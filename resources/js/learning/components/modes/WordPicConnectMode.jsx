import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";

/**
 * WordPicConnectMode — pair each word with its picture.
 *
 * v5 (May 2026 — operator wave 5)
 * ───────────────────────────────
 * Operator complaint: "الصور كثير كبيرة كثير وفي فراغ اول الصفحة
 * يعني صغير الصور اكثر مع تناسق الكلمات مع مربعات الصور زي الحالي
 * بس لو تحط شكل للخط يكون احلى من هيك وتبعد مسافة بين الكلمات
 * والصور".
 *
 * Translation:
 *   • The pictures are too big.
 *   • There's wasted vertical space at the top of the screen.
 *   • Word and picture cards should stay aligned at the same height.
 *   • Add a visible "guide line" / connector style between the
 *     two columns.
 *   • Increase the horizontal spacing between words and pictures.
 *
 * v5 changes:
 *   • Picture cards capped at 88px - 130px (was unbounded square,
 *     ballooning to ~200px on desktop).
 *   • Words now use the same MAX height as pictures so each row is
 *     a tight, balanced bar — no card stretches taller than its
 *     sibling.
 *   • Two new dashed "guide rails" run vertically between the two
 *     columns — gives the kid a visual hint that the columns are
 *     paired (the actual solid lines that draw on a successful
 *     match still replace these on hit).
 *   • Bumped the column gap from 12-24px to 32-48px so the rails
 *     have breathing room.
 *   • Added top alignment for the whole grid so the rows pack
 *     against the header instead of being pushed to the screen
 *     centre by the parent flex layout.
 */

const MAX_PAIRS = 5;

