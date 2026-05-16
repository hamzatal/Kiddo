<?php

namespace App\Http\Controllers;

use App\Models\AudioTrack;
use Illuminate\Http\Request;

/**
 * Resolves an NCCD audio track to a playable URL.
 *
 * Why a 302 redirect (and NOT a server-side proxy)?
 *
 * The Admin → Audio Tracks page already proves the browser can play
 * NCCD audio just fine when the <audio> element has NO `crossOrigin`
 * attribute: the browser allows plain playback, seeking, and
 * timeupdate events even when qr.nccd.gov.jo doesn't send CORS
 * headers. The CORS check only kicks in when JS code asks for raw
 * sample data via the Web Audio API or Canvas.
 *
 * So we just redirect the browser straight to the upstream URL:
 *   • zero bytes of audio ever touch our Laravel server
 *   • repo stays tiny (no audio_cache directory growing forever)
 *   • Whisper still works because the artisan command downloads the
 *     file using `Http::get($track->url)` directly — see
 *     AudioSegmentationService::getAudioFile().
 *
 * The only time we DON'T redirect is when the admin has uploaded a
 * local copy (`local_path` is set). In that case we serve the local
 * file directly so the browser doesn't bounce out to NCCD.
 */
class AudioStreamController extends Controller
{
    public function __invoke(Request $request, string $code)
    {
        $track = AudioTrack::where('code', $code)->firstOrFail();

        // 1. Local file? Serve directly with permissive CORS so future
        //    consumers (e.g. WaveSurfer.js) can read the bytes.
        if ($track->local_path) {
            $abs = public_path($track->local_path);
            if (is_file($abs)) {
                return response()->file($abs, [
                    'Content-Type'                => $track->format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
                    'Accept-Ranges'               => 'bytes',
                    'Cache-Control'               => 'public, max-age=2592000',
                    'Access-Control-Allow-Origin' => '*',
                ]);
            }
        }

        // 2. Otherwise, send the browser straight to NCCD. <audio>
        //    elements without crossOrigin will follow the 302 and
        //    play the file with no CORS issues.
        return redirect()->away($track->url, 302);
    }
}
