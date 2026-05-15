<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams an NCCD audio track to the browser.
 *
 * IMPORTANT: We PROXY the audio (not redirect) to avoid CORS issues
 * when the SegmentEditor tries to seek/preview audio. Browsers block
 * cross-origin audio with crossOrigin="anonymous" unless the server
 * sends Access-Control-Allow-Origin headers — which qr.nccd.gov.jo
 * does not.
 *
 * Three modes:
 *   1. local_path exists  -> serve file directly (fastest)
 *   2. cached in storage  -> serve from cache
 *   3. fallback           -> proxy stream from NCCD with CORS headers
 *
 * The proxy supports HTTP Range requests so the browser can seek
 * and only download the bytes it actually plays.
 */
class AudioStreamController extends Controller
{
    public function __invoke(Request $request, string $code)
    {
        $track = AudioTrack::where('code', $code)->firstOrFail();

        // 1. Local file? Serve directly.
        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs)) {
                return response()->file($abs, [
                    'Content-Type'   => $track->format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
                    'Accept-Ranges'  => 'bytes',
                    'Cache-Control'  => 'public, max-age=2592000',
                    'Access-Control-Allow-Origin' => '*',
                ]);
            }
        }

        // 2. Check storage cache (storage/app/audio_cache/{code}.mp3)
        $cachePath = storage_path('app/audio_cache/' . $code . '.' . $track->format);
        if (is_file($cachePath)) {
            return $this->serveLocalFile($cachePath, $track);
        }

        // 3. Try to download and cache, then serve
        @mkdir(dirname($cachePath), 0775, true);
        try {
            $response = Http::timeout(30)
                ->withOptions(['allow_redirects' => true])
                ->get($track->url);

            if ($response->successful()) {
                file_put_contents($cachePath, $response->body());
                return $this->serveLocalFile($cachePath, $track);
            }
        } catch (\Throwable $e) {
            Log::warning('Audio proxy failed: ' . $e->getMessage());
        }

        // 4. Last resort: redirect (might fail with CORS but better than nothing)
        return redirect()->away($track->url, 302);
    }

    private function serveLocalFile(string $abs, AudioTrack $track): BinaryFileResponse
    {
        return response()->file($abs, [
            'Content-Type'   => $track->format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
            'Accept-Ranges'  => 'bytes',
            'Cache-Control'  => 'public, max-age=2592000',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Range',
            'Access-Control-Expose-Headers' => 'Content-Range, Content-Length, Accept-Ranges',
        ]);
    }
}
