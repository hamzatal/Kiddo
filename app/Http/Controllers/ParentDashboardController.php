<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
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

        // FIX 10: build dynamic achievements based on the real user state.
        // We compute each badge independently so empty/partial states read
        // gracefully in the UI.
        $achievements = [];

        $gameResultCount   = GameResult::where('user_id', $user->id)->count();
        $totalStars        = (int) ($user->total_stars ?? 0);
        $hasPerfectLesson  = GameResult::where('user_id', $user->id)
            ->whereIn('type', ['lesson', 'lesson-game'])
            ->where('score', '>=', 90)
            ->exists();

        if ($gameResultCount >= 1) {
            $achievements[] = [
                'img'   => 'achievement.png',
                'label' => 'First Steps',
            ];
        }

        foreach ($units as $u) {
            if ($u['status'] === 'done') {
                $achievements[] = [
                    'img'   => 'certificate.png',
                    'label' => 'Unit ' . $u['id'] . ' Done',
                ];
            }
        }

        if ($totalStars >= 10) {
            $achievements[] = [
                'img'   => 'star.png',
                'label' => '10 Stars',
            ];
        }
        if ($totalStars >= 25) {
            $achievements[] = [
                'img'   => 'trophy.png',
                'label' => '25 Stars',
            ];
        }

        if ($hasPerfectLesson) {
            $achievements[] = [
                'img'   => 'badge.png',
                'label' => 'Fast Learner',
            ];
        }

        // Error analysis for parents — surface every wrong-answer the
        // child has made across lessons, games and unit quizzes.
        //
        // Two storage shapes exist on game_results.meta:
        //   • meta.errors  — array of { word, wrongChoice, wordId? }
        //                    written by ProgressService (lesson-game)
        //                    AND by QuizScreen via QuizController::submit
        //                    (unit-quiz). Same shape, both consumed here.
        //   • meta.rounds  — array of { word, wordId, correct, wrongChoice }
        //                    written by every game mode (vocab, drag-drop,
        //                    memory, listening, etc.). We fall back to it
        //                    so older rows still surface their errors even
        //                    if they didn't write meta.errors.
        $recentErrors = GameResult::where('user_id', $user->id)
            ->whereNotNull('meta')
            ->where(function ($q) {
                $q->where('wrong_count', '>', 0)
                  ->orWhereNull('wrong_count');
            })
            ->orderByDesc('created_at')
            ->take(60) // wide window so a struggling child's history is fully captured
            ->get()
            ->flatMap(function (GameResult $gr) {
                $meta    = $gr->meta ?? [];
                $entries = collect();

                if (! empty($meta['errors']) && is_array($meta['errors'])) {
                    $entries = $entries->concat($meta['errors']);
                }

                // Fallback: derive errors from rounds[] when meta.errors
                // wasn't recorded (older runs / direct game writes).
                if ($entries->isEmpty() && ! empty($meta['rounds']) && is_array($meta['rounds'])) {
                    foreach ($meta['rounds'] as $r) {
                        if (! is_array($r)) continue;
                        if (! empty($r['correct'])) continue;
                        $entries->push([
                            'word'        => $r['word'] ?? null,
                            'wrongChoice' => $r['wrongChoice'] ?? null,
                            'wordId'      => $r['wordId'] ?? null,
                        ]);
                    }
                }

                return $entries->map(fn ($e) => [
                    'word'        => $e['word'] ?? 'unknown',
                    'wrongChoice' => $e['wrongChoice'] ?? '',
                    'unit_id'     => $gr->unit_id,
                    'created_at'  => optional($gr->created_at)->toDateString(),
                ]);
            })
            ->filter(fn ($e) => ! empty($e['word']) && $e['word'] !== 'unknown')
            ->groupBy(fn ($e) => mb_strtolower($e['word']))
            ->map(fn ($group) => [
                'word'         => $group->first()['word'],
                'count'        => $group->count(),
                'wrongChoices' => $group
                    ->pluck('wrongChoice')
                    ->filter(fn ($v) => $v !== null && $v !== '')
                    ->unique()
                    ->values()
                    ->all(),
                'lastSeen'     => $group->max('created_at'),
            ])
            ->sortByDesc('count')
            ->values()
            ->take(20)
            ->all();

        return Inertia::render('Parent/ProgressScreen', [
            'user'  => $user,
            'unitsList' => $units,
            'achievements' => $achievements,
            'errorAnalysis' => $recentErrors,
            'stats' => [
                'completionPercentage' => $completion,
                'latestLesson'         => optional(
                    $units->firstWhere('status', 'active')
                )['name'] ?? ($units->first()['name'] ?? 'Welcome / Hello'),
            ],
        ]);
    }
}
