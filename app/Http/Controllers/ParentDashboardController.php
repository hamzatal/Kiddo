<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
use App\Models\Unit;
use App\Models\Word;
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
            ->where('type', 'lesson')
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

        return Inertia::render('Parent/ProgressScreen', [
            'user'  => $user,
            'unitsList' => $units,
            'achievements' => $achievements,
            'weakWords' => $this->buildWeakWords($user->id),
            'stats' => [
                'completionPercentage' => $completion,
                'latestLesson'         => optional(
                    $units->firstWhere('status', 'active')
                )['name'] ?? ($units->first()['name'] ?? 'Welcome / Hello'),
            ],
        ]);
    }

    /**
     * FIX 8 — Aggregate the top-N words a child has gotten wrong most
     * often across every recorded game result. We read `meta.word_errors`
     * (an array of word_ids) so a single round failure is preserved
     * even when the child eventually gets the word right on a later
     * round (we still want to surface it to the parent).
     */
    private function buildWeakWords(int $userId, int $limit = 8): array
    {
        $rows = GameResult::where('user_id', $userId)
            ->whereNotNull('meta')
            ->get(['meta']);

        $counts = [];
        foreach ($rows as $row) {
            $errors = $row->meta['word_errors'] ?? null;
            if (! is_array($errors)) continue;
            foreach ($errors as $wid) {
                $wid = (int) $wid;
                if ($wid <= 0) continue;
                $counts[$wid] = ($counts[$wid] ?? 0) + 1;
            }
        }

        if (empty($counts)) return [];

        arsort($counts);
        $topIds = array_slice(array_keys($counts), 0, $limit);

        $words = Word::with('unit:id,title')
            ->whereIn('id', $topIds)
            ->get()
            ->keyBy('id');

        $out = [];
        foreach ($topIds as $id) {
            $w = $words->get($id);
            if (! $w) continue;
            $out[] = [
                'id'        => $w->id,
                'word'      => $w->word,
                'imagePath' => $w->image_path ? '/' . ltrim($w->image_path, '/') : null,
                'unitTitle' => $w->unit?->title,
                'wrongTimes' => (int) $counts[$id],
            ];
        }
        return $out;
    }
}
