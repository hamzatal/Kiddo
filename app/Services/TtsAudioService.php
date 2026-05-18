<?php

namespace App\Services;

use App\Models\Unit;
use App\Models\Word;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Generates child-friendly TTS audio clips for individual words and
 * stores them under public/assets/audio/tts/word_{id}.mp3.
 *
 * Voice strategy (Kiddo v3)
 * ─────────────────────────
 *  • Primary model: `gpt-4o-mini-tts` — OpenAI's newest expressive
 *    TTS engine. It accepts an `instructions` parameter that lets us
 *    steer the personality ("warm kindergarten teacher, slow and
 *    cheerful, articulate every phoneme"). The result sounds like
 *    a real classroom teacher rather than a flat assistant.
 *  • Fallback model: `tts-1-hd` (same /v1/audio/speech endpoint, no
 *    instructions support) used automatically when the primary model
 *    returns 404/400 — useful for accounts that haven't been granted
 *    the new model yet.
 *
 * Per-Word personality presets
 * ────────────────────────────
 *  Different unit kinds want a slightly different vibe:
 *    • Welcome (U0): even gentler, nursery-rhyme cadence.
 *    • Phonics:      very deliberate, exaggerated phoneme.
 *    • Sentences:    natural conversational rhythm.
 *  See `instructionsForWord()` below.
 *
 * The clips are cached on disk (`/public/assets/audio/tts/word_{id}.mp3`)
 * and the Word's `audio_path` is updated, so the browser never has to
 * re-synthesise. Re-run with `--overwrite` to regenerate after a voice
 * config change.
 */
class TtsAudioService
{
    private const ENDPOINT = 'https://api.openai.com/v1/audio/speech';

    public function __construct(
        private readonly ?string $apiKey,
        private readonly string $voice,
        private readonly string $model,
        private readonly string $fallbackModel,
        private readonly float  $speed,
        private readonly string $defaultInstructions,
    ) {
    }

    public static function make(): self
    {
        return new self(
            apiKey:              config('services.openai.key'),
            voice:               (string) config('services.openai.voice', 'nova'),
            model:               (string) config('services.openai.tts_model', 'gpt-4o-mini-tts'),
            fallbackModel:       (string) config('services.openai.tts_fallback_model', 'tts-1-hd'),
            speed:               (float)  config('services.openai.tts_speed', 1.0),
            defaultInstructions: (string) config('services.openai.tts_instructions',
                'Speak like a warm kindergarten teacher reading vocabulary flashcards to a six-year-old.'
            ),
        );
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Generate a single mp3 clip for a Word and link it via audio_path.
     * Returns the public-relative path on success, null on failure.
     */
    public function synthesizeWord(Word $word, bool $overwrite = false, ?string $voiceOverride = null, ?string $instructionsOverride = null): ?string
    {
        $publicRel = 'assets/audio/tts/word_' . $word->id . '.mp3';
        $abs = public_path($publicRel);
        if (! $overwrite && is_file($abs) && filesize($abs) > 1024) {
            // Already generated — just make sure the row points at it.
            if ($word->audio_path !== $publicRel) {
                $word->update(['audio_path' => $publicRel]);
            }
            return $publicRel;
        }

        if (! $this->isConfigured()) {
            return null;
        }

        $text = trim($word->word);
        if ($text === '') return null;

        @mkdir(dirname($abs), 0775, true);

        $bytes = $this->callTtsApi(
            text:         $text,
            voice:        $voiceOverride ?? $this->voice,
            instructions: $instructionsOverride ?? $this->instructionsForWord($word),
        );
        if (! $bytes) {
            return null;
        }

        if (file_put_contents($abs, $bytes) === false) {
            Log::warning('tts: file_put_contents failed', ['path' => $abs]);
            return null;
        }

        $word->update([
            'audio_path' => $publicRel,
            // Once the operator forces a TTS clip, drop any previous
            // NCCD segment binding so the lesson plays the new voice
            // file directly. The admin can re-link a track at any
            // time — TTS is meant as a clean, reliable fallback.
            'audio_track_id'   => null,
            'segment_start_ms' => null,
            'segment_end_ms'   => null,
        ]);
        return $publicRel;
    }

    /**
     * Synthesise an arbitrary string and return the raw mp3 bytes
     * (or null on failure). Doesn't write to disk — the caller
     * decides where to cache the file. Used by the public on-demand
     * TTS endpoint when the kid taps the speaker on a decoy that
     * isn't backed by a real Word row.
     */
    public function synthesizeText(string $text, ?string $voiceOverride = null, ?string $instructionsOverride = null): ?string
    {
        $text = trim($text);
        if ($text === '' || ! $this->isConfigured()) {
            return null;
        }
        return $this->callTtsApi(
            text:         $text,
            voice:        $voiceOverride ?? $this->voice,
            instructions: $instructionsOverride ?? $this->defaultInstructions,
        );
    }

    /**
     * Centralized OpenAI TTS request. Tries the primary model first
     * (which supports `instructions` for personality steering) and
     * gracefully retries with the fallback model on 4xx so accounts
     * without access to `gpt-4o-mini-tts` still get a usable clip.
     */
    private function callTtsApi(string $text, string $voice, string $instructions): ?string
    {
        $payload = [
            'model'           => $this->model,
            'voice'           => $voice,
            'input'           => $this->makeChildFriendlyPrompt($text),
            'response_format' => 'mp3',
            // 1.0 keeps natural prosody — slowing is now expressed
            // through the `instructions` field so the voice still
            // sounds expressive instead of slurred.
            'speed'           => $this->speed,
        ];
        if ($instructions !== '') {
            $payload['instructions'] = $instructions;
        }

        try {
            $resp = Http::timeout(60)
                ->withToken($this->apiKey)
                ->withHeaders(['Accept' => 'audio/mpeg'])
                ->post(self::ENDPOINT, $payload);
        } catch (\Throwable $e) {
            Log::warning('tts request exception: ' . $e->getMessage());
            return null;
        }

        $body = $resp->body();
        if ($resp->successful() && strlen($body) >= 512 && ! $this->looksLikeJsonError($body)) {
            return $body;
        }

        // Some accounts don't yet have access to `gpt-4o-mini-tts`,
        // or the `instructions` field. Retry with the legacy model
        // and no instructions — same endpoint, same voices.
        if ($this->shouldFallback($resp->status(), $body)) {
            Log::info('tts: falling back to ' . $this->fallbackModel, [
                'status' => $resp->status(),
                'model'  => $this->model,
            ]);
            $legacy = [
                'model'           => $this->fallbackModel,
                'voice'           => $voice,
                'input'           => $this->makeChildFriendlyPrompt($text),
                'response_format' => 'mp3',
                // The legacy model doesn't have personality
                // steering, so we lean on a slightly slower speed
                // to keep the clip child-friendly.
                'speed'           => max(0.8, min(1.0, $this->speed - 0.15)),
            ];
            try {
                $resp = Http::timeout(60)
                    ->withToken($this->apiKey)
                    ->withHeaders(['Accept' => 'audio/mpeg'])
                    ->post(self::ENDPOINT, $legacy);
                $body = $resp->body();
                if ($resp->successful() && strlen($body) >= 512 && ! $this->looksLikeJsonError($body)) {
                    return $body;
                }
            } catch (\Throwable $e) {
                Log::warning('tts fallback exception: ' . $e->getMessage());
                return null;
            }
        }

        Log::warning('tts api returned non-audio', [
            'status' => $resp->status(),
            'len'    => strlen($body),
            'model'  => $payload['model'] ?? null,
        ]);
        return null;
    }

    private function looksLikeJsonError(string $body): bool
    {
        $trim = ltrim($body);
        if ($trim === '' || $trim[0] !== '{') return false;
        $decoded = json_decode($trim, true);
        return is_array($decoded) && isset($decoded['error']);
    }

    private function shouldFallback(int $status, string $body): bool
    {
        if ($status >= 500) return true;
        if ($status === 404 || $status === 400 || $status === 422) return true;
        $msg = strtolower($body);
        return str_contains($msg, 'unknown model')
            || str_contains($msg, 'does not exist')
            || str_contains($msg, 'unsupported value');
    }

    /**
     * Decide which "personality" a Word should be read with. Picks
     * sensible defaults for the Team Together 1A curriculum:
     *
     *   • U0 Welcome  → softer, nursery-rhyme cadence
     *   • phonics     → exaggerated phoneme isolation
     *   • sentence    → natural conversational pace
     *   • everything else → the configured default (warm teacher)
     */
    public function instructionsForWord(Word $word): string
    {
        $type = strtolower((string) ($word->type ?? ''));
        $unitNumber = $word->unit?->unit_number ?? null;
        if ($word->relationLoaded('unit') === false) {
            // Avoid lazy load when the unit isn't already loaded.
            // We rely on the type/category fields below as the
            // primary driver of personality.
        }

        if ($type === 'phonics') {
            return 'Read this letter or sound like a phonics teacher introducing a brand-new sound to a six-year-old.'
                . ' Stretch the phoneme slightly so the child can hear and repeat it.'
                . ' Bright, encouraging, very clear articulation.';
        }
        if ($type === 'sentence') {
            return 'Read this short sentence with a warm, natural rhythm — like a teacher modelling a phrase for a child to echo.'
                . ' Friendly, gentle pace, no rush.';
        }
        if ($type === 'cvc') {
            return 'Pronounce this short word slowly, one syllable at a time, like a reading-coach helping a beginner learner.'
                . ' Cheerful and patient.';
        }

        if ((int) $unitNumber === 0) {
            return 'Speak like a kindergarten teacher saying a single warm greeting to a child.'
                . ' Soft, smiling, slightly sing-song. The child should feel welcomed.';
        }

        return $this->defaultInstructions;
    }

    /**
     * Wrap the bare word/phrase in a tiny pause so the TTS doesn't
     * clip the first phoneme, and so the cadence sounds like a
     * teacher demonstrating a vocabulary card to a class. Adding a
     * trailing period also helps the prosody land softly instead of
     * cutting off abruptly.
     */
    private function makeChildFriendlyPrompt(string $text): string
    {
        $clean = trim($text);
        if ($clean === '') return $clean;
        if (preg_match('/[.!?…]$/u', $clean)) return $clean;
        return $clean . '.';
    }

    /**
     * Generate clips for every word in a Unit that doesn't already have
     * a usable per-word audio file. Used by the admin "Generate child
     * voice for all words in U0" button.
     *
     * @return array{generated:int,skipped:int,errors:array<int,string>}
     */
    public function synthesizeUnit(Unit $unit, bool $overwrite = false): array
    {
        $generated = 0;
        $skipped = 0;
        $errors = [];

        $words = Word::with('unit')
            ->where('unit_id', $unit->id)
            ->orderBy('id')
            ->get();
        foreach ($words as $word) {
            try {
                if (
                    ! $overwrite &&
                    $word->audio_path &&
                    is_file(public_path(ltrim($word->audio_path, '/')))
                ) {
                    $skipped++;
                    continue;
                }
                $rel = $this->synthesizeWord($word, $overwrite);
                if ($rel) {
                    $generated++;
                } else {
                    $errors[] = "Could not synthesize {$word->word} (id={$word->id}).";
                }
            } catch (\Throwable $e) {
                $errors[] = "{$word->word}: " . $e->getMessage();
            }
        }
        return compact('generated', 'skipped', 'errors');
    }
}
