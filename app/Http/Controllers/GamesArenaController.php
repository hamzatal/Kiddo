<?php

namespace App\Http\Controllers;

use App\Models\GameResult;
use App\Models\Unit;
use App\Models\UserProgress;
use App\Models\Word;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * Games Arena — مساحة الألعاب المختلطة.
 *
 * Architecture (rewrite):
 * ───────────────────────
 *  /arena                     → menu of the available mini-games
 *  /arena/play/{game}         → plays the chosen game with a deck
 *                               built from every unlocked unit's
 *                               vocabulary
 *  /arena/submit              → POST results, awards bonus XP
 *
 * The catalogue of games is defined ONCE in `availableGames()` and
 * each entry maps to one of the existing lesson mode React
 * components (MemoryGame, MatchConnect, WordPicConnect, BubblePop,
 * SpeedTap, ListeningGame, PictureMatch, VocabGame, DragDrop). That
 * means:
 *
 *   • zero new game logic to maintain — every game already works
 *     in the lesson flow and is well-tested.
 *   • adding a new game = one new entry in the list (icon, label,
 *     description, mode key) — nothing else.
 *
 * Deck shape is the SAME shape `LessonDeckBuilder::buildVocabGame`
 * produces, so the React mode components consume it without any
 * branching.
 */
class GamesArenaController extends Controller
{
    /**
     * GET /arena
     * Show the game picker — a hub of the mini-games the kid can
     * play. We don't build a deck yet; we just count how many words
     * are available and which units are unlocked.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        $unlockedUnitIds = $this->unlockedUnitIds($user);
        $wordsCount = Word::whereIn('unit_id', $unlockedUnitIds)->count();
        $unitsCount = count($unlockedUnitIds);
        $unitsTotal = Unit::count();

        $vocabPlayed = (int) GameResult::where('user_id', $user->id)
            ->where('type', 'arena')
            ->sum('correct_count');

        return Inertia::render('Arena/ArenaScreen', [
            'arena' => [
                // The menu items the React picker renders.
                'games'          => $this->availableGames(),
                'unlockedUnits'  => $unitsCount,
                'totalUnits'     => $unitsTotal,
                'wordsAvailable' => $wordsCount,
                'vocabPlayed'    => $vocabPlayed,
                // We're at the picker step, not playing yet.
                'mode'           => null,
                'deck'           => [],
                'gameMeta'       => null,
            ],
        ]);
    }

    /**
     * GET /arena/play/{game}
     * Build the deck for the chosen mini-game and render the same
     * Arena page in "play" mode. The React side detects `mode != null`
     * and switches from the picker to the chosen game component.
     */
    public function play(Request $request, string $game)
    {
        $user  = $request->user();
        $games = collect($this->availableGames())->keyBy('key');

        if (! $games->has($game)) {
            return redirect()->route('arena');
        }

        $meta = $games[$game];

        $unlockedUnitIds = $this->unlockedUnitIds($user);
        $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
            ->whereIn('unit_id', $unlockedUnitIds)
            ->where(function ($q) {
                $q->whereNotNull('image_path')
                    ->orWhereNotNull('audio_path')
                    ->orWhereNotNull('audio_track_id');
            })
            ->get();

        if ($words->count() < 4) {
            // Pad with anything — the kid never lands on an empty room.
            $words = Word::with(['audioTrack', 'unit:id,code,title,unit_number,color_key'])
                ->whereIn('unit_id', $unlockedUnitIds)
                ->get();
        }

        // Pick how many rounds make sense for this game style.
        $rounds = (int) ($meta['rounds'] ?? 8);
        // Some games use "pairs" instead of rounds (memory, picture-
        // match, match-connect, word-pic-connect). The deck is the
        // same shape — the mode component reads `pairs` from its own
        // config — so we just cap deck size at 6 for those.
        $deckSize = (int) ($meta['deck_size'] ?? min(8, $words->count()));

        $deck = $this->buildDeck($words, $deckSize, $meta['style']);

        return Inertia::render('Arena/ArenaScreen', [
            'arena' => [
                'games'          => $this->availableGames(),
                'unlockedUnits'  => count($unlockedUnitIds),
                'totalUnits'     => Unit::count(),
                'wordsAvailable' => $words->count(),
                'vocabPlayed'    => (int) GameResult::where('user_id', $user->id)
                    ->where('type', 'arena')->sum('correct_count'),
                'mode'           => $meta['mode'],
                'gameKey'        => $meta['key'],
                'gameMeta'       => $meta,
                'deck'           => $deck,
            ],
        ]);
    }

