<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    // عرض الكويز النهائي للوحدة
    public function show($unit_id)
    {
        $unit = Unit::findOrFail($unit_id);

        // جلب جميع كلمات الوحدة لعمل أسئلة منها
        $words = Word::where('unit_id', $unit_id)->inRandomOrder()->get();

        $questions = $words->map(function ($word) {
            // تجهيز الخيارات: الخيار الصحيح + خيارات خاطئة للتمويه
            $options = collect([
                ['id' => 'c_' . $word->id, 'word' => $word->word, 'imagePath' => $word->image_path, 'isCorrect' => true]
            ]);

            // إضافة الخيارات الخاطئة
            if (is_array($word->wrong_options)) {
                foreach ($word->wrong_options as $index => $wrong) {
                    $options->push([
                        'id' => 'w_' . $word->id . '_' . $index,
                        'word' => $wrong['word'] ?? $wrong,
                        'imagePath' => $wrong['image_path'] ?? null,
                        'isCorrect' => false
                    ]);
                }
            }

            return [
                'targetWord' => $word->word,
                'options' => $options->shuffle()->values()->all()
            ];
        });

        return Inertia::render('QuizScreen', [
            'quizData' => [
                'unit_id' => $unit->id,
                'questions' => $questions // إرسال مصفوفة الأسئلة كلها
            ]
        ]);
    }

    // حفظ النتيجة وفتح الدرس اللي بعده بالترتيب
    public function submit(Request $request)
    {
        $user = Auth::user();
        $unit_id = $request->unit_id;

        // 1. زيادة الـ XP والنجوم
        $user->increment('total_stars', 3);
        $user->increment('xp', 50);

        // 2. جعل الوحدة الحالية (done)
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit_id],
            ['status' => 'done', 'stars_earned' => 3]
        );

        // 3. فتح الوحدة اللي بعدها مباشرة (إذا كانت الوحدة الحالية 1، بنفتح 2)
        $nextUnit = Unit::where('unit_number', '>', function ($query) use ($unit_id) {
            $query->select('unit_number')->from('units')->where('id', $unit_id);
        })->orderBy('unit_number', 'asc')->first();

        if ($nextUnit) {
            UserProgress::firstOrCreate(
                ['user_id' => $user->id, 'unit_id' => $nextUnit->id],
                ['status' => 'active', 'stars_earned' => 0]
            );
        }

        return redirect()->route('map'); // نرجعه للخريطة
    }
}
