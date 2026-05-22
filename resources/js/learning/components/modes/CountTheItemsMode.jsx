import React, { useEffect, useMemo, useRef, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import { playClick, playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * CountTheItemsMode — number-words game.
 *
 * Round flow:
 *   1. Pick an item from the deck (any vocab word with an
 *      imagePath — apple, dog, star, whatever).
 *   2. Pick a random count between 1 and 9 (kept low so even
 *      pre-readers can count without losing track).
 *   3. Show that many copies of the item in a friendly grid,
 *      with a gentle pop animation as they appear (so the kid
 *      can SEE each one arriving).
 *   4. Below: 4 number tiles. Three are decoys close to the
 *      target (n-1, n+1, n+2 etc., clamped to 1..10).
 *   5. Kid taps the right number tile → big celebration, audio
 *      reads the count out loud (e.g. "Three apples!").
 *
 * Why this works for first-graders
 * ────────────────────────────────
 *   • Numbers up to 10 are a Year 1 vocabulary essential. Kiddo
 *     already teaches the words ("one", "two", "three", …) but
 *     never had a game that PRACTISES counting.
 *   • Visual + linguistic — kid hears the count spoken when
 *     they're correct, locking word ↔ quantity together.
 *   • Tile decoys are close to the target so the kid actually
 *     has to count, not just compare big vs small.
 *
 * Data
 * ────
 *   Reuses the standard lesson deck. Doesn't need any special
 *   field — only `prompt.imagePath`. The "answer" word is the
 *   number's English spelling (one..ten) so audio TTS works
 *   without us seeding new audio clips.
 */

const ROUNDS_PER_GAME = 6;
const NUMBER_WORDS = [
    null, "one", "two", "three", "four", "five",
    "six", "seven", "eight", "nine", "ten",
];

/** Pure helper — Fisher-Yates shuffle. */
const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

/**
 * Pick three decoy numbers different from the target. Each decoy
 * is biased toward "close to the target" so the kid actually has
 * to count, not just compare big vs small. Clamps to 1..10.
 */
const pickNumberDecoys = (target, count) => {
    const candidates = new Set();
    // Add nearby neighbours first.
    [target - 1, target + 1, target + 2, target - 2, target + 3].forEach((n) => {
        if (n >= 1 && n <= 10 && n !== target) candidates.add(n);
    });
    // Top up with random numbers if we're short.
    let safety = 50;
    while (candidates.size < count && safety-- > 0) {
        const r = 1 + Math.floor(Math.random() * 10);
        if (r !== target) candidates.add(r);
    }
    return shuffle(Array.from(candidates)).slice(0, count);
};

const buildRounds = (deck) => {
    const seen = new Set();
    const items = [];
    for (const r of deck || []) {
        const t = r?.prompt?.text;
        if (!t || seen.has(t)) continue;
        seen.add(t);
        if (!r.prompt?.imagePath) continue;
        items.push(r);
        if (items.length >= ROUNDS_PER_GAME) break;
    }

    return items.map((it, i) => {
        const target = 1 + Math.floor(Math.random() * 9); // 1..9
        const decoys = pickNumberDecoys(target, 3);
        const opts = shuffle(
            [target, ...decoys].map((n, idx) => ({
                id: `cnt-${i}-${n}`,
                wordId: null,
                word: NUMBER_WORDS[n] || String(n),
                count: n,
                isCorrect: n === target,
            })),
        );
        return {
            roundId: `cnt-${i}`,
            itemWordId: it.wordId || null,
            itemWord: it.prompt.text,
            itemImagePath: it.prompt.imagePath,
            count: target,
            options: opts,
        };
    });
};

const CountTheItemsMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => buildRounds(deck), [deck]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [pickedId, setPickedId] = useState(null);
    const [wrongIds, setWrongIds] = useState([]);
    const popOnceRef = useRef(false);

    const round = rounds[roundIdx];

    // Reset per round + tiny "pop" sound as the items render.
    useEffect(() => {
        if (!round) return;
        setPickedId(null);
        setWrongIds([]);
        popOnceRef.current = false;

        // Stagger a single pop sound to mark "items have arrived"
        // (avoid playing it `count` times — that would feel noisy
        // for a count of nine).
        const t = setTimeout(() => {
            if (popOnceRef.current) return;
            popOnceRef.current = true;
            playPop();
        }, 250);
        return () => clearTimeout(t);
    }, [round?.roundId]);

    // Hand control back when all rounds done.
    useEffect(() => {
        if (!rounds.length) return;
        if (results.length >= rounds.length) {
            const t = setTimeout(() => {
                onComplete({
                    correct: results.filter((r) => r.correct).length,
                    total: rounds.length,
                    rounds: results,
                });
            }, 600);
            return () => clearTimeout(t);
        }
    }, [results, rounds.length, onComplete]);

    if (!rounds.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No items to count yet.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold"
                >
                    Skip
                </button>
            </div>
        );
    }
    if (!round) return null;

    const handlePick = (opt) => {
        if (pickedId) return;
        playClick();
        if (opt.isCorrect) {
            setPickedId(opt.id);
            playSuccess();
            // Speak the count out loud — locks number-word to the
            // visual quantity in the kid's head.
            setTimeout(
                () =>
                    speakWord({
                        wordId: null,
                        label: `${opt.word} ${round.itemWord}${round.count === 1 ? "" : "s"}`,
                    }),
                280,
            );
            setResults((prev) => [
                ...prev,
                {
                    roundId: round.roundId,
                    correct: true,
                    wordId: round.itemWordId,
                    word: round.itemWord,
                    style: "count-the-items",
                    pickedNumber: opt.count,
                    targetNumber: round.count,
                },
            ]);
            setTimeout(() => setRoundIdx((i) => i + 1), 1300);
        } else {
            playFail();
            setWrongIds((prev) => [...prev, opt.id]);
            setResults((prev) => {
                const already = prev.find((r) => r.roundId === round.roundId);
                if (already) return prev;
                return [
                    ...prev,
                    {
                        roundId: round.roundId,
                        correct: false,
                        wordId: round.itemWordId,
                        word: round.itemWord,
                        wrongChoice: opt.word,
                        targetNumber: round.count,
                        pickedNumber: opt.count,
                        style: "count-the-items",
                    },
                ];
            });
            // Wrong picks DON'T end the round — kid keeps trying.
            // Once they get the right one, the success branch
            // appends a "correct" record AFTER the failed one. We
            // de-dupe in the celebration screen by roundId, taking
            // the LAST entry.
        }
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);

    return (
        <div className="w-full max-w-2xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest text-center">🔢 Count the items</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-orange-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Counting board */}
            <div className="w-full max-w-md rounded-3xl border-4 border-white bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 shadow-md">
                <p className="text-center text-xs sm:text-sm font-black uppercase tracking-wider text-amber-700 mb-3">
                    How many <span className="text-orange-700">{round.itemWord}</span>{round.count === 1 ? "" : "s"}?
                </p>
                <div className="grid grid-cols-5 gap-2 justify-items-center min-h-[6.5rem] sm:min-h-[7.5rem]">
                    {Array.from({ length: round.count }).map((_, i) => (
                        <span
                            key={`${round.roundId}-${i}`}
                            className="cti-item"
                            style={{ animationDelay: `${i * 110}ms` }}
                            aria-hidden="true"
                        >
                            <img
                                src={round.itemImagePath}
                                alt=""
                                loading="lazy"
                                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow"
                                onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
                            />
                        </span>
                    ))}
                </div>
            </div>

            {/* Number tiles — 4 options laid out as text-only OptionCards. */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-md">
                {round.options.map((opt) => {
                    let state = "idle";
                    if (pickedId) {
                        if (opt.id === pickedId) state = "correct";
                        else if (opt.isCorrect) state = "correct";
                        else state = "disabled";
                    } else if (wrongIds.includes(opt.id)) {
                        state = "wrong";
                    }
                    return (
                        <OptionCard
                            key={opt.id}
                            imagePath={null}
                            label={opt.word}
                            wordId={null}
                            audioClip={null}
                            state={state}
                            onClick={() => handlePick(opt)}
                            showAudio={false}
                        />
                    );
                })}
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {pickedId
                    ? "Great counting!"
                    : "Count them and tap the right number."}
            </p>

            <style>{`
                /* Each item pops in with a gentle scale-up so the
                   kid sees them arriving one by one — way easier to
                   count than if they all appeared instantly. */
                .cti-item {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transform: scale(0.5);
                    animation: cti-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    will-change: opacity, transform;
                }
                @keyframes cti-pop {
                    0%   { opacity: 0; transform: scale(0.5) rotate(-6deg); }
                    60%  { opacity: 1; transform: scale(1.12) rotate(2deg); }
                    100% { opacity: 1; transform: scale(1)    rotate(0deg); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .cti-item { animation: none; opacity: 1; transform: none; }
                }
            `}</style>
        </div>
    );
};

export default CountTheItemsMode;
