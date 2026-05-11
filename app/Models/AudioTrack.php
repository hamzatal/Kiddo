<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AudioTrack extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'source',
        'book_type',
        'semester',
        'page',
        'track_no',
        'label',
        'kind',
        'url',
        'local_path',
        'format',
        'file_size',
        'duration_sec',
        'downloaded_at',
    ];

    protected $casts = [
        'downloaded_at' => 'datetime',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    /**
     * Playable URL preferring the locally cached copy.
     * Returns a root-relative path (/assets/...) for local files,
     * or the full NCCD URL as fallback.
     */
    public function getPlayableUrlAttribute(): string
    {
        if ($this->local_path) {
            // local_path stored as "assets/audio/nccd/ab/p4.mp3"
            return '/' . ltrim($this->local_path, '/');
        }

        return $this->url;
    }
}
