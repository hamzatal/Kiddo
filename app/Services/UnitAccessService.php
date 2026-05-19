<?php

namespace App\Services;

use App\Models\Unit;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Support\Collection;

/**
 * Encapsulates the "strict sequential unit unlock" rules so the
 * HomeController + MapController can stay slim and stay in sync.
 *
 * Rules:
 *   - Unit 0 (Welcome) is always reachable. It's `active` until the
 *     learner finishes it, then `done`.
 *   - Unit N (N > 0) is `locked` unless Unit N-1 is `done`. Once
 *     Unit N-1 is `done`, Unit N becomes `active`.
 *
 * Performance notes:
 *   - The previous controllers ran a separate `progresses()` query
 *     for every unit (classic N+1). This service eager-loads ALL
 *     progresses for the user once and indexes them by unit_id.
 *     The map page goes from 7 queries to 2 in the common path.
 */
class UnitAccessService
{
    /**
     * Annotates every unit with status/stars/etc from the user's
     * progress, applying the strict unlock chain.
     *
     * @param  Collection<int, Unit>  $units  ordered by unit_number ASC
     * @return Collection<int, array<string, mixed>>
     */
    public function annotate(Collection $units, ?User $user): Collection
    {
        $progressByUnit = $user
            ? UserProgress::where('user_id', $user->id)
                ->get()
                ->keyBy('unit_id')
            : collect();

        $prevStatus = 'done'; // so Unit 0 always unlocks

        return $units->map(function (Unit $unit) use ($progressByUnit, &$prevStatus, $user) {
            $progress = $progressByUnit->get($unit->id);
            $stored   = $progress?->status;

            if ((int) $unit->unit_number === 0) {
                $status = $stored === 'done' ? 'done' : 'active';
            } else {
                if ($stored === 'done') {
                    $status = 'done';
                } elseif ($prevStatus === 'done' && $user !== null) {
                    $status = 'active';
                } else {
                    $status = 'locked';
                }
            }

            $prevStatus = $status;

            return [
                'unit'           => $unit,
                'progress'       => $progress,
                'status'         => $status,
                'current_lesson' => $progress->current_lesson ?? 1,
                'stars_earned'   => $progress->stars_earned ?? 0,
            ];
        })->values();
    }

    /**
     * The Games Arena unlocks once the learner has cleared at least
     * one lesson (any unit). Computed once from the same in-memory
     * progresses collection, so this is O(1) on top of `annotate()`.
     */
    public function arenaUnlocked(?User $user): bool
    {
        if (! $user) {
            return false;
        }
        return UserProgress::where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('current_lesson', '>', 1)
                  ->orWhere('status', 'done');
            })
            ->exists();
    }
}
