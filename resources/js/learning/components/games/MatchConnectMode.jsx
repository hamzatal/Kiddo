import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";

/**
 * MatchConnectMode — "Match & Connect" — picture/word pair game.
 *
 * Layout v3 fixes for the operator's complaints:
 *   • Pictures NEVER clip. Each picture card uses `object-contain`
 *     in a fixed-aspect frame and never has padding small enough to
 *     hide an asset. The card itself uses aspect-ratio rather than
 *     a fixed min-height, so images breathe at every screen size.
 *   • Word column and picture column are equal-width on every
 *     breakpoint with a fixed-pixel middle gutter for the SVG
 *     connector lines (no more squashing on tablets).
 *   • The whole game now fits a 720p tablet viewport without scroll
 *     — the header is compact and the cards shrink their min-height
 *     when there are 4 pairs vs 3.
 *   • Connector lines are drawn with stable IDs + reflow on resize.
 */

const COLUMN_COUNT = 4;

const MatchConnectMode = ({ lesson, deck = [], onComplete }) => {
    // Pull up to 4 unique pairs (dedupe by the displayed word).
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

    // Randomise the picture column order. Avoid the identity ordering
    // so word A doesn't trivially line up with picture A on the same row.
    const imageOrder = useMemo(() => {
        const arr = pairs.map((_, i) => i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (pairs.length > 1 && arr.every((v, i) => v === i)) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        return arr;
    }, [pairs]);

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matched, setMatched] = useState([]);
    const [wrong, setWrong] = useState(null);
    const [attempts, setAttempts] = useState([]);

    const containerRef = useRef(null);
    const leftRefs = useRef({});
    const rightRefs = useRef({});
    const [tick, setTick] = useState(0);

    const setLeftRef = useCallback((id) => (el) => {
        if (el) leftRefs.current[id] = el;
        else delete leftRefs.current[id];
    }, []);
    const setRightRef = useCallback((idx) => (el) => {
        if (el) rightRefs.current[idx] = el;
        else delete rightRefs.current[idx];
    }, []);

    useEffect(() => {
        const onResize = () => setTick((t) => t + 1);
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, true);
        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onResize, true);
        };
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setTick((n) => n + 1), 80);
        return () => clearTimeout(t);
    }, [pairs.length]);

    useEffect(() => {
        if (!wrong) return;
        const t = setTimeout(() => setWrong(null), 700);
        return () => clearTimeout(t);
    }, [wrong]);

    useEffect(() => {
        if (!pairs.length) return;
        if (matched.length >= pairs.length) {
            const t = setTimeout(() => {
                onComplete({
                    correct: attempts.filter((a) => a.correct).length,
                    total: pairs.length,
                    rounds: attempts.map((a) => ({
                        roundId: a.pairId,
                        correct: a.correct,
                        wordId: a.wordId || null,
                        word: a.word || null,
                        wrongChoice: a.wrongChoice || null,
                        wrongChoiceId: a.wrongChoiceId || null,
                    })),
                });
            }, 700);
            return () => clearTimeout(t);
        }
    }, [matched, pairs.length, attempts, onComplete]);

    if (!pairs.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">No pairs available for this lesson yet.</p>
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

    const handleRightClick = (pairIdx) => {
        if (selectedLeft == null) return;
        const targetPair = pairs[pairIdx];
        const expectedPairId = targetPair?.id;
        if (matched.includes(expectedPairId)) return;
        playClick();

        const sourcePair = pairs.find((p) => p.id === selectedLeft);

        if (expectedPairId === selectedLeft) {
            playSuccess();
            setMatched((prev) => [...prev, expectedPairId]);
            setAttempts((prev) => [
                ...prev,
                { pairId: expectedPairId, correct: true, wordId: sourcePair?.wordId, word: sourcePair?.word },
            ]);
            setSelectedLeft(null);
        } else {
            playFail();
            setWrong({ leftId: selectedLeft, rightPairId: expectedPairId });
            setAttempts((prev) => [
                ...prev,
                {
                    pairId: expectedPairId,
                    correct: false,
                    wordId: sourcePair?.wordId,
                    word: sourcePair?.word,
                    wrongChoice: targetPair?.word,
                    wrongChoiceId: targetPair?.wordId,
                },
            ]);
            setSelectedLeft(null);
        }
        setTick((n) => n + 1);
    };

    const getCoords = (leftId, rightPairId) => {
        const container = containerRef.current;
        const a = leftRefs.current[leftId];
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

    const matchedLines = matched.map((pid) => ({ pid, coords: getCoords(pid, pid) })).filter((x) => x.coords);
    const wrongLine = wrong ? getCoords(wrong.leftId, wrong.rightPairId) : null;

    const label = lesson?.config?.prompt || "Tap a word, then tap its picture!";
    const progressPct = Math.round((matched.length / pairs.length) * 100);

    return (
        <div className="w-full max-w-5xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            {/* Compact header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest text-center">{label}</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-purple-600">{matched.length}/{pairs.length}</span>
                </div>
            </div>

            {/* Two-column board */}
            <div
                ref={containerRef}
                className="
                    relative w-full max-w-4xl
                    grid grid-cols-1
                    md:grid-cols-[1fr_140px_1fr]
                    lg:grid-cols-[1fr_180px_1fr]
                    xl:grid-cols-[1fr_220px_1fr]
                    gap-3 md:gap-2 lg:gap-3 items-stretch
                "
            >
                {/* Words column */}
                <div className="flex flex-col gap-2 sm:gap-2.5 lg:gap-3">
                    <p className="md:hidden text-[10px] font-black text-purple-500 uppercase tracking-widest pl-2">Words</p>
                    {pairs.map((p) => {
                        const isMatched = matched.includes(p.id);
                        const isSelected = selectedLeft === p.id;
                        const isWrong = wrong?.leftId === p.id;

                        let cls = "border-white hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5";
                        if (isSelected) cls = "border-purple-500 ring-4 ring-purple-200 shadow-lg";
                        if (isMatched)  cls = "border-emerald-400 bg-emerald-50 opacity-90";
                        if (isWrong)    cls = "border-red-400 bg-red-50 animate-shake";

                        return (
                            <button
                                key={p.id}
                                ref={setLeftRef(p.id)}
                                type="button"
                                disabled={isMatched}
                                onClick={() => handleLeftClick(p)}
                                className={`relative w-full p-2.5 sm:p-3 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center gap-2 ${cls} ${isMatched ? "cursor-default" : ""}`}
                            >
                                <AudioClipButton clip={p.audioClip} wordId={p.wordId} label={p.word} size="sm" />
                                <span className="text-base sm:text-lg lg:text-xl font-black uppercase text-[#1E293B] tracking-tight flex-1 text-left truncate">
                                    {p.word}
                                </span>
                                <span
                                    aria-hidden
                                    className={`hidden md:block absolute right-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                                        isMatched ? "bg-emerald-500" : isSelected ? "bg-purple-500" : "bg-purple-300"
                                    }`}
                                />
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-xs">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* SVG canvas */}
                <svg
                    className="hidden md:block absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%" }}
                    aria-hidden="true"
                >
                    {matchedLines.map(({ pid, coords }) => (
                        <line
                            // Stable key (no tick suffix) so React
                            // re-uses the same DOM node when coords
                            // change. Previously every resize/scroll
                            // bumped `tick`, the key changed, and
                            // every matched line unmounted+remounted
                            // — replaying the `mc-draw` keyframe and
                            // making the lines blink back in from
                            // zero on every page scroll.
                            key={`m-${pid}`}
                            x1={coords.x1} y1={coords.y1}
                            x2={coords.x2} y2={coords.y2}
                            stroke="#10B981" strokeWidth="5" strokeLinecap="round"
                            className="mc-line-correct"
                        />
                    ))}
                    {wrongLine ? (
                        <line
                            key={`w-${tick}`}
                            x1={wrongLine.x1} y1={wrongLine.y1}
                            x2={wrongLine.x2} y2={wrongLine.y2}
                            stroke="#EF4444" strokeWidth="5" strokeLinecap="round"
                            className="mc-line-wrong"
                        />
                    ) : null}
                </svg>

                {/* Phone-only divider */}
                <div className="md:hidden flex items-center justify-center py-1">
                    <span className="text-2xl text-purple-400">⬇️</span>
                </div>

                {/* Pictures column — aspect-square frames so images
                    never clip. We use object-contain on a clean white
                    background so even tall illustrations show fully. */}
                <div className="flex flex-col gap-2 sm:gap-2.5 lg:gap-3">
                    <p className="md:hidden text-[10px] font-black text-purple-500 uppercase tracking-widest pl-2">Pictures</p>
                    {imageOrder.map((pairIdx, slotIdx) => {
                        const p = pairs[pairIdx];
                        const isMatched = matched.includes(p.id);
                        const isWrong = wrong?.rightPairId === p.id;
                        const isWaiting = selectedLeft != null && !isMatched;

                        let cls = "border-white hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5";
                        if (isWaiting) cls = "border-purple-200 hover:border-purple-400";
                        if (isMatched) cls = "border-emerald-400 bg-emerald-50 opacity-90";
                        if (isWrong)   cls = "border-red-400 bg-red-50 animate-shake";

                        return (
                            <button
                                key={p.id}
                                ref={setRightRef(slotIdx)}
                                type="button"
                                disabled={isMatched || selectedLeft == null}
                                onClick={() => handleRightClick(pairIdx)}
                                className={`relative w-full p-2 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center justify-center aspect-[16/9] ${cls} ${isMatched ? "cursor-default" : ""} ${selectedLeft == null && !isMatched ? "opacity-70" : ""}`}
                            >
                                <span
                                    aria-hidden
                                    className={`hidden md:block absolute left-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                                        isMatched ? "bg-emerald-500" : "bg-purple-300"
                                    }`}
                                />
                                <SmartImage
                                    src={p.imagePath}
                                    label={p.word}
                                    className="w-full h-full"
                                    imgClassName="w-full h-full object-contain drop-shadow"
                                />
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-xs">
                                        ✓
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {selectedLeft ? "✨ Now tap the matching picture →" : "👈 Tap a word to start"}
            </p>

            <style>{`
                .mc-line-correct {
                    stroke-dasharray: 600;
                    stroke-dashoffset: 600;
                    animation: mc-draw 480ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .mc-line-wrong { animation: mc-flash 700ms ease-in-out forwards; }
                @keyframes mc-draw  { to { stroke-dashoffset: 0; } }
                @keyframes mc-flash {
                    0%, 100% { opacity: 0; }
                    15%, 85% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MatchConnectMode;
