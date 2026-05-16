<?php

namespace App\Services;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AI-powered curriculum ingest:
 *   1. Pulls every AudioTrack linked (by `page`) to a Unit's known
 *      page range, downloads the mp3, transcribes it via Whisper
 *      with word-level timestamps.
 *   2. Sends the transcript + unit metadata to GPT to extract a
 *      compact JSON object: {vocabulary[], summary, objectives[],
 *      sentences[]}.
 *   3. Writes (idempotently) into the words / lessons tables and
 *      uses the Whisper word-level timestamps to populate
 *      segment_start_ms + segment_end_ms on each new vocab row.
 *
 * Designed to be safe to re-run. Existing rows are matched by
 * lower(word) + unit_id and only their missing fields are filled
 * in — so admin-edited image_path / category values are preserved.
 */
class CurriculumIngestService
{
    private const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
    private const CHAT_ENDPOINT    = 'https://api.openai.com/v1/chat/completions';

    /**
     * Page ranges that map to each Team Together 1A unit. Used by
     * `unitPageRange()` to figure out which AudioTracks belong to
     * a given unit when the admin clicks "Ingest" on its row.
     */
    private const UNIT_PAGE_RANGES = [
        0 => [4, 5],     // Welcome
        1 => [6, 13],    // U1 Family
        2 => [14, 21],   // U2 School bag
        3 => [22, 29],   // U3 Classroom
        4 => [30, 37],   // U4 Toy
        5 => [38, 39],   // Learning Club
    ];

    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly string  $chatModel = 'gpt-4o-mini',
    ) {
    }

    public static function make(): self
    {
        return new self(
            config('services.openai.key'),
            config('services.openai.model', 'gpt-4o-mini'),
        );
    }

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey);
    }

    public static function pageRangeForUnit(int $unitNumber): ?array
    {
        return self::UNIT_PAGE_RANGES[$unitNumber] ?? null;
    }

    /**
     * Main entry: ingest every track inside the unit's page range.
     *
     * @return array{
     *   unit:string, tracks:int, transcribed:int, vocab_added:int,
     *   vocab_updated:int, lessons_touched:int, errors:array<string>,
     *   summaries: array<int,array<string,mixed>>
     * }
     */
    public function ingestUnit(Unit $unit, bool $overwrite = false): array
    {
        $report = [
            'unit'           => $unit->title,
            'tracks'         => 0,
            'transcribed'    => 0,
            'vocab_added'    => 0,
            'vocab_updated'  => 0,
            'lessons_touched'=> 0,
            'errors'         => [],
            'summaries'      => [],
        ];

        if (! $this->isConfigured()) {
            $report['errors'][] = 'OPENAI_API_KEY is not configured.';
            return $report;
        }

        $range = self::pageRangeForUnit((int) $unit->unit_number);
        if (! $range) {
            $report['errors'][] = "No page range configured for unit U{$unit->unit_number}.";
            return $report;
        }
        [$pageFrom, $pageTo] = $range;

        // Prefer Pupil's Book audio because it's the primary teacher script.
        // Skip mp4 video tracks — Whisper doesn't transcribe them well and
        // they're usually song karaoke.
        $tracks = AudioTrack::where('book_type', 'pb')
            ->whereBetween('page', [$pageFrom, $pageTo])
            ->where('format', 'mp3')
            ->orderBy('page')->orderBy('track_no')
            ->get();

        if ($tracks->isEmpty()) {
            // Fall back to Activity Book if PB has no audio for this range yet.
            $tracks = AudioTrack::whereBetween('page', [$pageFrom, $pageTo])
                ->where('format', 'mp3')
                ->orderBy('page')->orderBy('track_no')
                ->get();
        }

        $report['tracks'] = $tracks->count();
        if ($tracks->isEmpty()) {
            $report['errors'][] = "No mp3 audio tracks linked for pages {$pageFrom}-{$pageTo}.";
            return $report;
        }

        foreach ($tracks as $track) {
            try {
                $audioFile = $this->downloadAudio($track);
                if (! $audioFile) {
                    $report['errors'][] = "Could not download {$track->code} ({$track->url}).";
                    continue;
                }

                $transcript = $this->transcribe($audioFile);
                if (! $transcript) {
                    $report['errors'][] = "Whisper failed on {$track->code}.";
                    continue;
                }
                $report['transcribed']++;

                $extracted = $this->extractCurriculumDetails(
                    $transcript['text'] ?? '',
                    $unit->title,
                    (string) ($track->label ?? ''),
                );

                $vocab = $this->upsertVocabulary($unit, $track, $transcript, $extracted, $overwrite);
                $report['vocab_added']   += $vocab['added'];
                $report['vocab_updated'] += $vocab['updated'];

                $lessonTouched = $this->annotateLesson($unit, $track, $extracted);
                if ($lessonTouched) {
                    $report['lessons_touched']++;
                }

                $report['summaries'][] = [
                    'track'      => $track->code,
                    'page'       => $track->page,
                    'transcript' => mb_strimwidth($transcript['text'] ?? '', 0, 240, '…'),
                    'vocabulary' => array_values($extracted['vocabulary'] ?? []),
                    'summary'    => $extracted['summary'] ?? null,
                    'objectives' => $extracted['objectives'] ?? [],
                    'sentences'  => $extracted['sentences'] ?? [],
                    'added'      => $vocab['added'],
                    'updated'    => $vocab['updated'],
                ];
            } catch (\Throwable $e) {
                Log::warning("ingestUnit error on {$track->code}: " . $e->getMessage());
                $report['errors'][] = "{$track->code}: " . $e->getMessage();
            }
        }

        return $report;
    }

    // ─────────────────────────────────────────────────────────────
    // Internals
    // ─────────────────────────────────────────────────────────────

    private function downloadAudio(AudioTrack $track): ?string
    {
        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs) && filesize($abs) > 0) return $abs;
        }
        $cache = storage_path('app/audio_cache/' . $track->code . '.' . ($track->format ?: 'mp3'));
        if (is_file($cache) && filesize($cache) > 0) return $cache;

        @mkdir(dirname($cache), 0775, true);
        try {
            $resp = Http::timeout(60)
                ->withHeaders(['User-Agent' => 'Kiddo/curriculum-ingest'])
                ->get($track->url);
            if ($resp->successful() && strlen($resp->body()) > 1024) {
                file_put_contents($cache, $resp->body());
                return $cache;
            }
        } catch (\Throwable $e) {
            Log::warning('ingest download failed: ' . $e->getMessage());
        }
        return null;
    }

    private function transcribe(string $path): ?array
    {
        try {
            $resp = Http::timeout(180)
                ->withToken($this->apiKey)
                ->attach('file', file_get_contents($path), basename($path))
                ->post(self::WHISPER_ENDPOINT, [
                    'model'                     => 'whisper-1',
                    'language'                  => 'en',
                    'response_format'           => 'verbose_json',
                    'timestamp_granularities[]' => 'word',
                ]);
            if (! $resp->successful()) {
                Log::warning('whisper api error', ['status' => $resp->status(), 'body' => $resp->body()]);
                return null;
            }
            return $resp->json();
        } catch (\Throwable $e) {
            Log::warning('whisper exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Asks GPT to mine a small structured curriculum summary from
     * the transcript. Keeps the response strictly JSON so we can
     * persist it without further parsing.
     */
    private function extractCurriculumDetails(string $transcript, string $unitTitle, string $trackLabel): array
    {
        if (trim($transcript) === '') return $this->emptyExtract();
        try {
            $system = "You are a curriculum design assistant for a first-grade English class "
                . "(Team Together 1A, Jordan). You will receive a transcript from a lesson audio track. "
                . "Extract a STRICT JSON object with these fields:\n"
                . "  vocabulary  – array of single-word lowercase entries that are concrete child-friendly nouns/verbs/colours/numbers spoken in the audio.\n"
                . "  summary     – ONE short sentence (max 18 words) describing what this audio teaches.\n"
                . "  objectives  – up to 3 short learning objectives (verb-led, e.g. 'Identify family members').\n"
                . "  sentences   – up to 3 simple example sentences a child could echo (≤ 8 words each).\n"
                . "Return ONLY the JSON object, no prose, no markdown. Keep vocabulary specific to the unit.";
            $user = "Unit: {$unitTitle}\nTrack: {$trackLabel}\nTranscript:\n" . $transcript;

            $resp = Http::timeout(45)
                ->withToken($this->apiKey)
                ->acceptJson()
                ->post(self::CHAT_ENDPOINT, [
                    'model'       => $this->chatModel,
                    'messages'    => [
                        ['role' => 'system', 'content' => $system],
                        ['role' => 'user',   'content' => $user],
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.2,
                    'max_tokens'  => 600,
                ]);
            if (! $resp->successful()) {
                Log::warning('chat extract failed', ['body' => $resp->body()]);
                return $this->emptyExtract();
            }
            $content = $resp->json('choices.0.message.content') ?: '{}';
            $decoded = json_decode($content, true);
            if (! is_array($decoded)) return $this->emptyExtract();
            return [
                'vocabulary' => array_values(array_unique(array_map(
                    fn ($w) => strtolower(trim((string) $w)),
                    (array) ($decoded['vocabulary'] ?? [])
                ))),
                'summary'    => is_string($decoded['summary'] ?? null) ? trim($decoded['summary']) : null,
                'objectives' => array_slice(array_map('strval', (array) ($decoded['objectives'] ?? [])), 0, 3),
                'sentences'  => array_slice(array_map('strval', (array) ($decoded['sentences']  ?? [])), 0, 3),
            ];
        } catch (\Throwable $e) {
            Log::warning('chat extract exception: ' . $e->getMessage());
            return $this->emptyExtract();
        }
    }

    private function emptyExtract(): array
    {
        return ['vocabulary' => [], 'summary' => null, 'objectives' => [], 'sentences' => []];
    }

    /**
     * Persist vocabulary the AI mined from the audio, computing per-word
     * segment timestamps from the Whisper transcript when possible.
     */
    private function upsertVocabulary(Unit $unit, AudioTrack $track, array $transcript, array $extracted, bool $overwrite): array
    {
        $words = $extracted['vocabulary'] ?? [];
        $added = 0;
        $updated = 0;
        $whisperWords = $transcript['words'] ?? [];

        foreach ($words as $w) {
            $clean = preg_replace('/[^a-z0-9 \']/i', '', $w);
            $clean = trim($clean);
            if ($clean === '') continue;
            // Skip junk words / stopwords that aren't useful flashcards.
            if (in_array(strtolower($clean), ['the','a','an','and','or','is','it','this','that','to','do'], true)) continue;
            $titleCased = mb_convert_case($clean, MB_CASE_TITLE, 'UTF-8');

            $existing = Word::where('unit_id', $unit->id)
                ->whereRaw('LOWER(word) = ?', [strtolower($titleCased)])
                ->first();

            // Compute Whisper segment for this word
            [$startMs, $endMs] = $this->matchWhisperSegment($titleCased, $whisperWords);

            if ($existing) {
                $patch = [];
                if ($existing->audio_track_id === null) {
                    $patch['audio_track_id'] = $track->id;
                }
                if ($overwrite || $existing->segment_start_ms === null) {
                    if ($startMs !== null) $patch['segment_start_ms'] = $startMs;
                }
                if ($overwrite || $existing->segment_end_ms === null) {
                    if ($endMs !== null) $patch['segment_end_ms'] = $endMs;
                }
                if (! $existing->category) {
                    $patch['category'] = $extracted['summary'] ? 'ai-ingest' : null;
                }
                if (! empty($patch)) {
                    $existing->update($patch);
                    $updated++;
                }
                continue;
            }

            Word::create([
                'unit_id'         => $unit->id,
                'word'            => $titleCased,
                'type'            => 'vocab',
                'category'        => 'ai-ingest',
                'audio_track_id'  => $track->id,
                'segment_start_ms'=> $startMs,
                'segment_end_ms'  => $endMs,
            ]);
            $added++;
        }

        return ['added' => $added, 'updated' => $updated];
    }

    /**
     * Find the matching Whisper word with timestamp.
     * Returns [startMs, endMs] (with 50ms head padding & 100ms tail).
     */
    private function matchWhisperSegment(string $target, array $whisperWords): array
    {
        if (empty($whisperWords)) return [null, null];
        $needle = preg_replace('/[^a-z0-9]/i', '', mb_strtolower($target));
        if ($needle === '') return [null, null];
        foreach ($whisperWords as $tw) {
            $hay = preg_replace('/[^a-z0-9]/i', '', mb_strtolower((string) ($tw['word'] ?? '')));
            if ($hay === $needle || str_starts_with($hay, $needle) || str_starts_with($needle, $hay)) {
                $start = max(0, (int) round(($tw['start'] ?? 0) * 1000) - 50);
                $end   = (int) round(($tw['end'] ?? 0) * 1000) + 100;
                if ($end > $start) return [$start, $end];
            }
        }
        return [null, null];
    }

    /**
     * Stash the AI summary/objectives into the matching Lesson.config
     * so the admin sees them in /admin/lessons. Doesn't overwrite
     * existing config keys — only appends `ai_summary`, `ai_objectives`,
     * `ai_sentences` so curated content stays intact.
     */
    private function annotateLesson(Unit $unit, AudioTrack $track, array $extracted): bool
    {
        if (! $extracted['summary'] && empty($extracted['objectives']) && empty($extracted['sentences'])) {
            return false;
        }

        // Try to find a lesson on this exact page/track first; else
        // any lesson in this unit pointing at this track.
        $lesson = Lesson::where('unit_id', $unit->id)
            ->where(function ($q) use ($track) {
                $q->where('audio_track_id', $track->id)
                  ->orWhere('page_number', $track->page);
            })
            ->orderBy('lesson_number')
            ->first();
        if (! $lesson) return false;

        $config = $lesson->config ?? [];
        $config['ai_summary']    = $extracted['summary'];
        $config['ai_objectives'] = $extracted['objectives'];
        $config['ai_sentences']  = $extracted['sentences'];
        $config['ai_ingested_at']= now()->toIso8601String();
        $lesson->update(['config' => $config]);
        return true;
    }
}
