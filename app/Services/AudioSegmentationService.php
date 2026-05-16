<?php

namespace App\Services;

use App\Models\AudioTrack;
use App\Models\Word;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI-powered audio segmentation service.
 *
 * Uses OpenAI Whisper API to transcribe audio tracks with word-level
 * timestamps, then matches transcribed words to the words in our DB
 * and automatically populates segment_start_ms / segment_end_ms.
 *
 * Matching strategy (in order of preference):
 *   1. Exact case-insensitive match.
 *   2. Prefix match (handles "boy" vs "boys", "cat" vs "catch").
 *   3. Levenshtein distance ≤ 2 for words ≥ 4 chars (catches typos
 *      and small Whisper transcription errors).
 *
 * Indices already claimed by an earlier (longer) DB word are skipped
 * so the same spoken token isn't reused.
 *
 * Also exposes URL probing so the admin can see which AudioTrack
 * URLs return a valid mp3/mp4 (HEAD 200 with audio/* content type)
 * vs which ones are 404 / wrong type before spending Whisper credit.
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

        $words = Word::where('audio_track_id', $track->id)->get();
        if ($words->isEmpty()) {
            return ['error' => 'No words linked to this track', 'matched' => 0, 'total' => 0];
        }

        if (! $overwrite) {
            $words = $words->filter(fn ($w) => $w->segment_start_ms === null || $w->segment_end_ms === null);
            if ($words->isEmpty()) {
                return ['matched' => 0, 'total' => 0, 'message' => 'All words already segmented (use --overwrite)'];
            }
        }

        $audioPath = $this->getAudioFile($track);
        if (! $audioPath) {
            return ['error' => 'Could not retrieve audio file (URL may be broken)', 'matched' => 0, 'total' => $words->count()];
        }

        $transcription = $this->transcribeAudio($audioPath);
        if (! $transcription || empty($transcription['words'])) {
            return ['error' => 'Whisper transcription failed or empty', 'matched' => 0, 'total' => $words->count()];
        }

        $matched = 0;
        $details = [];
        $usedIndices = [];

        // Sort DB words by length descending so longer words pick first
        // ("brother" before "ro", "elephant" before "ant").
        $orderedWords = $words->sortByDesc(fn (Word $w) => strlen($w->word))->values();

        foreach ($orderedWords as $word) {
            $match = $this->findBestMatch($word->word, $transcription['words'], $usedIndices);
            if ($match) {
                $usedIndices[$match['_index']] = true;
                $startMs = (int) round($match['start'] * 1000);
                $endMs = (int) round($match['end'] * 1000);

                // Add small padding for natural playback
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
                    'reason'   => $match['_reason'],
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
     * Quick HEAD request to check whether the upstream URL really is a
     * playable audio file. Used by the "Check all audio URLs" admin
     * tool so we can flag broken links before children hit them.
     *
     * Returns one of:
     *   ['ok' => true,  'status' => 200, 'content_type' => 'audio/mpeg', 'size' => 1234]
     *   ['ok' => false, 'status' => 404, 'error' => 'HTTP 404']
     *   ['ok' => false, 'error' => 'Network failure: ...']
     */
    public function probeUrl(string $url): array
    {
        try {
            $resp = Http::timeout(15)
                ->withHeaders(['User-Agent' => 'Kiddo/audio-probe'])
                ->head($url);

            $status = $resp->status();
            $ct = $resp->header('Content-Type') ?: '';
            $len = (int) ($resp->header('Content-Length') ?: 0);

            // Some servers refuse HEAD; retry with a tiny ranged GET
            if ($status === 405 || $status === 501) {
                $resp = Http::timeout(15)
                    ->withHeaders([
                        'User-Agent' => 'Kiddo/audio-probe',
                        'Range'      => 'bytes=0-0',
                    ])
                    ->get($url);
                $status = $resp->status();
                $ct = $resp->header('Content-Type') ?: '';
                if ($range = $resp->header('Content-Range')) {
                    $len = (int) preg_replace('~^bytes \d+-\d+/~', '', $range);
                } else {
                    $len = (int) ($resp->header('Content-Length') ?: 0);
                }
            }

            $isAudio = $status >= 200 && $status < 400 &&
                (str_contains($ct, 'audio') || str_contains($ct, 'video') ||
                 str_contains($ct, 'octet-stream') || str_contains($ct, 'mpeg'));

            return [
                'ok'           => $isAudio,
                'status'       => $status,
                'content_type' => $ct ?: null,
                'size'         => $len ?: null,
                'error'        => $isAudio ? null : "HTTP {$status} · " . ($ct ?: 'unknown type'),
            ];
        } catch (\Throwable $e) {
            return [
                'ok'    => false,
                'error' => 'Network failure: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get the audio file as a local file path. Downloads if needed.
     */
    private function getAudioFile(AudioTrack $track): ?string
    {
        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs) && filesize($abs) > 0) {
                return $abs;
            }
        }

        $cachePath = storage_path('app/audio_cache/' . $track->code . '.' . ($track->format ?: 'mp3'));
        if (is_file($cachePath) && filesize($cachePath) > 0) {
            return $cachePath;
        }

        @mkdir(dirname($cachePath), 0775, true);
        try {
            $response = Http::timeout(60)
                ->withHeaders(['User-Agent' => 'Kiddo/audio-fetch'])
                ->get($track->url);
            if ($response->successful() && strlen($response->body()) > 0) {
                file_put_contents($cachePath, $response->body());
                return $cachePath;
            }
            Log::warning('Audio download not OK', [
                'track'  => $track->code,
                'status' => $response->status(),
                'size'   => strlen($response->body()),
            ]);
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
                    'model'                     => 'whisper-1',
                    'language'                  => 'en',
                    'response_format'           => 'verbose_json',
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
     *
     * Three passes in order of confidence:
     *   1. Exact normalised match.
     *   2. Prefix match in either direction (≥ 3 chars).
     *   3. Levenshtein distance ≤ 2 (≥ 4 chars).
     *
     * Skips indices already claimed by an earlier DB word.
     */
    private function findBestMatch(string $target, array $transcribedWords, array $usedIndices = []): ?array
    {
        $targetLower = mb_strtolower(trim($target));
        $targetCore  = preg_replace('/[^a-z0-9]/i', '', $targetLower);
        if ($targetCore === '') return null;

        // Pass 1: exact
        foreach ($transcribedWords as $i => $tw) {
            if (isset($usedIndices[$i])) continue;
            $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
            if ($targetCore === $twCore) {
                return ['_index' => $i, '_reason' => 'exact'] + $tw;
            }
        }

        // Pass 2: prefix
        if (strlen($targetCore) >= 3) {
            foreach ($transcribedWords as $i => $tw) {
                if (isset($usedIndices[$i])) continue;
                $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
                if ($twCore === '') continue;
                if (str_starts_with($twCore, $targetCore) || str_starts_with($targetCore, $twCore)) {
                    return ['_index' => $i, '_reason' => 'prefix'] + $tw;
                }
            }
        }

        // Pass 3: Levenshtein
        if (strlen($targetCore) >= 4) {
            $best = null;
            $bestDist = PHP_INT_MAX;
            foreach ($transcribedWords as $i => $tw) {
                if (isset($usedIndices[$i])) continue;
                $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
                if (strlen($twCore) < 3) continue;
                $d = levenshtein($targetCore, $twCore);
                if ($d <= 2 && $d < $bestDist) {
                    $best = ['_index' => $i, '_reason' => "fuzzy(d={$d})"] + $tw;
                    $bestDist = $d;
                }
            }
            if ($best) return $best;
        }

        return null;
    }
}
