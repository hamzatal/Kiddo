<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use App\Models\Lesson;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LessonController extends Controller
{
    public function show(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::with('lessons')->findOrFail($unitId);

        $progress = UserProgress::firstOrCreate(
            [
                'user_id' => $user->id,
                'unit_id' => $unit->id,
            ],
            [
                'status'         => $unit->unit_number === 1 ? 'active' : 'locked',
                'current_lesson' => 1,
                'stars_earned'   => 0,
            ]
        );

        if ($progress->status === 'locked') {
            // منع الوصول لو الوحدة مقفولة
            return redirect()->route('map');
        }

        $currentLessonNumber = $progress->current_lesson ?? 1;

        $lesson = $unit->lessons()
            ->where('lesson_number', $currentLessonNumber)
            ->first();

        if (!$lesson) {
            // لا يوجد دروس أخرى -> اذهب للكويز
            return redirect()->route('quiz.show', $unit->id);
        }

        // اختيار كلمة مناسبة للدرس الحالي
        $wordQuery = Word::where('unit_id', $unit->id);

        $config = $lesson->config ?? [];

        if (!empty($config['word_filter'])) {
            $wordQuery->whereIn('word', $config['word_filter']);
        } elseif (!empty($config['category'])) {
            $wordQuery->where('category', $config['category']);
        }

        $word = $wordQuery->inRandomOrder()->first();

        if (!$word) {
            // fallback
            $word = Word::where('unit_id', $unit->id)->first();
        }

        return Inertia::render('Lessons/LessonScreen', [
            'unit' => [
                'id'    => $unit->id,
                'title' => $unit->title,
            ],
            'wordData' => $word ? [
                'id'           => $word->id,
                'word'         => $word->word,
                'imagePath'    => $word->image_path,
                'audioPath'    => $word->audio_path,
                'wrongOptions' => $word->wrong_options,
            ] : null,
            'progress' => [
                'current' => $currentLessonNumber,
                'total'   => $unit->lessons_count,
            ],
        ]);
    }

    public function complete(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::findOrFail($unitId);

        $progress = UserProgress::where('user_id', $user->id)
            ->where('unit_id', $unit->id)
            ->firstOrFail();

        // انتقال للدرس التالي أو تحويل للكويز
        if ($progress->current_lesson < $unit->lessons_count) {
            $progress->current_lesson += 1;
            $progress->last_activity_at = now();
            $progress->save();

            // XP بسيط لكل درس
            $user->increment('xp', 10);

            return redirect()->route('lesson.show', $unit->id);
        }

        // إذا انتهت كل الدروس -> اذهب للكويز
        return redirect()->route('quiz.show', $unit->id);
    }
}