const WordPicConnectMode = ({ lesson, deck = [], onComplete }) => {
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
            if (out.length >= MAX_PAIRS) break;
        }
        return out;
    }, [deck]);

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

    const containerRef = useRef(null);
    const wordRefs = useRef({});
    const picRefs = useRef({});
    /**
     * Guard — set to the pair id we LAST played `playSuccess` for.
     * Prevents the success melody from firing twice in rapid
     * succession on a stale render or double-tap.
     */
    const lastMatchRef = useRef(null);

    const [selectedWord, setSelectedWord] = useState(null);
    const [matched, setMatched] = useState([]);
    const [wrongFlash, setWrongFlash] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [tick, setTick] = useState(0);
    const [sparklePairId, setSparklePairId] = useState(null);

    const setWordRef = (id) => (el) => {
        if (el) wordRefs.current[id] = el; else delete wordRefs.current[id];
    };
    const setPicRef = (slotIdx) => (el) => {
        if (el) picRefs.current[slotIdx] = el; else delete picRefs.current[slotIdx];
    };

    useEffect(() => {
        if (!wrongFlash) return;
        const t = setTimeout(() => setWrongFlash(null), 700);
        return () => clearTimeout(t);
    }, [wrongFlash]);

    useEffect(() => {
        if (!sparklePairId) return;
        const t = setTimeout(() => setSparklePairId(null), 800);
        return () => clearTimeout(t);
    }, [sparklePairId]);

    useEffect(() => {
        const t = setTimeout(() => setTick((n) => n + 1), 100);
        return () => clearTimeout(t);
    }, [pairs.length]);

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
        if (!pairs.length) return;
        if (matched.length >= pairs.length) {
            const t = setTimeout(() => {
                onComplete({
                    correct: attempts.filter((a) => a.correct).length,
                    total: pairs.length,
                    rounds: attempts.map((a) => ({
                        roundId: a.pairId,
                        correct: a.correct,
                        wordId: a.wordId,
                        word: a.word,
                        wrongChoice: a.wrongChoice,
                        wrongChoiceId: a.wrongChoiceId,
                    })),
                });
            }, 800);
            return () => clearTimeout(t);
        }
    }, [matched.length, pairs.length, attempts, onComplete]);

    if (!pairs.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No items available.</p>
                <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-2xl font-bold">
                    Skip
                </button>
            </div>
        );
    }

    const handleWordTap = (pair) => {
        if (matched.includes(pair.id)) return;
        playClick();
        setSelectedWord(pair.id);
    };

    const handlePicTap = (pairIdx) => {
        if (selectedWord == null) return;
        const targetPair = pairs[pairIdx];
        if (matched.includes(targetPair.id)) return;
        playClick();

        const sourcePair = pairs.find((p) => p.id === selectedWord);

        if (targetPair.id === selectedWord) {
            if (lastMatchRef.current !== targetPair.id) {
                lastMatchRef.current = targetPair.id;
                playSuccess();
            }
            setMatched((prev) => [...prev, targetPair.id]);
            setSparklePairId(targetPair.id);
            setAttempts((prev) => [...prev, { pairId: targetPair.id, correct: true, wordId: sourcePair?.wordId, word: sourcePair?.word }]);
        } else {
            playFail();
            setWrongFlash({ wordId: selectedWord, picId: targetPair.id });
            setAttempts((prev) => [...prev, {
                pairId: targetPair.id,
                correct: false,
                wordId: sourcePair?.wordId,
                word: sourcePair?.word,
                wrongChoice: targetPair.word,
                wrongChoiceId: targetPair.wordId,
            }]);
        }
        setSelectedWord(null);
        setTick((n) => n + 1);
    };

    const getCoords = (wordId, picPairId) => {
        const container = containerRef.current;
        const a = wordRefs.current[wordId];
        let slotIdx = -1;
        for (let i = 0; i < imageOrder.length; i++) {
            if (imageOrder[i] === pairs.findIndex((p) => p.id === picPairId)) { slotIdx = i; break; }
        }
        if (slotIdx < 0) return null;
        const b = picRefs.current[slotIdx];
        if (!container || !a || !b) return null;
        const cRect = container.getBoundingClientRect();
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return {
            x1: aRect.right - cRect.left, y1: aRect.top + aRect.height / 2 - cRect.top,
            x2: bRect.left - cRect.left,  y2: bRect.top + bRect.height / 2 - cRect.top,
        };
    };

    const matchedLines = matched.map((pid) => ({ pid, coords: getCoords(pid, pid) })).filter((x) => x.coords);
    const wrongLine = wrongFlash ? getCoords(wrongFlash.wordId, wrongFlash.picId) : null;

    /**
     * Compute "decorative guide lines" between every word's right
     * edge and the picture column's left edge — one per row. These
     * are the dashed cyan rails the operator asked for. They sit
     * BEHIND the solid match/wrong lines so a successful match
     * paints over its rail. Recomputed on the same tick the match
     * lines use so they snap to the real layout.
     */
    const guideRails = pairs.map((p, rowIdx) => {
        const container = containerRef.current;
        const a = wordRefs.current[p.id];
        const b = picRefs.current[rowIdx];
        if (!container || !a || !b) return null;
        const cRect = container.getBoundingClientRect();
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return {
            id: p.id,
            x1: aRect.right - cRect.left,
            y1: aRect.top + aRect.height / 2 - cRect.top,
            x2: bRect.left - cRect.left,
            y2: bRect.top + bRect.height / 2 - cRect.top,
        };
    });

    const progressPct = Math.round((matched.length / pairs.length) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-start gap-2 sm:gap-3 animate-fade-in-up px-2">
            {/* Compact header bar — unchanged size, but the parent
                now uses items-start so the page packs from the top
                rather than centering vertically. */}
            <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest text-center">Connect each word to its picture</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-cyan-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-cyan-600">{matched.length}/{pairs.length}</span>
                </div>
            </div>

            {/*
              Two-column board. Operator wave 5:
                • bigger column gap (32-48px) so the dashed guide
                  rails between word and picture have visual room
                • items-start packs rows from the top — no more
                  empty space at the head of the page
                • each row uses a fixed, smaller picture size
                  (`h-20 sm:h-24 lg:h-28`) so pictures no longer
                  feel like the dominant visual element
            */}
            <div
                ref={containerRef}
                className="
                    relative w-full max-w-2xl mx-auto
                    grid grid-cols-[1fr_minmax(0,5rem)_1fr] sm:grid-cols-[1fr_minmax(0,7rem)_1fr]
                    gap-y-2 sm:gap-y-3
                    items-start
                "
            >
                {/* Headers — small chips above each column. */}
                <p className="text-[9px] sm:text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">Words</p>
                <span aria-hidden="true" />
                <p className="text-[9px] sm:text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">Pictures</p>

                {/* Render each row as: word | spacer | picture.
                    Three explicit grid cells per row keeps the
                    middle column dedicated to the connection rails. */}
                {pairs.map((p, rowIdx) => {
                    const isMatched = matched.includes(p.id);
                    const isSelected = selectedWord === p.id;
                    const isWrongWord = wrongFlash?.wordId === p.id;

                    let wordCls = "border-white hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5";
                    if (isSelected) wordCls = "border-cyan-500 ring-4 ring-cyan-200 shadow-lg scale-[1.02]";
                    if (isMatched)  wordCls = "border-emerald-400 bg-emerald-50 opacity-90";
                    if (isWrongWord) wordCls = "border-red-400 bg-red-50 animate-shake";

                    const picPairIdx = imageOrder[rowIdx];
                    const picPair = pairs[picPairIdx];
                    const picMatched = matched.includes(picPair.id);
                    const picWrong = wrongFlash?.picId === picPair.id;
                    const picSparkle = sparklePairId === picPair.id;

                    let picCls = "border-white hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5";
                    if (picMatched) picCls = "border-emerald-400 bg-emerald-50 opacity-90";
                    if (picWrong)   picCls = "border-red-400 bg-red-50 animate-shake";

                    return (
                        <React.Fragment key={p.id}>
                            {/* Word card — fixed height that matches
                                the picture column so each row is a
                                tidy bar. */}
                            <button
                                ref={setWordRef(p.id)}
                                disabled={isMatched}
                                onClick={() => handleWordTap(p)}
                                className={`relative w-full h-20 sm:h-24 lg:h-28 px-2.5 sm:px-3 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center gap-2 ${wordCls} ${isMatched ? "cursor-default" : ""}`}
                            >
                                <AudioClipButton clip={p.audioClip} wordId={p.wordId} label={p.word} size="sm" />
                                <span className="text-sm sm:text-base lg:text-lg font-black uppercase text-gray-800 tracking-tight flex-1 text-left truncate">{p.word}</span>
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-[10px] sm:text-xs">✓</span>
                                )}
                            </button>

                            {/* Middle spacer cell — empty grid cell,
                                the dashed rail is drawn in the SVG
                                overlay below so it lines up exactly
                                with the row's vertical centre. */}
                            <span aria-hidden="true" className="block" />

                            {/* Picture card — same fixed height as
                                the word card, capped width so it
                                never stretches into a giant square. */}
                            <button
                                ref={setPicRef(rowIdx)}
                                disabled={picMatched || !selectedWord}
                                onClick={() => handlePicTap(picPairIdx)}
                                className={`relative w-full h-20 sm:h-24 lg:h-28 max-w-[8rem] sm:max-w-[9rem] lg:max-w-[10rem] mx-auto p-1.5 sm:p-2 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center justify-center ${picCls} ${picMatched ? "cursor-default" : ""} ${selectedWord == null && !picMatched ? "opacity-70" : ""}`}
                            >
                                <SmartImage src={picPair.imagePath} label={picPair.word} className="w-full h-full" imgClassName="w-full h-full object-contain" />
                                {picMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-[10px] sm:text-xs">✓</span>
                                )}
                                {picSparkle && (
                                    <span className="pointer-events-none absolute inset-0 wpc-sparkle-burst" aria-hidden="true">
                                        <span className="wpc-spark wpc-spark-1">✨</span>
                                        <span className="wpc-spark wpc-spark-2">⭐</span>
                                        <span className="wpc-spark wpc-spark-3">✨</span>
                                        <span className="wpc-spark wpc-spark-4">⭐</span>
                                    </span>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}

                {/* SVG overlay — three layers stacked:
                      1. Dashed cyan guide rails (always visible)
                      2. Solid green lines for matched pairs
                      3. Red flash for wrong attempts
                    The dashed rails are drawn FIRST so the solid
                    match line paints over its rail when a pair
                    connects. */}
                <svg
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: "100%", height: "100%" }}
                    aria-hidden="true"
                >
                    {/* Layer 1: dashed guide rails — one per row. */}
                    {guideRails.map((g) =>
                        g ? (
                            <line
                                key={`g-${g.id}`}
                                x1={g.x1}
                                y1={g.y1}
                                x2={g.x2}
                                y2={g.y2}
                                stroke="#06B6D4"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray="6 8"
                                opacity={matched.includes(g.id) ? 0 : 0.5}
                                className="wpc-rail"
                            />
                        ) : null,
                    )}
                    {/* Layer 2: matched lines — solid green. */}
                    {matchedLines.map(({ pid, coords }) => (
                        <line
                            key={`m-${pid}`}
                            x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}
                            stroke="#10B981" strokeWidth="5" strokeLinecap="round"
                            className="wpc-line-correct"
                        />
                    ))}
                    {/* Layer 3: wrong-attempt flash. */}
                    {wrongLine ? (
                        <line
                            key={`w-${tick}`}
                            x1={wrongLine.x1} y1={wrongLine.y1} x2={wrongLine.x2} y2={wrongLine.y2}
                            stroke="#EF4444" strokeWidth="5" strokeLinecap="round"
                            className="wpc-line-wrong"
                        />
                    ) : null}
                </svg>
            </div>

            <p className="w-full text-[10px] sm:text-xs font-bold text-gray-500 text-center mt-1">
                {selectedWord ? "✨ Now tap the matching picture →" : "👈 Tap a word to start"}
            </p>

            <style>{`
                .wpc-line-correct {
                    stroke-dasharray: 600;
                    stroke-dashoffset: 600;
                    animation: wpc-draw 480ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .wpc-line-wrong { animation: wpc-flash 700ms ease-in-out forwards; }
                @keyframes wpc-draw  { to { stroke-dashoffset: 0; } }
                @keyframes wpc-flash { 0%, 100% { opacity: 0; } 15%, 85% { opacity: 1; } }

                /* Dashed rails breathe gently so the kid sees they
                   are intentional decoration (and a hint at the
                   connection direction), not stale lines. */
                .wpc-rail {
                    animation: wpc-rail-breathe 2.4s ease-in-out infinite;
                }
                @keyframes wpc-rail-breathe {
                    0%, 100% { opacity: 0.30; }
                    50%      { opacity: 0.60; }
                }

                /* Sparkle burst on a correct match — four tiny stars
                   shoot outward from the picture card centre. */
                .wpc-sparkle-burst { position: absolute; inset: 0; pointer-events: none; }
                .wpc-spark {
                    position: absolute;
                    top: 50%; left: 50%;
                    font-size: 20px;
                    will-change: transform, opacity;
                }
                .wpc-spark-1 { animation: wpc-sparkle-tl 700ms ease-out forwards; }
                .wpc-spark-2 { animation: wpc-sparkle-tr 700ms ease-out forwards; }
                .wpc-spark-3 { animation: wpc-sparkle-bl 700ms ease-out forwards; }
                .wpc-spark-4 { animation: wpc-sparkle-br 700ms ease-out forwards; }
                @keyframes wpc-sparkle-tl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%, -180%) scale(1.1) rotate(-30deg); opacity: 0; } }
                @keyframes wpc-sparkle-tr { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%, -180%) scale(1.1) rotate( 30deg); opacity: 0; } }
                @keyframes wpc-sparkle-bl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%,  80%) scale(1.1) rotate( 45deg); opacity: 0; } }
                @keyframes wpc-sparkle-br { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%,  80%) scale(1.1) rotate(-45deg); opacity: 0; } }

                @media (prefers-reduced-motion: reduce) {
                    .wpc-rail, .wpc-spark, .wpc-line-correct, .wpc-line-wrong { animation: none !important; }
                }
            `}</style>
        </div>
    );
};

export default WordPicConnectMode;
