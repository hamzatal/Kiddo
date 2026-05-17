import React, { useEffect, useMemo, useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import RoundProgress from "@/learning/components/ui/RoundProgress";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * DrawCircleMode — "Circle the correct picture".
 *
 * A simple 3-options-per-round game where the child must "draw" a
 * red circle around the card that matches the target word shown at
 * the top. The deck shape is the same one produced by the lesson
 * engine (array of rounds with options), so we re-use it verbatim.
 *
 *   Props: { lesson, deck, audioTrack, onComplete }
 *
 * UX details:
 *   - Target word + audio button sits in a white pill at the top.
 *   - Tapping a card draws a ring (border-radius 50%, scales via
 *     transform). Correct = green + playSuccess, wrong = red + shake
 *     + playFail; the child can try again until correct.
 *   - After the configured number of rounds (default 5, bounded by
 *     the deck length), we bubble up onComplete({correct, total, rounds}).
 */
const MAX_ROUNDS_DEFAULT = 5;

const DrawCircleMode = ({ lesson, deck = [], onComplete }) => {
    const maxRounds = Math.max(
        1,
        Math.min(
            deck.length || MAX_ROUNDS_DEFAULT,
            lesson?.config?.rounds || MAX_ROUNDS_DEFAULT
        )
    );

    // Take the first N rounds; the backend has already shuffled & built
    // 3-option sets for us, so we don't re-shuffle here.
    const rounds = useMemo(
        () => (deck || []).slice(0, maxRounds),
        [deck, maxRounds]
    );

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]); // [{ roundId, correct }]
    const [wrong, setWrong] = useState([]); // option ids tried this round
    const [correctId, setCorrectId] = useState(null);

    if (!rounds.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">
                    No pictures available for this lesson yet.
                </p>
                <button
                    onClick={() =>
                        onComplete({ correct: 0, total: 1, rounds: [] })
                    }
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full"
                >
                    Skip
                </button>
            </div>
        );
    }

    const round = rounds[idx];
    const prompt = round?.prompt;
    const label =
        lesson?.config?.prompt || "Circle the correct picture!";

    const advance = (finalResults) => {
        if (idx + 1 >= rounds.length) {
            onComplete({
                correct: finalResults.filter((r) => r.correct).length,
                total: rounds.length,
                rounds: finalResults,
            });
            return;
        }
        setIdx(idx + 1);
        setWrong([]);
        setCorrectId(null);
    };

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
            const firstWrongOpt = round.options?.find((o) => wrong.includes(o.id));
            const next = [
                ...results,
                {
                    roundId: round.roundId,
                    wordId: round.wordId || null,
                    word: prompt?.text || null,
                    correct: firstTry,
                    timeMs: 0,
                    wrongChoice: firstWrongOpt?.word || null,
                    wrongChoiceId: firstWrongOpt?.wordId || null,
                },
            ];
            setResults(next);
            // Give the ring animation a moment to land before advancing
            setTimeout(() => advance(next), 1100);
        } else {
            playFail();
            setWrong((w) => (w.includes(option.id) ? w : [...w, option.id]));
        }
    };

    // Auto-play the target word once per round so a non-reader kid can
    // still play without needing to tap the speaker.
    useEffect(() => {
        if (prompt?.audioClip) {
            playAudio(prompt.audioClip);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    return (
        <div className="w-full max-w-5xl lg:max-w-6xl flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <RoundProgress
                    total={rounds.length}
                    current={idx}
                    results={results}
                />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    {idx + 1} / {rounds.length}
                </span>
            </div>

            {/* Target card */}
            <div className="bg-white/90 backdrop-blur-md px-6 sm:px-10 py-5 rounded-[2rem] shadow-md border border-white flex flex-col items-center gap-3 w-full max-w-2xl">
                <p className="text-[11px] font-black text-purple-500 uppercase tracking-widest">
                    {label}
                </p>
                <div className="flex items-center gap-3">
                    <h2 className="text-4xl sm:text-5xl font-black uppercase text-[#1E293B] tracking-tight">
                        {prompt?.text || "?"}
                    </h2>
                    <AudioClipButton clip={prompt?.audioClip} size="md" />
                </div>
            </div>

            {/* Option row */}
            <div className="grid grid-cols-3 gap-4 lg:gap-6 w-full max-w-4xl">
                {(round.options || []).map((opt) => {
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong.includes(opt.id);
                    const isDisabled =
                        (correctId !== null && !isCorrect) ||
                        (isWrong && correctId === null);

                    // Ring state drives the CSS classes for the circle overlay.
                    let ringClass = "dc-ring dc-ring-idle";
                    if (isCorrect) ringClass = "dc-ring dc-ring-correct";
                    else if (isWrong) ringClass = "dc-ring dc-ring-wrong";

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handlePick(opt)}
                            className={`dc-card group relative p-4 sm:p-5 bg-white/95 backdrop-blur-xl rounded-[2rem] border-4 border-white transition-all duration-300 shadow-md flex flex-col items-center justify-center aspect-square ${
                                isDisabled ? "opacity-60 cursor-not-allowed" : "hover:border-purple-300 hover:-translate-y-1"
                            }`}
                        >
                            {/* The ring that "draws" itself */}
                            <span aria-hidden="true" className={ringClass} />

                            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                                <SmartImage
                                    src={opt.imagePath}
                                    label={opt.word}
                                    className="w-full h-full"
                                    imgClassName="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                                />
                            </div>

                            <span className="mt-2 text-xs sm:text-sm font-black uppercase tracking-wide text-[#1E293B]">
                                {opt.word}
                            </span>
                        </button>
                    );
                })}
            </div>

            <style>{`
                .dc-card { position: relative; }
                .dc-ring {
                    position: absolute;
                    inset: 6px;
                    border-radius: 50%;
                    border: 6px solid transparent;
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.0);
                    transform: scale(0);
                    pointer-events: none;
                    transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
                                box-shadow 400ms ease,
                                border-color 200ms ease;
                    z-index: 2;
                }
                .dc-ring-idle { border-color: transparent; }
                .dc-ring-wrong {
                    border-color: #EF4444;
                    transform: scale(1);
                    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.15);
                    animation: dc-shake 420ms ease-in-out;
                }
                .dc-ring-correct {
                    border-color: #10B981;
                    transform: scale(1);
                    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.2);
                }
                @keyframes dc-shake {
                    0%   { transform: scale(1) translateX(0); }
                    20%  { transform: scale(1) translateX(-8px); }
                    40%  { transform: scale(1) translateX(8px); }
                    60%  { transform: scale(1) translateX(-6px); }
                    80%  { transform: scale(1) translateX(6px); }
                    100% { transform: scale(1) translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default DrawCircleMode;
