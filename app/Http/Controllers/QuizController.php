<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Word;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function __construct(
        private readonly ProgressService $progress,
    ) {
    }

    /**
     * GET /quiz/{unit}
     * Build a unit-wide quiz from all Words in the unit.
     * Uses authored wrong_options first, falls back to same-category peers.
     */
    public function show(Request $request, int $unitId)
    {
        $user = $request->user();
        $unit = Unit::findOrFail($unitId);

        $words = Word::where('unit_id', $unit->id)
            ->inRandomOrder()
            ->take(10) // cap attention span for first-graders
            ->get();

        $questions = $words->map(function (Word $word) use ($unit) {
            $correct = [
                'id'        => 'correct_' . $word->id,
                'word'      => $word->word,
                'imagePath' => $this->asset($word->image_path),
                'isCorrect' => true,
            ];

            $options = collect([$correct]);

            // Prefer author-seeded decoys
            if (is_array($word->wrong_options) && count($word->wrong_options) >= 2) {
                foreach (array_slice($word->wrong_options, 0, 2) as $index => $wrong) {
                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_' . $index,
                        'word'      => $wrong['word'] ?? 'Wrong',
                        'imagePath' => $this->asset($wrong['image_path'] ?? null),
                        'isCorrect' => false,
                    ]);
                }
            } else {
                // Fallback: sibling words in same unit (preferring same category)
                $q = Word::where('unit_id', $unit->id)->where('id', '!=', $word->id);
                if ($word->category) {
                    $q->where('category', $word->category);
                }
                $siblings = $q->inRandomOrder()->take(2)->get();
                if ($siblings->count() < 2) {
                    $siblings = $siblings->concat(
                        Word::where('unit_id', $unit->id)
                            ->where('id', '!=', $word->id)
                            ->whereNotIn('id', $siblings->pluck('id'))
                            ->inRandomOrder()
                            ->take(2 - $siblings->count())
                            ->get()
                    );
                }
                foreach ($siblings as $i => $sib) {
                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_' . $i,
                        'word'      => $sib->word,
                        'imagePath' => $this->asset($sib->image_path),
                        'isCorrect' => false,
                    ]);
                }
            }

            return [
                'targetWord' => $word->word,
                'audioPath'  => $this->asset($word->audio_path),
                'options'    => $options->shuffle()->values()->all(),
            ];
        });

        return Inertia::render('Quiz/QuizScreen', [
            'quizData' => [
                'unitId'    => $unit->id,
                'unitTitle' => $unit->title,
                'questions' => $questions,
            ],
        ]);
    }

    /**
     * POST /quiz/submit
     * Delegates scoring / unlocking to ProgressService so stars and XP
     * match actual accuracy instead of being hardcoded.
     */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'unitId'        => 'required|integer|exists:units,id',
            'correctCount'  => 'required|integer|min:0',
            'wrongCount'    => 'nullable|integer|min:0',
            'total'         => 'nullable|integer|min:1',
        ]);

        $user    = $request->user();
        $unit    = Unit::findOrFail($data['unitId']);
        $correct = (int) $data['correctCount'];
        $wrong   = (int) ($data['wrongCount'] ?? 0);
        $total   = (int) ($data['total'] ?? max(1, $correct + $wrong));

        $result = $this->progress->recordQuizResult($user, $unit, [
            'correct' => $correct,
            'total'   => $total,
        ]);

        return redirect()->route('map')->with('quizResult', $result);
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
