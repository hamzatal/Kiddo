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
        'title',
        'type',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function gameResults()
    {
        return $this->hasMany(GameResult::class);
    }
}
