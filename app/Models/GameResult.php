<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'unit_id',
        'lesson_id',
        'word_id',
        'type',
        'correct_count',
        'wrong_count',
        'score',
        'meta',
        // Mass-assignable so seeders, the StreakService test suite,
        // and any future history-back-fill commands can plant rows
        // at deterministic timestamps. Eloquent's updateTimestamps()
        // already skips overwriting either column when it's marked
        // dirty by fill(), so passing an explicit value through
        // GameResult::create([...]) is honoured exactly.
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function word()
    {
        return $this->belongsTo(Word::class);
    }
}
