<?php

namespace App\Services;

use App\Models\GameResult;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Daily Quest engine — three small goals reset every midnight.
 *
 * Like StreakService this lives entirely on top of `game_results`.
 * No new tables. No new columns. The "completed" flag on a quest
 * is purely a derived `progress >= goal` boolean — there's no
 * server-side claim flow because the reward IS the streak day, and
 * the streak day is itself derived from the same activity rows.
 *
 * Three quests we settled on after looking at retention research
 * for Duolingo / Khan Kids:
 *
 *   1. Play one lesson           — onboarding-friendly, hard floor
 *   2. Get 10 answers right      — keeps the kid engaged once on
 *   3. Try the Games Arena       — drives mixed review (the bit
 *                                  that actually moves vocabulary
 *                                  into long-term memory)
 *
 * Every quest knows how to inspect today's `game_results` rows for
 * its progress, so the React UI just renders the structured array.
 */
class DailyQuestService
{
    private const CACHE_TTL = 30;

    /**
     * @return array{
     *     date: string,
     *     completed_count: int,
     *     total: int,
     *     all_complete: bool,
     *     quests: array<int, array<string, mixed>>
     * }
     */
    public function today(User $user): array
    {
        return Cache::remember(
            $this->cacheKey($user),
            self::CACHE_TTL,
            fn () => $this->compute($user),
        );
    }

    public function bust(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    private function cacheKey(User $user): string
    {
        $date = Carbon::now(config('app.timezone', 'UTC'))->toDateString();
        return "kiddo:dailyquest:v1:{$user->id}:{$date}";
    }

    private function compute(User $user): array
    {
        $tz = config('app.timezone', 'UTC');
        $today = Carbon::now($tz);

        $todayResults = GameResult::where('user_id', $user->id)
            ->whereBetween('created_at', [
                $today->copy()->startOfDay(),
                $today->copy()->endOfDay(),
            ])
            ->get(['type', 'lesson_id', 'unit_id', 'correct_count']);

        // ─── Quest 1: play one lesson ─────────────────────────
        // Counts unique lessons completed today, capped at the goal
        // so the progress bar can't overflow visually.
        $lessonsPlayed = $todayResults
            ->where('type', 'lesson-game')
            ->whereNotNull('lesson_id')
            ->pluck('lesson_id')
            ->unique()
            ->count();

        // ─── Quest 2: 10 right answers ────────────────────────
        $correctAnswers = (int) $todayResults->sum('correct_count');

        // ─── Quest 3: try the Arena ───────────────────────────
        // After the v3 arena migration, mixed-review rows write
        // `type='arena'` and `unit_id` is null. We check both for
        // forward + backward compatibility.
        $arenaSessions = $todayResults
            ->filter(fn ($r) => $r->type === 'arena' || $r->unit_id === null)
            ->count();

        $quests = [
            $this->quest(
                id: 'play_lesson',
                icon: '📖',
                title: 'Play 1 lesson',
                description: 'Open and complete any lesson today.',
                goal: 1,
                progress: $lessonsPlayed,
            ),
            $this->quest(
                id: 'words_correct',
                icon: '⭐',
                title: 'Get 10 answers right',
                description: 'Across any games today.',
                goal: 10,
                progress: $correctAnswers,
            ),
            $this->quest(
                id: 'visit_arena',
                icon: '🏆',
                title: 'Try the Games Arena',
                description: 'Mixed practice with words from every unit.',
                goal: 1,
                progress: $arenaSessions,
            ),
        ];

        $completedCount = collect($quests)->where('completed', true)->count();

        return [
            'date'            => $today->toDateString(),
            'completed_count' => $completedCount,
            'total'           => count($quests),
            'all_complete'    => $completedCount === count($quests),
            'quests'          => $quests,
        ];
    }

    /**
     * Build a quest record. Centralised so the progress / completed
     * fields are derived consistently and the UI can rely on the
     * shape regardless of which goal it represents.
     */
    private function quest(
        string $id,
        string $icon,
        string $title,
        string $description,
        int $goal,
        int $progress,
    ): array {
        $clampedProgress = max(0, min($goal, $progress));
        return [
            'id'          => $id,
            'icon'        => $icon,
            'title'       => $title,
            'description' => $description,
            'goal'        => $goal,
            'progress'    => $clampedProgress,
            'percent'     => $goal > 0 ? (int) round($clampedProgress / $goal * 100) : 0,
            'completed'   => $progress >= $goal,
        ];
    }
}
