<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * GamesArenaController — mixed-review arena.
 *
 * v4 (May 2026): added memory-flip, shadow-match, reveal-guess,
 * balloon-pop, true-or-false round styles. Each gets a dedicated
 * builder so buildDeck() stays clean.
 */
class GamesArenaController extends Controller
{
    public function show(Request $request)
    {
        $user   = $request->user();
        $rounds = (int) min(20, max(6, (int) $request->query('rounds', 12)));

        $unlockedUnitIds = UserProgress::where('user_id', $user->id)
            ->whereIn('status', ['active', 'done'])
            ->pluck('unit_id')
            ->all();

        if (empty($unlockedUnitIds)) {
            $unlockedUnitIds = Unit::orderBy('unit_number')->limit(1)->pluck('id')->all();
        }

        $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
            ->whereIn('unit_id', $unlockedUnitIds)
            ->where(function ($q) {
                $q->whereNotNull('image_path')
                  ->orWhereNotNull('audio_path')
                  ->orWhereNotNull('audio_track_id');
            })
            ->get();

        if ($words->count() < 4) {
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
                ->whereIn('unit_id', $unlockedUnitIds)
                ->get();
        }

        $deck = $this->buildDeck($words, $rounds);

        $unitsCount  = count($unlockedUnitIds);
        $unitsTotal  = Unit::count();
        $vocabPlayed = (int) GameResult::where('user_id', $user->id)
            ->where('type', 'arena')
            ->sum('correct_count');

        return Inertia::render('Arena/ArenaScreen', [
            'arena' => [
                'rounds'         => $deck,
                'unlockedUnits'  => $unitsCount,
                'totalUnits'     => $unitsTotal,
                'vocabPlayed'    => $vocabPlayed,
                'wordsAvailable' => $words->count(),
            ],
        ]);
    }

