<?php

namespace App\Services;

use App\Models\GameResult;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\User;
use App\Models\UserProgress;

/**
 * Single place to mutate progress, stars and XP. Every lesson/quiz
 * submission goes through this service so game rules (unlocks,
 * thresholds, etc.) stay consistent.
 */
class ProgressService
{
    // XP per lesson type
    private const XP_INTRO        = 10;
    private const XP_VOCAB_GAME   = 15;
    private const XP_PHONICS_GAME = 15;
    private const XP_REVIEW       = 20;
    private const XP_QUIZ_PASS    = 50;

    public const QUIZ_PASS_PERCENT = 70;

    /**
     * Record a completed lesson (intro or game).
     * $stats is an array of { correct, total, rounds?[] }.
     *
     * Returns: { stars, xp, next: 'lesson'|'quiz'|'done', nextLessonNumber? }
     */
    public function recordLessonResult(User $user, Lesson $lesson, array $stats): array
    {
        $unit = $lesson->unit ?? Unit::findOrFail($lesson->unit_id);

        $stats['correct'] = max(0, (int) ($stats['correct'] ?? 0));
        $stats['total']   = max(1, (int) ($stats['total']   ?? 1));
        $percent          = $this->percent($stats);

        $stars = $this->starsForLesson($lesson->type, $percent);
        $xp    = $this->xpForLesson($lesson->type);

        GameResult::create([
            'user_id'       => $user->id,
            'unit_id'       => $unit->id,
            'lesson_id'     => $lesson->id,
            'type'          => 'lesson-game',
            'correct_count' => $stats['correct'],
            'wrong_count'   => $stats['total'] - $stats['correct'],
            'score'         => $percent,
            'meta'          => $stats,
        ]);

        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit->id],
            ['status' => 'active', 'current_lesson' => 1, 'stars_earned' => 0]
        );

        $progress->stars_earned    = (int) $progress->stars_earned + $stars;
        $progress->last_activity_at = now();

        if ($progress->current_lesson <= $lesson->lesson_number) {
            $progress->current_lesson = $lesson->lesson_number + 1;
        }
        $progress->save();

        $user->increment('xp', $xp);
        $user->increment('total_stars', $stars);

        $isLastLesson = $progress->current_lesson > (int) $unit->lessons_count;

        return [
            'stars'            => $stars,
            'xp'               => $xp,
            'percent'          => $percent,
            'next'             => $isLastLesson ? 'quiz' : 'lesson',
            'nextLessonNumber' => $isLastLesson ? null : $progress->current_lesson,
        ];
    }

    /**
     * Record a unit quiz attempt. Pass/fail gates the next unit unlock.
     *
     * Returns: { stars, xp, passed, percent, nextUnitId? }
     */
    public function recordQuizResult(User $user, Unit $unit, array $stats): array
    {
        $stats['correct'] = max(0, (int) ($stats['correct'] ?? 0));
        $stats['total']   = max(1, (int) ($stats['total']   ?? 1));
        $percent          = $this->percent($stats);
        $passed           = $percent >= self::QUIZ_PASS_PERCENT;

        $stars = $passed ? ($percent >= 90 ? 3 : 2) : 0;
        $xp    = $passed ? self::XP_QUIZ_PASS : 0;

        GameResult::create([
            'user_id'       => $user->id,
            'unit_id'       => $unit->id,
            'lesson_id'     => null,
            'type'          => 'unit-quiz',
            'correct_count' => $stats['correct'],
            'wrong_count'   => $stats['total'] - $stats['correct'],
            'score'         => $percent,
            'meta'          => $stats + ['passed' => $passed],
        ]);

        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit->id],
            ['status' => 'active', 'current_lesson' => 1, 'stars_earned' => 0]
        );

        $progress->last_activity_at = now();
        $progress->stars_earned = (int) $progress->stars_earned + $stars;
        if ($passed) {
            $progress->status = 'done';
            $progress->current_lesson = max($progress->current_lesson, (int) $unit->lessons_count + 1);
        }
        $progress->save();

        $user->increment('xp', $xp);
        $user->increment('total_stars', $stars);

        $nextUnitId = null;
        if ($passed) {
            $nextUnit = Unit::where('unit_number', '>', $unit->unit_number)
                ->orderBy('unit_number')
                ->first();
            if ($nextUnit) {
                UserProgress::firstOrCreate(
                    ['user_id' => $user->id, 'unit_id' => $nextUnit->id],
                    ['status' => 'active', 'current_lesson' => 1, 'stars_earned' => 0]
                );
                $nextUnitId = $nextUnit->id;
            }
        }

        return [
            'stars'      => $stars,
            'xp'         => $xp,
            'percent'    => $percent,
            'passed'     => $passed,
            'nextUnitId' => $nextUnitId,
        ];
    }

    private function percent(array $stats): int
    {
        return (int) round($stats['correct'] / max(1, $stats['total']) * 100);
    }

    private function starsForLesson(string $type, int $percent): int
    {
        if ($type === 'intro') {
            return 1;
        }
        return match (true) {
            $percent >= 90 => 3,
            $percent >= 70 => 2,
            default        => 1, // never leave a young learner empty-handed
        };
    }

    private function xpForLesson(string $type): int
    {
        return match ($type) {
            'intro'        => self::XP_INTRO,
            'phonics-game' => self::XP_PHONICS_GAME,
            'review'       => self::XP_REVIEW,
            'vocab-game'   => self::XP_VOCAB_GAME,
            default        => self::XP_INTRO,
        };
    }
}
