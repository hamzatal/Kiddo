import React, { useEffect, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

/**
 * TrueOrFalseRound — does the word match the picture?
 *
 * Standard round shape (style = "true-or-false"):
 *   round.prompt.imagePath  — the image (always the real target)
 *   round.prompt.text       — a word (correct 50% of the time, decoy 50%)
 *   round.prompt.audioClip  — auto-plays on mount
 *   round.options = [
 *     { id: "true",  word: "true",  isCorrect: <bool> },
 *     { id: "false", word: "false", isCorrect: <bool> },
 *   ]
 */

const TrueOrFalseRound = ({ round, onPick, correctId, wrong, disabled }) => {
    const prompt = round?.prompt;
    const options = round?.options || [];
    const [answered, setAnswered] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setAnswered(null);
        if (prompt?.audioClip) {
            const t = setTimeout(() => playAudio(prompt.audioClip), 350);
            return () => clearTimeout(t);
        }
    }, [round?.roundId]);

    const handleAnswer = (opt) => {
        if (disabled || answered !== null) return;
        playClick();
        setAnswered(opt.id);
        if (opt.isCorrect) {
            playSuccess();
            const el = containerRef.current;
            if (el) {
                const r = el.getBoundingClientRect();
                launchStars(r.left + r.width / 2, r.top + r.height / 2.5, 6);
            }
        } else {
            playFail();
        }
        setTimeout(() => onPick?.(opt), 350);
    };

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 sm:text-xs">
                Is this the right word?
            </p>

            {/* Image + word card */}
            <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur-sm sm:p-6">
                <div
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                    style={{ width: "clamp(7rem,22vw,10rem)", height: "clamp(7rem,22vw,10rem)" }}
                >
                    <SmartImage
                        src={prompt?.imagePath}
                        label={prompt?.text}
                        className="h-full w-full"
                        imgClassName="w-full h-full object-contain p-2"
                    />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2">
                    {prompt?.audioClip && (
                        <button
                            type="button"
                            onClick={() => playAudio(prompt.audioClip)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm text-white shadow transition-transform hover:scale-110 active:scale-95"
                            aria-label="Listen"
                        >
                            🔊
                        </button>
                    )}
                    <span
                        className="text-center font-black text-gray-800"
                        style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.75rem)" }}
                    >
                        {prompt?.text}
                    </span>
                </div>
            </div>

            {/* TRUE / FALSE buttons */}
            <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-4">
                {options.map((opt) => {
                    const isThisCorrect = correctId === opt.id;
                    const isThisWrong = wrong?.includes(opt.id);
                    const isTrue = opt.id === "true" || opt.word?.toLowerCase() === "true";

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={!!answered || disabled}
                            onClick={() => handleAnswer(opt)}
                            className={[
                                "relative rounded-2xl py-4 font-black text-white sm:py-5",
                                "flex flex-col items-center gap-1.5 shadow-lg",
                                "select-none transition-all duration-200",
                                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60",
                                !!answered || disabled
                                    ? "pointer-events-none cursor-not-allowed"
                                    : "cursor-pointer hover:scale-[1.04] active:scale-95",
                                isThisCorrect
                                    ? "scale-[1.06] ring-4 ring-white ring-offset-2 " +
                                      (isTrue ? "ring-offset-emerald-400" : "ring-offset-rose-400")
                                    : "",
                                isThisWrong ? "scale-95 opacity-60 grayscale" : "",
                                isTrue
                                    ? "bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-300/50"
                                    : "bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-300/50",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-label={isTrue ? "True — they match" : "False — they don't match"}
                        >
                            <span className="text-3xl leading-none sm:text-4xl">
                                {isTrue ? "✅" : "❌"}
                            </span>
                            <span
                                className="font-black uppercase tracking-wider"
                                style={{ fontSize: "clamp(0.8rem, 3vw, 1.1rem)" }}
                            >
                                {isTrue ? "True" : "False"}
                            </span>
                            {isThisCorrect && (
                                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-400 bg-white text-sm font-black text-emerald-600 shadow-lg">
                                    ✓
                                </div>
                            )}
                            {isThisWrong && (
                                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-rose-400 bg-white text-sm font-black text-rose-600 shadow-lg">
                                    ✕
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TrueOrFalseRound;
