<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UserProgress;
use App\Services\UnitAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MapController extends Controller
{
    public function __construct(private readonly UnitAccessService $access)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // Make sure the very first unit (U0) has a progress row so the
        // learner can start immediately.
        $firstUnit = Unit::orderBy('unit_number')->first();
        if ($firstUnit) {
            UserProgress::firstOrCreate(
                ['user_id' => $user->id, 'unit_id' => $firstUnit->id],
                [
                    'status'         => 'active',
                    'current_lesson' => 1,
                    'stars_earned'   => 0,
                ],
            );
        }

        // FIX (N+1): the previous version called
        //   $user->progresses()->where('unit_id', $u->id)->first()
        // inside a `map()` over every unit — turning the page load
        // into 1 + N queries. UnitAccessService now eager-loads all
        // progresses in a single query and indexes them by unit_id.
        $unitsRaw = Unit::orderBy('unit_number')
            ->withCount('lessons')
            ->get();

        $annotated = $this->access->annotate($unitsRaw, $user);

        $units = $annotated->map(function (array $row) {
            $unit     = $row['unit'];
            $progress = $row['progress'];
            return [
                'id'             => $unit->id,
                'number'         => $unit->unit_number,
                'title'          => $unit->title,
                'lessonsCount'   => (int) $unit->lessons_count,
                'currentLesson'  => $row['current_lesson'],
                'status'         => $row['status'],
                'stars'          => $row['stars_earned'],
                'stars_earned'   => $row['stars_earned'],
                // Map placement is DB-driven so the admin can reposition
                // a pin without code changes.
                'image_path'     => $unit->image_path,
                'color_key'      => $unit->color_key,
                'map_x'          => $unit->map_x,
                'map_y'          => $unit->map_y,
                'map_size'       => $unit->map_size,
                'map_image_path' => $unit->map_image_path ?: $unit->image_path,
            ];
        });

        $completedUnitsCount = $units->where('status', 'done')->count();

        // Latest active unit (for the sidebar's "Today's mission" tile).
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

        // Arena unlocks once at least one lesson has been cleared.
        $arenaUnlocked = $units->contains(fn ($u) => $u['status'] === 'done')
            || $this->access->arenaUnlocked($user);

        // Position the Arena pin to the left of Unit 2.
        $u2 = $units->firstWhere('number', 2);
        $arenaX = $u2 && $u2['map_x'] !== null ? max(8, (float) $u2['map_x'] - 18) : 38;
        $arenaY = $u2 && $u2['map_y'] !== null ? (float) $u2['map_y'] : 50;

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
            'arena' => [
                'unlocked'   => $arenaUnlocked,
                'title'      => 'Games Arena',
                'subtitle'   => 'Mixed practice across every unit',
                'map_x'      => $arenaX,
                'map_y'      => $arenaY,
                'image_path' => 'assets/lessons/toy/toy.png',
                'size'       => 'w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44',
            ],
            'stats' => [
                'completionPercentage' => $completionPercentage,
                'latestLesson'         => $latestLessonTitle,
                'total_stars'          => $user->total_stars ?? $totalStars,
            ],
        ]);
    }
}
