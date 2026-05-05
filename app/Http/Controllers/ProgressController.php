<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\UserProgress;
use Illuminate\Support\Facades\Auth;

class ProgressController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if (!$user) return redirect()->route('home');

        $allProgress = UserProgress::where('user_id', $user->id)->get();
        $completedUnits = $allProgress->where('status', 'done')->count();
        $totalUnits = 5; // عدد وحدات المنهاج

        $completionPercentage = $totalUnits > 0 ? round(($completedUnits / $totalUnits) * 100) : 0;

        // تجهيز بيانات الوحدات لعرضها في القائمة
        $unitsList = [];
        $unitNames = [
            1 => 'Welcome Island',
            2 => 'Family Tree',
            3 => 'My School Bag',
            4 => 'Our Classroom',
            5 => 'My Favourite Toy'
        ];

        for ($i = 1; $i <= $totalUnits; $i++) {
            $prog = $allProgress->where('unit_id', $i)->first();
            $status = $prog ? $prog->status : ($i === 1 ? 'active' : 'locked');

            $percentage = $status === 'done' ? 100 : ($status === 'active' ? 50 : 0);

            $unitsList[] = [
                'id' => $i,
                'name' => $unitNames[$i],
                'percentage' => $percentage,
                'stars' => $prog ? $prog->stars_earned : 0,
                'status' => $status
            ];
        }

        return Inertia::render('ProgressScreen', [
            'user' => [
                'name' => $user->name,
                'level' => $user->level,
                'total_stars' => $user->total_stars,
                'avatar' => $user->avatar
            ],
            'stats' => [
                'completion_percentage' => $completionPercentage,
                'latest_lesson' => $completedUnits > 0 ? $unitNames[$completedUnits] : 'Welcome Island',
            ],
            'unitsList' => $unitsList
        ]);
    }
}
