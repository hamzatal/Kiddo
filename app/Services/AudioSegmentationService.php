<?php

namespace App\Services;

use App\Models\AudioTrack;
use App\Models\Word;
use Illuminate\Support\Facades\DB;
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

    /**
     * Where we cache verbose Whisper transcripts so we don't pay for
     * the same track twice across the lifetime of the project. JSON
     * blobs keyed by track code under storage/app/audio_cache/.
     */
    private const TRANSCRIPT_CACHE_DIR = 'audio_cache';

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

        // Prime Whisper with the exact words we expect to hear so it
        // recognises rare names like "Hala", "Lama", "Malek" and
        // preserves child-friendly vocab like "mum" instead of
        // normalising it to "mom".
        // We use ALL the unit's words (not just unset ones) so Whisper
        // gets the full context, but we only update segments for the
        // filtered subset.
        $allUnitWords = Word::where('audio_track_id', $track->id)
            ->orderBy('id')
            ->pluck('word')
            ->unique()
            ->values()
            ->all();
        $vocabHint = $this->buildVocabHint($allUnitWords, $track);

        $transcription = $this->transcribeAudio($audioPath, $vocabHint);
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
     * Cross-curriculum auto-segment.
     *
     * The user request: "the AI should hear every unit's audio and
     * the entire material's audio with all its branches, then match
     * the audio against the existing words". The original
     * `segmentTrack()` only matches the words explicitly linked to
     * a single track via `audio_track_id`, so a freshly-added Word
     * (or a Word still pending an audio binding) was always invisible
     * to the matcher.
     *
     * This method walks every AudioTrack the project knows about,
     * transcribes each one ONCE (cached on disk under
     * storage/app/audio_cache/{code}.transcript.json so re-runs are
     * effectively free), and then for every Word in the database
     * scans those transcripts for the best match. The best match
     * wins by:
     *
     *     1. Match quality:  exact > synonym > prefix > phrase > fuzzy
     *     2. Same-unit preference:  a Word from "Family & Friends"
     *        prefers a track whose linked Lessons live in the same
     *        unit, even when an out-of-unit track has an equally
     *        good token match. This avoids accidentally pinning
     *        "boy" from a Welcome unit decoy onto a track that
     *        belongs to "Around the world".
     *     3. Track preference:  pb > ab > new > part2  (mirrors how
     *        the curriculum is organised — Pupil's Book is the
     *        canonical recording).
     *
     * Returns a structured report identical in shape to the existing
     * `autoSegmentAll` admin endpoint so the React UI can render it
     * with no changes.
     *
     * @param array $opts {
     *     @type bool       $overwrite     replace already-set timestamps. default false
     *     @type ?int[]     $unit_ids      restrict the WORDS we update to these units
     *                                      (still considers ALL tracks for transcription)
     *     @type bool       $prefer_same_unit  bias toward same-unit tracks. default true
     *     @type bool       $relink_track  when a word's best match lives on a different
     *                                      track than its current audio_track_id, also
     *                                      update audio_track_id (default true)
     * }
     */
    public function segmentEverything(array $opts = []): array
    {
        if (! $this->isConfigured()) {
            return [
                'ok'    => false,
                'error' => 'OPENAI_API_KEY is not configured. Add it to .env to enable AI auto-segment.',
                'tracks_run'    => 0,
                'words_matched' => 0,
                'words_total'   => 0,
                'report'        => [],
            ];
        }

        @set_time_limit(0);
        $overwrite      = (bool) ($opts['overwrite'] ?? false);
        $unitIds        = $opts['unit_ids'] ?? null;
        $preferSameUnit = (bool) ($opts['prefer_same_unit'] ?? true);
        $relinkTrack    = (bool) ($opts['relink_track'] ?? true);

        // Pull every track and every candidate word in two queries
        // so we don't issue lookups inside the matching loop.
        $tracks = AudioTrack::orderByRaw("CASE book_type WHEN 'pb' THEN 1 WHEN 'ab' THEN 2 WHEN 'new' THEN 3 ELSE 4 END")
            ->orderBy('page')
            ->orderBy('track_no')
            ->get();
        if ($tracks->isEmpty()) {
            return [
                'ok'    => false,
                'error' => 'No audio tracks in the database. Run "Discover NCCD audio" first.',
                'tracks_run'    => 0,
                'words_matched' => 0,
                'words_total'   => 0,
                'report'        => [],
            ];
        }

        $wordsQuery = Word::query()->with('unit:id,unit_number,title');
        if ($unitIds) {
            $wordsQuery->whereIn('unit_id', array_map('intval', $unitIds));
        }
        if (! $overwrite) {
            $wordsQuery->where(function ($q) {
                $q->whereNull('segment_start_ms')
                  ->orWhereNull('segment_end_ms');
            });
        }
        $words = $wordsQuery->orderByDesc(DB::raw('LENGTH(word)'))->get();

        if ($words->isEmpty()) {
            return [
                'ok'             => true,
                'message'        => 'Every word is already segmented (use overwrite=true to redo).',
                'tracks_run'     => 0,
                'words_matched'  => 0,
                'words_total'    => 0,
                'report'         => [],
            ];
        }

        // Build a vocabulary hint that primes Whisper with the union
        // of every word in the curriculum, capped at the prompt limit.
        $vocab = $words->pluck('word')->unique()->values()->all();

        // Step 1 — transcribe every track once (with caching).
        $transcripts = [];      // track_id => array
        $trackErrors = [];      // track_id => string
        $tracksRun   = 0;
        $tracksCachedHit = 0;

        // Pre-compute which Lessons belong to each track so we can
        // honour the "same unit" preference without N+1 queries.
        $trackUnitIds = $this->mapTracksToUnits($tracks->pluck('id')->all());

        foreach ($tracks as $track) {
            try {
                $cacheStatus = null;
                $transcript  = $this->cachedOrFreshTranscript(
                    $track,
                    $vocab,
                    $cacheStatus,
                );
                if ($transcript && ! empty($transcript['words'])) {
                    $transcripts[$track->id] = $transcript;
                    $tracksRun++;
                    if ($cacheStatus === 'hit') $tracksCachedHit++;
                } else {
                    $trackErrors[$track->id] = 'Empty / failed transcription';
                }
            } catch (\Throwable $e) {
                $trackErrors[$track->id] = 'Whisper error: ' . $e->getMessage();
                Log::warning('segmentEverything transcribe', [
                    'track' => $track->code,
                    'msg'   => $e->getMessage(),
                ]);
            }
        }

        // Step 2 — for every word, find the best match across ALL
        // transcripts, taking the same-unit preference into account.
        $matched = 0;
        $perWord = [];
        $perTrack = [];
        foreach ($transcripts as $tid => $_t) {
            $perTrack[$tid] = ['matched' => 0, 'total' => 0];
        }

        foreach ($words as $word) {
            $best = null; // ['score' => N, 'track' => AudioTrack, 'match' => [...]]
            foreach ($transcripts as $tid => $transcript) {
                $hit = $this->findBestMatch($word->word, $transcript['words'] ?? []);
                if (! $hit) continue;

                $score = $this->reasonScore($hit['_reason'] ?? '');
                if ($preferSameUnit && $word->unit_id) {
                    $unitsForTrack = $trackUnitIds[$tid] ?? [];
                    if (in_array($word->unit_id, $unitsForTrack, true)) {
                        $score += 50; // Strong bonus for same-unit tracks
                    } elseif (! empty($unitsForTrack)) {
                        // Track is bound to a different unit — small penalty
                        $score -= 5;
                    }
                }
                if ($best === null || $score > $best['score']) {
                    $tracksById = $tracks->keyBy('id');
                    $best = [
                        'score' => $score,
                        'track' => $tracksById[$tid] ?? null,
                        'match' => $hit,
                    ];
                }
                if (isset($perTrack[$tid])) $perTrack[$tid]['total']++;
            }

            if (! $best || ! $best['track']) {
                $perWord[] = [
                    'word_id' => $word->id,
                    'word'    => $word->word,
                    'unit'    => $word->unit?->title,
                    'matched' => false,
                    'reason'  => 'No track contained this word',
                ];
                continue;
            }

            $startMs = max(0, (int) round($best['match']['start'] * 1000) - 50);
            $endMs   = (int) round($best['match']['end']   * 1000) + 100;
            $patch = [
                'segment_start_ms' => $startMs,
                'segment_end_ms'   => $endMs,
            ];
            if ($relinkTrack && $word->audio_track_id !== $best['track']->id) {
                $patch['audio_track_id'] = $best['track']->id;
            }
            $word->update($patch);
            $matched++;

            $perWord[] = [
                'word_id'  => $word->id,
                'word'     => $word->word,
                'unit'     => $word->unit?->title,
                'matched'  => true,
                'track'    => $best['track']->code,
                'reason'   => $best['match']['_reason'] ?? null,
                'start_ms' => $startMs,
                'end_ms'   => $endMs,
            ];
            if (isset($perTrack[$best['track']->id])) {
                $perTrack[$best['track']->id]['matched']++;
            }
        }

        // Step 3 — assemble the per-track report so the admin sees
        // exactly which tracks contributed and which failed.
        $tracksReport = [];
        foreach ($tracks as $track) {
            $tracksReport[] = [
                'track'   => $track->code,
                'label'   => $track->label,
                'matched' => $perTrack[$track->id]['matched'] ?? 0,
                'total'   => $perTrack[$track->id]['total']   ?? 0,
                'error'   => $trackErrors[$track->id] ?? null,
            ];
        }

        return [
            'ok'             => true,
            'mode'           => 'cross-track',
            'tracks_run'     => $tracksRun,
            'tracks_cached'  => $tracksCachedHit,
            'words_matched'  => $matched,
            'words_total'    => $words->count(),
            'report'         => $tracksReport,
            'words'          => $perWord,
        ];
    }

    /**
     * Build a parallel array index of [track_id => [unit_id, ...]]
     * pulled from the `lessons` table so the segmentation matcher
     * can prefer same-unit tracks without firing a query per word.
     */
    private function mapTracksToUnits(array $trackIds): array
    {
        if (empty($trackIds)) return [];
        $rows = DB::table('lessons')
            ->whereIn('audio_track_id', $trackIds)
            ->whereNotNull('audio_track_id')
            ->select('audio_track_id', 'unit_id')
            ->distinct()
            ->get();
        $index = [];
        foreach ($rows as $r) {
            $tid = (int) $r->audio_track_id;
            $uid = (int) $r->unit_id;
            $index[$tid] ??= [];
            if (! in_array($uid, $index[$tid], true)) $index[$tid][] = $uid;
        }
        // Also pull tracks linked via the words.audio_track_id column
        // (the Words admin lets you pick a track without creating a
        // Lesson row), so a Welcome-unit track that's only attached
        // through Word::audio_track_id is still scored as same-unit.
        $wordRows = DB::table('words')
            ->whereIn('audio_track_id', $trackIds)
            ->whereNotNull('audio_track_id')
            ->select('audio_track_id', 'unit_id')
            ->distinct()
            ->get();
        foreach ($wordRows as $r) {
            $tid = (int) $r->audio_track_id;
            $uid = (int) $r->unit_id;
            $index[$tid] ??= [];
            if (! in_array($uid, $index[$tid], true)) $index[$tid][] = $uid;
        }
        return $index;
    }

    /**
     * Disk-backed transcript cache.
     *
     * Whisper-1 has stable, deterministic output for a given input
     * (we pin temperature=0), and our audio URLs come from NCCD which
     * is essentially read-only. Caching the verbose JSON response
     * once per track means the operator can run "AI auto-segment all"
     * twice in a row without paying for the same transcription twice
     * — only newly-discovered tracks incur a Whisper call.
     */
    private function cachedOrFreshTranscript(AudioTrack $track, array $vocab, ?string &$cacheStatus = null): ?array
    {
        $cacheKey = $track->code ?: ('id_' . $track->id);
        $cachePath = storage_path(
            'app/' . self::TRANSCRIPT_CACHE_DIR . '/' . preg_replace('/[^A-Za-z0-9_-]/', '_', $cacheKey) . '.transcript.json'
        );

        if (is_file($cachePath) && filesize($cachePath) > 0) {
            $raw = @file_get_contents($cachePath);
            $decoded = $raw ? json_decode($raw, true) : null;
            if (is_array($decoded) && ! empty($decoded['words'])) {
                $cacheStatus = 'hit';
                return $decoded;
            }
        }

        $audioPath = $this->getAudioFile($track);
        if (! $audioPath) {
            $cacheStatus = 'miss-no-audio';
            return null;
        }

        $hint = $this->buildVocabHint($vocab, $track);
        $transcript = $this->transcribeAudio($audioPath, $hint);
        if ($transcript && ! empty($transcript['words'])) {
            @mkdir(dirname($cachePath), 0775, true);
            @file_put_contents($cachePath, json_encode($transcript));
            $cacheStatus = 'miss-fresh';
            return $transcript;
        }

        $cacheStatus = 'miss-failed';
        return null;
    }

    /**
     * Numeric quality score for a match reason. Higher is better.
     * Used by `segmentEverything()` to break ties between candidate
     * matches on different tracks.
     */
    private function reasonScore(string $reason): int
    {
        if (str_starts_with($reason, 'exact'))   return 100;
        if (str_starts_with($reason, 'phrase'))  return 95;
        if (str_starts_with($reason, 'synonym')) return 80;
        if (str_starts_with($reason, 'prefix'))  return 60;
        if (str_starts_with($reason, 'fuzzy')) {
            // fuzzy(d=N) — smaller N = better
            if (preg_match('/d=(\d+)/', $reason, $m)) {
                return 40 - (int) $m[1] * 5;
            }
            return 30;
        }
        return 10;
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
     *
     * If a $vocabHint is supplied (a short comma-separated list of
     * the words we expect to hear), it's passed as Whisper's `prompt`
     * parameter. Whisper biases its decoder toward those words, which
     * raises the recognition rate noticeably for child-friendly
     * vocabulary like "mum", "dad", "Hala", "Lama", etc.
     *
     * Reference: OpenAI's Whisper API exposes `prompt` for exactly
     * this kind of vocabulary priming.
     */
    private function transcribeAudio(string $audioPath, ?string $vocabHint = null): ?array
    {
        try {
            $payload = [
                'model'                     => 'whisper-1',
                'language'                  => 'en',
                'response_format'           => 'verbose_json',
                'timestamp_granularities[]' => 'word',
                // Slight temperature so Whisper preserves rare names
                // like "Hala", "Bill", "Malek" instead of normalising
                // them away.
                'temperature'               => '0',
            ];
            if ($vocabHint) {
                // Cap at ~224 tokens (Whisper's prompt limit).
                $payload['prompt'] = mb_substr($vocabHint, 0, 600);
            }

            $response = Http::timeout(120)
                ->withToken($this->apiKey)
                ->attach(
                    'file',
                    file_get_contents($audioPath),
                    basename($audioPath)
                )
                ->post(self::WHISPER_ENDPOINT, $payload);

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
     * Five passes in order of confidence:
     *   1. Multi-word phrase match — "Good morning" against two
     *      consecutive transcribed tokens.
     *   2. Synonym map — common variants like mum↔mom, hi↔hello.
     *   3. Exact normalised match.
     *   4. Prefix match in either direction (≥ 3 chars).
     *   5. Levenshtein distance ≤ 2 for ≥ 4 chars, ≤ 1 for 3 chars
     *      (rescues short words like "boy" → "boi").
     *
     * Indices already claimed by an earlier (longer) DB word are
     * skipped so the same spoken token isn't reused.
     */
    private function findBestMatch(string $target, array $transcribedWords, array $usedIndices = []): ?array
    {
        $targetLower = mb_strtolower(trim($target));
        $targetCore  = preg_replace('/[^a-z0-9]/i', '', $targetLower);
        if ($targetCore === '') return null;

        // Pass 1: multi-word phrase. Split target on whitespace; if it
        // has 2+ tokens, look for consecutive transcribed words that
        // match all of them.
        $targetTokens = preg_split('/\s+/', $targetLower);
        $targetTokens = array_values(array_filter(array_map(
            fn ($t) => preg_replace('/[^a-z0-9]/i', '', $t),
            $targetTokens
        )));
        if (count($targetTokens) >= 2) {
            $maxStart = count($transcribedWords) - count($targetTokens);
            for ($i = 0; $i <= $maxStart; $i++) {
                if (isset($usedIndices[$i])) continue;
                $allMatch = true;
                for ($j = 0; $j < count($targetTokens); $j++) {
                    if (isset($usedIndices[$i + $j])) { $allMatch = false; break; }
                    $tw = $transcribedWords[$i + $j] ?? null;
                    if (! $tw) { $allMatch = false; break; }
                    $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
                    if ($twCore !== $targetTokens[$j]
                        && ! str_starts_with($twCore, $targetTokens[$j])
                        && ! str_starts_with($targetTokens[$j], $twCore)) {
                        $allMatch = false;
                        break;
                    }
                }
                if ($allMatch) {
                    $first = $transcribedWords[$i];
                    $last = $transcribedWords[$i + count($targetTokens) - 1];
                    return [
                        '_index'  => $i,
                        '_reason' => 'phrase',
                        'word'    => $first['word'] ?? $target,
                        'start'   => $first['start'],
                        'end'     => $last['end'],
                    ];
                }
            }
        }

        // Pass 2: synonyms. We match alternate spellings used by
        // British vs American English and child-friendly variants.
        $synonyms = $this->synonymGroup($targetCore);
        if (! empty($synonyms)) {
            foreach ($transcribedWords as $i => $tw) {
                if (isset($usedIndices[$i])) continue;
                $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
                if (in_array($twCore, $synonyms, true)) {
                    return ['_index' => $i, '_reason' => 'synonym'] + $tw;
                }
            }
        }

        // Pass 3: exact
        foreach ($transcribedWords as $i => $tw) {
            if (isset($usedIndices[$i])) continue;
            $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
            if ($targetCore === $twCore) {
                return ['_index' => $i, '_reason' => 'exact'] + $tw;
            }
        }

        // Pass 4: prefix
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

        // Pass 5: Levenshtein. Allowable distance scales with length:
        //   3 chars → ≤ 1   (boy ↔ boi)
        //   4-6 chars → ≤ 2
        //   7+ chars → ≤ 3  (elephant ↔ elaphant)
        if (strlen($targetCore) >= 3) {
            $maxDist = strlen($targetCore) >= 7 ? 3 : (strlen($targetCore) >= 4 ? 2 : 1);
            $best = null;
            $bestDist = PHP_INT_MAX;
            foreach ($transcribedWords as $i => $tw) {
                if (isset($usedIndices[$i])) continue;
                $twCore = preg_replace('/[^a-z0-9]/i', '', mb_strtolower(trim($tw['word'] ?? '')));
                if (strlen($twCore) < 2) continue;
                $d = levenshtein($targetCore, $twCore);
                if ($d <= $maxDist && $d < $bestDist) {
                    $best = ['_index' => $i, '_reason' => "fuzzy(d={$d})"] + $tw;
                    $bestDist = $d;
                }
            }
            if ($best) return $best;
        }

        return null;
    }

    /**
     * Common British/American/child-friendly synonyms. The lookup is
     * symmetric: passing any member of a group returns the group.
     */
    private function synonymGroup(string $core): array
    {
        static $groups = [
            ['mum', 'mom', 'mummy', 'mommy', 'mother'],
            ['dad', 'daddy', 'father', 'papa'],
            ['hi', 'hello', 'hey'],
            ['bye', 'goodbye'],
            ['rubber', 'eraser'],
            ['trousers', 'pants'],
            ['biscuit', 'cookie'],
            ['holiday', 'vacation'],
            ['lift', 'elevator'],
            ['nappy', 'diaper'],
            ['lorry', 'truck'],
            ['football', 'soccer'],
            ['grandma', 'granny', 'grandmother', 'nana'],
            ['grandpa', 'grandfather', 'granddad'],
        ];

        foreach ($groups as $group) {
            if (in_array($core, $group, true)) {
                return array_values(array_diff($group, [$core]));
            }
        }
        return [];
    }

    /**
     * Build a Whisper `prompt` string from the unit's vocabulary plus
     * the track's label. The prompt biases recognition toward exactly
     * the words we want to find. Format follows what Whisper expects:
     * a natural-sounding sentence containing the target words.
     */
    private function buildVocabHint(array $words, AudioTrack $track): string
    {
        if (empty($words)) {
            return '';
        }

        $vocab = implode(', ', array_slice($words, 0, 40));
        $label = $track->label ?: 'a children\'s English lesson';

        // The "context" sentence helps Whisper lock its language
        // model. Mentioning the words verbatim here makes Whisper
        // bias toward them in the transcription.
        return "This is {$label} for first-grade English learners. "
             . "The audio includes these words: {$vocab}.";
    }

}
