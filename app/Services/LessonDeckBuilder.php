<?php

namespace App\Services;

use App\Models\Lesson;
use App\Models\Word;
use Illuminate\Support\Collection;

/**
 * Turns a Lesson row (type + config) into a ready-to-render deck for
 * the React LessonEngine. The frontend never queries the DB — it just
 * consumes this shape and plays rounds.
 *
 * Shapes returned:
 *  - mode=intro:        { mode, intro: { headline, audioTrack, cards[] } }
 *  - mode=vocab-game:   { mode, deck: [ { roundId, style, prompt, options[] } ] }
 *  - mode=phonics-game: same shape as vocab-game with phonics prompt
 *  - mode=review:       same shape, words sampled across multiple categories
 */
class LessonDeckBuilder
{
    public function build(Lesson $lesson): array
    {
        $lesson->loadMissing('audioTrack');

        $cfg  = $lesson->config ?? [];
        $mode = $cfg['mode'] ?? $lesson->type;

        return match ($mode) {
            'intro'        => $this->buildIntro($lesson, $cfg),
            'phonics-game' => $this->buildPhonicsGame($lesson, $cfg),
            'review'       => $this->buildReview($lesson, $cfg),
            'vocab-game'   => $this->buildVocabGame($lesson, $cfg),
            default        => $this->buildVocabGame($lesson, $cfg),
        };
    }

    // ───────── INTRO ─────────

    private function buildIntro(Lesson $lesson, array $cfg): array
    {
        $words = $this->selectTargets($lesson, $cfg)->values();

        return [
            'mode' => 'intro',
            'intro' => [
                'headline'   => $lesson->title,
                'audioTrack' => $this->audioTrackPayload($lesson),
                'cards'      => $words->map(fn (Word $w) => [
                    'id'        => $w->id,
                    'word'      => $w->word,
                    'imagePath' => $this->resolveImage($w),
                    'audioClip' => $w->audioClip(),
                ])->all(),
            ],
        ];
    }

    // ───────── VOCAB GAME ─────────

    private function buildVocabGame(Lesson $lesson, array $cfg): array
    {
        $targets = $this->selectTargets($lesson, $cfg);
        $rounds  = min((int) ($cfg['rounds'] ?? 6), max(1, $targets->count()));
        $style   = $cfg['question_style'] ?? 'word-to-image';
        $opts    = (int) ($cfg['options_per_round'] ?? 3);
        $pool    = $cfg['decoy_pool'] ?? 'same_category';

        $deck = $targets->loadMissing('audioTrack')->shuffle()->take($rounds)->values()->map(
            fn (Word $target, int $i) => $this->makeRound("r{$i}", $target, $style, $opts, $pool, $lesson->unit_id)
        );

        return [
            'mode'       => 'vocab-game',
            'audioTrack' => $this->audioTrackPayload($lesson),
            'deck'       => $deck->all(),
        ];
    }

    // ───────── PHONICS GAME ─────────

    private function buildPhonicsGame(Lesson $lesson, array $cfg): array
    {
        $sets = $cfg['phonics_sets'] ?? [];
        $targets = Word::with('audioTrack')
            ->where('unit_id', $lesson->unit_id)
            ->where('type', 'phonics')
            ->when(! empty($sets), fn ($q) => $q->whereIn('category', $sets))
            ->inRandomOrder()
            ->get();

        $rounds  = min((int) ($cfg['rounds'] ?? 8), max(1, $targets->count()));
        $style   = $cfg['question_style'] ?? 'sound-to-word';
        $opts    = (int) ($cfg['options_per_round'] ?? 3);

        $deck = $targets->take($rounds)->values()->map(function (Word $target, int $i) use ($style, $opts, $sets, $lesson) {
            // Phonics decoys: prefer words from the OTHER set in the pair
            // so a /s/ target shows /d/ distractors -> teaches contrast.
            $others = array_values(array_diff($sets, [$target->category]));
            $decoys = Word::with('audioTrack')
                ->where('unit_id', $lesson->unit_id)
                ->where('type', 'phonics')
                ->when(! empty($others), fn ($q) => $q->whereIn('category', $others))
                ->where('id', '!=', $target->id)
                ->inRandomOrder()
                ->take($opts - 1)
                ->get();

            if ($decoys->count() < $opts - 1) {
                $decoys = $decoys->concat(
                    Word::with('audioTrack')
                        ->where('unit_id', $lesson->unit_id)
                        ->where('id', '!=', $target->id)
                        ->whereNotIn('id', $decoys->pluck('id'))
                        ->inRandomOrder()
                        ->take($opts - 1 - $decoys->count())
                        ->get()
                );
            }

            return $this->assembleRound("r{$i}", $target, $decoys, $style);
        });

        return [
            'mode'       => 'phonics-game',
            'audioTrack' => $this->audioTrackPayload($lesson),
            'deck'       => $deck->all(),
        ];
    }

