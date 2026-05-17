<?php

namespace App\Console\Commands;

use App\Models\Unit;
use App\Services\CurriculumIngestService;
use Illuminate\Console\Command;

/**
 * Whisper + GPT pipeline that mines vocabulary and lesson details
 * straight out of a unit's audio recordings.
 *
 *   php artisan kiddo:ingest-unit --unit=1
 *   php artisan kiddo:ingest-unit --all
 *   php artisan kiddo:ingest-unit --unit=0 --overwrite
 */
class IngestUnitCommand extends Command
{
    protected $signature = 'kiddo:ingest-unit
        {--unit= : Unit number (0..5)}
        {--all : Ingest every unit}
        {--overwrite : Replace existing segment timestamps}';

    protected $description = 'Use Whisper + GPT to add words/details to a unit from its recorded audio';

    public function handle(): int
    {
        $service = CurriculumIngestService::make();

        if (! $service->isConfigured()) {
            $this->error('OPENAI_API_KEY is not configured.');
            return self::FAILURE;
        }

        $units = $this->option('all')
            ? Unit::orderBy('unit_number')->get()
            : Unit::where('unit_number', (int) $this->option('unit'))->get();

        if ($units->isEmpty()) {
            $this->error('No matching unit. Use --unit=N or --all.');
            return self::FAILURE;
        }

        $overwrite = (bool) $this->option('overwrite');

        foreach ($units as $unit) {
            $this->line('');
            $this->info("Ingesting Unit U{$unit->unit_number}: {$unit->title}");
            $report = $service->ingestUnit($unit, $overwrite);

            $this->line("  tracks transcribed: {$report['transcribed']}/{$report['tracks']}");
            $this->line("  vocabulary added:   {$report['vocab_added']}");
            $this->line("  vocabulary updated: {$report['vocab_updated']}");
            $this->line("  lessons annotated:  {$report['lessons_touched']}");
            if (! empty($report['errors'])) {
                $this->warn("  warnings:");
                foreach ($report['errors'] as $err) {
                    $this->line("    • {$err}");
                }
            }
            if ($this->getOutput()->isVerbose()) {
                foreach ($report['summaries'] as $s) {
                    $this->line('');
                    $this->line("  ⌘ {$s['track']} (p{$s['page']})");
                    $this->line('    summary    : ' . ($s['summary'] ?? '—'));
                    if (! empty($s['vocabulary'])) {
                        $this->line('    vocabulary : ' . implode(', ', $s['vocabulary']));
                    }
                    if (! empty($s['objectives'])) {
                        $this->line('    objectives : ' . implode(' / ', $s['objectives']));
                    }
                    if (! empty($s['sentences'])) {
                        $this->line('    sentences  : ' . implode(' | ', $s['sentences']));
                    }
                }
            }
        }

        $this->line('');
        $this->info('Done.');
        return self::SUCCESS;
    }
}
