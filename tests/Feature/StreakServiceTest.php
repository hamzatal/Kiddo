<?php

namespace Tests\Feature;

use App\Models\GameResult;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\User;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for the streak-derivation logic.
 *
 * Streaks are derived purely from `game_results.created_at`, so we
 * exercise the service by creating GameResult rows at carefully-
 * chosen timestamps and asserting the summary the navbar will see.
 *
 * No new schema is involved — every assertion exists to lock in
 * the "we never touch the DB schema" contract that ships with this
 * feature.
 */
class StreakServiceTest extends TestCase
{
    use RefreshDatabase;

    private StreakService $svc;
    private User $user;
    private Unit $unit;
    private Lesson $lesson;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = app(StreakService::class);

        $this->user   = User::factory()->create();
        $this->unit   = Unit::create([
            'unit_number'   => 0,
            'code'          => 'U0',
            'title'         => 'Welcome',
            'lessons_count' => 1,
        ]);
        $this->lesson = Lesson::create([
            'unit_id'       => $this->unit->id,
            'lesson_number' => 1,
            'page_number'   => 1,
            'title'         => 'Hello',
            'type'          => 'intro',
            'config'        => null,
        ]);
    }

    public function test_no_results_yields_zero_streak(): void
    {
        $summary = $this->svc->summary($this->user);

        $this->assertSame(0, $summary['current']);
        $this->assertSame(0, $summary['longest']);
        $this->assertFalse($summary['active_today']);
        $this->assertSame('fresh', $summary['status']);
    }

    public function test_single_play_today_yields_one_day_streak(): void
    {
        $this->plant(now());

        $summary = $this->svc->summary($this->user);

        $this->assertSame(1, $summary['current']);
        $this->assertSame(1, $summary['longest']);
        $this->assertTrue($summary['active_today']);
        $this->assertSame('fresh', $summary['status']);
    }

    public function test_three_consecutive_days_streak(): void
    {
        // Today, yesterday, day before — should produce a 3-day streak.
        $this->plant(now());
        $this->plant(now()->subDay());
        $this->plant(now()->subDays(2));

        $summary = $this->svc->summary($this->user);

        $this->assertSame(3, $summary['current']);
        $this->assertSame(3, $summary['longest']);
    }

    public function test_played_yesterday_only_is_in_grace(): void
    {
        $this->plant(now()->subDay());

        $summary = $this->svc->summary($this->user);

        $this->assertSame(1, $summary['current']);
        $this->assertFalse($summary['active_today']);
        $this->assertSame('in-grace', $summary['status']);
    }

    public function test_two_days_ago_with_nothing_in_between_is_broken(): void
    {
        $this->plant(now()->subDays(2));

        $summary = $this->svc->summary($this->user);

        $this->assertSame(0, $summary['current']);
        $this->assertSame('broken', $summary['status']);
    }

    public function test_longest_streak_survives_a_break(): void
    {
        // Play 5 days in a row, take a break, play 2 more days.
        // Current streak should be 0 (the gap broke the chain) but
        // longest should remember the original 5-day run.
        for ($d = 10; $d >= 6; $d--) {
            $this->plant(now()->subDays($d));
        }
        $this->plant(now()->subDays(2));
        $this->plant(now()->subDays(1));

        $summary = $this->svc->summary($this->user);

        $this->assertSame(5, $summary['longest']);
        $this->assertSame(2, $summary['current']); // last 2 days, in-grace
    }

    public function test_freezes_available_grows_with_streak(): void
    {
        // Plant 14 consecutive days ending today → current=14 → 2 freezes.
        for ($d = 13; $d >= 0; $d--) {
            $this->plant(now()->subDays($d));
        }

        $summary = $this->svc->summary($this->user);

        $this->assertSame(14, $summary['current']);
        $this->assertSame(2, $summary['freezes_available']);
    }

    public function test_multiple_results_on_same_day_count_as_one_day(): void
    {
        // Three separate game submissions today should still be 1 day.
        $this->plant(now()->setTime(8, 30));
        $this->plant(now()->setTime(13, 15));
        $this->plant(now()->setTime(19, 45));

        $summary = $this->svc->summary($this->user);

        $this->assertSame(1, $summary['current']);
    }

    private function plant(Carbon $when): void
    {
        GameResult::create([
            'user_id'       => $this->user->id,
            'unit_id'       => $this->unit->id,
            'lesson_id'     => $this->lesson->id,
            'type'          => 'lesson-game',
            'correct_count' => 5,
            'wrong_count'   => 0,
            'score'         => 100,
            'meta'          => [],
            'created_at'    => $when,
            'updated_at'    => $when,
        ]);
        // The cache the service uses is keyed by user_id, so we need
        // to bust between assertions in tests that re-query.
        $this->svc->bust($this->user);
    }
}
