<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Services\LessonDeckBuilder;
use App\Services\ProgressService;
use Illuminate\Http\Request;
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
                'status'         => $unit->unit_number <= 1 ? 'active' : 'locked',
                'current_lesson' => 1,
                'stars_earned'   => 0,
            ]
        );

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

        $progress = UserProgress::where('user_id', $user->id)
            ->where('unit_id', $unit->id)
            ->firstOrFail();

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
     */
    public function submitResult(Request $request, int $unitId, int $lessonId)
    {
        $data = $request->validate([
            'rounds'              => 'array',
            'rounds.*.roundId'    => 'nullable|string',
            'rounds.*.correct'    => 'required|boolean',
            'rounds.*.timeMs'     => 'nullable|integer',
            'durationMs'          => 'nullable|integer',
        ]);

        $user   = $request->user();
        $unit   = Unit::findOrFail($unitId);
        $lesson = Lesson::where('unit_id', $unit->id)->findOrFail($lessonId);

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
