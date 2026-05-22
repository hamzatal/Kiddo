import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * WordPicConnectMode — pair each word with its picture.
 *
 * v4 (May 2026) — operator feedback fixes:
 *   "الكلمات كلهم مرصوصين فقوق والصور نازلين كثير لتحت" — old layout
 *   stacked all words on top, then a big arrow, then all pictures
 *   on a separate row. The kid had to scroll between halves and
 *   could lose track of which word they had picked.
 *
 *   v4 keeps the picture on the same row as ITS WORD's row even on
 *   mobile (always two columns — `grid-cols-2`). Words on the left,
 *   shuffled pictures on the right; the grid uses `auto-rows-fr` so
 *   row heights stay equal and the kid's eyes only move sideways
 *   between the picked word and the candidate picture, not up and
 *   down across stacked groups. The big mobile-only "⬇️" divider
 *   went away because there's no longer a top/bottom split.
 *
 *   "صوت النجاح بيظهر 3 مرات" — the previous build occasionally
 *   replayed the success melody because (a) `playSuccess` itself
 *   was a long 5-note arpeggio that sounded like multiple beeps,
 *   (b) a stale render could re-enter `handlePicTap` while the
 *   first match was still in flight. v4 adds `lastMatchRef` as a
 *   guard so each pair fires `playSuccess` AT MOST ONCE, and
 *   relies on the slimmed 3-note `playSuccess` (see soundEffects.js
 *   v2). TTS for the picked word now plays through the
 *   AudioClipButton on the word card itself — `handleWordTap` no
 *   longer triggers `speakWord` directly, so the click → word →
 *   click → success cascade can't overlap into "feels like three
 *   sounds for one correct match".
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
     * Prevents the success melody from firing twice in rapid succession
     * if React re-renders or the kid double-taps the same picture.
     * Cleared back to null on unmount only; matched pairs are
     * unclickable so a second tap can't reach this code.
     */
    const lastMatchRef = useRef(null);

    const [selectedWord, setSelectedWord] = useState(null);
    const [matched, setMatched] = useState([]);
    const [wrongFlash, setWrongFlash] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [tick, setTick] = useState(0);
    /**
     * One-shot sparkle burst keyed by the matched pair id. Used to
     * trigger a tiny celebration animation on the picture card the
     * instant a pair is connected — kids see WHICH match they got
     * right, not just hear a generic ding.
     */
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
        // Recompute SVG line endpoints on resize AND scroll so the
        // already-drawn lines never point at stale coordinates.
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
        // The word card has its own AudioClipButton speaker icon —
        // tapping the body of the word selects it but does NOT
        // auto-play the TTS. This stops the "click + speech + click
        // + success" cascade from feeling like 3 success sounds.
        // The kid can still hear the word any time by tapping the
        // small green speaker chip on the card.
    };

    const handlePicTap = (pairIdx) => {
        if (selectedWord == null) return;
        const targetPair = pairs[pairIdx];
        if (matched.includes(targetPair.id)) return;
        playClick();

        const sourcePair = pairs.find((p) => p.id === selectedWord);

        if (targetPair.id === selectedWord) {
            // Guard against double-fire — playSuccess is a 3-note
            // melody and stacking two of them on top of each other
            // is what the operator heard as "3 times".
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

    const progressPct = Math.round((matched.length / pairs.length) * 100);

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest text-center">Connect each word to its picture</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-cyan-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500 rounded-full" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-cyan-600">{matched.length}/{pairs.length}</span>
                </div>
            </div>

            {/* Two-column grid, ALWAYS. Words on the left, pictures on
                the right. `auto-rows-fr` makes every row the same
                height so the kid's eyes only move sideways between
                a picked word and a candidate picture — never up
                and down across stacked groups. */}
            <div
                ref={containerRef}
                className="
                    relative w-full max-w-3xl
                    grid grid-cols-2
                    gap-3 sm:gap-4 lg:gap-6
                    items-stretch
                "
                style={{ gridAutoRows: "1fr" }}
            >
                {/* Column header — appears once on each side, very small. */}
                <div className="contents">
                    <p className="text-[9px] sm:text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">Words</p>
                    <p className="text-[9px] sm:text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">Pictures</p>
                </div>

                {/* Render row-by-row so each WORD sits next to a
                    SHUFFLED PICTURE at the same vertical position.
                    React-wise that means we interleave the two
                    columns into a single flat list of children. */}
                {pairs.map((p, rowIdx) => {
                    const isMatched = matched.includes(p.id);
                    const isSelected = selectedWord === p.id;
                    const isWrongWord = wrongFlash?.wordId === p.id;

                    let wordCls = "border-white hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5";
                    if (isSelected) wordCls = "border-cyan-500 ring-4 ring-cyan-200 shadow-lg scale-[1.02]";
                    if (isMatched)  wordCls = "border-emerald-400 bg-emerald-50 opacity-90";
                    if (isWrongWord) wordCls = "border-red-400 bg-red-50 animate-shake";

                    // Picture for THIS row — uses the shuffled
                    // imageOrder so it doesn't sit next to its own
                    // word (otherwise the puzzle would solve itself).
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
                            <button
                                ref={setWordRef(p.id)}
                                disabled={isMatched}
                                onClick={() => handleWordTap(p)}
                                className={`relative w-full p-2 sm:p-2.5 lg:p-3 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${wordCls} ${isMatched ? "cursor-default" : ""}`}
                            >
                                <AudioClipButton clip={p.audioClip} wordId={p.wordId} label={p.word} size="sm" />
                                <span className="text-sm sm:text-base lg:text-lg font-black uppercase text-gray-800 tracking-tight flex-1 text-left truncate">{p.word}</span>
                                {isMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-[10px] sm:text-xs">✓</span>
                                )}
                            </button>

                            <button
                                ref={setPicRef(rowIdx)}
                                disabled={picMatched || !selectedWord}
                                onClick={() => handlePicTap(picPairIdx)}
                                className={`relative w-full p-1.5 sm:p-2 bg-white rounded-2xl border-4 shadow-md transition-all duration-200 flex items-center justify-center aspect-square ${picCls} ${picMatched ? "cursor-default" : ""} ${selectedWord == null && !picMatched ? "opacity-70" : ""}`}
                            >
                                <SmartImage src={picPair.imagePath} label={picPair.word} className="w-full h-full" imgClassName="w-full h-full object-contain" />
                                {picMatched && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-[10px] sm:text-xs">✓</span>
                                )}
                                {picSparkle && (
                                    <>
                                        <span className="pointer-events-none absolute inset-0 wpc-sparkle-burst" aria-hidden="true">
                                            <span className="wpc-spark wpc-spark-1">✨</span>
                                            <span className="wpc-spark wpc-spark-2">⭐</span>
                                            <span className="wpc-spark wpc-spark-3">✨</span>
                                            <span className="wpc-spark wpc-spark-4">⭐</span>
                                        </span>
                                    </>
                                )}
                            </button>
                        </React.Fragment>
                    );
                })}

                {/* SVG overlay for the connecting lines — drawn after
                    the cards so it sits on top, but `pointer-events:
                    none` keeps it from stealing taps from the cards. */}
                <svg
                    className="absolute inset-0 pointer-events-none hidden md:block"
                    style={{ width: "100%", height: "100%" }}
                    aria-hidden="true"
                >
                    {matchedLines.map(({ pid, coords }) => (
                        <line
                            key={`m-${pid}`}
                            x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}
                            stroke="#10B981" strokeWidth="5" strokeLinecap="round"
                            className="wpc-line-correct"
                        />
                    ))}
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

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
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

                /* Sparkle burst on a correct match — four tiny stars
                   shoot outward from the picture card centre. Lasts
                   ~700ms then unmounts via React. */
                .wpc-sparkle-burst { position: absolute; inset: 0; pointer-events: none; }
                .wpc-spark {
                    position: absolute;
                    top: 50%; left: 50%;
                    font-size: 20px;
                    animation: wpc-sparkle 700ms ease-out forwards;
                    will-change: transform, opacity;
                }
                .wpc-spark-1 { animation-name: wpc-sparkle-tl; }
                .wpc-spark-2 { animation-name: wpc-sparkle-tr; }
                .wpc-spark-3 { animation-name: wpc-sparkle-bl; }
                .wpc-spark-4 { animation-name: wpc-sparkle-br; }
                @keyframes wpc-sparkle-tl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%, -180%) scale(1.1) rotate(-30deg); opacity: 0; } }
                @keyframes wpc-sparkle-tr { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%, -180%) scale(1.1) rotate( 30deg); opacity: 0; } }
                @keyframes wpc-sparkle-bl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%,  80%) scale(1.1) rotate( 45deg); opacity: 0; } }
                @keyframes wpc-sparkle-br { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%,  80%) scale(1.1) rotate(-45deg); opacity: 0; } }
            `}</style>
        </div>
    );
};

export default WordPicConnectMode;
