<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Word extends Model
{
    protected $guarded = [];
    protected $casts = [
        'wrong_options' => 'array', 
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
