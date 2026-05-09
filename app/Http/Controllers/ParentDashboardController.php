<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ParentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $units = Unit::orderBy('unit_number')
            ->with(['lessons', 'progresses' => function ($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->get()
            ->map(function (Unit $unit) use ($user) {
                $progress = $unit->progresses->first();

                $status = $progress->status ?? 'locked';
                $percentage = 0;

                if ($progress) {
                    $percentage = $unit->lessons_count > 0
                        ? round(($progress->current_lesson - 1) / $unit->lessons_count * 100)
                        : 0;

                    if ($status === 'done') {
                        $percentage = 100;
                    }
                }

                return [
                    'id'         => $unit->id,
                    'name'       => $unit->title,
                    'percentage' => $percentage,
                    'stars'      => $progress->stars_earned ?? 0,
                    'status'     => $status,
                ];
            });

        $totalUnits   = $units->count();
        $unitsDone    = $units->where('status', 'done')->count();
        $completion   = $totalUnits > 0 ? round($unitsDone / $totalUnits * 100) : 0;

        return Inertia::render('Parent/ProgressScreen', [
            'user'  => $user,
            'unitsList' => $units,
            'stats' => [
                'completionPercentage' => $completion,
                'latestLesson'         => optional(
                    $units->firstWhere('status', 'active')
                )['name'] ?? ($units->first()['name'] ?? 'Welcome / Hello'),
            ],
        ]);
    }
}
