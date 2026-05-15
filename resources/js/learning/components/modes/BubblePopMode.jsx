import React, { useEffect, useMemo, useState } from "react";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * BubblePopMode — "Listen and pop the right word!"
 *
 * The target word is announced via audio; 5 floating bubble cards
 * drift around the play area; tapping the wrong one shakes the bubble,
 * tapping the right one pops it (CSS scale + fade) with playPop().
 *
 * Multi-round: after a successful pop we advance to the next round
 * with a brand-new shuffled set. Every round is logged so the parent
 * dashboard can pick up wrong attempts.
 */
const BUBBLES_PER_ROUND = 5;
const MAX_ROUNDS_DEFAULT = 5;

const BubblePopMode = ({ lesson, deck = [], onComplete }) => {
    // Build a flat pool of all words known to the deck (target + decoys).
    const wordPool = useMemo(() => {
        const seen = new Map();
        for (const r of deck || []) {
            const target = r?.prompt;
            if (target?.text && !seen.has(target.text)) {
                seen.set(target.text, {
                    word: target.text,
                    imagePath: target.imagePath,
                    audioClip: target.audioClip,
                    wordId: r.wordId || null,
                });
            }
            for (const o of r?.options || []) {
                if (o?.word && !seen.has(o.word)) {
                    seen.set(o.word, {
                        word: o.word,
                        imagePath: o.imagePath,
                        audioClip: o.audioClip,
                        wordId: o.wordId || null,
                    });
                }
            }
        }
        return Array.from(seen.values());
    }, [deck]);

    const maxRounds = Math.min(
        MAX_ROUNDS_DEFAULT,
        Math.max(1, deck?.length || MAX_ROUNDS_DEFAULT)
    );

    const [round, setRound] = useState(0);
    const [results, setResults] = useState([]);
    const [wrongIds, setWrongIds] = useState([]);
    const [popped, setPopped] = useState(null); // bubble id that was popped this round

    // Build the bubble set for the current round. We pull from the deck
    // entry at the matching index so the target/decoys remain coherent.
    const roundData = useMemo(() => {
        const r = deck[round % Math.max(1, deck.length)];
        const target = r?.prompt;
        if (!target) return null;
        const opts = (r?.options || []).slice(0, BUBBLES_PER_ROUND);
        // Make sure the correct option is present
        const hasCorrect = opts.find((o) => o.isCorrect);
        if (!hasCorrect && wordPool.length) {
            opts.push({
                id: "fallback-correct",
                word: target.text,
                imagePath: target.imagePath,
                audioClip: target.audioClip,
                isCorrect: true,
            });
        }
        // Shuffle
        const arr = [...opts];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return { target, options: arr.slice(0, BUBBLES_PER_ROUND), wordId: r?.wordId || null };
    }, [round, deck, wordPool.length]);

    // Speak the target word at the start of every round so non-readers
    // can play. We delay slightly so the bubbles are on screen first.
    useEffect(() => {
        if (!roundData?.target?.audioClip) return;
        const t = setTimeout(() => playAudio(roundData.target.audioClip), 350);
        return () => clearTimeout(t);
    }, [round, roundData?.target?.audioClip]);

    if (!roundData) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">No words to pop yet.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full"
                >
                    Skip
                </button>
            </div>
        );
    }

    const handlePop = (opt) => {
        if (popped) return;
        playClick();
        if (opt.isCorrect) {
            setPopped(opt.id);
            playPop();
            playSuccess();
            const firstTry = wrongIds.length === 0;
            const next = [
                ...results,
                {
                    roundId: `bp-${round}`,
                    correct: firstTry,
                    wordId: roundData.wordId,
                },
            ];
            setResults(next);
            setTimeout(() => {
                if (round + 1 >= maxRounds) {
                    onComplete({
                        correct: next.filter((r) => r.correct).length,
                        total: maxRounds,
                        rounds: next,
                    });
                } else {
                    setRound(round + 1);
                    setWrongIds([]);
                    setPopped(null);
                }
            }, 700);
        } else {
            playFail();
            setWrongIds((arr) => (arr.includes(opt.id) ? arr : [...arr, opt.id]));
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-md border border-white flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => playAudio(roundData.target.audioClip)}
                    className="w-10 h-10 rounded-full bg-[#10B981] text-white text-lg shadow-md flex items-center justify-center"
                    aria-label="Hear the word again"
                >
                    🔊
                </button>
                <p className="text-sm sm:text-base font-black text-[#1E293B]">
                    Pop the bubble that says{" "}
                    <span className="text-[#7C3AED] uppercase">{roundData.target.text}</span>
                    !
                </p>
            </div>

            <div className="bp-stage relative w-full max-w-4xl h-[24rem] sm:h-[26rem] lg:h-[30rem] rounded-[2rem] bg-gradient-to-b from-sky-50 to-purple-50 border border-white/80 shadow-inner overflow-hidden">
                {roundData.options.map((o, i) => {
                    const isWrong = wrongIds.includes(o.id);
                    const isPopped = popped === o.id;
                    const left = 8 + ((i * 17) % 80);
                    const top = 10 + ((i * 23) % 65);
                    const delay = (i * 0.4).toFixed(1);
                    return (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => handlePop(o)}
                            disabled={!!popped}
                            className={`bp-bubble absolute aspect-square ${
                                isWrong ? "bp-shake" : ""
                            } ${isPopped ? "bp-pop" : ""}`}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: "26%",
                                maxWidth: "10rem",
                                animationDelay: `${delay}s`,
                            }}
                        >
                            <span className="bp-skin">
                                {o.imagePath ? (
                                    <img
                                        src={o.imagePath}
                                        alt={o.word}
                                        className="max-h-20 lg:max-h-28 object-contain drop-shadow-md"
                                    />
                                ) : null}
                                <span className="mt-1 text-[11px] sm:text-xs font-black uppercase text-[#1E293B] truncate">
                                    {o.word}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Round {round + 1} of {maxRounds}
            </p>

            <style>{`
                @keyframes bp-float {
                    0%   { transform: translateY(0px); }
                    50%  { transform: translateY(-14px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes bp-shake-kf {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
                @keyframes bp-pop-kf {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                .bp-bubble {
                    border: none; padding: 0; background: transparent;
                    animation: bp-float 3.4s ease-in-out infinite;
                    transition: transform 200ms ease;
                    will-change: transform;
                }
                .bp-bubble:hover .bp-skin { box-shadow: 0 12px 30px rgba(124,58,237,0.18); transform: scale(1.05); }
                .bp-skin {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    width: 100%; height: 100%;
                    background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, rgba(186,230,253,0.7) 60%, rgba(167,243,208,0.6) 100%);
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.95);
                    box-shadow: 0 8px 22px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.6);
                    padding: 0.75rem;
                    transition: transform 200ms ease, box-shadow 200ms ease;
                }
                .bp-shake { animation: bp-shake-kf 420ms ease-in-out; }
                .bp-pop   { animation: bp-pop-kf 380ms ease-out forwards; }
            `}</style>
        </div>
    );
};

export default BubblePopMode;
