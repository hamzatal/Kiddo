<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MapController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // تأكد من وجود Progress للوحدة الأولى على الأقل
        $firstUnit = Unit::orderBy('unit_number')->first();
        if ($firstUnit && !$user->progresses()->where('unit_id', $firstUnit->id)->exists()) {
            UserProgress::create([
                'user_id'        => $user->id,
                'unit_id'        => $firstUnit->id,
                'status'         => 'active',
                'current_lesson' => 1,
                'stars_earned'   => 0,
            ]);
        }

        $units = Unit::orderBy('unit_number')
            ->with('lessons')
            ->get()
            ->map(function (Unit $unit) use ($user) {
                $progress = $user->progresses()
                    ->where('unit_id', $unit->id)
                    ->first();

                $status = $progress->status ?? 'locked';
                if (!$progress && $unit->unit_number === 1) {
                    $status = 'active';
                }

                return [
                    'id'            => $unit->id,
                    'number'        => $unit->unit_number,
                    'title'         => $unit->title,
                    'lessonsCount'  => $unit->lessons_count,
                    'currentLesson' => $progress->current_lesson ?? 1,
                    'status'        => $status,
                    'stars'         => $progress->stars_earned ?? 0,
                ];
            });

        $completedUnitsCount = $units->where('status', 'done')->count();

        // آخر وحدة/درس نشط
        $activeProgress = $user->progresses()
            ->with('unit')
            ->where('status', 'active')
            ->orderBy('unit_id')
            ->first();

        $latestLessonTitle = $activeProgress
            ? $activeProgress->unit->title
            : ($firstUnit->title ?? 'Welcome Island');

        $completionPercentage = $units->count() > 0
            ? round($completedUnitsCount / $units->count() * 100)
            : 0;

        return Inertia::render('Map/MapScreen', [
            'user' => $user,
            'units' => $units,
            'stats' => [
                'completionPercentage' => $completionPercentage,
                'latestLesson'         => $latestLessonTitle,
            ],
        ]);
    }
}
