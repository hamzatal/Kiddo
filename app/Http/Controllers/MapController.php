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

        // Make sure the very first unit (U0) has a progress row so the
        // learner can start immediately.
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

        $unitsRaw = Unit::orderBy('unit_number')->with('lessons')->get();

        // Strict sequential unlocking (FIX 6):
        //   - unit_number 0  -> always active/done
        //   - unit N > 0     -> locked unless previous unit's progress is 'done'
        // We walk units in order so we can consult the previously-computed
        // unit's status for the lock rule.
        $prevStatus = 'done'; // treat the "before U0" state as done so U0 unlocks.

        $units = $unitsRaw->map(function (Unit $unit) use ($user, &$prevStatus) {
            $progress = $user->progresses()
                ->where('unit_id', $unit->id)
                ->first();

            $storedStatus = $progress->status ?? null;

            if ((int) $unit->unit_number === 0) {
                // Welcome unit: always either active or done.
                $status = $storedStatus === 'done' ? 'done' : 'active';
            } else {
                if ($storedStatus === 'done') {
                    $status = 'done';
                } elseif ($prevStatus === 'done') {
                    $status = 'active';
                } else {
                    $status = 'locked';
                }
            }

            $prevStatus = $status;

            return [
                'id'            => $unit->id,
                'number'        => $unit->unit_number,
                'title'         => $unit->title,
                'lessonsCount'  => $unit->lessons_count,
                'currentLesson' => $progress->current_lesson ?? 1,
                'status'        => $status,
                'stars'         => $progress->stars_earned ?? 0,
                'stars_earned'  => $progress->stars_earned ?? 0,
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

        $totalStars = $units->sum('stars_earned');

        return Inertia::render('Map/MapScreen', [
            'user' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'total_stars' => $user->total_stars ?? $totalStars,
                'xp'          => $user->xp ?? 0,
                'level'       => $user->level ?? 1,
                'isAdmin'     => method_exists($user, 'isAdmin') ? $user->isAdmin() : false,
            ],
            'units' => $units,
            'stats' => [
                'completionPercentage' => $completionPercentage,
                'latestLesson'         => $latestLessonTitle,
                'total_stars'          => $user->total_stars ?? $totalStars,
            ],
        ]);
    }
}
