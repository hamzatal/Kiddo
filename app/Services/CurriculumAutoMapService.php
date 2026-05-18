<?php

namespace App\Services;

use App\Models\AudioTrack;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\Word;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * One-button "AI auto-map" pipeline.
 *
 * The operator clicks ONE button in the admin and this service
 * walks the entire curriculum end-to-end:
 *
 *   1. Crawl every plausible NCCD QR endpoint for the requested
 *      grade. NCCD ships four sibling folders for the Team Together
 *      English series:
 *         /QR/Eng/{grade}/ab        Activity Book
 *         /QR/Eng/{grade}/pb        Pupil's Book
 *         /QR/Eng/{grade}/new       Newer (re-recorded) tracks
 *         /QR/Eng/{grade}/part2     Semester-2 split
 *      Each folder uses the same `p{page}.mp3` / `p{page}.{n}.mp3`
 *      naming convention so a single discovery loop covers all of
 *      them. We HEAD-probe every candidate URL and persist the
 *      working ones into `audio_tracks` (idempotent upsert by code).
 *
 *   2. For every track inside the requested unit's page range, run
 *      Whisper with word-level timestamps + a prompt biased toward
 *      the unit's already-known vocabulary. The transcript flows
 *      back into a structured GPT extract:
 *           { vocabulary[], summary, objectives[], sentences[] }
 *
 *   3. Auto-wire the database:
 *        • Match the track to a Lesson by `page_number` and pin it
 *          via `audio_track_id`.
 *        • For every existing Word in the unit, find its exact (or
 *          fuzzy) timestamp inside the Whisper output and write
 *          segment_start_ms / segment_end_ms. NEVER overwrites a
 *          hand-stamped segment unless `overwrite=true`.
 *        • For new vocabulary the AI mined from the audio, create a
 *          `Word` row with the correct unit + track + timestamps.
 *
 *   4. (Optional) Generate child-friendly OpenAI TTS clips for any
 *      remaining words still missing audio (typically Welcome unit
 *      colours / numbers / characters where NCCD has no recording).
 *
 * The output is a structured report the admin UI can render as a
 * progress log so the operator sees, per-unit:
 *   tracks discovered · tracks transcribed · words linked · words
 *   added · lessons annotated · TTS generated · errors.
 */
class CurriculumAutoMapService
{
    /**
     * NCCD QR ships the same `p{page}.mp3` pattern under several
     * sibling folders. We crawl all four — the missing folders just
     * resolve to 0 found tracks, which is harmless.
     */
    private const FOLDERS = ['ab', 'pb', 'new', 'part2'];
    public const  BASE     = 'https://qr.nccd.gov.jo/QR/Eng/';

    public function __construct(
        private readonly NccdAudioDiscoveryService $discovery,
        private readonly AudioSegmentationService  $segmentation,
        private readonly CurriculumIngestService   $ingest,
        private readonly TtsAudioService           $tts,
    ) {
    }

    public static function make(): self
    {
        return new self(
            NccdAudioDiscoveryService::make(),
            AudioSegmentationService::make(),
            CurriculumIngestService::make(),
            TtsAudioService::make(),
        );
    }

    public function isConfigured(): bool
    {
        // We need the AI subsystem to be configured because Whisper
        // and GPT both depend on the OpenAI key.
        return $this->ingest->isConfigured();
    }