    public function submit(Request $request)
    {
        $data = $request->validate([
            'rounds'               => 'nullable|array',   // ← nullable هنا مهم
            'rounds.*.roundId'     => 'nullable|string',
            'rounds.*.correct'     => 'nullable|boolean', // ← nullable بدل required
            'rounds.*.timeMs'      => 'nullable|integer',
            'rounds.*.wordId'      => 'nullable|integer',
            'rounds.*.word'        => 'nullable|string|max:120',
            'rounds.*.style'       => 'nullable|string|max:32',
            'rounds.*.wrongChoice' => 'nullable|string|max:120',
            'durationMs'           => 'nullable|integer',
        ]);

        $user     = $request->user();
        $rounds   = $data['rounds'] ?? [];
        $correct  = collect($rounds)->where('correct', true)->count();
        $total    = max(1, count($rounds));
        $lastWord = collect($rounds)->reverse()->firstWhere('wordId');

        try {
            GameResult::create([
                'user_id'       => $user->id,
                'lesson_id'     => null,
                'unit_id'       => null,
                'word_id'       => $lastWord['wordId'] ?? null,
                'type'          => 'arena',
                'correct_count' => $correct,
                'wrong_count'   => max(0, $total - $correct),
                'score'         => (int) round(($correct / $total) * 100),
                'meta'          => [
                    'mode'        => 'arena',
                    'duration_ms' => (int) ($data['durationMs'] ?? 0),
                    'rounds'      => $rounds,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Arena: could not persist GameResult — ' . $e->getMessage());
        }

        try {
            $bonus = min(50, $correct * 5);
            if ($bonus > 0 && method_exists($user, 'increment')) {
                $user->increment('xp', $bonus);
            }
        } catch (\Throwable $_) {}

        return redirect()->route('arena')->with('arenaResult', [
            'correct' => $correct,
            'total'   => $total,
            'percent' => (int) round(($correct / $total) * 100),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deck builder
    // ─────────────────────────────────────────────────────────────────────────

    private function buildDeck($words, int $rounds): array
    {
        if ($words->isEmpty()) return [];

        $byCategory = $words->groupBy(fn (Word $w) => mb_strtolower((string) $w->category));
        $byUnit     = $words->groupBy('unit_id');
        $pool       = $words->shuffle()->values();

        $styles = [
            'word-to-image',
            'audio-to-image',
            'image-to-word',
            'listen-then-spell',
            'odd-one-out',
            'spot-the-decoy',
            'memory-flip',
            'shadow-match',
            'reveal-guess',
            'balloon-pop',
            'true-or-false',
        ];

        $deck  = [];
        $count = min($rounds, $pool->count());

        for ($i = 0; $i < $count; $i++) {
            /** @var Word $target */
            $target = $pool[$i];
            $style  = $styles[$i % count($styles)];

            // Styles with specialised builders
            if ($style === 'memory-flip') {
                $deck[] = $this->buildMemoryFlipRound($target, $byCategory, $byUnit, $words, $i);
                continue;
            }
            if ($style === 'true-or-false') {
                $deck[] = $this->buildTrueOrFalseRound($target, $words, $i);
                continue;
            }

            // All other styles share the standard prompt+options shape
            $decoys = $this->pickDecoys($target, $byCategory, $byUnit, $words, 2);

            $seenWords = [mb_strtolower(trim((string) $target->word)) => true];
            $decoys    = collect($decoys)->filter(function (Word $w) use (&$seenWords) {
                $key = mb_strtolower(trim((string) $w->word));
                if ($key === '' || isset($seenWords[$key])) return false;
                $seenWords[$key] = true;
                return true;
            })->values()->all();

            $allOpts = collect([$target])->merge($decoys);
            $options = $allOpts->map(function (Word $w, int $j) use ($target) {
                return [
                    'id'        => 'opt-' . $w->id . '-' . $j,
                    'wordId'    => $w->id,
                    'word'      => $w->word,
                    'imagePath' => $w->imageUrl(),
                    'audioClip' => $w->audioClip(),
                    'isCorrect' => $w->id === $target->id,
                ];
            })->shuffle()->values()->all();

            $deck[] = [
                'roundId'   => 'arena-' . $i,
                'style'     => $style,
                'wordId'    => $target->id,
                'unitTitle' => $target->unit?->title,
                'unitColor' => $target->unit?->color_key,
                'prompt'    => [
                    'text'      => $target->word,
                    'imagePath' => $target->imageUrl(),
                    'audioClip' => $target->audioClip(),
                ],
                'options'   => $options,
                'pairs'     => [],
            ];
        }

        return $deck;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Specialised round builders
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * memory-flip: 4 pairs (1 target + 3 decoys).
     * Returns round.pairs instead of round.options.
     */
    private function buildMemoryFlipRound($target, $byCategory, $byUnit, $allWords, int $i): array
    {
        $others = collect($this->pickDecoys($target, $byCategory, $byUnit, $allWords, 3));

        $pairs = collect([$target])
            ->merge($others)
            ->map(function (Word $w) {
                return [
                    'pairId'    => 'pair-' . $w->id,
                    'wordId'    => $w->id,
                    'word'      => $w->word,
                    'imagePath' => $w->imageUrl(),
                    'audioClip' => $w->audioClip(),
                ];
            })
            ->shuffle()
            ->values()
            ->all();

        return [
            'roundId'   => 'arena-' . $i,
            'style'     => 'memory-flip',
            'wordId'    => $target->id,
            'unitTitle' => $target->unit?->title,
            'unitColor' => $target->unit?->color_key,
            'prompt'    => [
                'text'      => 'Match every picture to its word!',
                'imagePath' => null,
                'audioClip' => null,
            ],
            'pairs'   => $pairs,
            'options' => [],
        ];
    }

    /**
     * true-or-false: 50% chance the displayed word is a decoy.
     * Options are always [{id:"true",...},{id:"false",...}].
     */
    private function buildTrueOrFalseRound($target, $allWords, int $i): array
    {
        $showDecoy   = (bool) random_int(0, 1);
        $displayWord = $target;

        if ($showDecoy) {
            $decoy = $allWords
                ->where('id', '!=', $target->id)
                ->where('word', '!=', $target->word)
                ->shuffle()
                ->first();
            if ($decoy) $displayWord = $decoy;
        }

        $wordIsCorrect = !$showDecoy;

        return [
            'roundId'   => 'arena-' . $i,
            'style'     => 'true-or-false',
            'wordId'    => $target->id,
            'unitTitle' => $target->unit?->title,
            'unitColor' => $target->unit?->color_key,
            'prompt'    => [
                'text'      => $displayWord->word,
                'imagePath' => $target->imageUrl(),
                'audioClip' => $target->audioClip(),
            ],
            'options' => [
                [
                    'id'        => 'true',
                    'wordId'    => null,
                    'word'      => 'true',
                    'imagePath' => null,
                    'audioClip' => null,
                    'isCorrect' => $wordIsCorrect,
                ],
                [
                    'id'        => 'false',
                    'wordId'    => null,
                    'word'      => 'false',
                    'imagePath' => null,
                    'audioClip' => null,
                    'isCorrect' => !$wordIsCorrect,
                ],
            ],
            'pairs' => [],
        ];
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Decoy picker (unchanged logic, v3 — stable)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Choose $count decoy words for the given target.
     *
     * Priority order:
     *   1. Same category siblings (strict — avoids cross-concept mixing)
     *   2. Same unit siblings (different category only)
     *   3. Random words from any unit (last resort)
     *
     * Always dedupes by lowercase word so identical spellings never
     * produce two cards on the same round.
     */
    private function pickDecoys(Word $target, $byCategory, $byUnit, $allWords, int $count): array
    {
        $picks = collect();
        $cat   = mb_strtolower((string) $target->category);
        $seen  = [mb_strtolower(trim((string) $target->word)) => true];

        $accept = function (Word $w) use (&$seen, &$picks, $count): bool {
            if ($picks->count() >= $count) return false;
            $key = mb_strtolower(trim((string) $w->word));
            if ($key === '' || isset($seen[$key])) return false;
            $seen[$key] = true;
            $picks->push($w);
            return true;
        };

        // 1) Same category
        if ($cat !== '' && $byCategory->has($cat)) {
            foreach ($byCategory[$cat]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 2) Same unit, different category
        if ($picks->count() < $count && $byUnit->has($target->unit_id)) {
            foreach ($byUnit[$target->unit_id]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 3) Any word in the global pool
        if ($picks->count() < $count) {
            foreach ($allWords->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        return $picks->take($count)->values()->all();
    }
}