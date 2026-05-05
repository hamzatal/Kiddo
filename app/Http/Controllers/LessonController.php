<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function show($unit_id = 2) // افتراضياً نعرض الوحدة الثانية (العائلة) إذا لم يُحدد
    {
        // بيانات المنهاج المعتمد للصف الأول - الفصل الأول
        $curriculum = [
            1 => [
                'unit_id' => 1,
                'unit_title' => 'Welcome Island',
                'lesson_title' => 'Say Hello!',
                'word' => 'Hello',
                'image' => '/assets/lessons/welcome/hello.png',
                'emoji' => '👋',
                'fact1' => 'We say Hello when we meet friends!',
                'fact2' => 'Numbers: One, Two, Three...',
                'next_route' => '/quiz/1'
            ],
            2 => [
                'unit_id' => 2,
                'unit_title' => 'Family Tree',
                'lesson_title' => "Let's Meet My Family",
                'word' => 'Dad', // بناءً على مفردات الوحدة الأولى من الكتاب
                'image' => '/assets/lessons/family/dad.png',
                'emoji' => '👨‍👧‍👦',
                'fact1' => 'This is my Dad. I love my family!',
                'fact2' => 'Other words: Mum, Brother, Sister.',
                'next_route' => '/quiz/2'
            ],
            3 => [
                'unit_id' => 3,
                'unit_title' => 'My School Bag',
                'lesson_title' => 'School Items',
                'word' => 'Pencil', // بناءً على مفردات الوحدة الثانية
                'image' => '/assets/lessons/schoolbag/pencil.png',
                'emoji' => '✏️',
                'fact1' => "It's used to write and draw.",
                'fact2' => 'The pencil has a soft eraser on the top!',
                'next_route' => '/quiz/3'
            ],
        ];

        // جلب بيانات الوحدة المطلوبة، أو الرجوع لدرس الحقيبة كاحتياط
        $lessonData = $curriculum[$unit_id] ?? $curriculum[3];

        return Inertia::render('LessonScreen', [
            'lessonData' => $lessonData
        ]);
    }
}
