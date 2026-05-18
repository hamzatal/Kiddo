import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playClick, playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * SpeedTapMode — Whack-a-Word.
 *
 * 5–6 picture cards drift across the play area at the same time.
 * The audio prompt announces the target word; the kid has to TAP
 * the right picture before any of them slip off the right edge.
 *
 * Why it works for first-graders:
 *  • Pure listening / visual matching — no reading required.
 *  • Rewards quick recognition without a "fail timer".
 *  • Each round is short (≤ 12 s) so attention stays high.
 *
 * Game rules:
 *  • Picks one target per round from the deck.
 *  • Plays the target audio twice (once at start, once mid-round).
 *  • Wrong taps cost a heart (3 hearts per session).
 *  • Round ends when the target is tapped OR all decoys roll off
 *    the right edge — whichever comes first.
 *  • 8 rounds per game; final score is correct/total.
 */

const ROUNDS_PER_GAME = 8;
const HEARTS_TOTAL    = 3;
const ROUND_DURATION  = 12000; // ms — bubbles drift across in this time
const BUBBLE_COUNT    = 5;     // visible cards per round

/** Pure helper: pick a random round from the deck. */
const pickRandomRound = (deck, exclude = null) => {
    if (!deck?.length) return null;
    const candidates = deck.filter((r) => r?.prompt?.text && r?.wordId !== exclude);
    if (!candidates.length) return deck[Math.floor(Math.random() * deck.length)];
    return candidates[Math.floor(Math.random() * candidates.length)];
};

/** Build BUBBLE_COUNT bubbles for a round: 1 target + N-1 decoys. */
const buildBubbles = (round, deck) => {
    const target = {
        ...round.prompt,
        wordId: round.wordId,
        isTarget: true,
        id: `b-target-${round.roundId}`,
    };
    const decoyPool = (deck || [])
        .filter((r) => r.wordId !== round.wordId && r.prompt?.imagePath)
        .map((r) => ({
            ...r.prompt,
            wordId: r.wordId,
            isTarget: false,
            id: `b-${r.wordId}-${Math.random().toString(36).slice(2, 6)}`,
        }));
    // Shuffle decoys, take BUBBLE_COUNT-1
    for (let i = decoyPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [decoyPool[i], decoyPool[j]] = [decoyPool[j], decoyPool[i]];
    }
    const decoys = decoyPool.slice(0, BUBBLE_COUNT - 1);
    const bubbles = [target, ...decoys];

    // Shuffle final order so target isn't always first
    for (let i = bubbles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bubbles[i], bubbles[j]] = [bubbles[j], bubbles[i]];
    }
    // Lay each bubble out on a unique vertical lane (12-78%) and
    // randomise the start delay so they enter staggered, not all
    // at once like a wave.
    return bubbles.map((b, idx) => ({
        ...b,
        lane:  12 + (idx * (66 / BUBBLE_COUNT)),
        delay: idx * 380 + Math.floor(Math.random() * 200),
    }));
};

