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
                    'imagePath' => $this->assetUrl($w->image_path),
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
        $options = $decoys->push($target)->map(fn (Word $w, int $i) => [
            'id'        => "o{$id}_{$i}",
            'wordId'    => $w->id ?: null,
            'word'      => $w->word,
            'imagePath' => $this->assetUrl($w->image_path),
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
                'imagePath' => $this->assetUrl($target->image_path),
                'audioClip' => $target->audioClip(),
            ],
            'options' => $options,
        ];
    }

    private function pickDecoys(Word $target, int $n, string $pool, int $unitId): Collection
    {
        // 1. Hand-authored wrong_options — try to resolve them against
        //    real DB rows so they carry image_path + audioClip. If a
        //    wrong_option word exists in the same unit, use that row
        //    directly (with its real image). Only fall back to a bare
        //    Word instance when the word doesn't exist in the DB.
        if (is_array($target->wrong_options) && count($target->wrong_options) >= $n) {
            $wrongWords = collect($target->wrong_options)->shuffle()->take($n);
            $resolved = collect();

            foreach ($wrongWords as $w) {
                $wordText = is_array($w) ? ($w['word'] ?? '') : (string) $w;
                if (! $wordText) continue;

                // Try to find a real Word row in the same unit.
                $real = Word::with('audioTrack')
                    ->where('unit_id', $unitId)
                    ->whereRaw('LOWER(word) = ?', [mb_strtolower($wordText)])
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
            return $resolved;
        }

        // 2. Query DB. We pull a generous candidate set (3x) and then
        //    score them so that decoys WITH image_path appear first.
        //    The previous strategy returned random words, which often
        //    surfaced rows with empty image_path — leaving the kid
        //    looking at coloured fallback tiles for every wrong choice
        //    while only the target word showed a real picture.
        //
        //    Order of preference (highest first):
        //      a) same category AND has image_path
        //      b) any unit word with image_path
        //      c) same category (no image)
        //      d) any unit word
        $candidates = $this->preferImageRichDecoys($target, $n, $pool, $unitId);

        return $candidates;
    }

    /**
     * Score-and-pick decoys so the lesson screen never has to render
     * coloured fallback tiles when there ARE words with images
     * available in the unit. Falls through tiers gracefully.
     */
    private function preferImageRichDecoys(Word $target, int $n, string $pool, int $unitId): Collection
    {
        $wantCategory = $pool === 'same_category' && $target->category;

        // Tier A: same category + has image
        $tierA = collect();
        if ($wantCategory) {
            $tierA = Word::with('audioTrack')
                ->where('unit_id', $unitId)
                ->where('id', '!=', $target->id)
                ->where('category', $target->category)
                ->whereNotNull('image_path')
                ->where('image_path', '!=', '')
                ->inRandomOrder()
                ->take($n)
                ->get();
        }
        if ($tierA->count() >= $n) {
            return $tierA;
        }

        // Tier B: any unit word with an image (excluding tier A picks)
        $picked = $tierA->pluck('id');
        $tierB = Word::with('audioTrack')
            ->where('unit_id', $unitId)
            ->where('id', '!=', $target->id)
            ->whereNotIn('id', $picked)
            ->whereNotNull('image_path')
            ->where('image_path', '!=', '')
            ->inRandomOrder()
            ->take($n - $tierA->count())
            ->get();

        $combined = $tierA->concat($tierB);
        if ($combined->count() >= $n) {
            return $combined;
        }

        // Tier C: same category (no image filter)
        $picked = $combined->pluck('id');
        if ($wantCategory) {
            $tierC = Word::with('audioTrack')
                ->where('unit_id', $unitId)
                ->where('id', '!=', $target->id)
                ->whereNotIn('id', $picked)
                ->where('category', $target->category)
                ->inRandomOrder()
                ->take($n - $combined->count())
                ->get();
            $combined = $combined->concat($tierC);
        }
        if ($combined->count() >= $n) {
            return $combined;
        }

        // Tier D: any other word in the unit
        $picked = $combined->pluck('id');
        $tierD = Word::with('audioTrack')
            ->where('unit_id', $unitId)
            ->where('id', '!=', $target->id)
            ->whereNotIn('id', $picked)
            ->inRandomOrder()
            ->take($n - $combined->count())
            ->get();

        return $combined->concat($tierD);
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
