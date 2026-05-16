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

        // Pre-load words with their audio track so every Word->audioClip()
        // call below resolves without an N+1 query (FIX 7).
        $words = Word::with('audioTrack')
            ->where('unit_id', $unit->id)
            ->inRandomOrder()
            ->take(10) // cap attention span for first-graders
            ->get();

        // Cache every word in the unit keyed by its lowercase name so we
        // can resolve audioClips for decoy options coming from wrong_options
        // (which are stored as plain word/image pairs without a DB id).
        $allUnitWords = Word::with('audioTrack')
            ->where('unit_id', $unit->id)
            ->get()
            ->keyBy(fn (Word $w) => mb_strtolower($w->word));

        $questions = $words->map(function (Word $word) use ($unit, $allUnitWords) {
            $correct = [
                'id'        => 'correct_' . $word->id,
                'word'      => $word->word,
                'imagePath' => $this->asset($word->image_path),
                'isCorrect' => true,
                'audioClip' => $word->audioClip(),
            ];

            $options = collect([$correct]);

            // Prefer author-seeded decoys
            if (is_array($word->wrong_options) && count($word->wrong_options) >= 2) {
                foreach (array_slice($word->wrong_options, 0, 2) as $index => $wrong) {
                    $decoyWord = $wrong['word'] ?? 'Wrong';
                    $row = $allUnitWords->get(mb_strtolower($decoyWord));
                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_' . $index,
                        'word'      => $decoyWord,
                        'imagePath' => $this->asset($wrong['image_path'] ?? null),
                        'isCorrect' => false,
                        'audioClip' => $row ? $row->audioClip() : null,
                    ]);
                }
            } else {
                // Fallback: sibling words in same unit (preferring same category)
                $q = Word::with('audioTrack')
                    ->where('unit_id', $unit->id)
                    ->where('id', '!=', $word->id);
                if ($word->category) {
                    $q->where('category', $word->category);
                }
                $siblings = $q->inRandomOrder()->take(2)->get();
                if ($siblings->count() < 2) {
                    $siblings = $siblings->concat(
                        Word::with('audioTrack')
                            ->where('unit_id', $unit->id)
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
                        'audioClip' => $sib->audioClip(),
                    ]);
                }
            }

            return [
                'targetWord' => $word->word,
                'targetWordId' => $word->id,
                'audioPath'  => $this->asset($word->audio_path),
                'audioClip'  => $word->audioClip(),
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
            'errors'        => 'nullable|array',
            'errors.*.word' => 'nullable|string',
            'errors.*.wrongChoice' => 'nullable|string',
        ]);

        $user    = $request->user();
        $unit    = Unit::findOrFail($data['unitId']);
        $correct = (int) $data['correctCount'];
        $wrong   = (int) ($data['wrongCount'] ?? 0);
        $total   = (int) ($data['total'] ?? max(1, $correct + $wrong));

        $result = $this->progress->recordQuizResult($user, $unit, [
            'correct' => $correct,
            'total'   => $total,
            'errors'  => $data['errors'] ?? [],
        ]);

        return redirect()->route('map')->with('quizResult', $result);
    }

    /**
     * Convert a stored image path into a browser URL, returning null
     * when the file is missing on disk so the React SmartImage shows
     * its coloured-letter fallback instead of letting the browser fire
     * a 404 request.
     */
    private function asset(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }
        $rel = ltrim($path, '/');
        if (! is_file(public_path($rel))) {
            return null;
        }
        return '/' . $rel;
    }
}
