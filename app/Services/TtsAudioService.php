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
 * Why we need this: Unit 0 (Welcome & Hello) and a few stray U5
 * Learning Club words have no usable NCCD recording. Without a clip,
 * the front-end falls back to the browser's speechSynthesizer, which
 * is acceptable but inconsistent across devices. This service uses
 * OpenAI's text-to-speech endpoint with a high-quality child-friendly
 * voice ("nova" / "shimmer") so kids hear the same warm pronunciation
 * everywhere.
 *
 * If OPENAI_API_KEY is missing we fall back to populating the words'
 * `audio_path` with NULL and rely on the browser TTS path inside
 * Word::audioClip()->tts which the React engine already supports.
 */
class TtsAudioService
{
    private const ENDPOINT = 'https://api.openai.com/v1/audio/speech';

    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly string $voice = 'shimmer',
        private readonly string $model = 'tts-1-hd',
    ) {
    }

    public static function make(): self
    {
        return new self(
            config('services.openai.key'),
            config('services.openai.voice', 'shimmer'),
            config('services.openai.tts_model', 'tts-1-hd'),
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
    public function synthesizeWord(Word $word, bool $overwrite = false): ?string
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

        // Pad single-syllable words with leading/trailing silence so the
        // browser's first decoded frame doesn't get clipped.
        $text = trim($word->word);
        if ($text === '') return null;

        @mkdir(dirname($abs), 0775, true);
        try {
            $resp = Http::timeout(60)
                ->withToken($this->apiKey)
                ->withHeaders(['Accept' => 'audio/mpeg'])
                ->post(self::ENDPOINT, [
                    'model'  => $this->model,
                    'voice'  => $this->voice,
                    'input'  => $this->makeChildFriendlyPrompt($text),
                    'format' => 'mp3',
                    // 0.85x is the sweet spot: clearly-articulated for
                    // a 6-year-old without sounding sluggish to adults.
                    'speed'  => 0.85,
                ]);
            if (! $resp->successful() || strlen($resp->body()) < 512) {
                Log::warning('TTS api returned non-audio', ['status' => $resp->status(), 'len' => strlen($resp->body())]);
                return null;
            }
            file_put_contents($abs, $resp->body());
        } catch (\Throwable $e) {
            Log::warning('tts exception: ' . $e->getMessage());
            return null;
        }

        $word->update([
            'audio_path'        => $publicRel,
            'audio_track_id'    => null,
            'segment_start_ms'  => null,
            'segment_end_ms'    => null,
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
    public function synthesizeText(string $text): ?string
    {
        $text = trim($text);
        if ($text === '' || ! $this->isConfigured()) {
            return null;
        }
        try {
            $resp = Http::timeout(60)
                ->withToken($this->apiKey)
                ->withHeaders(['Accept' => 'audio/mpeg'])
                ->post(self::ENDPOINT, [
                    'model'  => $this->model,
                    'voice'  => $this->voice,
                    'input'  => $this->makeChildFriendlyPrompt($text),
                    'format' => 'mp3',
                    'speed'  => 0.85,
                ]);
            if (! $resp->successful() || strlen($resp->body()) < 512) {
                Log::warning('TTS api returned non-audio for text', [
                    'status' => $resp->status(),
                    'len'    => strlen($resp->body()),
                ]);
                return null;
            }
            return $resp->body();
        } catch (\Throwable $e) {
            Log::warning('tts text exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Wrap the bare word/phrase in a tiny pause so the TTS doesn't
     * clip the first phoneme, and so the cadence sounds like a
     * teacher demonstrating a vocabulary card to a class. Adding a
     * trailing period also helps OpenAI's prosody land softly
     * instead of cutting off abruptly.
     *
     * For very short single words ("Mum", "Cat") we keep it bare;
     * the SSML-like wrapping above is overkill and makes the clip
     * feel formal. The trick is just the trailing period.
     */
    private function makeChildFriendlyPrompt(string $text): string
    {
        $clean = trim($text);
        if ($clean === '') return $clean;
        // Already has terminal punctuation? Leave it.
        if (preg_match('/[.!?…]$/u', $clean)) return $clean;
        // Single-word vocabulary card: "Mum." reads warmer than "Mum"
        // because the tts model lengthens the vowel slightly.
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

        $words = Word::where('unit_id', $unit->id)->orderBy('id')->get();
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
