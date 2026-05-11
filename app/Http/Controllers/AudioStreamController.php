<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * Streams an NCCD audio track to the browser without forcing a local
 * download of all ~500MB of curriculum media. Two modes:
 *
 *   - If the track has a local_path (admin opted in to caching),
 *     we serve the file from disk with Range-request support so the
 *     browser can seek / skip freely.
 *   - Otherwise, we 302-redirect to the official qr.nccd.gov.jo URL.
 *     The browser then issues Range requests directly against NCCD
 *     (it supports them), so only the requested bytes are downloaded.
 *
 * This endpoint is cheap and stable, which lets the frontend <audio>
 * element point at /api/audio/{code} and seek to any millisecond
 * segment without any extra plumbing.
 */
class AudioStreamController extends Controller
{
    public function __invoke(Request $request, string $code): RedirectResponse|BinaryFileResponse
    {
        $track = AudioTrack::where('code', $code)->firstOrFail();

        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs)) {
                return response()->file($abs, [
                    'Content-Type'   => $track->format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
                    'Accept-Ranges'  => 'bytes',
                    'Cache-Control'  => 'public, max-age=2592000',
                ]);
            }
        }

        // Stream directly from NCCD: the browser will issue its own
        // Range requests against their server. 302 keeps this handler
        // stateless and avoids proxying bytes through Laravel.
        return redirect()->away($track->url, 302, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
