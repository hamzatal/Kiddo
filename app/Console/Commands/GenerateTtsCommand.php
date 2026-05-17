<?php

namespace App\Console\Commands;

use App\Models\Unit;
use App\Services\TtsAudioService;
use Illuminate\Console\Command;

/**
 * Generates child-friendly TTS clips for words missing real audio.
 *
 *   php artisan kiddo:tts --unit=0
 *   php artisan kiddo:tts --all --overwrite
 */
class GenerateTtsCommand extends Command
{
    protected $signature = 'kiddo:tts
        {--unit= : Unit number to generate clips for}
        {--all : Process every unit}
        {--overwrite : Re-generate clips even if a file already exists}';

    protected $description = 'Generate per-word TTS audio (OpenAI tts-1) for words missing usable recordings';

    public function handle(): int
    {
        $service = TtsAudioService::make();
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
            $this->info("→ U{$unit->unit_number} {$unit->title}");
            $report = $service->synthesizeUnit($unit, $overwrite);
            $this->line("  generated = {$report['generated']}, skipped = {$report['skipped']}");
            foreach ($report['errors'] as $e) {
                $this->warn("  ! {$e}");
            }
        }
        return self::SUCCESS;
    }
}
