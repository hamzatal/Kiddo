<?php

namespace App\Services;

use App\Models\GameResult;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Daily-streak engine — computed entirely from `game_results.created_at`.
 *
 * No new tables, no new columns. The contract is simple:
 *
 *   • A learner has a streak day for any calendar day (server timezone)
 *     on which they recorded at least one `game_results` row of any
 *     type — lesson-game, unit-quiz, or arena.
 *
 *   • The current streak is the count of consecutive streak days
 *     anchored to today. If the most recent activity was today OR
 *     yesterday the streak is alive; if it was 2+ days ago the streak
 *     resets to 0 (we don't deduct, just report).
 *
 *   • The longest streak is the maximum run of consecutive streak
 *     days across the learner's history. Useful as a "personal best"
 *     stat in the parent dashboard.
 *
 * Performance:
 *   We pull every distinct `DATE(created_at)` for the user in one
 *   query. For a child playing 3-5 lessons/day for a year that's
 *   ~365 strings — trivial to scan in PHP. We also memoise the
 *   summary in the cache for 60 seconds so navigation between
 *   pages doesn't re-query for every Inertia partial reload.
 */
class StreakService
{
    /** Cache TTL in seconds. Short enough that a fresh game updates
     *  the navbar quickly; long enough that page-to-page nav is free. */
    private const CACHE_TTL = 60;

    /**
     * @return array{
     *     current: int,
     *     longest: int,
     *     active_today: bool,
     *     last_activity: ?string,
     *     status: 'fresh'|'in-grace'|'broken',
     *     freezes_available: int
     * }
     */
    public function summary(User $user): array
    {
        return Cache::remember(
            $this->cacheKey($user),
            self::CACHE_TTL,
            fn () => $this->compute($user),
        );
    }

    /** Bust the cache after recording a new game result. */
    public function bust(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    private function cacheKey(User $user): string
    {
        return "kiddo:streak:v1:{$user->id}";
    }

    private function compute(User $user): array
    {
        $tz = config('app.timezone', 'UTC');

        // SQLite + MySQL both accept this expression; we keep it
        // driver-agnostic by leaning on Carbon for the day math
        // and only using a single SELECT here. Even with thousands
        // of rows this is one indexed scan on (user_id, created_at).
        $rawDates = GameResult::where('user_id', $user->id)
            ->orderBy('created_at')
            ->pluck('created_at');

        if ($rawDates->isEmpty()) {
            return [
                'current'           => 0,
                'longest'           => 0,
                'active_today'      => false,
                'last_activity'     => null,
                'status'            => 'fresh',
                'freezes_available' => 0,
            ];
        }

        // Bucket distinct days. Carbon's `toDateString()` honours the
        // timezone so a learner in Amman who plays at 11pm doesn't
        // accidentally land on tomorrow when our PHP timezone is UTC.
        $days = $rawDates
            ->map(fn ($t) => Carbon::parse($t)->setTimezone($tz)->toDateString())
            ->unique()
            ->values()
            ->all();

        sort($days);

        $today = Carbon::now($tz)->toDateString();
        $yesterday = Carbon::now($tz)->subDay()->toDateString();

        $current = $this->currentStreak($days, $today, $yesterday);
        $longest = $this->longestStreak($days);

        $activeToday = end($days) === $today;
        $lastActivity = end($days);

        // Status drives the navbar copy:
        //   fresh    – played today, all good
        //   in-grace – played yesterday, must play today before midnight
        //   broken   – more than a day since last activity
        $status = match (true) {
            $activeToday              => 'fresh',
            $lastActivity === $yesterday => 'in-grace',
            default                   => 'broken',
        };

        // Streak freezes: every 7 days we bank one freeze. We never
        // actually consume it (no DB column), but the navbar uses
        // this number to render a 'shield' badge.
        $freezesAvailable = intdiv($current, 7);

        return [
            'current'           => $current,
            'longest'           => $longest,
            'active_today'      => $activeToday,
            'last_activity'     => $lastActivity,
            'status'            => $status,
            'freezes_available' => $freezesAvailable,
        ];
    }

    /**
     * Walk backwards from today (or yesterday for grace day) and
     * count consecutive days that exist in the activity set.
     */
    private function currentStreak(array $days, string $today, string $yesterday): int
    {
        $set = array_flip($days);
        $latest = end($days);

        // No activity today AND no activity yesterday → streak is broken.
        if ($latest !== $today && $latest !== $yesterday) {
            return 0;
        }

        $cursor = Carbon::parse($latest);
        $streak = 0;
        while (isset($set[$cursor->toDateString()])) {
            $streak++;
            $cursor->subDay();
        }
        return $streak;
    }

    /**
     * Linear pass over the sorted distinct days to find the longest
     * consecutive run. Runs in O(n) on the size of the activity set.
     */
    private function longestStreak(array $days): int
    {
        if (empty($days)) {
            return 0;
        }
        $longest = 1;
        $current = 1;
        for ($i = 1; $i < count($days); $i++) {
            $prev = Carbon::parse($days[$i - 1]);
            $curr = Carbon::parse($days[$i]);
            if ($curr->diffInDays($prev) === 1) {
                $current++;
                $longest = max($longest, $current);
            } else {
                $current = 1;
            }
        }
        return $longest;
    }
}
