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

        if (!$user) {
            $user = User::first();
            if (!$user) {
                $user = User::create([
                    'name' => 'Alex',
                    'email' => 'alex@kiddo.test',
                    'password' => bcrypt('password'),
                    'avatar' => 'boy',
                    'level' => 2,
                    'xp' => 350,
                    'total_stars' => 125,
                ]);
            }
            Auth::login($user);
        }

        $baseUnits = [
            [
                'id' => 1,
                'number' => '1',
                'title' => 'Welcome Island',
                'imagePath' => '/assets/lessons/welcome/hut.png',
                'color' => 'bg-[#7C3AED]',
                'pos' => ['left' => '16%', 'top' => '44%'],
                'lessons_count' => 1
            ],
            [
                'id' => 2,
                'number' => '2',
                'title' => 'Family Tree',
                'imagePath' => '/assets/lessons/family/treehouse.png',
                'color' => 'bg-[#2563EB]',
                'pos' => ['left' => '50%', 'top' => '34%'],
                'lessons_count' => 5
            ],
            [
                'id' => 3,
                'number' => '3',
                'title' => 'My School Bag',
                'imagePath' => '/assets/lessons/schoolbag/bag.png',
                'color' => 'bg-[#DB2777]',
                'pos' => ['left' => '80%', 'top' => '40%'],
                'lessons_count' => 5
            ],
            [
                'id' => 4,
                'number' => '4',
                'title' => 'Our Classroom',
                'imagePath' => '/assets/lessons/classroom/desk.png',
                'color' => 'bg-[#D97706]',
                'pos' => ['left' => '27%', 'top' => '72%'],
                'lessons_count' => 5
            ],
            [
                'id' => 5,
                'number' => '5',
                'title' => 'My Favourite Toy',
                'imagePath' => '/assets/lessons/toy/bear.png',
                'color' => 'bg-[#16A34A]',
                'pos' => ['left' => '64%', 'top' => '72%'],
                'lessons_count' => 5
            ],
        ];

        // 3. جلب تقدم الطفل من الداتا بيس
        $progress = UserProgress::where('user_id', $user->id)->get()->keyBy('unit_id');

        // 4. دمج بيانات المنهاج مع تقدم الطفل
        $units = array_map(function ($unit) use ($progress) {
            $unitProgress = $progress->get($unit['id']);

            if ($unitProgress) {
                $unit['status'] = $unitProgress->status; // 'done', 'active', 'locked'
                $unit['stars'] = $unitProgress->stars_earned;

                if ($unit['status'] === 'active') {
                    $unit['badge'] = 'Current Adventure!';
                    $unit['label'] = "Lesson {$unit['id']}.{$unitProgress->lesson_id}";

                    // حساب الدروس الفرعية المكتملة
                    $unit['subLessons'] = array_fill(0, $unit['lessons_count'], false);
                    for ($i = 0; $i < ($unitProgress->lesson_id - 1); $i++) {
                        $unit['subLessons'][$i] = true;
                    }
                }
            } else {
                // الوضع الافتراضي: الوحدة الأولى فعالة والباقي مقفل
                $unit['status'] = $unit['id'] === 1 ? 'active' : 'locked';
                $unit['stars'] = 0;

                if ($unit['status'] === 'active') {
                    $unit['badge'] = 'Current Adventure!';
                    $unit['label'] = "Lesson {$unit['id']}.1";
                    $unit['subLessons'] = array_fill(0, $unit['lessons_count'], false);
                }
            }

            return $unit;
        }, $baseUnits);

        // إرسال البيانات إلى واجهة React عن طريق Inertia
        return Inertia::render('MapScreen', [
            'user' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                'level' => $user->level,
                'xp' => $user->xp,
                'total_stars' => $user->total_stars,
            ],
            'units' => $units
        ]);
    }
}
