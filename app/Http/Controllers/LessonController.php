<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use App\Models\UserProgress;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LessonController extends Controller
{
    public function show($unit_id)
    {
        $user = Auth::user();
        $unit = Unit::findOrFail($unit_id);

        // جلب تقدم المستخدم في هذه الوحدة
        $progress = UserProgress::where('user_id', $user->id)
            ->where('unit_id', $unit_id)
            ->first();

        $currentLesson = $progress->current_lesson ?? 1;

        // جلب الكلمات بالترتيب
        $words = Word::where('unit_id', $unit_id)->get();

        if ($currentLesson > $words->count()) {
            // إذا خلص الدروس، نروح للكويز
            return redirect()->route('quiz.show', $unit_id);
        }

        $word = $words[$currentLesson - 1];

        return Inertia::render('LessonScreen', [
            'unit' => [
                'id' => $unit->id,
                'title' => $unit->title,
            ],
            'wordData' => [
                'id' => $word->id,
                'word' => $word->word,
                'image_path' => $word->image_path,
                'audio_path' => $word->audio_path,
                'wrong_options' => $word->wrong_options
            ],
            'progress' => [
                'current' => $currentLesson,
                'total' => $words->count()
            ]
        ]);
    }

    // حفظ التقدم بعد إنهاء الدرس
    public function complete($unit_id)
    {
        $user = Auth::user();

        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit_id],
            ['current_lesson' => 1]
        );

        $progress->increment('current_lesson');
        $user->increment('xp', 10); // 10 نقاط لكل درس

        return response()->json(['success' => true]);
    }
}
