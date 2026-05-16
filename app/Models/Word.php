<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Word extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_id',
        'word',
        'type',
        'audio_path',
        'audio_track_id',
        'segment_start_ms',
        'segment_end_ms',
        'image_path',
        'wrong_options',
        'category',
    ];

    protected $casts = [
        'wrong_options'     => 'array',
        'segment_start_ms'  => 'integer',
        'segment_end_ms'    => 'integer',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function audioTrack()
    {
        return $this->belongsTo(AudioTrack::class);
    }

    /**
     * Build a front-end friendly audio clip descriptor. Prefers a
     * segment of a shared NCCD track (streamed, no download needed)
     * and falls back to the per-word audio_path if no track is linked.
     *
     * The `src` field points DIRECTLY at the upstream NCCD URL, the
     * same way the Admin → Audio Tracks page plays audio. This lets
     * the browser stream the mp3 without bouncing through our Laravel
     * server (no /api/audio/{code} 302) — same trick that fixed the
     * Words & Segments editor. The proxy URL is still exposed under
     * `proxySrc` for callers that prefer it.
     *
     * Always exposes `tts` so the browser can fall back to its built-in
     * speech synthesizer (free, no network) when:
     *   • there is no audio track at all (e.g. Welcome unit U0 — no
     *     usable NCCD audio for the colours/numbers/characters), or
     *   • the linked track plays but the word has no segment yet.
     *
     * Shape:
     *   [
     *     'src'        => 'https://qr.nccd.gov.jo/.../p6.mp3' | null
     *     'proxySrc'   => '/api/audio/PB6'                    | null
     *     'startMs'    => 0,                                  // null = play from start
     *     'endMs'      => 1800,                               // null = play to end
     *     'trackCode'  => 'PB6',                              | null
     *     'label'      => 'Boy',
     *     'tts'        => 'Boy',                              // text for speechSynthesis fallback
     *   ]
     */
    public function audioClip(): ?array
    {
        if ($this->audio_track_id && $this->audioTrack) {
            $code = $this->audioTrack->code;
            return [
                'src'       => $this->audioTrack->url,
                'proxySrc'  => "/api/audio/{$code}",
                'startMs'   => $this->segment_start_ms,
                'endMs'     => $this->segment_end_ms,
                'trackCode' => $code,
                'label'     => $this->word,
                'remoteUrl' => $this->audioTrack->url,
                'tts'       => $this->word,
            ];
        }

        if ($this->audio_path) {
            return [
                'src'       => '/' . ltrim($this->audio_path, '/'),
                'startMs'   => null,
                'endMs'     => null,
                'trackCode' => null,
                'label'     => $this->word,
                'tts'       => $this->word,
            ];
        }

        // Last-resort fallback: no track and no per-word file. Still
        // hand the frontend a TTS hint so the child hears the word
        // pronounced via the browser's built-in speech synthesizer.
        return [
            'src'       => null,
            'proxySrc'  => null,
            'startMs'   => null,
            'endMs'     => null,
            'trackCode' => null,
            'label'     => $this->word,
            'tts'       => $this->word,
        ];
    }
}