    // ───────── REVIEW ─────────

    private function buildReview(Lesson $lesson, array $cfg): array
    {
        $categories = $cfg['categories'] ?? null;
        $rounds     = (int) ($cfg['rounds'] ?? 10);
        $styles     = $cfg['styles'] ?? ['word-to-image', 'image-to-word'];
        $opts       = (int) ($cfg['options_per_round'] ?? 3);

        $targets = Word::with('audioTrack')
            ->where('unit_id', $lesson->unit_id)
            ->when($categories, fn ($q) => $q->whereIn('category', $categories))
            ->inRandomOrder()
            ->take($rounds)
            ->get();

        $deck = $targets->values()->map(function (Word $target, int $i) use ($styles, $opts, $lesson) {
            $style = $styles[$i % count($styles)];
            return $this->makeRound("r{$i}", $target, $style, $opts, 'same_category', $lesson->unit_id);
        });

        return [
            'mode'       => 'review',
            'audioTrack' => $this->audioTrackPayload($lesson),
            'deck'       => $deck->all(),
        ];
    }

    // ───────── Helpers ─────────

    private function selectTargets(Lesson $lesson, array $cfg): Collection
    {
        $q = Word::where('unit_id', $lesson->unit_id)->with('audioTrack');

        if (! empty($cfg['word_filter'])) {
            $q->whereIn('word', $cfg['word_filter']);
        } elseif (! empty($cfg['category'])) {
            $q->where('category', $cfg['category']);
        } elseif (! empty($cfg['categories'])) {
            $q->whereIn('category', $cfg['categories']);
        }

        $words = $q->get();

        if ($words->isEmpty()) {
            $words = Word::with('audioTrack')->where('unit_id', $lesson->unit_id)->limit(8)->get();
        }

        return $words;
    }

    private function makeRound(string $id, Word $target, string $style, int $opts, string $pool, int $unitId): array
    {
        $decoys = $this->pickDecoys($target, $opts - 1, $pool, $unitId);
        return $this->assembleRound($id, $target, $decoys, $style);
    }

    private function assembleRound(string $id, Word $target, Collection $decoys, string $style): array
    {
        // Final safety pass: never let the target's word text appear
        // among the decoys, and never let two options share the same
        // word text (case-insensitive). This is the last line of
        // defense — the seeders, AI ingest and admin editor can all
        // accidentally introduce duplicates and we'd rather render
        // fewer-than-expected options than confuse the kid with two
        // identical-looking cards.
        $targetKey = mb_strtolower(trim((string) $target->word));
        $seen = [$targetKey => true];
        $cleanDecoys = $decoys->filter(function (Word $w) use (&$seen) {
            $key = mb_strtolower(trim((string) $w->word));
            if ($key === '' || isset($seen[$key])) {
                return false;
            }
            $seen[$key] = true;
            return true;
        })->values();

        $options = $cleanDecoys->push($target)->map(fn (Word $w, int $i) => [
            'id'        => "o{$id}_{$i}",
            'wordId'    => $w->id ?: null,
            'word'      => $w->word,
            'imagePath' => $this->resolveImage($w),
            'audioClip' => $w->audioClip(),
            'isCorrect' => $w->is($target),
        ])->shuffle()->values()->all();

        return [
            'roundId' => $id,
            'wordId'  => $target->id ?: null,
            'style'   => $style,
            'prompt'  => [
                'kind'      => in_array($style, ['image-to-word', 'audio-to-image']) ? 'image' : 'word',
                'text'      => $target->word,
                'imagePath' => $this->resolveImage($target),
                'audioClip' => $target->audioClip(),
            ],
            'options' => $options,
        ];
    }

