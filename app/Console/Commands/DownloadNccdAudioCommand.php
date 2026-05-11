<?php

namespace App\Console\Commands;

use App\Models\AudioTrack;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

/**
 * Mirrors the NCCD audio tracks locally so the app keeps working even
 * when the MoE server is offline / geo-blocked. Run from a location
 * that can actually reach qr.nccd.gov.jo (the server rejects requests
 * from outside Jordan with HTTP 403).
 *
 *   php artisan nccd:download                # all missing tracks
 *   php artisan nccd:download --force        # re-download everything
 *   php artisan nccd:download --source=ab    # restrict to a subfolder
 *   php artisan nccd:download --skip-mp4     # skip large video files
 */
class DownloadNccdAudioCommand extends Command
{
    protected $signature = 'nccd:download
        {--source= : Limit to a single source subfolder (ab|pb|part2|new_g1)}
        {--force : Re-download tracks that already have a local copy}
        {--skip-mp4 : Skip mp4 video files (they are large)}';

    protected $description = 'Download NCCD audio tracks into public/assets/audio/nccd/';

    public function handle(): int
    {
        $query = AudioTrack::query();

        if ($source = $this->option('source')) {
            $query->where('source', $source);
        }
        if ($this->option('skip-mp4')) {
            $query->where('format', 'mp3');
        }
        if (! $this->option('force')) {
            $query->whereNull('local_path');
        }

        $tracks = $query->orderBy('source')->orderBy('page')->orderBy('track_no')->get();

        if ($tracks->isEmpty()) {
            $this->info('Nothing to download. Run with --force to re-fetch existing files.');
            return self::SUCCESS;
        }

        $this->info("Downloading {$tracks->count()} track(s)...");
        $bar = $this->output->createProgressBar($tracks->count());
        $bar->start();

        $ok = $failed = $skipped = 0;

        foreach ($tracks as $track) {
            $relDir = "assets/audio/nccd/{$track->source}";
            $absDir = public_path($relDir);
            if (! is_dir($absDir) && ! mkdir($absDir, 0755, true) && ! is_dir($absDir)) {
                $this->newLine();
                $this->error("Cannot create directory: {$absDir}");
                $failed++;
                $bar->advance();
                continue;
            }

            $filename = basename(parse_url($track->url, PHP_URL_PATH) ?: '');
            if ($filename === '') {
                $filename = strtolower($track->code) . '.' . $track->format;
            }
            $absPath = $absDir . DIRECTORY_SEPARATOR . $filename;
            $relPath = $relDir . '/' . $filename;

            if (! $this->option('force') && is_file($absPath) && filesize($absPath) > 0) {
                $track->update([
                    'local_path'    => $relPath,
                    'file_size'     => filesize($absPath),
                    'downloaded_at' => $track->downloaded_at ?? now(),
                ]);
                $skipped++;
                $bar->advance();
                continue;
            }

            try {
                $response = Http::timeout(120)
                    ->withOptions([
                        'sink'            => $absPath,
                        'verify'          => true,
                        'allow_redirects' => true,
                    ])
                    ->withHeaders([
                        'User-Agent' => 'Kiddo-Audio-Sync/1.0 (+https://github.com/hamzatal/Kiddo)',
                        'Accept'     => '*/*',
                    ])
                    ->get($track->url);

                if (! $response->successful()) {
                    throw new \RuntimeException("HTTP {$response->status()} for {$track->url}");
                }

                $size = is_file($absPath) ? filesize($absPath) : 0;
                if ($size === 0) {
                    throw new \RuntimeException("Empty file for {$track->url}");
                }

                $track->update([
                    'local_path'    => $relPath,
                    'file_size'     => $size,
                    'downloaded_at' => now(),
                ]);
                $ok++;
            } catch (\Throwable $e) {
                @unlink($absPath);
                $this->newLine();
                $this->warn("  ✗ {$track->code}: " . $e->getMessage());
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done. Downloaded: {$ok}, skipped (already present): {$skipped}, failed: {$failed}.");

        if ($failed > 0) {
            $this->warn('Some tracks failed. The NCCD server only accepts connections from Jordan, so run this command from a Jordanian server or VPN.');
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
