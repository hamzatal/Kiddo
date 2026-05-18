<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
use App\Models\Lesson;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Mixed-review "Games Arena" — a single, fully randomised playground
 * that combines vocabulary from every unit the learner has unlocked
 * so far and rotates through a half-dozen mini-game styles. Designed
 * for free-form practice between adventures, NOT scored against any
 * specific unit.
 *
 * Round generation
 * ────────────────
 *  • Picks every Word in unlocked units (status=active|done) that has
 *    something to display: an image_path or an audio source.
 *  • For each round, we choose a "style" round-robin so the kid never
 *    gets two identical games in a row:
 *       0  word-to-image    (read the word → tap the matching image)
 *       1  audio-to-image   (hear the word → tap the matching image)
 *       2  image-to-word    (see the image → tap the matching word)
 *       3  listen-then-spell ( hear → tap the right word among 3 )
 *  • Decoys are siblings from the SAME category when possible, falling
 *    back to other words in the same unit, falling back to the global
 *    pool. Every option carries an audioClip so the speaker icon works
 *    on every card, even decoys.
 *  • Up to 12 rounds per session — short enough to keep first-grader
 *    attention but long enough to feel like a "level".
 *
 * Persistence
 * ───────────
 *  Submitting a session writes a single GameResult row with
 *    lesson_id  = nullable  (Arena has no specific lesson)
 *    unit_id    = nullable  (Arena spans every unit)
 *    word_id    = the word that was prompted on the LAST round
 *    correct    = total correct
 *    total      = total rounds
 *    duration_ms / metadata.rounds[] = full per-round detail
 *  XP / stars stay simple: 5 XP per correct answer, capped at 50.
 *  The map / parent dashboard can use these rows to surface "Arena
 *  practice" stats without having to special-case the schema.
 */
class GamesArenaController extends Controller
{
    /**
     * GET /arena
     * Build the arena deck for the current learner.
     */
    public function show(Request $request)
    {
        $user  = $request->user();
        $rounds = (int) min(20, max(6, (int) $request->query('rounds', 12)));

        $unlockedUnitIds = UserProgress::where('user_id', $user->id)
            ->whereIn('status', ['active', 'done'])
            ->pluck('unit_id')
            ->all();

        if (empty($unlockedUnitIds)) {
            // Brand-new account — let them play with U0 anyway so the
            // arena never shows an empty room.
            $unlockedUnitIds = Unit::orderBy('unit_number')->limit(1)->pluck('id')->all();
        }

        $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
            ->whereIn('unit_id', $unlockedUnitIds)
            ->where(function ($q) {
                // Skip rows with no displayable content. We always have
                // SVG fallback for missing images, but a totally empty
                // word row is still useless in a game.
                $q->whereNotNull('image_path')
                  ->orWhereNotNull('audio_path')
                  ->orWhereNotNull('audio_track_id');
            })
            ->get();

        if ($words->count() < 4) {
            // Not enough words yet — add ANY words in the unit pool.
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
                ->whereIn('unit_id', $unlockedUnitIds)
                ->get();
        }

        $deck = $this->buildDeck($words, $rounds);

        // Stats footer — counts the kid will see in the celebration card
        $unitsCount   = count($unlockedUnitIds);
        $unitsTotal   = Unit::count();
        $vocabPlayed  = (int) GameResult::where('user_id', $user->id)
            ->where('type', 'arena')
            ->sum('correct_count');

        return Inertia::render('Arena/ArenaScreen', [
            'arena' => [
                'rounds'       => $deck,
                'unlockedUnits'=> $unitsCount,
                'totalUnits'   => $unitsTotal,
                'vocabPlayed'  => (int) $vocabPlayed,
                'wordsAvailable' => $words->count(),
            ],
        ]);
    }