    /**
     * Resolve any Word into a guaranteed-renderable URL. Saved DB
     * rows use the centralized Word::imageUrl() helper which falls
     * back to the dynamic SVG endpoint when the original file is
     * missing. Transient Word instances (built from authored
     * wrong_options that don't match a DB row) get a by-text SVG so
     * the card still displays something delightful instead of a
     * coloured letter tile.
     */
    private function resolveImage(Word $w): string
    {
        if ($w->exists) {
            return $w->imageUrl();
        }

        // Transient Word: try the raw image_path first, otherwise the
        // dynamic by-text SVG endpoint.
        $path = $w->image_path;
        if ($path) {
            if (preg_match('~^https?://~i', $path)) {
                return $path;
            }
            $rel = ltrim($path, '/');
            if (is_file(public_path($rel))) {
                return '/' . $rel;
            }
        }
        // Always return a usable URL — never null.
        $text = $w->word ?: 'word';
        $slug = rawurlencode(preg_replace('/[^A-Za-z0-9 ]+/', '', $text));
        return "/api/word-svg-by-text/{$slug}.svg";
    }

    private function pickDecoys(Word $target, int $n, string $pool, int $unitId): Collection
    {
        // 1. Hand-authored wrong_options — try to resolve them against
        //    real DB rows so they carry image_path + audioClip. If a
        //    wrong_option word exists in the same unit, use that row
        //    directly (with its real image). Only fall back to a bare
        //    Word instance when the word doesn't exist in the DB.
        //
        //    We DEDUPE by lowercase word text so a malformed
        //    wrong_options array (or one that AI ingest re-wrote) can
        //    never produce two identical cards on the same round.
        if (is_array($target->wrong_options) && count($target->wrong_options) >= 1) {
            $targetKey = mb_strtolower(trim((string) $target->word));
            $seen = [$targetKey => true];
            $resolved = collect();

            $shuffledAuthored = collect($target->wrong_options)->shuffle();

            foreach ($shuffledAuthored as $w) {
                if ($resolved->count() >= $n) break;

                $wordText = is_array($w) ? trim((string) ($w['word'] ?? '')) : trim((string) $w);
                if ($wordText === '') continue;

                $key = mb_strtolower($wordText);
                if (isset($seen[$key])) continue;          // skip duplicates
                $seen[$key] = true;

                // Try to find a real Word row in the same unit.
                $real = Word::with('audioTrack')
                    ->where('unit_id', $unitId)
                    ->whereRaw('LOWER(word) = ?', [$key])
                    ->where('id', '!=', $target->id)
                    ->first();

                if ($real) {
                    $resolved->push($real);
                } else {
                    $resolved->push(new Word([
                        'word'       => $wordText,
                        'image_path' => is_array($w) ? ($w['image_path'] ?? null) : null,
                    ]));
                }
            }

            // If authored decoys were enough — return.
            if ($resolved->count() >= $n) {
                return $resolved;
            }

            // Otherwise top up from the DB while still avoiding
            // duplicates and the target itself.
            $topUp = $this->preferImageRichDecoys(
                $target,
                $n - $resolved->count(),
                $pool,
                $unitId,
                array_keys($seen)
            );
            return $resolved->concat($topUp);
        }

        return $this->preferImageRichDecoys($target, $n, $pool, $unitId, []);
    }

