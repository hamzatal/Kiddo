import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import OptionCard from "@/learning/components/ui/OptionCard";
import { playClick, playSuccess, playFail, playPop, playStarCollect } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * PixelRevealMode — guess the picture as it slowly uncovers.
 *
 * Round flow:
 *   1. A 4×4 grid of opaque "pixel tiles" sits over the target
 *      picture. The picture starts fully covered.
 *   2. Every 1.0s, ONE random tile vanishes — revealing a slice
 *      of the image.
 *   3. Below the picture: 4 word options (1 target + 3 decoys
 *      pulled from the deck).
 *   4. The kid taps a word as soon as they think they know.
 *      Faster guesses earn more bonus stars on the round result.
 *      Wrong guesses don't end the round; they just get marked.
 *   5. When the kid taps the correct word OR all tiles uncover,
 *      the round resolves and the next picture loads.
 *
 * Why this works for first-graders
 * ────────────────────────────────
 *   • Combines visual recognition with a satisfying reveal —
 *     kids love watching the puzzle unwrap.
 *   • Self-paced: the timer only adds bonus stars, never punishes
 *     a slow learner. Round ends with a positive when fully
 *     revealed.
 *   • Reuses the existing OptionCard so the visual language
 *     matches every other game.
 *
 * Data
 * ────
 *   Uses the standard lesson deck shape: each entry needs
 *   `wordId`, `prompt.text`, `prompt.imagePath`, `prompt.audioClip`.
 *   Decoys come from the same deck so they're always vocab the
 *   kid has been taught.
 */

const ROUNDS_PER_GAME = 6;
const GRID = 4; // 4×4 = 16 tiles per round
const REVEAL_INTERVAL_MS = 950; // gap between auto-uncovers

/** Pure helper — Fisher-Yates shuffle. */
const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

/** Pure helper — pick `count` decoy entries that aren't the target. */
const pickDecoys = (deck, target, count) => {
    const pool = (deck || []).filter(
        (r) =>
            r?.prompt?.text &&
            r.prompt.text !== target?.prompt?.text,
    );
    return shuffle(pool).slice(0, count);
};

const buildRounds = (deck) => {
    const seen = new Set();
    const targets = [];
    for (const r of deck || []) {
        const t = r?.prompt?.text;
        if (!t || seen.has(t)) continue;
        seen.add(t);
        if (!r.prompt?.imagePath) continue; // image is mandatory
        targets.push(r);
        if (targets.length >= ROUNDS_PER_GAME) break;
    }

    return targets.map((target, i) => {
        const decoys = pickDecoys(deck, target, 3);
        const allOpts = [target, ...decoys].filter(Boolean);
        // We need at least 2 options for the round to make sense.
        if (allOpts.length < 2) return null;
        const options = shuffle(
            allOpts.map((r, idx) => ({
                id: `pr-${i}-${idx}`,
                wordId: r.wordId || null,
                word: r.prompt.text,
                imagePath: r.prompt.imagePath,
                audioClip: r.prompt.audioClip,
                isCorrect: r.prompt.text === target.prompt.text,
            })),
        );

        // Pre-shuffle the tile reveal order so the same round shows
        // a predictable sequence on every render (no flicker on
        // re-render).
        const tileOrder = shuffle(
            Array.from({ length: GRID * GRID }, (_, k) => k),
        );

        return {
            roundId: `pr-${i}`,
            wordId: target.wordId || null,
            word: target.prompt.text,
            imagePath: target.prompt.imagePath,
            audioClip: target.prompt.audioClip,
            options,
            tileOrder,
        };
    }).filter(Boolean);
};

const PixelRevealMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => buildRounds(deck), [deck]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [revealedTiles, setRevealedTiles] = useState([]);
    const [pickedId, setPickedId] = useState(null);
    const [wrongIds, setWrongIds] = useState([]);
    const audioRef = useRef(false);

    const round = rounds[roundIdx];

    // Reset and start the auto-reveal timer when a new round loads.
    useEffect(() => {
        if (!round) return;
        setRevealedTiles([]);
        setPickedId(null);
        setWrongIds([]);
        audioRef.current = false;

        // Auto-uncover one tile per interval. We push tile ids into
        // `revealedTiles` in the round's pre-shuffled order until
        // they're all gone OR the kid picks the correct word.
        const total = round.tileOrder.length;
        let i = 0;
        const id = setInterval(() => {
            i += 1;
            setRevealedTiles((prev) => {
                if (prev.length >= total) return prev;
                const nextTile = round.tileOrder[prev.length];
                playPop();
                return [...prev, nextTile];
            });
            if (i >= total) clearInterval(id);
        }, REVEAL_INTERVAL_MS);

        return () => clearInterval(id);
    }, [round?.roundId]);

    // When all rounds are exhausted, hand control back to LessonScreen.
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
                <p className="text-gray-500 font-bold">No pictures available.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-2xl font-bold"
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
            // Bonus star sound for early guesses (≥ half the tiles
            // still hidden when picked).
            const hiddenLeft = round.tileOrder.length - revealedTiles.length;
            if (hiddenLeft >= round.tileOrder.length / 2) {
                setTimeout(() => playStarCollect(), 250);
            }
            // Speak the word so the kid hears the answer they got.
            setTimeout(
                () => speakWord({ wordId: round.wordId, label: round.word, audioClip: round.audioClip }),
                300,
            );
            setResults((prev) => [
                ...prev,
                {
                    roundId: round.roundId,
                    correct: true,
                    wordId: round.wordId,
                    word: round.word,
                    style: "pixel-reveal",
                    timeMs: 0,
                    revealedTilesAtPick: revealedTiles.length,
                },
            ]);
            setTimeout(() => setRoundIdx((i) => i + 1), 1100);
        } else {
            playFail();
            setWrongIds((prev) => [...prev, opt.id]);
        }
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);
    const tileCount = round.tileOrder.length;
    const revealPct = Math.round((revealedTiles.length / tileCount) * 100);
    const tilesHiddenSet = new Set(revealedTiles);

    return (
        <div className="w-full max-w-2xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest text-center">🧩 Pixel Reveal · Guess the picture</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-purple-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Reveal arena — picture sits behind a 4×4 grid of opaque
                tiles. Tiles disappear one by one. */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-purple-100 to-fuchsia-100">
                <SmartImage
                    src={round.imagePath}
                    label={round.word}
                    className="absolute inset-0 w-full h-full"
                    imgClassName="w-full h-full object-contain p-3"
                />

                {/* Pixel grid overlay */}
                <div
                    className="absolute inset-0 grid pointer-events-none"
                    style={{
                        gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${GRID}, minmax(0, 1fr))`,
                    }}
                    aria-hidden="true"
                >
                    {Array.from({ length: tileCount }).map((_, idx) => {
                        const gone = tilesHiddenSet.has(idx);
                        return (
                            <div
                                key={idx}
                                className={`pr-tile ${gone ? "pr-tile--gone" : ""}`}
                            />
                        );
                    })}
                </div>

                {/* Reveal % chip */}
                <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-purple-700 shadow">
                    <span>👁</span>
                    <span>{revealPct}%</span>
                </div>
            </div>

            {/* Word options — 2×2 grid of stickers */}
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
                            imagePath={null /* hide picture — kid recognises from THE prompt picture */}
                            label={opt.word}
                            audioClip={opt.audioClip}
                            wordId={opt.wordId}
                            state={state}
                            onClick={() => handlePick(opt)}
                            showAudio={false}
                        />
                    );
                })}
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {pickedId
                    ? "Nice spotting! Loading the next one…"
                    : revealedTiles.length === tileCount
                    ? "All revealed — pick the word!"
                    : "Watch the pixels disappear and tap the right word ASAP for bonus stars!"}
            </p>

            <style>{`
                .pr-tile {
                    background: linear-gradient(135deg, #C084FC 0%, #7C3AED 100%);
                    border: 1px solid rgba(255,255,255,0.35);
                    transition: opacity 350ms ease-out, transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .pr-tile--gone {
                    opacity: 0;
                    transform: scale(0.4) rotate(8deg);
                }
                @media (prefers-reduced-motion: reduce) {
                    .pr-tile { transition: opacity 80ms linear; }
                    .pr-tile--gone { transform: none; }
                }
            `}</style>
        </div>
    );
};

export default PixelRevealMode;
