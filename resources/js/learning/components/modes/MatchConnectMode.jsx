import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";

/**
 * MatchConnectMode — "Match & Connect" drag/line game.
 *
 * The left column shows 4 word cards; the right column shows the
 * matching pictures (order randomized on mount). The child picks
 * one card on the left, then one on the right. We draw an animated
 * SVG line between them and validate:
 *
 *   - correct pair  : line turns green and stays, both cards get a ✓
 *   - wrong pair    : line flashes red for 600ms then disappears
 *
 * Once all 4 pairs are matched we call onComplete({ correct, total, rounds }).
 *
 *   Props: { lesson, deck, audioTrack, onComplete }
 *
 * The deck is consumed as a flat list of rounds (same shape the
 * backend produces for vocab-game) — we only use the prompt of each
 * round as the "pair" (word + image + audio clip). 4 unique prompts
 * are plenty for a first-grade matching game.
 */

const COLUMN_COUNT = 4;

const MatchConnectMode = ({ lesson, deck = [], onComplete }) => {
    // Derive up to 4 unique pairs from the deck. We dedupe by word so
    // a flukey repeated target doesn't give us two identical pairs.
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
            if (out.length >= COLUMN_COUNT) break;
        }
        return out;
    }, [deck]);

    // Randomize the image column order once, so pairs aren't on the same row.
    const imageOrder = useMemo(() => {
        const arr = pairs.map((_, i) => i);
        // Fisher-Yates shuffle with a tiny guard to avoid the no-op
        // identity permutation (so row-pairs visibly differ).
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (pairs.length > 1 && arr.every((v, i) => v === i)) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        return arr;
    }, [pairs]);

    const [selectedLeft, setSelectedLeft] = useState(null); // pair id
    const [matched, setMatched] = useState([]); // array of pair ids
    const [wrong, setWrong] = useState(null); // { leftId, rightIdx, until }
    const [attempts, setAttempts] = useState([]); // { pairId, correct }

    const containerRef = useRef(null);
    const leftRefs = useRef({}); // pairId -> DOM node
    const rightRefs = useRef({}); // rightIdx -> DOM node
    const [tick, setTick] = useState(0); // triggers recompute on resize

    const setLeftRef = useCallback((id) => (el) => {
        if (el) leftRefs.current[id] = el;
        else delete leftRefs.current[id];
    }, []);

    const setRightRef = useCallback((idx) => (el) => {
        if (el) rightRefs.current[idx] = el;
        else delete rightRefs.current[idx];
    }, []);

    // Recompute line coordinates on resize / scroll (SVG repaints).
    useEffect(() => {
        const onResize = () => setTick((t) => t + 1);
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, true);
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onResize, true);
        };
    }, []);

    // Fire a tick after layout so the first paint has correct coords.
    useEffect(() => {
        const t = setTimeout(() => setTick((n) => n + 1), 50);
        return () => clearTimeout(t);
    }, [pairs.length]);

    // Auto-clear the red flash after 600ms.
    useEffect(() => {
        if (!wrong) return;
        const t = setTimeout(() => setWrong(null), 600);
        return () => clearTimeout(t);
    }, [wrong]);

    // When everything is matched, call onComplete.
    useEffect(() => {
        if (pairs.length === 0) return;
        if (matched.length >= pairs.length) {
            // Small delay so the last line's green animation lands first.
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
            }, 650);
            return () => clearTimeout(t);
        }
    }, [matched, pairs.length, attempts, onComplete]);

    if (!pairs.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">
                    No pairs available for this lesson yet.
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

    const handleLeftClick = (pair) => {
        if (matched.includes(pair.id)) return;
        playClick();
        setSelectedLeft(pair.id);
    };

    const handleRightClick = (rightIdx) => {
        if (selectedLeft == null) return;
        const targetPair = pairs[rightIdx]; // image at position imageOrder[slot] -> pairs[imageOrder[slot]]
        // rightIdx is the pair index *of the image at the current slot*,
        // but the slot layout maps slot -> imageOrder[slot] -> pairs[...].
        const expectedPairId = pairs[rightIdx]?.id;
        if (matched.includes(expectedPairId)) return;
        playClick();

        if (expectedPairId === selectedLeft) {
            // correct match
            playSuccess();
            setMatched((prev) => [...prev, expectedPairId]);
            setAttempts((prev) => [
                ...prev,
                {
                    pairId: expectedPairId,
                    correct: true,
                    wordId: pairs.find((p) => p.id === expectedPairId)?.wordId || null,
                },
            ]);
            setSelectedLeft(null);
        } else {
            // wrong match — flash red then clear
            playFail();
            setWrong({ leftId: selectedLeft, rightPairId: expectedPairId });
            setAttempts((prev) => [
                ...prev,
                {
                    pairId: expectedPairId,
                    correct: false,
                    wordId: pairs.find((p) => p.id === expectedPairId)?.wordId || null,
                },
            ]);
            setSelectedLeft(null);
        }
        // tick so the SVG lines re-render
        setTick((n) => n + 1);
    };

    const getCoords = (leftId, rightPairId) => {
        const container = containerRef.current;
        const a = leftRefs.current[leftId];
        // Find the slot that renders the image for rightPairId
        let slotIdx = -1;
        for (let i = 0; i < imageOrder.length; i++) {
            if (imageOrder[i] === pairs.findIndex((p) => p.id === rightPairId)) {
                slotIdx = i;
                break;
            }
        }
        if (slotIdx < 0) return null;
        const b = rightRefs.current[slotIdx];
        if (!container || !a || !b) return null;

        const cRect = container.getBoundingClientRect();
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();

        return {
            x1: aRect.right - cRect.left,
            y1: aRect.top + aRect.height / 2 - cRect.top,
            x2: bRect.left - cRect.left,
            y2: bRect.top + bRect.height / 2 - cRect.top,
        };
    };

    // Lines for matched pairs (green, permanent)
    const matchedLines = matched
        .map((pid) => ({ pid, coords: getCoords(pid, pid) }))
        .filter((x) => x.coords);

    // Red flash line for a wrong attempt
    const wrongLine = wrong ? getCoords(wrong.leftId, wrong.rightPairId) : null;

    const label = lesson?.config?.prompt || "Match the word to the picture!";

    return (
        <div className="w-full max-w-5xl lg:max-w-6xl flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-md px-6 sm:px-10 py-4 rounded-[2rem] shadow-md border border-white flex flex-col items-center gap-1 w-full max-w-2xl">
                <p className="text-[11px] font-black text-purple-500 uppercase tracking-widest">
                    {label}
                </p>
                <p className="text-xs font-black text-gray-500">
                    {matched.length} / {pairs.length} matched
                </p>
            </div>

            <div
                ref={containerRef}
                className="relative w-full max-w-4xl grid grid-cols-[1fr_80px_1fr] gap-4 lg:gap-6 items-stretch"
            >
                {/* Left column — word cards */}
                <div className="flex flex-col gap-3 lg:gap-4">
                    {pairs.map((p) => {
                        const isMatched = matched.includes(p.id);
                        const isSelected = selectedLeft === p.id;
                        const isWrong = wrong?.leftId === p.id;

                        let stateCls =
                            "border-white hover:border-purple-300 hover:-translate-y-0.5";
                        if (isSelected) stateCls = "border-purple-500 ring-4 ring-purple-200";
                        if (isMatched)
                            stateCls = "border-green-500 bg-green-50 opacity-90";
                        if (isWrong) stateCls = "border-red-400 bg-red-50";

                        return (
                            <button
                                key={p.id}
                                ref={setLeftRef(p.id)}
                                type="button"
                                disabled={isMatched}
                                onClick={() => handleLeftClick(p)}
                                className={`relative p-3 sm:p-4 bg-white/95 rounded-[1.5rem] border-4 shadow-md transition-all duration-200 flex items-center gap-3 ${stateCls} ${
                                    isMatched ? "cursor-default" : ""
                                }`}
                            >
                                <AudioClipButton clip={p.audioClip} size="sm" />
                                <span className="text-lg sm:text-2xl font-black uppercase text-[#1E293B] tracking-tight flex-1 text-left">
                                    {p.word}
                                </span>
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-4 border-white shadow-sm">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Middle — SVG canvas (non-interactive) */}
                <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%" }}
                    aria-hidden="true"
                >
                    {matchedLines.map(({ pid, coords }) => (
                        <line
                            key={`m-${pid}-${tick}`}
                            x1={coords.x1}
                            y1={coords.y1}
                            x2={coords.x2}
                            y2={coords.y2}
                            stroke="#10B981"
                            strokeWidth="5"
                            strokeLinecap="round"
                            className="mc-line-correct"
                        />
                    ))}
                    {wrongLine ? (
                        <line
                            key={`w-${tick}`}
                            x1={wrongLine.x1}
                            y1={wrongLine.y1}
                            x2={wrongLine.x2}
                            y2={wrongLine.y2}
                            stroke="#EF4444"
                            strokeWidth="5"
                            strokeLinecap="round"
                            className="mc-line-wrong"
                        />
                    ) : null}
                </svg>

                {/* Right column — image cards in shuffled order */}
                <div className="flex flex-col gap-3 lg:gap-4">
                    {imageOrder.map((pairIdx, slotIdx) => {
                        const p = pairs[pairIdx];
                        const isMatched = matched.includes(p.id);
                        const isWrong = wrong?.rightPairId === p.id;

                        let stateCls =
                            "border-white hover:border-purple-300 hover:-translate-y-0.5";
                        if (isMatched)
                            stateCls = "border-green-500 bg-green-50 opacity-90";
                        if (isWrong) stateCls = "border-red-400 bg-red-50";

                        return (
                            <button
                                key={p.id}
                                ref={setRightRef(slotIdx)}
                                type="button"
                                disabled={isMatched}
                                onClick={() => handleRightClick(pairIdx)}
                                className={`relative p-3 sm:p-4 bg-white/95 rounded-[1.5rem] border-4 shadow-md transition-all duration-200 flex items-center justify-center aspect-[3/2] ${stateCls} ${
                                    isMatched ? "cursor-default" : ""
                                }`}
                            >
                                {p.imagePath ? (
                                    <img
                                        src={p.imagePath}
                                        alt={p.word}
                                        className="max-w-full max-h-full object-contain drop-shadow-md"
                                        onError={(e) => {
                                            e.currentTarget.outerHTML = `<span class="text-2xl font-black uppercase text-gray-400">${p.word ?? "?"}</span>`;
                                        }}
                                    />
                                ) : (
                                    <span className="text-2xl font-black uppercase text-gray-400">
                                        {p.word}
                                    </span>
                                )}
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-4 border-white shadow-sm">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .mc-line-correct {
                    stroke-dasharray: 400;
                    stroke-dashoffset: 400;
                    animation: mc-draw 420ms ease-out forwards;
                }
                .mc-line-wrong {
                    animation: mc-flash 600ms ease-in-out forwards;
                }
                @keyframes mc-draw {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes mc-flash {
                    0%   { opacity: 0; }
                    20%  { opacity: 1; }
                    80%  { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default MatchConnectMode;
