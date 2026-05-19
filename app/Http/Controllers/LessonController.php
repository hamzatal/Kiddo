<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Services\LessonDeckBuilder;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LessonController extends Controller
{
    public function __construct(
        private readonly LessonDeckBuilder $deckBuilder,
        private readonly ProgressService $progress,
    ) {
    }

    public function show(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::with('lessons.audioTrack')->findOrFail($unitId);

        // FIX 6: strict sequential access.
        //   - U0 is always reachable.
        //   - U_N (N>0) requires progress on U_{N-1} with status='done'.
        if ((int) $unit->unit_number > 0) {
            $previousUnit = Unit::where('unit_number', $unit->unit_number - 1)->first();
            if ($previousUnit) {
                $prevProgress = UserProgress::where('user_id', $user->id)
                    ->where('unit_id', $previousUnit->id)
                    ->first();
                if (! $prevProgress || $prevProgress->status !== 'done') {
                    return redirect()->route('map');
                }
            }
        }

        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit->id],
            [
                'status'         => (int) $unit->unit_number === 0 ? 'active' : 'locked',
                'current_lesson' => 1,
                'stars_earned'   => 0,
            ]
        );

        // FIX 1 — never let a brand-new user land on lesson 2+ when no
        // GameResult has been recorded for this unit yet. If somehow
        // current_lesson is > 1 but the user has no game results in
        // this unit, snap them back to lesson 1 and log it.
        if ($progress->current_lesson > 1) {
            $hasAnyResult = GameResult::where('user_id', $user->id)
                ->where('unit_id', $unit->id)
                ->exists();
            if (! $hasAnyResult) {
                Log::warning('Resetting progress to lesson 1 (no game results recorded yet).', [
                    'user_id' => $user->id,
                    'unit_id' => $unit->id,
                    'was_at'  => $progress->current_lesson,
                ]);
                $progress->current_lesson = 1;
                $progress->save();
            }
        }

        if ($progress->status === 'locked') {
            return redirect()->route('map');
        }

        $currentLessonNumber = max(1, (int) ($progress->current_lesson ?? 1));

        $lesson = $unit->lessons()
            ->with('audioTrack')
            ->where('lesson_number', $currentLessonNumber)
            ->first();

        if (! $lesson) {
            // User has finished all lessons → go to quiz.
            return redirect()->route('quiz.show', $unit->id);
        }

        $payload = $this->deckBuilder->build($lesson);

        return Inertia::render('Lessons/LessonScreen', [
            'unit' => [
                'id'       => $unit->id,
                'number'   => $unit->unit_number,
                'code'     => $unit->code,
                'title'    => $unit->title,
                'colorKey' => $unit->color_key,
            ],
            'lesson' => [
                'id'         => $lesson->id,
                'number'     => $lesson->lesson_number,
                'pageNumber' => $lesson->page_number,
                'title'      => $lesson->title,
                'type'       => $lesson->type,
                'config'     => $lesson->config,
            ],
            'mode'       => $payload['mode'] ?? $lesson->type,
            'intro'      => $payload['intro'] ?? null,
            'deck'       => $payload['deck']  ?? [],
            'audioTrack' => $payload['audioTrack'] ?? $this->trackPayload($lesson),
            'progress' => [
                'current'     => $currentLessonNumber,
                'total'       => (int) $unit->lessons_count,
                'starsInUnit' => (int) $progress->stars_earned,
            ],
        ]);
    }

    /**
     * POST /lesson/{unit}/complete (legacy)
     */
    public function complete(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::findOrFail($unitId);

        $progress = $this->progressForUserOrFail($user->id, $unit->id);

        $lesson = Lesson::where('unit_id', $unit->id)
            ->where('lesson_number', $progress->current_lesson)
            ->first();

        if ($lesson) {
            $this->progress->recordLessonResult($user, $lesson, [
                'correct' => 1,
                'total'   => 1,
            ]);
        }

        $progress->refresh();
        if ($progress->current_lesson > (int) $unit->lessons_count) {
            return redirect()->route('quiz.show', $unit->id);
        }
        return redirect()->route('lesson.show', $unit->id);
    }

    /**
     * POST /lesson/{unit}/{lesson}/result
     *
     * FIX (Authorization):
     *   The previous version trusted the request's unit/lesson IDs
     *   blindly. A determined user could `POST /lesson/5/12/result`
     *   without ever opening the unit and farm stars + XP. We now:
     *     1. Confirm the lesson belongs to the requested unit.
     *     2. Confirm the unit is unlocked for this user (UserProgress
     *        with status != 'locked' OR unit_number == 0).
     *     3. Confirm the requested lesson_number is <= current_lesson
     *        (so you can't submit lesson 5's result before completing
     *        lessons 1-4).
     */
    public function submitResult(Request $request, int $unitId, int $lessonId)
    {
        $data = $request->validate([
            'rounds'                  => 'array|max:200',
            'rounds.*.roundId'        => 'nullable|string|max:64',
            'rounds.*.correct'        => 'required|boolean',
            'rounds.*.timeMs'         => 'nullable|integer|min:0|max:600000',
            'rounds.*.wordId'         => 'nullable|integer|min:1',
            'rounds.*.word'           => 'nullable|string|max:120',
            'rounds.*.wrongChoice'    => 'nullable|string|max:120',
            'rounds.*.wrongChoiceId'  => 'nullable|integer|min:1',
            'durationMs'              => 'nullable|integer|min:0|max:7200000',
        ]);

        $user   = $request->user();
        $unit   = Unit::findOrFail($unitId);

        // Lesson MUST belong to the unit on the URL — otherwise return 404.
        $lesson = Lesson::where('unit_id', $unit->id)
            ->where('id', $lessonId)
            ->firstOrFail();

        $progress = $this->progressForUserOrFail($user->id, $unit->id);

        // Refuse submissions for locked units. We let unit_number=0
        // through unconditionally because UserProgress is created
        // lazily for first-time visitors.
        if ($progress->status === 'locked' && (int) $unit->unit_number !== 0) {
            abort(403, 'Unit is locked.');
        }

        // Refuse submissions for lessons the user hasn't reached yet.
        // current_lesson points at the NEXT lesson the user should
        // play, so any lesson_number > current_lesson is out of range.
        if ((int) $lesson->lesson_number > (int) $progress->current_lesson) {
            abort(403, 'Lesson not yet reached.');
        }

        $rounds  = $data['rounds'] ?? [];
        $correct = collect($rounds)->where('correct', true)->count();
        $total   = max(1, count($rounds));

        $result = $this->progress->recordLessonResult($user, $lesson, [
            'correct'    => $correct,
            'total'      => $total,
            'rounds'     => $rounds,
            'durationMs' => $data['durationMs'] ?? null,
        ]);

        return redirect()
            ->route($result['next'] === 'quiz' ? 'quiz.show' : 'lesson.show', $unit->id)
            ->with('lessonResult', $result);
    }

    /**
     * Resolve the UserProgress row for a (user, unit) pair, aborting
     * with 403 when the row is missing — i.e. the learner never
     * even loaded the lesson page that creates it lazily.
     */
    private function progressForUserOrFail(int $userId, int $unitId): UserProgress
    {
        $row = UserProgress::where('user_id', $userId)
            ->where('unit_id', $unitId)
            ->first();
        if (! $row) {
            abort(403, 'No progress recorded for this unit.');
        }
        return $row;
    }

    private function trackPayload(Lesson $lesson): ?array
    {
        $t = $lesson->audioTrack;
        if (! $t) return null;
        return [
            'id'       => $t->id,
            'code'     => $t->code,
            'label'    => $t->label,
            'kind'     => $t->kind,
            'page'     => $t->page,
            'url'      => $t->url,
            'localUrl' => $t->local_path ? '/' . ltrim($t->local_path, '/') : null,
            'playUrl'  => $t->playable_url,
            'format'   => $t->format,
        ];
    }
}