    /**
     * Execute the full pipeline for a grade.
     *
     * @param int   $grade        e.g. 1
     * @param int[] $pages        page range to crawl (defaults to 4..43)
     * @param array $options
     *        - overwrite (bool)        replace existing segment timestamps. default false
     *        - skip_tts  (bool)        do NOT generate fallback TTS clips. default false
     *        - units     (?int[])      restrict ingestion to these unit IDs
     *
     * @return array<string,mixed> structured report — safe to JSON-encode
     */
    public function run(int $grade, ?array $pages = null, array $options = []): array
    {
        @set_time_limit(0);
        $report = [
            'started_at'     => now()->toIso8601String(),
            'grade'          => $grade,
            'discovery'      => null,
            'units'          => [],
            'tts'            => ['generated' => 0, 'skipped' => 0, 'errors' => []],
            'errors'         => [],
            'totals'         => [
                'tracks_found'      => 0,
                'tracks_linked'     => 0,
                'words_segmented'   => 0,
                'words_added'       => 0,
                'lessons_annotated' => 0,
                'tts_generated'     => 0,
            ],
        ];

        if (! $this->isConfigured()) {
            $report['errors'][] = 'OPENAI_API_KEY is not configured. Add it to .env to enable AI auto-map.';
            return $report;
        }

        // ── Step 1: Discover ─────────────────────────────────────
        $pages ??= range(4, 43);
        try {
            $discoveryReport = $this->discoverAllFolders($grade, $pages);
            $report['discovery'] = $discoveryReport;
            $report['totals']['tracks_found'] = (int) ($discoveryReport['totals']['found'] ?? 0);
        } catch (\Throwable $e) {
            $report['errors'][] = 'Discovery failed: ' . $e->getMessage();
        }

        // ── Step 2 + 3: Ingest each unit ─────────────────────────
        $units = Unit::orderBy('unit_number')->get();
        if (! empty($options['units'])) {
            $allow = array_map('intval', $options['units']);
            $units = $units->filter(fn (Unit $u) => in_array($u->id, $allow, true))->values();
        }

        $overwrite = (bool) ($options['overwrite'] ?? false);
        foreach ($units as $unit) {
            $unitReport = [
                'unit'              => $unit->title,
                'unit_number'       => $unit->unit_number,
                'tracks'            => 0,
                'transcribed'       => 0,
                'words_segmented'   => 0,
                'words_added'       => 0,
                'lessons_linked'    => 0,
                'lessons_annotated' => 0,
                'errors'            => [],
            ];

            try {
                // Run the existing ingest pipeline (downloads, Whisper,
                // GPT, vocabulary upsert + lesson annotation).
                $ingestReport = $this->ingest->ingestUnit($unit, $overwrite);
                $unitReport['tracks']             = (int) ($ingestReport['tracks']         ?? 0);
                $unitReport['transcribed']        = (int) ($ingestReport['transcribed']    ?? 0);
                $unitReport['words_added']        = (int) ($ingestReport['vocab_added']    ?? 0);
                $unitReport['words_segmented']    = (int) ($ingestReport['vocab_updated']  ?? 0);
                $unitReport['lessons_annotated']  = (int) ($ingestReport['lessons_touched']?? 0);
                if (! empty($ingestReport['errors'])) {
                    $unitReport['errors'] = array_merge($unitReport['errors'], $ingestReport['errors']);
                }

                // Pin tracks to lessons by page_number — even when the
                // ingest didn't run Whisper for a track (e.g. ingest
                // skipped video files), this still gives every lesson
                // a usable audio_track_id.
                $unitReport['lessons_linked'] = $this->linkTracksToLessonsByPage($unit);

                // Run Whisper-driven segmentation on every track
                // linked to a word in this unit so we capture words
                // the ingest didn't surface. Idempotent — segments
                // already set are preserved unless overwrite=true.
                $extra = $this->segmentLinkedTracks($unit, $overwrite);
                $unitReport['words_segmented'] += $extra;
            } catch (\Throwable $e) {
                $unitReport['errors'][] = $e->getMessage();
            }

            $report['units'][] = $unitReport;
            $report['totals']['tracks_linked']     += $unitReport['lessons_linked'];
            $report['totals']['words_segmented']   += $unitReport['words_segmented'];
            $report['totals']['words_added']       += $unitReport['words_added'];
            $report['totals']['lessons_annotated'] += $unitReport['lessons_annotated'];
        }

        // ── Step 4: TTS fill-in ──────────────────────────────────
        if (! ($options['skip_tts'] ?? false) && $this->tts->isConfigured()) {
            foreach ($units as $unit) {
                try {
                    $ttsReport = $this->tts->synthesizeUnit($unit, false);
                    $report['tts']['generated'] += (int) ($ttsReport['generated'] ?? 0);
                    $report['tts']['skipped']   += (int) ($ttsReport['skipped']   ?? 0);
                    if (! empty($ttsReport['errors'])) {
                        $report['tts']['errors'] = array_merge(
                            $report['tts']['errors'],
                            $ttsReport['errors']
                        );
                    }
                } catch (\Throwable $e) {
                    $report['tts']['errors'][] = $e->getMessage();
                }
            }
            $report['totals']['tts_generated'] = $report['tts']['generated'];
        }

        $report['finished_at'] = now()->toIso8601String();
        return $report;
    }

