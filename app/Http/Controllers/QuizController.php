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
                'wordId'    => $word->id,
                'word'      => $word->word,
                'imagePath' => $word->imageUrl(),
                'isCorrect' => true,
                'audioClip' => $word->audioClip(),
            ];

            $options = collect([$correct]);

            // Track lowercase words we've already added so we never
            // produce two cards with identical text on the same
            // question. Without this guard a malformed wrong_options
            // array (or one accidentally rewritten by the AI ingest
            // pipeline) could surface duplicate-looking decoys.
            $targetKey = mb_strtolower(trim((string) $word->word));
            $usedWords = [$targetKey => true];

            // Prefer author-seeded decoys
            if (is_array($word->wrong_options) && count($word->wrong_options) >= 1) {
                $shuffled = collect($word->wrong_options)->shuffle();
                $added = 0;

                foreach ($shuffled as $index => $wrong) {
                    if ($added >= 2) break;

                    $decoyWord = trim((string) ($wrong['word'] ?? 'Wrong'));
                    if ($decoyWord === '') continue;

                    $key = mb_strtolower($decoyWord);
                    if (isset($usedWords[$key])) continue;
                    $usedWords[$key] = true;

                    $row = $allUnitWords->get($key);

                    // Resolve to the live row's URL when we found one
                    // (so the decoy gets the real image / SVG fallback).
                    // Otherwise build a by-text SVG URL from the decoy
                    // word so the card still renders meaningfully.
                    if ($row instanceof Word) {
                        $img = $row->imageUrl();
                    } elseif (! empty($wrong['image_path'])) {
                        $img = $this->resolveAuthoredPath($wrong['image_path'], $decoyWord);
                    } else {
                        $img = $this->byTextSvg($decoyWord);
                    }

                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_' . $index,
                        'wordId'    => $row?->id,
                        'word'      => $decoyWord,
                        'imagePath' => $img,
                        'isCorrect' => false,
                        'audioClip' => $row ? $row->audioClip() : null,
                    ]);
                    $added++;
                }
            }

            // Top up to exactly 3 options total. Prefer same-category
            // siblings (so a "Six" question never gets a "Boy" decoy)
            // and only fall through to any-other-unit-word when the
            // category is too small.
            if ($options->count() < 3) {
                $needed = 3 - $options->count();
                $usedIds = $options->pluck('wordId')->filter()->all();

                $catSiblings = collect();
                if ($word->category) {
                    $catSiblings = Word::with('audioTrack')
                        ->where('unit_id', $unit->id)
                        ->where('id', '!=', $word->id)
                        ->where('category', $word->category)
                        ->whereNotIn('id', $usedIds)
                        ->inRandomOrder()
                        ->take($needed * 3)
                        ->get();
                }

                $anyUnit = collect();
                if ($catSiblings->count() < $needed) {
                    $anyUnit = Word::with('audioTrack')
                        ->where('unit_id', $unit->id)
                        ->where('id', '!=', $word->id)
                        ->whereNotIn('id', $usedIds)
                        ->when($word->category, fn ($q) => $q->where('category', '!=', $word->category))
                        ->inRandomOrder()
                        ->take($needed * 3)
                        ->get();
                }

                $candidates = $catSiblings->concat($anyUnit);

                foreach ($candidates as $sib) {
                    if ($options->count() >= 3) break;
                    $key = mb_strtolower(trim((string) $sib->word));
                    if (isset($usedWords[$key])) continue;
                    $usedWords[$key] = true;

                    $options->push([
                        'id'        => 'wrong_' . $word->id . '_db_' . $sib->id,
                        'wordId'    => $sib->id,
                        'word'      => $sib->word,
                        'imagePath' => $sib->imageUrl(),
                        'isCorrect' => false,
                        'audioClip' => $sib->audioClip(),
                    ]);
                }
            }

            return [
                'targetWord' => $word->word,
                'targetWordId' => $word->id,
                'audioPath'  => $word->audio_path ? '/' . ltrim($word->audio_path, '/') : null,
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
     * Convert a stored image path into a browser URL. Used for the
     * raw audio file path; image paths now go through Word::imageUrl()
     * directly so they automatically fall back to /api/word-svg/...
     * when the asset is missing on disk.
     */
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

    /**
     * Resolve an authored decoy image path. Returns the real file
     * URL when it exists, or a by-text SVG URL when it doesn't, so
     * a typo or missing seed asset never produces a broken image.
     */
    private function resolveAuthoredPath(string $path, string $word): string
    {
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }
        $rel = ltrim($path, '/');
        if (is_file(public_path($rel))) {
            return '/' . $rel;
        }
        return $this->byTextSvg($word);
    }

    private function byTextSvg(string $word): string
    {
        $slug = rawurlencode(preg_replace('/[^A-Za-z0-9 ]+/', '', $word));
        return "/api/word-svg-by-text/{$slug}.svg";
    }
}
