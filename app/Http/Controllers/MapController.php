<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Support\Facades\Auth;

class MapController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // بيانات وهمية في حال عدم وجود مستخدم لتسهيل الفحص
        if (!$user) {
            $user = User::firstOrCreate(
                ['email' => 'alex@kiddo.test'],
                [
                    'name' => 'Alex',
                    'password' => bcrypt('password'),
                    'avatar' => 'boy',
                    'level' => 2,
                    'xp' => 350,
                    'total_stars' => 125,
                ]
            );
            Auth::login($user);
        }

        // 1. الداتا الأساسية فقط (بدون أي ألوان أو مسارات صور)
        $baseUnits = [
            ['id' => 1, 'number' => '1', 'title' => 'Welcome Island', 'lessons_count' => 1],
            ['id' => 2, 'number' => '2', 'title' => 'Family Tree', 'lessons_count' => 5],
            ['id' => 3, 'number' => '3', 'title' => 'My School Bag', 'lessons_count' => 5],
            ['id' => 4, 'number' => '4', 'title' => 'Our Classroom', 'lessons_count' => 5],
            ['id' => 5, 'number' => '5', 'title' => 'My Favourite Toy', 'lessons_count' => 5],
        ];

        // 2. جلب تقدم الطفل
        $progress = UserProgress::where('user_id', $user->id)->get()->keyBy('unit_id');

        // 3. دمج الحالة مع الدروس
        $units = array_map(function ($unit) use ($progress) {
            $unitProgress = $progress->get($unit['id']);

            if ($unitProgress) {
                $unit['status'] = $unitProgress->status; // 'done', 'active', 'locked'
                $unit['stars'] = $unitProgress->stars_earned;
                $unit['current_lesson'] = $unitProgress->lesson_id ?? 1;
            } else {
                // الافتراضي: الدرس الأول مفتوح والباقي مقفل
                $unit['status'] = $unit['id'] === 1 ? 'active' : 'locked';
                $unit['stars'] = 0;
                $unit['current_lesson'] = 1;
            }

            return $unit;
        }, $baseUnits);

        // إرسال داتا نقية للفرونت إند
        return Inertia::render('MapScreen', [
            'user' => [
                'name' => $user->name,
                'level' => $user->level,
                'xp' => $user->xp,
                'total_stars' => $user->total_stars,
                'streak' => $user->streak ?? 3,
            ],
            'units' => $units
        ]);
    }
}
