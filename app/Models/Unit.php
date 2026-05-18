<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    use HasFactory;

    protected $fillable = [
        'unit_number',
        'title',
        'code',
        'description',
        'image_path',
        'color_key',
        'lessons_count',
        'map_x',
        'map_y',
        'map_size',
        'map_image_path',
    ];

    protected $casts = [
        'map_x' => 'float',
        'map_y' => 'float',
    ];

    public function words()
    {
        return $this->hasMany(Word::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('lesson_number');
    }

    public function progresses()
    {
        return $this->hasMany(UserProgress::class);
    }

    public function gameResults()
    {
        return $this->hasMany(GameResult::class);
    }
}
