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
 * so far and rotates through ELEVEN mini-game styles. Designed for
 * free-form practice between adventures, NOT scored against any
 * specific unit.
 *
 * v3 round mix (May 2026 — operator wave 4)
 * ─────────────────────────────────────────
 *  The previous build round-robined six basic styles only:
 *    word-to-image, audio-to-image, image-to-word, listen-then-spell,
 *    odd-one-out, spot-the-decoy
 *
 *  The frontend ArenaScreen actually had five MORE specialised games
 *  registered as React components (MemoryFlip, ShadowMatch,
 *  RevealGuess, BalloonPop, TrueOrFalse) — but the controller never
 *  emitted their style strings, so they were dead code. The kid
 *  finished a 12-round arena session having seen the same six
 *  "tap the picture" variations over and over.
 *
 *  v3 expands the styles array to cover ALL ELEVEN game shapes plus
 *  bumps the default round count from 12 to 18 so the kid sees
 *  each style at least once per session. Specialised round shapes
 *  (pairs for memory-flip, decoy prompts for true-or-false) are
 *  built in dedicated branches so each game gets exactly the
 *  data its component expects.
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
        // v3: default 18 rounds (was 12). Operator wants kids to see
        // every game style at least once — there are 11 styles now,
        // so 18 rounds gives ~1.6× coverage with some doubles for
        // favourite mechanics.
        $rounds = (int) min(30, max(6, (int) $request->query('rounds', 18)));

        $unlockedUnitIds = UserProgress::where('user_id', $user->id)
            ->whereIn('status', ['active', 'done'])
            ->pluck('unit_id')
            ->all();

        // v1.1 (May 2026): the previous arena was unforgivingly strict
        // for brand-new learners. If a kid signed up and went STRAIGHT
        // to /arena (instead of clicking a unit on the map first), they
        // had no UserProgress rows yet — the controller fell back to
        // the FIRST unit only. If that one unit happened to have
        // words without `image_path` / `audio_path` / `audio_track_id`
        // set (or had fewer than 4 such words) the deck came out
        // empty and the screen rendered "🎮 No words yet!" which the
        // operator reported as "ولا اي لعبة موجودة".
        //
        // The new fallback chain ALWAYS produces a playable deck:
        //   1. Words from unlocked units, with media, ≥4 words      → ideal
        //   2. Words from unlocked units, with media, ≥1 word       → use them
        //   3. Words from unlocked units, ANY (rely on SVG fallback)→ use them
        //   4. Words from ALL units, with media                     → use them
        //   5. ANY words anywhere                                   → use them
        // Step 4-5 means a brand-new account is never blocked from
        // the arena even with empty UserProgress.

        if (empty($unlockedUnitIds)) {
            // Brand-new account — fall back to EVERY unit (not just U0)
            // so we have the largest possible pool of vocab to draw from.
            $unlockedUnitIds = Unit::orderBy('unit_number')->pluck('id')->all();
        }

        $allUnitIds = Unit::pluck('id')->all();

        $hasMediaQuery = function ($q) {
            $q->whereNotNull('image_path')
              ->orWhereNotNull('audio_path')
              ->orWhereNotNull('audio_track_id');
        };

        // Step 1+2: words with media in unlocked units
        $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
            ->whereIn('unit_id', $unlockedUnitIds)
            ->where($hasMediaQuery)
            ->get();

        // Step 3: any words in unlocked units (SVG fallback handles missing images)
        if ($words->count() < 4) {
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
                ->whereIn('unit_id', $unlockedUnitIds)
                ->get();
        }

        // Step 4: words with media across ALL units (covers the case
        // where the unlocked unit is empty but seeded units later are full)
        if ($words->count() < 4) {
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
                ->whereIn('unit_id', $allUnitIds)
                ->where($hasMediaQuery)
                ->get();
        }

        // Step 5: last-ditch — every word in the database.
        if ($words->count() < 1) {
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])->get();
        }

        Log::debug('Arena deck pool', [
            'user_id'         => $user->id,
            'unlocked_units'  => $unlockedUnitIds,
            'words_available' => $words->count(),
        ]);

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
     * The complete arena round-robin (v3, May 2026 wave 4). Twelve
     * distinct game shapes, every one of them mapped to a real
     * frontend component:
     *
     *   word-to-image      → StandardPrompt + StandardOptions
     *   audio-to-image     → StandardPrompt + StandardOptions
     *   image-to-word      → StandardPrompt + StandardOptions (text)
     *   listen-then-spell  → StandardPrompt + StandardOptions (text)
     *   odd-one-out        → StandardPrompt + StandardOptions
     *   spot-the-decoy     → StandardPrompt + StandardOptions
     *   memory-flip        → MemoryFlipRound      (round.pairs)
     *   shadow-match       → ShadowMatchRound     (standard shape)
     *   reveal-guess       → RevealGuessRound     (standard shape)
     *   balloon-pop        → BalloonPopRound      (standard shape)
     *   true-or-false      → TrueOrFalseRound     (decoy prompt + 2 opts)
     *   word-pic-connect   → WordPicConnectRound  (round.pairs)
     */
    private const STYLES = [
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
        'word-pic-connect',
    ];

    /**
     * Build a randomised deck of mixed rounds.
     *
     * Returns an array of round objects. Each round always carries
     * { roundId, style, wordId, unitTitle, unitColor, prompt, options }
     * so the frontend can consume any style with the same shape;
     * memory-flip additionally carries a `pairs` array.
     *
     * Strategy
     * ────────
     *   1. Shuffle the available words.
     *   2. For each round slot, pick the next word AND the next style
     *      from the round-robin. This guarantees variety: every kid
     *      sees each of the 11 styles before any style repeats.
     *   3. Specialised round shapes get dedicated builders.
     *
     * Falls back to plain word-to-image if the deck is too small
     * to populate a specialised style — the kid never gets a broken
     * round.
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

        // Shuffle the styles array ONCE per session so the kid doesn't
        // see the same style at the same slot every visit. Then cycle
        // through it round-robin so every style appears before any
        // style repeats.
        $styles = self::STYLES;
        shuffle($styles);

        $count = min($rounds, $pool->count());
        for ($i = 0; $i < $count; $i++) {
            /** @var Word $target */
            $target = $pool[$i];
            $style  = $styles[$i % count($styles)];

            $round = $this->buildRound($style, $target, $byCategory, $byUnit, $words, $i);
            if ($round !== null) {
                $deck[] = $round;
            }
        }

        return $deck;
    }

    /**
     * Build a single round of the requested style. Returns null only
     * when the style requires more material than the deck can supply
     * (e.g. memory-flip with fewer than 3 valid pairs); the caller
     * skips a null result rather than emitting a broken round.
     */
    private function buildRound(
        string $style,
        Word $target,
        $byCategory,
        $byUnit,
        $allWords,
        int $i,
    ): ?array {
        // memory-flip needs a different round shape entirely — a
        // small set of (image, word) pairs that the kid flips and
        // matches. Build it separately and return early.
        if ($style === 'memory-flip') {
            return $this->buildPairsRound($style, $target, $byUnit, $allWords, $i, 4);
        }

        // word-pic-connect uses the same `pairs` shape as memory-flip
        // (5 word/picture pairs the kid joins with lines). The
        // adapter component on the frontend turns the pair list
        // back into the lesson-engine deck shape.
        if ($style === 'word-pic-connect') {
            return $this->buildPairsRound($style, $target, $byUnit, $allWords, $i, 5);
        }

        // true-or-false is the standard shape with TWO options
        // (true/false) and a 50% chance the displayed word doesn't
        // match the picture. Build it separately too.
        if ($style === 'true-or-false') {
            return $this->buildTrueOrFalseRound($target, $byCategory, $byUnit, $allWords, $i);
        }

        // Every other style uses the standard "prompt + options"
        // shape with three image-bearing options.
        $decoys = $this->pickDecoys($target, $byCategory, $byUnit, $allWords, 2);

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

        return [
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

    /**
     * Generic "pairs" round builder — used by both memory-flip
     * (4 pairs, hidden + flipped to match) and word-pic-connect
     * (5 pairs, both sides visible, kid draws connections).
     *
     * Falls back to null if we can't find at least 3 distinct
     * words; the caller skips a null result rather than emitting
     * a half-built round.
     */
    private function buildPairsRound(
        string $style,
        Word $target,
        $byUnit,
        $allWords,
        int $i,
        int $count,
    ): ?array {
        $candidates = collect([$target]);

        // Prefer words from the same unit so the round feels coherent.
        if ($byUnit->has($target->unit_id)) {
            $candidates = $candidates->merge(
                $byUnit[$target->unit_id]
                    ->where('id', '!=', $target->id)
                    ->shuffle()
                    ->take($count - 1)
            );
        }

        // Top up from the global pool if we still don't have enough.
        if ($candidates->count() < $count) {
            $needed = $count - $candidates->count();
            $extras = $allWords
                ->where('id', '!=', $target->id)
                ->whereNotIn('id', $candidates->pluck('id')->all())
                ->shuffle()
                ->take($needed);
            $candidates = $candidates->merge($extras);
        }

        // Need at least 3 unique pairs to make either matching game
        // worth playing. If even that's too much, fall back to the
        // standard shape so the slot isn't wasted.
        if ($candidates->count() < 3) {
            return null;
        }

        // Final dedupe by lowercase word so two siblings with the
        // same spelling don't render as separate pairs.
        $seen = [];
        $pairs = $candidates->filter(function (Word $w) use (&$seen) {
            $key = mb_strtolower(trim((string) $w->word));
            if ($key === '' || isset($seen[$key])) return false;
            $seen[$key] = true;
            return true;
        })->take($count)->values()->map(function (Word $w, int $idx) {
            return [
                'pairId'    => 'pair-' . $idx,
                'wordId'    => $w->id,
                'word'      => $w->word,
                'imagePath' => $w->imageUrl(),
                'audioClip' => $w->audioClip(),
            ];
        })->all();

        return [
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
            'pairs'     => $pairs,
            // Empty options array so older frontend code that always
            // reads `round.options` doesn't crash on a missing key.
            'options'   => [],
        ];
    }

    /**
     * true-or-false: shows the target image with EITHER the matching
     * word (50%) or a sibling decoy word (50%). Two big buttons
     * (✅ True / ❌ False) — the kid picks whether the word matches.
     *
     * Hard rule: the "isCorrect" flag on each option must reflect
     * the actual relationship between the prompt image and the
     * displayed word. The frontend uses this directly to grade.
     */
    private function buildTrueOrFalseRound(
        Word $target,
        $byCategory,
        $byUnit,
        $allWords,
        int $i,
    ): ?array {
        // 50/50: keep the real word OR swap in a decoy.
        $useDecoy = (mt_rand(0, 1) === 1);
        $promptText = $target->word;

        if ($useDecoy) {
            $decoy = $this->pickDecoys($target, $byCategory, $byUnit, $allWords, 1)[0] ?? null;
            if ($decoy) {
                $promptText = $decoy->word;
            } else {
                // No decoy available — degrade to "true" so the round
                // is still grade-able (the kid will pick True).
                $useDecoy = false;
            }
        }

        // The image came from $target. If we kept the original word,
        // the answer is True; if we swapped to a decoy, the answer
        // is False.
        $trueIsCorrect  = !$useDecoy;
        $falseIsCorrect =  $useDecoy;

        return [
            'roundId'   => 'arena-' . $i,
            'style'     => 'true-or-false',
            'wordId'    => $target->id,
            'unitTitle' => $target->unit?->title,
            'unitColor' => $target->unit?->color_key,
            'prompt'    => [
                'text'      => $promptText,
                'imagePath' => $target->imageUrl(),
                'audioClip' => $target->audioClip(),
            ],
            'options'   => [
                ['id' => 'true',  'word' => 'true',  'isCorrect' => $trueIsCorrect ],
                ['id' => 'false', 'word' => 'false', 'isCorrect' => $falseIsCorrect],
            ],
        ];
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