    /**
     * Score-and-pick decoys that match the target's category whenever
     * possible. The PREVIOUS implementation would happily pull a
     * "Boy" decoy for a "Six" question — because it tried "any unit
     * word with an image" before "same-category without image". On a
     * unit where only a few categories have real PNGs (e.g. Welcome:
     * boy/hello/goodbye/hut on disk, but no number/colour PNGs) the
     * kid saw mismatched answers ("Six" → cards: Boy, Hello, Six).
     *
     * New ordering — strictly preserves the target's category so the
     * answer set is always educationally meaningful, even when that
     * means falling through to the dynamic SVG fallback for decoys:
     *
     *   A) same category + has image_path
     *   B) same category (image_path optional — relies on SVG fallback)
     *   C) any other word in the unit (last-resort)
     */
    private function preferImageRichDecoys(Word $target, int $n, string $pool, int $unitId, array $excludeWordKeys = []): Collection
    {
        if ($n <= 0) {
            return collect();
        }

        $wantCategory = $pool === 'same_category' && $target->category;
        $excludeIds = [$target->id];
        $excludeKeys = array_flip(array_map('mb_strtolower', $excludeWordKeys));
        $excludeKeys[mb_strtolower((string) $target->word)] = true;

        $picked = collect();
        $applyFilter = function ($collection) use (&$excludeKeys, &$excludeIds, &$picked, $n) {
            $remaining = $n - $picked->count();
            if ($remaining <= 0) return collect();
            return $collection->filter(function (Word $w) use (&$excludeKeys, &$excludeIds) {
                $key = mb_strtolower(trim((string) $w->word));
                if (isset($excludeKeys[$key])) return false;
                if (in_array($w->id, $excludeIds, true)) return false;
                $excludeKeys[$key] = true;
                $excludeIds[] = $w->id;
                return true;
            })->take($remaining)->values();
        };

        // Tier A: same category + has image
        if ($wantCategory) {
            $tierA = Word::with('audioTrack')
                ->where('unit_id', $unitId)
                ->where('id', '!=', $target->id)
                ->where('category', $target->category)
                ->whereNotNull('image_path')
                ->where('image_path', '!=', '')
                ->inRandomOrder()
                ->take($n * 3)
                ->get();
            $picked = $picked->concat($applyFilter($tierA));
            if ($picked->count() >= $n) return $picked;

            // Tier B: same category (image OR SVG fallback). This is
            // crucial for Welcome unit's numbers — the SVG fallback
            // already shows a keycap emoji per number so the cards
            // stay visually distinct AND on-topic.
            $tierB = Word::with('audioTrack')
                ->where('unit_id', $unitId)
                ->where('id', '!=', $target->id)
                ->where('category', $target->category)
                ->inRandomOrder()
                ->take($n * 3)
                ->get();
            $picked = $picked->concat($applyFilter($tierB));
            if ($picked->count() >= $n) return $picked;
        }

        // Tier C: any other word in the unit (last-resort).
        // Note: this is intentionally below same-category-no-image
        // so we never bleed mismatched concepts into a category quiz
        // unless absolutely no alternative exists.
        $tierC = Word::with('audioTrack')
            ->where('unit_id', $unitId)
            ->where('id', '!=', $target->id)
            ->inRandomOrder()
            ->take($n * 3)
            ->get();
        $picked = $picked->concat($applyFilter($tierC));

        return $picked;
    }

    private function audioTrackPayload(Lesson $lesson): ?array
    {
        $t = $lesson->audioTrack;
        if (! $t) {
            return null;
        }

        return [
            'id'       => $t->id,
            'code'     => $t->code,
            'label'    => $t->label,
            'kind'     => $t->kind,
            'page'     => $t->page,
            'url'      => $t->url,
            'localUrl' => $t->local_path ? '/' . ltrim($t->local_path, '/') : null,
            'playUrl'  => $t->playable_url,
            'format'   => $t->format,
            'duration' => $t->duration_sec,
        ];
    }

    /**
     * Normalize a stored path to a root-relative URL the browser can load.
     * Accepts: "assets/lessons/welcome/hello.png", "/assets/...", full http URL.
     *
     * We ALWAYS return the URL if a path is set — even if the file doesn't
     * currently exist on disk. SmartImage on the frontend has an onError
     * handler that gracefully shows a colourful letter tile when the img
     * 404s. The old behaviour of returning null meant decoy cards never
     * even ATTEMPTED to load their image, making the game look broken
     * (only the target word showed a picture, everything else was a
     * coloured square).
     */
    private function assetUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }

        $rel = ltrim($path, '/');
        return '/' . $rel;
    }
}
