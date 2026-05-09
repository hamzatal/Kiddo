<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'level',
        'xp',
        'total_stars',
        'badges',
        'avatar',
        'locale',
        'sound_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'badges'            => 'array',
        'sound_enabled'     => 'boolean',
    ];

    public function progresses()
    {
        return $this->hasMany(UserProgress::class);
    }

    public function gameResults()
    {
        return $this->hasMany(GameResult::class);
    }

    public function aiInteractions()
    {
        return $this->hasMany(AiInteraction::class);
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