const SpeedTapMode = ({ lesson, deck = [], onComplete }) => {
    const totalRounds = Math.min(ROUNDS_PER_GAME, deck?.length || 1);
    const [roundIdx, setRoundIdx] = useState(0);
    const [hearts, setHearts] = useState(HEARTS_TOTAL);
    const [bubbles, setBubbles] = useState([]);
    const [target, setTarget] = useState(null);
    const [results, setResults] = useState([]);
    const [feedback, setFeedback] = useState(null); // 'hit' | 'miss' | null
    const [phase, setPhase] = useState("ready");    // 'ready' | 'play' | 'between' | 'done'
    const playAreaRef = useRef(null);
    const roundTimerRef = useRef(null);

    // Build a bubble layout for the current round.
    useEffect(() => {
        if (phase === "done" || !deck?.length) return;
        const round = pickRandomRound(deck, results[results.length - 1]?.wordId);
        if (!round) return;
        setTarget({ ...round, _rid: `r-${roundIdx}` });
        setBubbles(buildBubbles(round, deck));
        setPhase("ready");

        // 600ms warm-up for the kid to spot the bubbles, then play
        // the target audio and start the round.
        const warmup = setTimeout(() => {
            if (round.prompt?.audioClip) playAudio(round.prompt.audioClip);
            setPhase("play");
            // Mid-round audio reminder for slower learners.
            const reminder = setTimeout(() => {
                if (round.prompt?.audioClip) playAudio(round.prompt.audioClip);
            }, ROUND_DURATION * 0.55);
            roundTimerRef.current = reminder;
        }, 600);

        return () => {
            clearTimeout(warmup);
            if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roundIdx]);

    // After every round (hit or miss-out), hold for 900ms so the
    // child sees the feedback before the next round paints.
    const advanceRound = (newResults) => {
        setPhase("between");
        setFeedback(null);
        setTimeout(() => {
            if (roundIdx + 1 >= totalRounds) {
                setPhase("done");
                onComplete({
                    correct: newResults.filter((r) => r.correct).length,
                    total:   newResults.length,
                    rounds:  newResults,
                });
            } else {
                setRoundIdx(roundIdx + 1);
            }
        }, 900);
    };

    const handleBubbleTap = (b) => {
        if (phase !== "play") return;
        playClick();
        if (b.isTarget) {
            playSuccess();
            playPop();
            setFeedback("hit");
            const next = [...results, {
                roundId:  target._rid,
                correct:  true,
                wordId:   target.wordId,
                word:     target.prompt?.text || target.text,
                style:    "speed-tap",
                timeMs:   0,
            }];
            setResults(next);
            advanceRound(next);
        } else {
            playFail();
            setHearts((h) => Math.max(0, h - 1));
            setFeedback("miss");
            setTimeout(() => setFeedback(null), 500);
            // If hearts hit zero, end the game on a kind note: log
            // the remaining rounds as missed so the score reflects
            // the run honestly.
            if (hearts - 1 <= 0) {
                const next = [
                    ...results,
                    { roundId: target._rid, correct: false, wordId: target.wordId, style: "speed-tap" },
                ];
                advanceRound(next);
            }
        }
    };

    // When the target's bubble leaves the play area without being
    // tapped, count it as a miss and move on. We trigger this by
    // the CSS animationend event on the target bubble.
    const handleBubbleExit = (b) => {
        if (phase !== "play") return;
        if (b.id !== target?._rid && !b.isTarget) return;
        if (!b.isTarget) return;
        // Target left the screen → miss
        playFail();
        const next = [
            ...results,
            { roundId: target._rid, correct: false, wordId: target.wordId, style: "speed-tap" },
        ];
        setResults(next);
        advanceRound(next);
    };

    if (!deck?.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">No words for the Whack game yet.</p>
                <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full">
                    Skip
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex items-center gap-3">
                <button
                    onClick={() => target?.prompt?.audioClip && playAudio(target.prompt.audioClip)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white text-lg shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
                    aria-label="Play target audio"
                >
                    🔊
                </button>
                <div className="flex-1 min-w-0 text-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Tap the picture for</p>
                    <p className="text-base sm:text-lg font-black text-[#1E293B] uppercase tracking-tight truncate">
                        {target?.prompt?.text || "..."}
                    </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3].map((h) => (
                        <span key={h} className={`text-base ${h <= hearts ? "" : "grayscale opacity-30"}`}>❤️</span>
                    ))}
                </div>
            </div>

            {/* Round indicator */}
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Round {Math.min(roundIdx + 1, totalRounds)} / {totalRounds}
            </p>

            {/* Play area — bubbles drift left → right on staggered lanes */}
            <div
                ref={playAreaRef}
                className="relative w-full max-w-3xl flex-1 min-h-[280px] rounded-3xl bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 border-2 border-white shadow-inner overflow-hidden"
            >
                {/* Decorative blobs */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-200/40 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-cyan-200/40 rounded-full blur-2xl" />

                {phase === "ready" || phase === "play" ? (
                    bubbles.map((b) => {
                        const stateCls =
                            feedback === "hit" && b.isTarget ? "st-hit" : "";
                        return (
                            <button
                                key={b.id}
                                type="button"
                                onClick={() => handleBubbleTap(b)}
                                onAnimationEnd={() => handleBubbleExit(b)}
                                disabled={phase !== "play"}
                                className={`st-bubble absolute w-[22%] sm:w-[18%] aspect-square ${stateCls}`}
                                style={{
                                    top: `${b.lane}%`,
                                    animationDelay: `${b.delay}ms`,
                                    animationDuration: `${ROUND_DURATION}ms`,
                                    animationPlayState: phase === "play" ? "running" : "paused",
                                }}
                            >
                                <div className="absolute inset-0 rounded-full bg-white/95 border-4 border-white shadow-xl flex flex-col items-center justify-center p-1.5 overflow-hidden">
                                    <SmartImage
                                        src={b.imagePath}
                                        label={b.text}
                                        className="w-full h-[80%]"
                                        imgClassName="w-full h-full object-contain drop-shadow"
                                    />
                                </div>
                            </button>
                        );
                    })
                ) : null}

                {phase === "between" && feedback === "miss" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-rose-100/40 backdrop-blur-sm pointer-events-none animate-fade-in">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-xl border-2 border-rose-200">
                            <p className="text-sm font-black text-rose-500">Try again 💪</p>
                        </div>
                    </div>
                )}
                {phase === "between" && feedback !== "miss" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/40 backdrop-blur-sm pointer-events-none animate-fade-in">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-xl border-2 border-emerald-200">
                            <p className="text-sm font-black text-emerald-500">Great! ⚡</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes st-drift {
                    0%   { transform: translateX(-30%) scale(0.6) rotate(-4deg); opacity: 0; }
                    8%   { opacity: 1; }
                    100% { transform: translateX(140vw) scale(1) rotate(4deg); opacity: 0; }
                }
                @keyframes st-hit-pulse {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.4); filter: brightness(1.4); }
                    100% { transform: scale(0); opacity: 0; }
                }
                .st-bubble {
                    border: none;
                    background: transparent;
                    padding: 0;
                    transform: translateX(-30%);
                    animation-name: st-drift;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                    transition: transform 200ms;
                }
                .st-bubble:hover { transform: scale(1.05); }
                .st-bubble.st-hit { animation: st-hit-pulse 700ms ease-out forwards !important; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 200ms ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SpeedTapMode;
