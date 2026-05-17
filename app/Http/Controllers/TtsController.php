<?php

namespace App\Http\Controllers;

use App\Models\Word;
use App\Services\TtsAudioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Learner-facing on-demand TTS endpoint.
 *
 * When the lesson screen renders an option whose word has no NCCD
 * audio (for example a U0 vocabulary item or a freshly-added word),
 * the OptionCard speaker button calls this endpoint to generate a
 * child-friendly OpenAI TTS clip on the spot. We cache the result
 * on the Word row so the next click re-uses the same file.
 *
 * Routes:
 *   POST /api/words/{word}/tts        — synthesise (or return cached)
 *   POST /api/words/by-text/tts       — synthesise an arbitrary string
 *
 * Both routes return JSON:
 *   { ok: true, audio_path: "/assets/audio/tts/word_42.mp3" }
 *
 * Falls back gracefully:
 *   • If OPENAI_API_KEY is missing, returns 200 with `tts: "Mom"` so
 *     the browser uses speechSynthesis instead. The frontend is
 *     already wired to do that.
 *   • If synthesis fails, also returns the TTS-only payload.
 *
 * The endpoint is throttled per-user to keep OpenAI bills sane.
 */
class TtsController extends Controller
{
    public function __construct(
        private readonly TtsAudioService $tts,
    ) {
    }

    /**
     * POST /api/words/{word}/tts
     * Generate (or fetch the cached) TTS clip for a Word in the DB.
     */
    public function generateForWord(Request $request, Word $word)
    {
        // Already have a per-word audio file? Just return it.
        if ($word->audio_path) {
            $abs = public_path(ltrim($word->audio_path, '/'));
            if (is_file($abs) && filesize($abs) > 1024) {
                return response()->json([
                    'ok'         => true,
                    'audio_path' => '/' . ltrim($word->audio_path, '/'),
                    'cached'     => true,
                    'tts'        => $word->word,
                ]);
            }
        }

        if (! $this->tts->isConfigured()) {
            // No OpenAI key — frontend uses browser speechSynthesis.
            return response()->json([
                'ok'         => false,
                'audio_path' => null,
                'tts'        => $word->word,
                'fallback'   => 'browser-speech',
            ]);
        }

        try {
            $rel = $this->tts->synthesizeWord($word, false);
            if (! $rel) {
                return response()->json([
                    'ok'         => false,
                    'audio_path' => null,
                    'tts'        => $word->word,
                    'fallback'   => 'browser-speech',
                ]);
            }
            return response()->json([
                'ok'         => true,
                'audio_path' => '/' . ltrim($rel, '/'),
                'cached'     => false,
                'tts'        => $word->word,
            ]);
        } catch (\Throwable $e) {
            Log::warning('public TTS for word failed: ' . $e->getMessage(), ['word_id' => $word->id]);
            return response()->json([
                'ok'         => false,
                'audio_path' => null,
                'tts'        => $word->word,
                'fallback'   => 'browser-speech',
            ]);
        }
    }

    /**
     * POST /api/tts/by-text
     * Generate a clip for free-form text (used by decoy words that
     * aren't backed by a Word DB row, or by quiz answers built on
     * the fly). The mp3 is cached under public/assets/audio/tts/
     * keyed by an md5 of the text so repeated requests are free.
     */
    public function generateForText(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string|min:1|max:120',
        ]);
        $text = trim($data['text']);
        if ($text === '') {
            return response()->json(['ok' => false, 'audio_path' => null]);
        }

        // Deterministic cache key — same text always maps to the same file.
        $slug = Str::slug(Str::limit($text, 40, ''), '-') ?: 'tts';
        $hash = substr(md5(mb_strtolower($text)), 0, 10);
        $rel  = "assets/audio/tts/text_{$slug}_{$hash}.mp3";
        $abs  = public_path($rel);

        if (is_file($abs) && filesize($abs) > 1024) {
            return response()->json([
                'ok'         => true,
                'audio_path' => '/' . $rel,
                'cached'     => true,
                'tts'        => $text,
            ]);
        }

        if (! $this->tts->isConfigured()) {
            return response()->json([
                'ok'         => false,
                'audio_path' => null,
                'tts'        => $text,
                'fallback'   => 'browser-speech',
            ]);
        }

        try {
            $bytes = $this->tts->synthesizeText($text);
            if (! $bytes) {
                return response()->json([
                    'ok'         => false,
                    'audio_path' => null,
                    'tts'        => $text,
                    'fallback'   => 'browser-speech',
                ]);
            }
            @mkdir(dirname($abs), 0775, true);
            file_put_contents($abs, $bytes);
            return response()->json([
                'ok'         => true,
                'audio_path' => '/' . $rel,
                'cached'     => false,
                'tts'        => $text,
            ]);
        } catch (\Throwable $e) {
            Log::warning('public TTS by-text failed: ' . $e->getMessage());
            return response()->json([
                'ok'         => false,
                'audio_path' => null,
                'tts'        => $text,
                'fallback'   => 'browser-speech',
            ]);
        }
    }
}
