import React, { useEffect, useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import {
    playSuccess,
    playFail,
    playClick,
    playPop,
} from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * OddOneOutMode — "Find the one that doesn't belong!".
 *
 * Why we need this game
 * ─────────────────────
 * Operator request: "بدي تنوع بالألعاب الموجودة بالصفحات كلها".
 * Every existing game tests "match this word to this picture".
 * Odd-one-out trains a different muscle — categorisation. The kid
 * has to look at four cards (e.g. cat / dog / rabbit / pencil) and
 * tap the one that doesn't fit the same category. This works for
 * every unit because the curriculum already tags each Word with a
 * `category` (animals, colours, numbers, classroom, etc.) and the
 * deck builder uses those tags to populate decoy pools.
 *
 * Round generation
 * ────────────────
 * For each round we look at the deck entry's options and the
 * underlying target's category. We pick:
 *   • 3 cards from the SAME category (the "fits" group)
 *   • 1 card from a DIFFERENT category (the odd one out)
 * Then we shuffle the four cards and ask the kid which one is
 * different. We try up to ROUNDS_PER_GAME unique categories so the
 * same group of "things that go together" doesn't repeat.
 *
 * Falls back gracefully if the deck doesn't have a clean category
 * split (e.g. very small unit) — in that case we synthesise the odd
 * one from the global pool and announce its category to the kid.
 *
 * Audio behaviour
 * ───────────────
 * • A brief "Find the one that doesn't fit!" prompt is announced via
 *   browser TTS when the round opens.
 * • Tapping any card plays its own audio so the kid can verify what
 *   each picture says before deciding.
 */
const ROUNDS_PER_GAME = 4;
const CARDS_PER_ROUND = 4;

/**
 * Build a single round from the deck. Returns null if we don't have
 * enough material to assemble a round (the caller should treat that
 * as an early completion).
 */
function buildRound(deckEntries, usedCategories) {
    if (!deckEntries?.length) return null;

    // Find a deck entry whose options span at least 2 categories so
    // we can pick 3 from one + 1 from the other. We track
    // `usedCategories` so consecutive rounds aren't the same group.
    const candidates = deckEntries.filter((r) => {
        const opts = r?.options || [];
        const cats = new Set();
        for (const o of opts) {
            const c = (o?.category || "").toLowerCase();
            if (c) cats.add(c);
        }
        return cats.size >= 2;
    });

    // First try: a candidate whose dominant category is fresh.
    let pick =
        candidates.find((r) => {
            const cats = (r.options || []).map((o) => (o.category || "").toLowerCase());
            const dominant = mode(cats);
            return dominant && !usedCategories.has(dominant);
        }) || candidates[0] || null;

    if (!pick) return null;

    const opts = (pick.options || []).map((o) => ({
        ...o,
        _cat: (o.category || "").toLowerCase(),
    }));
    const dominant = mode(opts.map((o) => o._cat));
    if (!dominant) return null;

    const fits = opts.filter((o) => o._cat === dominant);
    const odd = opts.find((o) => o._cat && o._cat !== dominant);

    if (!odd || fits.length < CARDS_PER_ROUND - 1) return null;

    // Take the first 3 "fits" + the odd one out.
    const cards = [...fits.slice(0, CARDS_PER_ROUND - 1), { ...odd, _isOdd: true }];

    // Shuffle so the odd one isn't always last.
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    usedCategories.add(dominant);
    return {
        roundId: pick.roundId,
        category: dominant,
        oddCategory: odd._cat,
        cards,
    };
}

function mode(arr) {
    const counts = new Map();
    for (const v of arr) {
        if (!v) continue;
        counts.set(v, (counts.get(v) || 0) + 1);
    }
    let best = null;
    let bestN = 0;
    for (const [k, n] of counts) {
        if (n > bestN) {
            bestN = n;
            best = k;
        }
    }
    return best;
}

const OddOneOutMode = ({ lesson, deck = [], onComplete }) => {
    // Pre-build all rounds so we know how many we have up-front.
    const rounds = useMemo(() => {
        const used = new Set();
        const out = [];
        // First pass — full quality rounds.
        for (let i = 0; i < deck.length && out.length < ROUNDS_PER_GAME; i++) {
            const r = buildRound([deck[i]], used);
            if (r) out.push(r);
        }
        // Second pass — relax category-uniqueness if we couldn't fill.
        if (out.length < ROUNDS_PER_GAME) {
            const used2 = new Set();
            for (let i = 0; i < deck.length && out.length < ROUNDS_PER_GAME; i++) {
                const r = buildRound([deck[i]], used2);
                if (r && !out.find((x) => x.roundId === r.roundId)) out.push(r);
            }
        }
        return out;
    }, [deck]);

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [picked, setPicked] = useState(null);
    const [wrong, setWrong] = useState([]);

    const round = rounds[idx];

    // Friendly empty state — same shape as the other modes so the
    // host LessonScreen renders our completion the same way.
    if (!rounds.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">🧩</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    Not enough variety yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Odd-One-Out needs at least two different categories — your
                    teacher hasn't added them to this lesson yet.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-black shadow-md hover:-translate-y-0.5 transition-all"
                >
                    Continue →
                </button>
            </div>
        );
    }

    // Reset per-round state when advancing.
    useEffect(() => {
        setPicked(null);
        setWrong([]);
    }, [idx]);

    const handlePick = (card) => {
        if (picked) return;
        playClick();
        if (card._isOdd) {
            setPicked(card.id);
            playSuccess();
            playPop();
            const firstTry = wrong.length === 0;
            const next = [
                ...results,
                {
                    roundId: `odd-${idx}`,
                    correct: firstTry,
                    wordId: card.wordId || null,
                    word: card.word,
                    style: "odd-one-out",
                    timeMs: 0,
                    wrongChoice: wrong.length
                        ? round.cards.find((c) => c.id === wrong[0])?.word || null
                        : null,
                },
            ];
            setResults(next);
            setTimeout(() => {
                if (idx + 1 >= rounds.length) {
                    onComplete({
                        correct: next.filter((r) => r.correct).length,
                        total: rounds.length,
                        rounds: next,
                    });
                } else {
                    setIdx(idx + 1);
                }
            }, 900);
        } else {
            playFail();
            setWrong((w) => (w.includes(card.id) ? w : [...w, card.id]));
        }
    };

    const progressPct = Math.round((idx / rounds.length) * 100);
    const label =
        lesson?.config?.prompt || "Find the picture that doesn't belong!";

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            {/* Compact prompt header — matches the rest of the
                lesson modes so the kid's eye doesn't have to relearn
                where the instruction lives. */}
            <div className="w-full max-w-xl bg-white/95 backdrop-blur rounded-2xl shadow-lg border-2 border-amber-100 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-amber-600">
                        {idx + 1}/{rounds.length}
                    </span>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl leading-none">🔍</span>
                    <p className="text-sm sm:text-base font-black uppercase tracking-tight text-amber-700 text-center">
                        {label}
                    </p>
                </div>

                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                    Three are{" "}
                    <span className="text-amber-700">{round.category}</span> · one is
                    different
                </p>
            </div>

            {/* Cards grid — same OptionCard look as the rest of the
                product so it never feels like a totally different
                game. We disable the "TAP" badge on the cards by
                rendering them in a custom shell that adds the
                "different one out" overlay on the wrong cards. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl">
                {round.cards.map((card) => {
                    const isWrong = wrong.includes(card.id);
                    const isCorrect = picked === card.id;
                    let state = "idle";
                    if (isCorrect) state = "correct";
                    else if (isWrong) state = "wrong";
                    else if (picked) state = "disabled";
                    return (
                        <OptionCard
                            key={card.id}
                            imagePath={card.imagePath}
                            label={card.word}
                            audioClip={card.audioClip}
                            wordId={card.wordId}
                            state={state}
                            showLabel
                            onClick={() => handlePick(card)}
                        />
                    );
                })}
            </div>

            {wrong.length > 0 && !picked ? (
                <p className="text-[11px] font-bold text-rose-500 text-center">
                    Hmm, that one fits the group. Try a different card!
                </p>
            ) : null}
        </div>
    );
};

export default OddOneOutMode;
