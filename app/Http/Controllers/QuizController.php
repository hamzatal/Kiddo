<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Unit;
use App\Models\Word;
use App\Models\UserProgress;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    public function show($unit_id)
    {
        $unit = Unit::findOrFail($unit_id);
        $targetWord = Word::where('unit_id', $unit_id)->first();

        // جلب خيارات خاطئة من وحدات أخرى للتمويه
        $wrongWords = Word::where('id', '!=', $targetWord->id)->inRandomOrder()->limit(2)->get();

        $options = collect([
            ['id' => $targetWord->id, 'word' => $targetWord->word, 'imagePath' => $targetWord->image_path, 'isCorrect' => true]
        ]);

        foreach ($wrongWords as $wrong) {
            $options->push(['id' => $wrong->id, 'word' => $wrong->word, 'imagePath' => $wrong->image_path, 'isCorrect' => false]);
        }

        return Inertia::render('QuizScreen', [
            'quizData' => [
                'unit_id' => $unit->id,
                'targetWord' => $targetWord->word,
                'options' => $options->shuffle()->values()->all() // خلط الخيارات
            ]
        ]);
    }

    public function submit(Request $request)
    {
        $user = Auth::user();

        // 1. تحديث إحصائيات الطالب
        $user->increment('total_stars', 3);
        $user->increment('xp', 50);

        // 2. قفل الوحدة الحالية كـ (مكتملة)
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'unit_id' => $request->unit_id],
            ['status' => 'done', 'stars_earned' => 3]
        );

        // 3. فتح الوحدة التالية مباشرة بالترتيب (1 بفتح 2، و2 بفتح 3)
        if ($request->unit_id < 5) {
            UserProgress::firstOrCreate(
                ['user_id' => $user->id, 'unit_id' => $request->unit_id + 1],
                ['status' => 'active']
            );
        }

        return redirect()->route('map');
    }
}
