<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use Inertia\Inertia;

class LessonController extends Controller
{
    public function show($unit_id)
    {
        $unit = Unit::with('words')->findOrFail($unit_id);
        // نختار كلمة عشوائية من الوحدة الحالية للدرس
        $wordData = $unit->words->random();

        return Inertia::render('LessonScreen', [
            'unit' => $unit,
            'wordData' => $wordData
        ]);
    }
}
