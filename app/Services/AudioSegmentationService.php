<?php

namespace App\Services;

use App\Models\AudioTrack;
use App\Models\Word;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * AI-powered audio segmentation service.
 *
 * Uses OpenAI Whisper API to transcribe audio tracks with word-level
 * timestamps, then matches transcribed words to the words in our DB
 * and automatically populates segment_start_ms / segment_end_ms.
 *
 * This eliminates the need for the admin to manually listen to each
 * track and stamp start/end times.
 *
 * Usage from artisan command:
 *   php artisan kiddo:auto-segment --track=PB6
 *   php artisan kiddo:auto-segment --unit=2
 *   php artisan kiddo:auto-segment --all
 */
class AudioSegmentationService
{
    private const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

    public function __construct(
        private readonly ?string $apiKey = null,
    ) {
    }

    public static function make(): self
    {
        return new self(config('services.openai.key'));
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    /**
     * Process a single audio track:
     * 1. Download the audio file (or use local cached copy)
     * 2. Send to Whisper API with verbose_json + word-level timestamps
     * 3. Match transcribed words to Words in DB linked to this track
     * 4. Update segment_start_ms / segment_end_ms for each matched word
     *
     * Returns: ['matched' => N, 'total' => M, 'words' => [...]]
     */
    public function segmentTrack(AudioTrack $track, bool $overwrite = false): array
    {
        if (! $this->isConfigured()) {
            return ['error' => 'OPENAI_API_KEY not configured', 'matched' => 0, 'total' => 0];
        }

        // Get list of words linked to this track
        $words = Word::where('audio_track_id', $track->id)->get();
        if ($words->isEmpty()) {
            return ['error' => 'No words linked to this track', 'matched' => 0, 'total' => 0];
        }

        // Skip already-segmented words unless overwriting
        if (! $overwrite) {
            $words = $words->filter(fn ($w) => $w->segment_start_ms === null || $w->segment_end_ms === null);
            if ($words->isEmpty()) {
                return ['matched' => 0, 'total' => 0, 'message' => 'All words already segmented (use --overwrite)'];
            }
        }

        // Get audio file path
        $audioPath = $this->getAudioFile($track);
        if (! $audioPath) {
            return ['error' => 'Could not retrieve audio file', 'matched' => 0, 'total' => $words->count()];
        }

        // Transcribe with Whisper
        $transcription = $this->transcribeAudio($audioPath);
        if (! $transcription || empty($transcription['words'])) {
            return ['error' => 'Whisper transcription failed', 'matched' => 0, 'total' => $words->count()];
        }

        // Match each DB word to transcribed word(s)
        $matched = 0;
        $details = [];
        foreach ($words as $word) {
            $match = $this->findBestMatch($word->word, $transcription['words']);
            if ($match) {
                $startMs = (int) round($match['start'] * 1000);
                $endMs = (int) round($match['end'] * 1000);

                // Add small padding (50ms) for natural playback
                $startMs = max(0, $startMs - 50);
                $endMs = $endMs + 100;

                $word->update([
                    'segment_start_ms' => $startMs,
                    'segment_end_ms'   => $endMs,
                ]);
                $matched++;
                $details[] = [
                    'word'     => $word->word,
                    'matched'  => $match['word'],
                    'start_ms' => $startMs,
                    'end_ms'   => $endMs,
                    'duration' => round(($endMs - $startMs) / 1000, 2) . 's',
                ];
            } else {
                $details[] = [
                    'word'    => $word->word,
                    'matched' => null,
                    'reason'  => 'Not found in transcription',
                ];
            }
        }

        return [
            'matched' => $matched,
            'total'   => $words->count(),
            'words'   => $details,
        ];
    }

    /**
     * Get the audio file as a local file path. Downloads if needed.
     */
    private function getAudioFile(AudioTrack $track): ?string
    {
        // Check local_path first
        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs)) {
                return $abs;
            }
        }

        // Check storage cache
        $cachePath = storage_path('app/audio_cache/' . $track->code . '.' . ($track->format ?: 'mp3'));
        if (is_file($cachePath)) {
            return $cachePath;
        }

        // Download
        @mkdir(dirname($cachePath), 0775, true);
        try {
            $response = Http::timeout(60)->get($track->url);
            if ($response->successful()) {
                file_put_contents($cachePath, $response->body());
                return $cachePath;
            }
        } catch (\Throwable $e) {
            Log::warning('Audio download failed: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Send audio file to Whisper API and get word-level transcription.
     */
    private function transcribeAudio(string $audioPath): ?array
    {
        try {
            $response = Http::timeout(120)
                ->withToken($this->apiKey)
                ->attach(
                    'file',
                    file_get_contents($audioPath),
                    basename($audioPath)
                )
                ->post(self::WHISPER_ENDPOINT, [
                    'model' => 'whisper-1',
                    'language' => 'en',
                    'response_format' => 'verbose_json',
                    'timestamp_granularities[]' => 'word',
                ]);

            if (! $response->successful()) {
                Log::warning('Whisper API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::error('Whisper API failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Find the best matching transcribed word for a target word.
     * Uses case-insensitive matching with light fuzzy matching for plurals.
     */
    private function findBestMatch(string $target, array $transcribedWords): ?array
    {
        $targetLower = mb_strtolower(trim($target));
        $targetCore = preg_replace('/[^a-z0-9]/', '', $targetLower);

        foreach ($transcribedWords as $tw) {
            $twWord = mb_strtolower(trim($tw['word'] ?? ''));
            $twCore = preg_replace('/[^a-z0-9]/', '', $twWord);

            // Exact match
            if ($targetCore === $twCore) {
                return $tw;
            }
        }

        // Fuzzy match: target is prefix or transcribed contains target
        foreach ($transcribedWords as $tw) {
            $twWord = mb_strtolower(trim($tw['word'] ?? ''));
            $twCore = preg_replace('/[^a-z0-9]/', '', $twWord);

            if (
                strlen($targetCore) >= 3 &&
                (str_starts_with($twCore, $targetCore) ||
                 str_starts_with($targetCore, $twCore))
            ) {
                return $tw;
            }
        }

        return null;
    }
}
