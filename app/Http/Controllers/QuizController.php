<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\UserProgress;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    // 1. عرض بيانات الاختبار بناءً على الوحدة
    public function show($unit_id = 2)
    {
        // بنك الأسئلة بناءً على المنهاج
        $quizzes = [
            2 => [
                'unit_id' => 2,
                'questionText' => 'Where is',
                'targetWord' => 'Dad',
                'audioPrompt' => 'Where is Dad?',
                'options' => [
                    ['id' => 1, 'word' => 'Boy', 'imagePath' => '/assets/lessons/family/boy.png', 'isCorrect' => false],
                    ['id' => 2, 'word' => 'Cat', 'imagePath' => '/assets/lessons/family/cat.png', 'isCorrect' => false],
                    ['id' => 3, 'word' => 'Dad', 'imagePath' => '/assets/lessons/family/dad.png', 'isCorrect' => true],
                ]
            ],
            3 => [
                'unit_id' => 3,
                'questionText' => 'Where is the',
                'targetWord' => 'Pencil',
                'audioPrompt' => 'Where is the pencil?',
                'options' => [
                    ['id' => 1, 'word' => 'Bag', 'imagePath' => '/assets/lessons/schoolbag/bag.png', 'isCorrect' => false],
                    ['id' => 2, 'word' => 'Pencil', 'imagePath' => '/assets/lessons/schoolbag/pencil.png', 'isCorrect' => true],
                    ['id' => 3, 'word' => 'Bear', 'imagePath' => '/assets/lessons/toy/bear.png', 'isCorrect' => false],
                ]
            ],
        ];

        $quizData = $quizzes[$unit_id] ?? $quizzes[3];

        return Inertia::render('QuizScreen', [
            'quizData' => $quizData
        ]);
    }

    // 2. حفظ النتيجة وفتح المرحلة التالية
    public function submit(Request $request)
    {
        $user = Auth::user();

        // تحديث إجمالي النجوم والـ XP للطفل
        $user->total_stars += $request->stars_earned;
        $user->xp += $request->xp_earned;
        $user->save();

        // تحديث حالة الوحدة الحالية إلى "مكتملة" (done)
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'unit_id' => $request->unit_id],
            ['lesson_id' => 5, 'status' => 'done', 'stars_earned' => $request->stars_earned]
        );

        // فتح الوحدة التالية (active) إذا لم تكن الوحدة الأخيرة
        if ($request->unit_id < 5) {
            UserProgress::updateOrCreate(
                ['user_id' => $user->id, 'unit_id' => $request->unit_id + 1],
                ['lesson_id' => 1, 'status' => 'active']
            );
        }

        // العودة للخريطة
        return redirect()->route('map');
    }
}
