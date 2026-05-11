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
            'word'      => $w->word,
            'imagePath' => $this->assetUrl($w->image_path),
            'audioClip' => $w->audioClip(),
            'isCorrect' => $w->is($target),
        ])->shuffle()->values()->all();

        return [
            'roundId' => $id,
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
        // 1. Hand-authored wrong_options win if rich enough.
        // Returned Word instances stay transient so they carry image + word
        // text but no audio_track binding (which is fine: these rows are
        // only used to render decoy cards, not to speak them).
        if (is_array($target->wrong_options) && count($target->wrong_options) >= $n) {
            return collect($target->wrong_options)
                ->shuffle()
                ->take($n)
                ->map(fn ($w) => new Word([
                    'word'       => $w['word'] ?? '?',
                    'image_path' => $w['image_path'] ?? null,
                ]));
        }

        // 2. Query DB: same category first, then fallback to unit.
        $q = Word::where('unit_id', $unitId)->where('id', '!=', $target->id)->with('audioTrack');
        if ($pool === 'same_category' && $target->category) {
            $q->where('category', $target->category);
        }
        $candidates = $q->inRandomOrder()->take($n)->get();

        if ($candidates->count() < $n) {
            $candidates = $candidates->concat(
                Word::with('audioTrack')
                    ->where('unit_id', $unitId)
                    ->where('id', '!=', $target->id)
                    ->whereNotIn('id', $candidates->pluck('id'))
                    ->inRandomOrder()
                    ->take($n - $candidates->count())
                    ->get()
            );
        }

        return $candidates;
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
     */
    private function assetUrl(?string $path): ?string
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
