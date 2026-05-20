import React, { useEffect, useMemo, useState } from "react";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * MemoryFlipMode — classic memory match with 8 cards (4 word + 4 image
 * pairs). Cards are face-down; flipping two reveals them, a match keeps
 * them face-up, a miss flips both back after a short pause. After every
 * pair is matched, onComplete fires.
 *
 * Each card uses CSS 3D flip (rotateY) so the front/back swap is
 * smooth without any extra dependencies.
 */
const TARGET_PAIRS = 4;

const MemoryFlipMode = ({ lesson, deck = [], onComplete }) => {
    // Pull up to TARGET_PAIRS unique words from the deck (dedupe by text).
    const pairs = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const r of deck || []) {
            const p = r?.prompt;
            if (!p?.text || seen.has(p.text)) continue;
            seen.add(p.text);
            out.push({
                id: `pair-${out.length}`,
                wordId: r.wordId || null,
                word: p.text,
                imagePath: p.imagePath,
                audioClip: p.audioClip,
            });
            if (out.length >= TARGET_PAIRS) break;
        }
        return out;
    }, [deck]);

    // Build 2N cards (one image card + one word card per pair) and shuffle.
    const initialCards = useMemo(() => {
        const cards = [];
        pairs.forEach((p) => {
            cards.push({ id: `${p.id}-img`, pairId: p.id, type: "image", value: p });
            cards.push({ id: `${p.id}-word`, pairId: p.id, type: "word", value: p });
        });
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards;
    }, [pairs]);

    const [revealed, setRevealed] = useState([]); // currently flipped (max 2)
    const [matched, setMatched] = useState([]);   // pairIds successfully matched
    const [attempts, setAttempts] = useState([]); // [{ pairId, correct, wordId }]
    const [busy, setBusy] = useState(false);

    const isFinished = pairs.length > 0 && matched.length >= pairs.length;

    useEffect(() => {
        if (isFinished) {
            const t = setTimeout(() => {
                onComplete({
                    correct: attempts.filter((a) => a.correct).length,
                    total: pairs.length,
                    rounds: attempts.map((a) => ({
                        roundId: a.pairId,
                        correct: a.correct,
                        wordId: a.wordId || null,
                    })),
                });
            }, 600);
            return () => clearTimeout(t);
        }
    }, [isFinished, attempts, pairs.length, onComplete]);

    const flip = (card) => {
        if (busy) return;
        if (matched.includes(card.pairId)) return;
        if (revealed.find((c) => c.id === card.id)) return;
        playClick();

        const next = [...revealed, card];
        setRevealed(next);

        if (next.length === 2) {
            setBusy(true);
            const [a, b] = next;
            if (a.pairId === b.pairId) {
                playSuccess();
                playAudio(a.value.audioClip);
                setMatched((m) => [...m, a.pairId]);
                setAttempts((arr) => [
                    ...arr,
                    { pairId: a.pairId, correct: true, wordId: a.value.wordId },
                ]);
                setTimeout(() => {
                    setRevealed([]);
                    setBusy(false);
                }, 600);
            } else {
                playFail();
                setAttempts((arr) => [
                    ...arr,
                    { pairId: a.pairId, correct: false, wordId: a.value.wordId },
                ]);
                setTimeout(() => {
                    setRevealed([]);
                    setBusy(false);
                }, 1100);
            }
        } else if (next.length === 1) {
            // Single flip — preview the word/image audio for context.
            playAudio(card.value.audioClip);
            playPop();
        }
    };

    if (!pairs.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">
                    Not enough words for memory yet.
                </p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full"
                >
                    Skip
                </button>
            </div>
        );
    }

    const label = lesson?.config?.prompt || "Find the matching pairs!";

    return (
        <div className="w-full flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-md border border-white">
                <p className="text-[11px] font-black text-purple-500 uppercase tracking-widest">
                    {label}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-5 w-full max-w-4xl">
                {initialCards.map((c) => {
                    const isMatched = matched.includes(c.pairId);
                    const isFlipped =
                        isMatched || !!revealed.find((r) => r.id === c.id);
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => flip(c)}
                            disabled={isMatched || busy}
                            className="mf-card aspect-[5/4] perspective"
                            aria-label={isFlipped ? c.value.word : "Card face down"}
                        >
                            <div className={`mf-inner ${isFlipped ? "is-flipped" : ""}`}>
                                {/* Back */}
                                <div className="mf-face mf-back bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
                                    <span className="text-3xl">⭐</span>
                                </div>
                                {/* Front */}
                                <div
                                    className={`mf-face mf-front ${
                                        isMatched
                                            ? "bg-emerald-50 border-emerald-300"
                                            : "bg-white border-white"
                                    }`}
                                >
                                    {c.type === "image" ? (
                                        c.value.imagePath ? (
                                            <img
                                                src={c.value.imagePath}
                                                alt={c.value.word}
                                                // Use percentage-based max-height so the image
                                                // scales with the card on every breakpoint
                                                // instead of clipping inside a fixed 128px box
                                                // when the phone rotates or the parent grid
                                                // collapses to a smaller column count.
                                                className="max-h-[70%] max-w-full object-contain drop-shadow-md"
                                            />
                                        ) : (
                                            <span className="text-3xl text-gray-300">?</span>
                                        )
                                    ) : (
                                        <span className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-[#1E293B]">
                                            {c.value.word}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {matched.length} / {pairs.length} pairs matched
            </p>

            <style>{`
                .perspective { perspective: 1000px; }
                .mf-card { background: transparent; border: none; padding: 0; }
                .mf-inner {
                    position: relative; width: 100%; height: 100%;
                    transform-style: preserve-3d;
                    transition: transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
                    border-radius: 1.5rem;
                }
                .mf-inner.is-flipped { transform: rotateY(180deg); }
                .mf-face {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    border-radius: 1.5rem; border: 4px solid;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.08);
                    padding: 0.75rem;
                }
                .mf-back { border-color: #7C3AED; }
                .mf-front { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default MemoryFlipMode;
