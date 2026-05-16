<?php

namespace App\Console\Commands;

use App\Services\NccdAudioDiscoveryService;
use Illuminate\Console\Command;

/**
 * Crawl the NCCD QR server (https://qr.nccd.gov.jo/QR/Eng/{grade}/{book}/)
 * and persist every working mp3/mp4 URL into the audio_tracks table.
 *
 * Examples:
 *   php artisan kiddo:discover-audio
 *   php artisan kiddo:discover-audio --grade=1 --pages=4-43
 *   php artisan kiddo:discover-audio --book=pb
 */
class DiscoverNccdCommand extends Command
{
    protected $signature = 'kiddo:discover-audio
        {--grade=1 : NCCD grade folder (1-6)}
        {--book=both : Which book(s) to crawl (ab|pb|both)}
        {--pages=4-43 : Page range, e.g. 4-43 or single page like 12}';

    protected $description = 'Probe the NCCD audio server and upsert every working URL into audio_tracks';

    public function handle(): int
    {
        $service = NccdAudioDiscoveryService::make();

        $grade = (int) $this->option('grade');
        $book  = $this->option('book');
        $rangeOpt = $this->option('pages');

        // Parse "4-43" or "12" syntax.
        $pages = [];
        if (str_contains($rangeOpt, '-')) {
            [$from, $to] = array_map('intval', explode('-', $rangeOpt, 2));
            $pages = range(min($from, $to), max($from, $to));
        } else {
            $pages = [(int) $rangeOpt];
        }

        $this->info("Probing NCCD grade {$grade}, book={$book}, pages " . min($pages) . "-" . max($pages));

        $books = $book === 'both' ? ['ab', 'pb'] : [$book];
        $totals = ['tried' => 0, 'found' => 0, 'created' => 0, 'updated' => 0];

        foreach ($books as $b) {
            $this->line('');
            $this->info("→ /{$b}/");
            $report = $service->discoverBook($b, $grade, $pages);
            $this->line("  tried   = {$report['tried']}");
            $this->line("  found   = {$report['found']}");
            $this->line("  created = {$report['created']}");
            $this->line("  updated = {$report['updated']}");
            foreach (['tried', 'found', 'created', 'updated'] as $k) {
                $totals[$k] += $report[$k];
            }
        }

        $this->line('');
        $this->info("Done. Total tried={$totals['tried']}, found={$totals['found']}, created={$totals['created']}, updated={$totals['updated']}.");
        return self::SUCCESS;
    }
}
