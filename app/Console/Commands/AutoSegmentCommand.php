<?php

namespace App\Console\Commands;

use App\Models\AudioTrack;
use App\Models\Unit;
use App\Services\AudioSegmentationService;
use Illuminate\Console\Command;

/**
 * AI auto-segmentation command.
 *
 * Uses OpenAI Whisper to automatically extract per-word timestamps
 * for audio tracks, eliminating the need to manually stamp each
 * word's start/end time in the admin panel.
 *
 * Examples:
 *   php artisan kiddo:auto-segment --track=PB6
 *   php artisan kiddo:auto-segment --unit=2
 *   php artisan kiddo:auto-segment --all
 *   php artisan kiddo:auto-segment --all --overwrite
 */
class AutoSegmentCommand extends Command
{
    protected $signature = 'kiddo:auto-segment
        {--track= : Track code (e.g. PB6) to segment}
        {--unit= : Unit number to segment all linked tracks for}
        {--all : Segment all tracks that have linked words}
        {--overwrite : Overwrite existing segments}';

    protected $description = 'Use OpenAI Whisper to auto-extract per-word timestamps from audio tracks';

    public function handle(): int
    {
        $service = AudioSegmentationService::make();

        if (! $service->isConfigured()) {
            $this->error('OPENAI_API_KEY is not configured in your .env file.');
            $this->line('Add this line to .env:  OPENAI_API_KEY=sk-...');
            return self::FAILURE;
        }

        $tracks = $this->resolveTracks();
        if ($tracks->isEmpty()) {
            $this->warn('No tracks to process. Use --track=CODE or --unit=N or --all');
            return self::FAILURE;
        }

        $overwrite = (bool) $this->option('overwrite');
        $totalMatched = 0;
        $totalWords = 0;

        $this->info("Processing {$tracks->count()} track(s)" . ($overwrite ? ' (overwriting existing segments)' : ''));

        foreach ($tracks as $track) {
            $this->line('');
            $this->info("→ Track {$track->code}: {$track->label}");

            $result = $service->segmentTrack($track, $overwrite);

            if (isset($result['error'])) {
                $this->warn("  ⚠ {$result['error']}");
                continue;
            }

            if (! empty($result['message'])) {
                $this->line("  ℹ {$result['message']}");
                continue;
            }

            $matched = $result['matched'] ?? 0;
            $total = $result['total'] ?? 0;
            $totalMatched += $matched;
            $totalWords += $total;

            $this->line("  ✓ Matched {$matched}/{$total} words");

            if ($this->getOutput()->isVerbose() && ! empty($result['words'])) {
                foreach ($result['words'] as $w) {
                    if ($w['matched'] ?? null) {
                        $this->line("    • {$w['word']}: {$w['start_ms']}ms → {$w['end_ms']}ms ({$w['duration']})");
                    } else {
                        $this->line("    × {$w['word']}: not found");
                    }
                }
            }
        }

        $this->line('');
        $this->info("Done! Total: {$totalMatched}/{$totalWords} words segmented.");
        return self::SUCCESS;
    }

    private function resolveTracks()
    {
        $code = $this->option('track');
        if ($code) {
            return AudioTrack::where('code', $code)->get();
        }

        $unitNumber = $this->option('unit');
        if ($unitNumber !== null) {
            $unit = Unit::where('unit_number', $unitNumber)->first();
            if (! $unit) {
                $this->error("Unit {$unitNumber} not found");
                return collect();
            }
            return AudioTrack::whereHas('words', fn ($q) => $q->where('unit_id', $unit->id))
                ->distinct()
                ->get();
        }

        if ($this->option('all')) {
            return AudioTrack::whereHas('words')->get();
        }

        return collect();
    }
}
