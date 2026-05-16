<?php

namespace App\Console\Commands;

use App\Models\AudioTrack;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Downloads NCCD audio tracks to local storage for offline use.
 *
 * Once downloaded, both the lesson player and the auto-segment command
 * will use the local copy instead of trying to reach qr.nccd.gov.jo.
 *
 * Usage:
 *   php artisan kiddo:download-tracks --all
 *   php artisan kiddo:download-tracks --track=PB6
 */
class DownloadTracksCommand extends Command
{
    protected $signature = 'kiddo:download-tracks
        {--track= : Download a specific track by code}
        {--all : Download all tracks}
        {--timeout=30 : HTTP timeout in seconds}';

    protected $description = 'Download NCCD audio tracks to local storage for offline use';

    public function handle(): int
    {
        $tracks = $this->option('all')
            ? AudioTrack::all()
            : ($this->option('track')
                ? AudioTrack::where('code', $this->option('track'))->get()
                : collect());

        if ($tracks->isEmpty()) {
            $this->warn('No tracks to download. Use --all or --track=CODE');
            return self::FAILURE;
        }

        $timeout = (int) $this->option('timeout');
        $downloaded = 0;
        $failed = 0;
        $skipped = 0;

        $this->info("Downloading {$tracks->count()} track(s)...");

        foreach ($tracks as $track) {
            $cachePath = storage_path('app/audio_cache/' . $track->code . '.' . ($track->format ?: 'mp3'));

            if (is_file($cachePath)) {
                $skipped++;
                $this->line("  ⏭ {$track->code} (already cached)");
                continue;
            }

            @mkdir(dirname($cachePath), 0775, true);

            try {
                $this->line("  ⬇ {$track->code} from {$track->url}...");
                $response = Http::timeout($timeout)
                    ->withOptions(['allow_redirects' => true])
                    ->get($track->url);

                if ($response->successful()) {
                    file_put_contents($cachePath, $response->body());
                    $size = round(filesize($cachePath) / 1024);
                    $this->line("    ✓ Saved ({$size} KB)");
                    $downloaded++;
                } else {
                    $this->warn("    ✗ HTTP {$response->status()}");
                    $failed++;
                }
            } catch (\Throwable $e) {
                $this->error("    ✗ {$e->getMessage()}");
                $failed++;
            }
        }

        $this->line('');
        $this->info("Done: {$downloaded} downloaded, {$skipped} skipped, {$failed} failed.");

        if ($failed > 0) {
            $this->warn("Some downloads failed. Make sure you have internet access to qr.nccd.gov.jo");
            $this->line("Tip: Try from a network without firewall/proxy blocking the NCCD server.");
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