    // ──────────────────────────────────────────────────────────
    // Internals
    // ──────────────────────────────────────────────────────────

    /**
     * Crawl all four NCCD subfolders (ab, pb, new, part2) for a
     * grade. Returns the merged report. The `discoverBook()` call
     * inside NccdAudioDiscoveryService only knew about ab/pb —
     * we extend it here to cover the two newer folders by issuing
     * the same probe pattern.
     */
    private function discoverAllFolders(int $grade, array $pages): array
    {
        $totals = ['tried' => 0, 'found' => 0, 'created' => 0, 'updated' => 0];
        $books  = [];

        foreach (self::FOLDERS as $folder) {
            try {
                if ($folder === 'ab' || $folder === 'pb') {
                    $rep = $this->discovery->discoverBook($folder, $grade, $pages);
                } else {
                    // Reuse the same probing logic but adapt the
                    // book_type / code prefix so the upsert doesn't
                    // collide with the standard ab/pb codes.
                    $rep = $this->discoverExtraFolder($folder, $grade, $pages);
                }
                $books[$folder] = $rep;
                $totals['tried']   += (int) ($rep['tried']   ?? 0);
                $totals['found']   += (int) ($rep['found']   ?? 0);
                $totals['created'] += (int) ($rep['created'] ?? 0);
                $totals['updated'] += (int) ($rep['updated'] ?? 0);
            } catch (\Throwable $e) {
                Log::warning("auto-map: discovery failed on {$folder}: " . $e->getMessage());
                $books[$folder] = ['error' => $e->getMessage()];
            }
        }

        return ['totals' => $totals, 'books' => $books];
    }

    /**
     * Probe a "non-canonical" NCCD folder (currently `new` /
     * `part2`). The URL pattern is identical to ab/pb but we tag
     * the resulting tracks with their folder name so the admin
     * library picker can group them sensibly. Codes look like:
     *   NEW6 / PART2_12 / etc.
     *
     * Idempotent — re-running just upserts by code.
     */
    private function discoverExtraFolder(string $folder, int $grade, array $pages): array
    {
        $tried   = 0;
        $found   = 0;
        $created = 0;
        $updated = 0;
        $tracks  = [];

        foreach ($pages as $page) {
            $candidates = [
                ['file' => "p{$page}.mp3", 'track_no' => 1, 'format' => 'mp3'],
            ];
            for ($i = 2; $i <= 6; $i++) {
                $candidates[] = ['file' => "p{$page}.{$i}.mp3", 'track_no' => $i, 'format' => 'mp3'];
            }
            $candidates[] = ['file' => "p{$page}.mp4", 'track_no' => 1, 'format' => 'mp4'];

            foreach ($candidates as $c) {
                $tried++;
                $url   = self::BASE . "{$grade}/{$folder}/" . $c['file'];
                $probe = $this->segmentation->probeUrl($url);
                if (! ($probe['ok'] ?? false)) continue;
                $found++;

                $codePrefix = strtoupper($folder === 'part2' ? 'P2' : $folder);
                $suffix     = $c['track_no'] > 1 ? '_' . $c['track_no'] : '';
                $videoSfx   = $c['format'] === 'mp4' ? 'V' : '';
                $code       = $codePrefix . $page . $suffix . $videoSfx;

                $existing = AudioTrack::where('code', $code)->first();
                $payload  = [
                    'code'      => $code,
                    'source'    => $folder,
                    // Keep book_type as 'pb' so existing UI grouping
                    // shows them under "Pupil's Book"; we differentiate
                    // by `source` instead.
                    'book_type' => $existing?->book_type ?: ($folder === 'ab' ? 'ab' : 'pb'),
                    'semester'  => $folder === 'part2' ? 2 : 1,
                    'page'      => $page,
                    'track_no'  => $c['track_no'],
                    'label'     => $existing?->label ?: $this->labelForExtra($folder, $page, $c['track_no']),
                    'kind'      => $existing?->kind  ?: ($c['format'] === 'mp4' ? 'dialogue' : 'listen_point_say'),
                    'url'       => $url,
                    'format'    => $c['format'],
                    'file_size' => $probe['size'] ?? null,
                ];

                if ($existing) {
                    $existing->update($payload);
                    $updated++;
                    $tracks[] = $existing->fresh()->toArray();
                } else {
                    $row = AudioTrack::create($payload);
                    $created++;
                    $tracks[] = $row->toArray();
                }
            }
        }

        return [
            'tried'   => $tried,
            'found'   => $found,
            'created' => $created,
            'updated' => $updated,
            'tracks'  => $tracks,
        ];
    }

