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
 * The frontend uses the same URL plus optional `?s=1800&e=3600`
 * query params (milliseconds) to document which segment it wants;
 * the server doesn't actually slice the MP3 — that's handled in JS
 * by seeking and stopping on timeupdate. The query params stay in
 * the URL so they can also be read by other code or logged.
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

        return redirect()->away($track->url, 302, [
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