    /**
     * POST /arena/submit
     * Persist a single arena session as a GameResult row.
     */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'rounds'              => 'array',
            'rounds.*.roundId'    => 'nullable|string',
            'rounds.*.correct'    => 'required|boolean',
            'rounds.*.timeMs'     => 'nullable|integer',
            'rounds.*.wordId'     => 'nullable|integer',
            'rounds.*.word'       => 'nullable|string|max:120',
            'rounds.*.style'      => 'nullable|string|max:32',
            'rounds.*.wrongChoice'=> 'nullable|string|max:120',
            'durationMs'          => 'nullable|integer',
        ]);

        $user    = $request->user();
        $rounds  = $data['rounds'] ?? [];
        $correct = collect($rounds)->where('correct', true)->count();
        $total   = max(1, count($rounds));
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

        // Award some pocket XP for arena fun. Keep it modest so the
        // arena never out-paces real lessons.
        try {
            $bonus = min(50, $correct * 5);
            if ($bonus > 0 && method_exists($user, 'increment')) {
                $user->increment('xp', $bonus);
            }
        } catch (\Throwable $_) { /* silent */ }

        return redirect()->route('arena')->with('arenaResult', [
            'correct' => $correct,
            'total'   => $total,
            'percent' => (int) round(($correct / $total) * 100),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // Internals
    // ──────────────────────────────────────────────────────────

    /**
     * Build a randomised deck of mixed rounds. Returns an array
     * of:
     *   [
     *     'roundId'   => 'arena-3',
     *     'style'     => 'word-to-image' | 'audio-to-image' | 'image-to-word' | 'listen-then-spell',
     *     'wordId'    => 12,
     *     'unitTitle' => 'Family',
     *     'prompt'    => ['text','imagePath','audioClip'],
     *     'options'   => [ ['id','word','imagePath','audioClip','isCorrect'] ],
     *   ]
     */
    private function buildDeck($words, int $rounds): array
    {
        if ($words->isEmpty()) return [];

        // Index all words once for fast decoy lookup.
        $byCategory = $words->groupBy(fn (Word $w) => mb_strtolower((string) $w->category));
        $byUnit     = $words->groupBy('unit_id');

        // Shuffle the word pool but keep the original 1A order as a
        // tiebreaker so the early-unit words appear at least once.
        $pool = $words->shuffle()->values();
        $deck = [];
        $styles = ['word-to-image', 'audio-to-image', 'image-to-word', 'listen-then-spell'];

        $count = min($rounds, $pool->count());
        for ($i = 0; $i < $count; $i++) {
            /** @var Word $target */
            $target = $pool[$i];
            $style  = $styles[$i % count($styles)];

            $decoys = $this->pickDecoys($target, $byCategory, $byUnit, $words, 2);

            // Final dedupe: never let the target's word text appear
            // among the decoys, and never let two decoys share the
            // same lowercase word — would otherwise produce two
            // identical-looking cards on the same round.
            $seenWords = [mb_strtolower(trim((string) $target->word)) => true];
            $decoys = collect($decoys)->filter(function (Word $w) use (&$seenWords) {
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
            ];
        }

        return $deck;
    }

    /**
     * Choose `$count` decoy words for the given target. Tries:
     *   1. siblings in same category
     *   2. siblings in same unit  (last-resort: only when category
     *      doesn't have enough peers — never bleeds across concepts
     *      when the category is well populated)
     *   3. random words from any unit (very last resort)
     *
     * Always dedupes by lowercase word so two siblings with the same
     * spelling don't both end up on the card.
     */
    private function pickDecoys(Word $target, $byCategory, $byUnit, $allWords, int $count): array
    {
        $picks = collect();
        $cat   = mb_strtolower((string) $target->category);
        $seen  = [mb_strtolower(trim((string) $target->word)) => true];

        $accept = function (Word $w) use (&$seen, &$picks, $count) {
            if ($picks->count() >= $count) return false;
            $key = mb_strtolower(trim((string) $w->word));
            if ($key === '' || isset($seen[$key])) return false;
            $seen[$key] = true;
            $picks->push($w);
            return true;
        };

        // 1) same category siblings (strict — never mix categories
        //    unless category pool is too small).
        if ($cat !== '' && $byCategory->has($cat)) {
            foreach ($byCategory[$cat]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 2) other siblings in same unit, but EXPLICITLY exclude the
        //    target's category to avoid duplicating the same concept.
        if ($picks->count() < $count && $byUnit->has($target->unit_id)) {
            foreach ($byUnit[$target->unit_id]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 3) random words from any unit
        if ($picks->count() < $count) {
            foreach ($allWords->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }
        return $picks->take($count)->values()->all();
    }
}
