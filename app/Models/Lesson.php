<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_id',
        'lesson_number',
        'page_number',
        'title',
        'type',
        'config',
        'audio_track_id',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function audioTrack()
    {
        return $this->belongsTo(AudioTrack::class);
    }

    public function gameResults()
    {
        return $this->hasMany(GameResult::class);
    }
}
