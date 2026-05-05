<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'unit_id',
        'lesson_id',
        'status',
        'stars_earned',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
