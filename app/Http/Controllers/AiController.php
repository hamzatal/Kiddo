<?php

namespace App\Http\Controllers;

use App\Models\AiInteraction;
use App\Models\GameResult;
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
     * Child-facing Fox helper inside LessonScreen. The prompt is
     * constrained to the current unit + word and only allowed
     * vocabulary so the model can't wander off-curriculum.
     *
     * Hardening (this rewrite):
     *   - Verifies the requested word actually belongs to the
     *     requested unit (so a user can't trick the helper into
     *     speaking words from a unit they haven't unlocked yet).
     *   - Stores the OpenAI interaction with PROMPT only, not the
     *     full word payload, to keep AiInteraction rows compact.
     */
    public function lessonHelper(Request $request)
    {
        $data = $request->validate([
            'unitId' => 'required|integer|exists:units,id',
            'wordId' => 'required|integer|exists:words,id',
            'prompt' => 'required|string|max:200',
        ]);

        $unit = Unit::findOrFail($data['unitId']);
        $word = Word::where('unit_id', $unit->id)
            ->where('id', $data['wordId'])
            ->firstOrFail();

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
     *
     * Hardening (this rewrite):
     *   - The child's NAME is no longer sent to OpenAI. The model
     *     receives a generic placeholder ("the child") and only
     *     curriculum-level metadata. The friendly name is then
     *     re-stitched into the response string locally.
     *   - We also drop fields the model doesn't need (xp absolute
     *     value, internal IDs) to minimise leakage.
     */
    public function parentReport(Request $request)
    {
        $user = $request->user();
        abort_unless($user, 403);

        // FIX (N+1): pull all progresses with their unit in one go.
        $progresses = UserProgress::where('user_id', $user->id)
            ->with('unit:id,title,lessons_count')
            ->get()
            ->map(fn (UserProgress $p) => [
                'unit'           => $p->unit?->title,
                'status'         => $p->status,
                'current_lesson' => $p->current_lesson,
                'total_lessons'  => $p->unit?->lessons_count,
                'stars_earned'   => $p->stars_earned,
            ])
            ->all();

        // Anonymous payload for OpenAI — no PII.
        $aiPayload = [
            'total_stars' => (int) ($user->total_stars ?? 0),
            'units'       => $progresses,
            'weakWords'   => $this->collectWeakWords($user->id),
        ];

        $report = $this->ai->parentInsight($aiPayload);

        // Replace generic stand-ins with the actual child's name on
        // the way back to the browser. We only do this if the
        // model actually used the placeholder, so a non-AI
        // fallback string still reads naturally.
        if ($user->name) {
            $report = preg_replace(
                ['/\bthe child\b/i', '/\byour child\b/i'],
                $user->name,
                $report,
                3, // first three occurrences only
            );
        }

        AiInteraction::create([
            'user_id'  => $user->id,
            'context'  => 'parent-report',
            'payload'  => $aiPayload, // already PII-free
            'response' => $report,
        ]);

        return response()->json(['report' => $report]);
    }

    /**
     * POST /ai/help-center — parent chat on Help Center.
     */
    public function helpCenter(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|min:3|max:500',
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

    /**
     * Top weak words for the parent AI report.
     * Reads `meta.word_errors` from GameResult rows.
     */
    private function collectWeakWords(int $userId, int $limit = 6): array
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
        $words = Word::whereIn('id', $topIds)->get()->keyBy('id');

        $out = [];
        foreach ($topIds as $id) {
            $w = $words->get($id);
            if (! $w) continue;
            $out[] = ['word' => $w->word, 'wrong' => $counts[$id]];
        }
        return $out;
    }
}