    /**
     * POST /arena/submit
     * Persist a single arena session as a GameResult row + give a
     * pocket XP bonus.
     */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'game'                => 'nullable|string|max:32',
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
                    'game'        => $data['game'] ?? null,
                    'duration_ms' => (int) ($data['durationMs'] ?? 0),
                    'rounds'      => $rounds,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('Arena: could not persist GameResult — ' . $e->getMessage());
        }

        // Bonus XP — modest, capped, never out-paces real lessons.
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
            'game'    => $data['game'] ?? null,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // Internals
    // ──────────────────────────────────────────────────────────

    /**
     * Catalogue of mini-games available in the Arena.
     *
     *  key       — URL slug used by /arena/play/{key}
     *  mode      — React component name (must match
     *              lessonEngine.resolveMode + LessonScreen switch)
     *  label     — human title shown on the picker card
     *  emoji     — header icon
     *  color     — picker card accent
     *  desc      — one-line "what is this game" for the kid
     *  style     — round style passed into the deck builder
     *  rounds    — how many rounds the deck should have
     *  deck_size — how many distinct words the deck pulls from
     *
     * Adding a new game = one extra entry here. The React picker
     * lays them out in a grid automatically.
     */
    private function availableGames(): array
    {
        return [
            [
                'key'       => 'word-hunt',
                'mode'      => 'vocab-game',
                'label'     => 'Word Hunt',
                'emoji'     => '🔎',
                'color'     => '#7C3AED',
                'desc'      => 'See the word, find the picture!',
                'style'     => 'word-to-image',
                'rounds'    => 8,
                'deck_size' => 8,
            ],
            [
                'key'       => 'listen-tap',
                'mode'      => 'listening-game',
                'label'     => 'Listen & Tap',
                'emoji'     => '🎧',
                'color'     => '#0EA5E9',
                'desc'      => 'Hear the word, choose the right picture.',
                'style'     => 'audio-to-image',
                'rounds'    => 6,
                'deck_size' => 6,
            ],
            [
                'key'       => 'memory-match',
                'mode'      => 'memory-game',
                'label'     => 'Memory Match',
                'emoji'     => '🧠',
                'color'     => '#F59E0B',
                'desc'      => 'Flip cards and find matching pairs.',
                'style'     => 'word-to-image',
                'rounds'    => 6,
                'deck_size' => 6,
            ],
            [
                'key'       => 'picture-pairs',
                'mode'      => 'picture-match',
                'label'     => 'Picture Pairs',
                'emoji'     => '🎴',
                'color'     => '#EC4899',
                'desc'      => 'Match identical pictures — no reading needed!',
                'style'     => 'word-to-image',
                'rounds'    => 6,
                'deck_size' => 6,
            ],
            [
                'key'       => 'connect-it',
                'mode'      => 'match-connect',
                'label'     => 'Connect It',
                'emoji'     => '🔗',
                'color'     => '#10B981',
                'desc'      => 'Connect each word to its picture.',
                'style'     => 'word-to-image',
                'rounds'    => 4,
                'deck_size' => 4,
            ],
            [
                'key'       => 'word-pic-link',
                'mode'      => 'word-pic-connect',
                'label'     => 'Word & Picture',
                'emoji'     => '🪢',
                'color'     => '#06B6D4',
                'desc'      => 'Same as Connect, longer rounds.',
                'style'     => 'word-to-image',
                'rounds'    => 5,
                'deck_size' => 5,
            ],
            [
                'key'       => 'bubble-pop',
                'mode'      => 'bubble-pop',
                'label'     => 'Bubble Pop',
                'emoji'     => '🫧',
                'color'     => '#3B82F6',
                'desc'      => 'Listen and pop the right bubble!',
                'style'     => 'audio-to-image',
                'rounds'    => 5,
                'deck_size' => 8,
            ],
            [
                'key'       => 'speed-tap',
                'mode'      => 'speed-tap',
                'label'     => 'Speed Tap',
                'emoji'     => '⚡',
                'color'     => '#F97316',
                'desc'      => 'Whack-a-Word — be quick!',
                'style'     => 'audio-to-image',
                'rounds'    => 8,
                'deck_size' => 10,
            ],
            [
                'key'       => 'sort-it',
                'mode'      => 'drag-drop',
                'label'     => 'Sort It',
                'emoji'     => '🎯',
                'color'     => '#8B5CF6',
                'desc'      => 'Tap a picture, then tap its word.',
                'style'     => 'word-to-image',
                'rounds'    => 5,
                'deck_size' => 5,
            ],
        ];
    }

    private function unlockedUnitIds($user): array
    {
        $ids = UserProgress::where('user_id', $user->id)
            ->whereIn('status', ['active', 'done'])
            ->pluck('unit_id')
            ->all();

        if (empty($ids)) {
            // Brand-new account — at least include the first unit so
            // the arena never says "no words available".
            $ids = Unit::orderBy('unit_number')->limit(1)->pluck('id')->all();
        }

        return $ids;
    }

    /**
     * Build a deck of `$rounds` rounds. Each round = 1 target word
     * + 2 same-category decoys. The shape matches what the lesson
     * mode components already consume.
     */
    private function buildDeck(Collection $words, int $rounds, string $style): array
    {
        if ($words->isEmpty()) return [];

        $byCategory = $words->groupBy(fn (Word $w) => mb_strtolower((string) $w->category));
        $byUnit     = $words->groupBy('unit_id');

        // Shuffle so kids don't always see the same target order.
        $pool = $words->shuffle()->values();
        $count = min($rounds, $pool->count());
        $deck = [];

        for ($i = 0; $i < $count; $i++) {
            /** @var Word $target */
            $target = $pool[$i];

            $decoys = $this->pickDecoys($target, $byCategory, $byUnit, $words, 2);

            // Final dedupe so two cards never share the same word.
            $seen = [mb_strtolower(trim((string) $target->word)) => true];
            $decoys = collect($decoys)->filter(function (Word $w) use (&$seen) {
                $key = mb_strtolower(trim((string) $w->word));
                if ($key === '' || isset($seen[$key])) return false;
                $seen[$key] = true;
                return true;
            })->values()->all();

            $allOpts = collect([$target])->merge($decoys);

            $options = $allOpts->map(function (Word $w, int $j) use ($target, $i) {
                return [
                    'id'        => "arena-r{$i}-o-{$w->id}-{$j}",
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
                    'kind'      => in_array($style, ['image-to-word', 'audio-to-image']) ? 'image' : 'word',
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
     * Pick `$count` decoys, preferring same-category siblings so a
     * "Six" question never gets a "Boy" option. Falls back to other
     * unit words then to the global pool — and dedupes by word text.
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

        // 1) same category siblings.
        if ($cat !== '' && $byCategory->has($cat)) {
            foreach ($byCategory[$cat]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 2) other words in the same unit.
        if ($picks->count() < $count && $byUnit->has($target->unit_id)) {
            foreach ($byUnit[$target->unit_id]->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }

        // 3) any word from any unit (last resort).
        if ($picks->count() < $count) {
            foreach ($allWords->where('id', '!=', $target->id)->shuffle() as $w) {
                if ($picks->count() >= $count) break;
                $accept($w);
            }
        }
        return $picks->take($count)->values()->all();
    }
}
