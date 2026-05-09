<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use App\Models\UserProgress;
use App\Models\GameResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function show(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::findOrFail($unitId);

        $words = Word::where('unit_id', $unit->id)->inRandomOrder()->get();

        $questions = $words->map(function (Word $word) {
            $options = collect([
                [
                    'id'        => 'correct_' . $word->id,
                    'word'      => $word->word,
                    'imagePath' => $word->image_path,
                    'isCorrect' => true,
                ],
            ]);

            if (is_array($word->wrong_options)) {
                foreach ($word->wrong_options as $index => $wrong) {
                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_' . $index,
                        'word'      => $wrong['word'] ?? 'Wrong',
                        'imagePath' => $wrong['image_path'] ?? null,
                        'isCorrect' => false,
                    ]);
                }
            }

            return [
                'targetWord' => $word->word,
                'options'    => $options->shuffle()->values()->all(),
            ];
        });

        return Inertia::render('Quiz/QuizScreen', [
            'quizData' => [
                'unitId'    => $unit->id,
                'unitTitle' => $unit->title,
                'questions' => $questions,
            ],
        ]);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'unitId'        => 'required|integer|exists:units,id',
            'correctCount'  => 'nullable|integer',
            'wrongCount'    => 'nullable|integer',
            'score'         => 'nullable|integer',
        ]);

        $user   = $request->user();
        $unitId = (int) $request->input('unitId');

        $unit = Unit::findOrFail($unitId);

        $correct = (int) $request->input('correctCount', 0);
        $wrong   = (int) $request->input('wrongCount', 0);
        $score   = (int) $request->input('score', max(0, $correct - $wrong) * 10);

        // حفظ نتيجة الكويز
        GameResult::create([
            'user_id'       => $user->id,
            'unit_id'       => $unit->id,
            'lesson_id'     => null,
            'type'          => 'unit-quiz',
            'correct_count' => $correct,
            'wrong_count'   => $wrong,
            'score'         => $score,
            'meta'          => null,
        ]);

        // تحديث Progress: الوحدة منتهية
        $progress = UserProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'unit_id' => $unit->id,
            ],
            [
                'status'          => 'done',
                'current_lesson'  => $unit->lessons_count,
                'stars_earned'    => 3, // مبدئياً
                'last_activity_at' => now(),
            ]
        );

        // إضافة Stars و XP للمستخدم
        $user->increment('total_stars', 3);
        $user->increment('xp', 50);

        // فتح الوحدة التالية إن وجدت
        $nextUnit = Unit::where('unit_number', '>', $unit->unit_number)
            ->orderBy('unit_number')
            ->first();

        if ($nextUnit) {
            UserProgress::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'unit_id' => $nextUnit->id,
                ],
                [
                    'status'         => 'active',
                    'current_lesson' => 1,
                    'stars_earned'   => 0,
                ]
            );
        }

        return redirect()->route('map');
    }
}
