<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Models\Word;
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

    /**
     * GET /lesson/{unit}
     * Resolves the user's current lesson in the unit and renders it.
     */
    public function show(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::with('lessons.audioTrack')->findOrFail($unitId);

        $progress = UserProgress::firstOrCreate(
            ['user_id' => $user->id, 'unit_id' => $unit->id],
            [
                'status'         => $unit->unit_number === 1 ? 'active' : 'locked',
                'current_lesson' => 1,
                'stars_earned'   => 0,
            ]
        );

        if ($progress->status === 'locked') {
            return redirect()->route('map');
        }

        $currentLessonNumber = $progress->current_lesson ?? 1;

        $lesson = $unit->lessons()
            ->with('audioTrack')
            ->where('lesson_number', $currentLessonNumber)
            ->first();

        if (! $lesson) {
            return redirect()->route('quiz.show', $unit->id);
        }

        $payload = $this->deckBuilder->build($lesson);

        // Legacy single-word payload kept for the current React screen
        // so the switch to the new engine can happen on the frontend
        // without breaking existing behaviour.
        $legacyWord = $this->legacyWordPick($lesson);

        return Inertia::render('Lessons/LessonScreen', [
            'unit' => [
                'id'       => $unit->id,
                'number'   => $unit->unit_number,
                'code'     => $unit->code,
                'title'    => $unit->title,
                'colorKey' => $unit->color_key,
            ],
            'lesson' => [
                'id'           => $lesson->id,
                'number'       => $lesson->lesson_number,
                'pageNumber'   => $lesson->page_number,
                'title'        => $lesson->title,
                'type'         => $lesson->type,
                'config'       => $lesson->config,
            ],
            'mode'       => $payload['mode'] ?? $lesson->type,
            'intro'      => $payload['intro'] ?? null,
            'deck'       => $payload['deck']  ?? [],
            'audioTrack' => $payload['audioTrack'] ?? $this->lessonAudioTrackPayload($lesson),
            'progress' => [
                'current'      => $currentLessonNumber,
                'total'        => (int) $unit->lessons_count,
                'starsInUnit'  => (int) $progress->stars_earned,
            ],
            // Legacy keys (current LessonScreen.jsx reads these)
            'wordData' => $legacyWord,
        ]);
    }

    /**
     * POST /lesson/{unit}/complete
     * Legacy endpoint used by the current LessonScreen which only reports
     * "I finished this stage" (no per-round detail).
     * Treats it as a 100% completion and routes to the next lesson/quiz.
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
        } else {
            // No lesson row matched (shouldn't happen) — advance blindly.
            $progress->current_lesson = min(
                (int) $unit->lessons_count + 1,
                (int) $progress->current_lesson + 1
            );
            $progress->last_activity_at = now();
            $progress->save();
        }

        $progress->refresh();

        if ($progress->current_lesson > (int) $unit->lessons_count) {
            return redirect()->route('quiz.show', $unit->id);
        }

        return redirect()->route('lesson.show', $unit->id);
    }

    /**
     * POST /lesson/{unit}/{lesson}/result
     * Preferred endpoint from the new LessonEngine. Accepts detailed
     * round-by-round results and returns the next step via flash data.
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

        $next = $result['next'] === 'quiz'
            ? route('quiz.show', $unit->id)
            : route('lesson.show', $unit->id);

        return redirect($next)->with('lessonResult', $result);
    }

    private function legacyWordPick(Lesson $lesson): ?array
    {
        $config = $lesson->config ?? [];
        $q = Word::where('unit_id', $lesson->unit_id);
        if (! empty($config['word_filter'])) {
            $q->whereIn('word', $config['word_filter']);
        } elseif (! empty($config['category'])) {
            $q->where('category', $config['category']);
        }
        $word = $q->inRandomOrder()->first() ?? Word::where('unit_id', $lesson->unit_id)->first();
        if (! $word) {
            return null;
        }
        return [
            'id'           => $word->id,
            'word'         => $word->word,
            'imagePath'    => $this->asset($word->image_path),
            'audioPath'    => $this->asset($word->audio_path),
            'wrongOptions' => collect($word->wrong_options ?? [])->map(fn ($w) => [
                'word'       => $w['word'] ?? '?',
                'image_path' => $this->asset($w['image_path'] ?? null),
            ])->all(),
        ];
    }

    private function lessonAudioTrackPayload(Lesson $lesson): ?array
    {
        $t = $lesson->audioTrack;
        if (! $t) {
            return null;
        }
        return [
            'id'      => $t->id,
            'code'    => $t->code,
            'label'   => $t->label,
            'kind'    => $t->kind,
            'page'    => $t->page,
            'url'     => $t->url,
            'localUrl' => $t->local_path ? '/' . ltrim($t->local_path, '/') : null,
            'playUrl' => $t->playable_url,
            'format'  => $t->format,
        ];
    }

    private function asset(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }
        return '/' . ltrim($path, '/');
    }
}
