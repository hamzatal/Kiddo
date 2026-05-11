<?php

namespace App\Http\Controllers;

use App\Models\AiInteraction;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Models\Word;
use App\Services\OpenAiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(private readonly OpenAiService $ai)
    {
    }

    /**
     * POST /ai/lesson-helper
     * Child-facing Fox helper inside LessonScreen.
     * Prompt is constrained to the current unit + word and only allowed
     * vocabulary so the model can't wander off-curriculum.
     */
    public function lessonHelper(Request $request)
    {
        $data = $request->validate([
            'unitId' => 'required|integer|exists:units,id',
            'wordId' => 'required|integer|exists:words,id',
            'prompt' => 'required|string|max:200',
        ]);

        $unit = Unit::findOrFail($data['unitId']);
        $word = Word::where('unit_id', $unit->id)->findOrFail($data['wordId']);

        $allowed = Word::where('unit_id', $unit->id)
            ->orderBy('word')
            ->pluck('word')
            ->unique()
            ->take(60)
            ->all();

        $answer = $this->ai->foxHelper($word->word, $unit->title, $allowed, $data['prompt']);

        AiInteraction::create([
            'user_id'  => $request->user()?->id,
            'context'  => 'lesson-helper',
            'unit_id'  => $unit->id,
            'payload'  => ['prompt' => $data['prompt'], 'word' => $word->word],
            'response' => $answer,
        ]);

        return response()->json(['answer' => $answer]);
    }

    /**
     * POST /ai/parent-report
     * Generates a 3-5 sentence report from UserProgress + GameResult
     * data for the parent's Dashboard.
     */
    public function parentReport(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 403);

        $progresses = UserProgress::where('user_id', $user->id)
            ->with('unit')
            ->get()
            ->map(function (UserProgress $p) {
                return [
                    'unit'            => $p->unit?->title,
                    'status'          => $p->status,
                    'current_lesson'  => $p->current_lesson,
                    'total_lessons'   => $p->unit?->lessons_count,
                    'stars_earned'    => $p->stars_earned,
                ];
            })
            ->all();

        $stats = [
            'name'        => $user->name,
            'total_stars' => $user->total_stars ?? 0,
            'xp'          => $user->xp ?? 0,
            'units'       => $progresses,
        ];

        $report = $this->ai->parentInsight($stats);

        AiInteraction::create([
            'user_id'  => $user->id,
            'context'  => 'parent-report',
            'payload'  => $stats,
            'response' => $report,
        ]);

        return response()->json(['report' => $report]);
    }

    /**
     * POST /ai/help-center
     * Parent chat on Help Center.
     */
    public function helpCenter(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:500',
        ]);

        $answer = $this->ai->helpCenterReply($data['question']);

        AiInteraction::create([
            'user_id'  => $request->user()?->id,
            'context'  => 'help-center',
            'payload'  => ['question' => $data['question']],
            'response' => $answer,
        ]);

        return response()->json(['answer' => $answer]);
    }
}