    private function labelForExtra(string $folder, int $page, int $trackNo): string
    {
        $bookName = match ($folder) {
            'new'   => 'Re-recorded (new)',
            'part2' => 'Semester 2',
            default => ucfirst($folder),
        };
        $extra = $trackNo > 1 ? " (track {$trackNo})" : '';
        return "{$bookName} p{$page}{$extra}";
    }

    /**
     * Pin AudioTracks to Lessons by matching `page_number`. Lessons
     * that already have an audio_track_id are left alone so manual
     * curation isn't undone.
     *
     * Returns the number of lessons we updated.
     */
    private function linkTracksToLessonsByPage(Unit $unit): int
    {
        $lessons = Lesson::where('unit_id', $unit->id)
            ->whereNull('audio_track_id')
            ->whereNotNull('page_number')
            ->get();
        if ($lessons->isEmpty()) return 0;

        $count = 0;
        foreach ($lessons as $lesson) {
            // Prefer Pupil's Book first track for a page; fall back
            // to Activity Book; then to anything.
            $track = AudioTrack::where('page', $lesson->page_number)
                ->where('format', 'mp3')
                ->orderByRaw("FIELD(book_type,'pb','ab','new','part2')")
                ->orderBy('track_no')
                ->first();
            if (! $track) continue;
            $lesson->update(['audio_track_id' => $track->id]);
            $count++;
        }
        return $count;
    }

    /**
     * Run AudioSegmentationService on every track currently linked
     * to a word in this unit. Useful as a fallback when the ingest
     * step couldn't extract tight Whisper timestamps for a Word —
     * the segmentation pass uses the same Whisper transcript but
     * matches against the EXACT spelling we have stored, so it
     * tends to fill the last few unset segments.
     *
     * Returns the total number of words newly segmented.
     */
    private function segmentLinkedTracks(Unit $unit, bool $overwrite): int
    {
        $trackIds = Word::query()
            ->whereNotNull('audio_track_id')
            ->where('unit_id', $unit->id)
            ->when(! $overwrite, fn ($q) => $q->where(function ($q) {
                $q->whereNull('segment_start_ms')->orWhereNull('segment_end_ms');
            }))
            ->distinct()
            ->pluck('audio_track_id');
        if ($trackIds->isEmpty()) return 0;

        $matched = 0;
        foreach (AudioTrack::whereIn('id', $trackIds)->get() as $track) {
            try {
                $r = $this->segmentation->segmentTrack($track, $overwrite);
                $matched += (int) ($r['matched'] ?? 0);
            } catch (\Throwable $e) {
                Log::warning("auto-map segmentation: {$track->code} — " . $e->getMessage());
            }
        }
        return $matched;
    }
}
