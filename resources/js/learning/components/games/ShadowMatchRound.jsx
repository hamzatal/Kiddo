import React, { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

/**
 * ShadowMatchRound — progressively de-blurs a shadowed image.
 *
 * Standard round shape (style = "shadow-match"):
 *   round.prompt.imagePath  — image to blur
 *   round.prompt.audioClip  — auto-plays on mount
 *   round.options           — [{id,word,imagePath,audioClip,isCorrect}]
 *
 * Three hint stages (2.2 s each):
 *   Stage 0 — fully black silhouette (CSS filter: brightness(0) blur(18px))
 *   Stage 1 — dark ghost          (brightness(0.12) blur(10px))
 *   Stage 2 — blurry shape        (brightness(0.4)  blur(4px))
 * Answering instantly stops the reveal timer.
 */

const STAGES = [
    { brightness: 0, blur: 18, label: "●●●" },
    { brightness: 0.12, blur: 10, label: "●●○" },
    { brightness: 0.4, blur: 4, label: "●○○" },
];
const STAGE_MS = 2200;

const ShadowMatchRound = ({ round, onPick, correctId, wrong, disabled }) => {
    const prompt = round?.prompt;
    const options = round?.options || [];

    const [stage, setStage] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setStage(0);
        setRevealed(false);
        if (prompt?.audioClip) {
            const t = setTimeout(() => playAudio(prompt.audioClip), 300);
            return () => clearTimeout(t);
        }
    }, [round?.roundId]);

    useEffect(() => {
        if (disabled || stage >= STAGES.length - 1) return;
        timerRef.current = setTimeout(() => setStage((s) => s + 1), STAGE_MS);
        return () => clearTimeout(timerRef.current);
    }, [stage, disabled]);

    useEffect(() => {
        if (disabled) {
            clearTimeout(timerRef.current);
            setRevealed(true);
        }
    }, [disabled]);

    const handlePick = useCallback(
        (opt) => {
            if (disabled) return;
            playClick();
            clearTimeout(timerRef.current);
            if (opt.isCorrect) {
                setRevealed(true);
                const el = containerRef.current;
                if (el) {
                    const r = el.getBoundingClientRect();
                    launchStars(r.left + r.width / 2, r.top + r.height / 3, 6);
                }
                playSuccess();
            } else {
                playFail();
            }
            onPick?.(opt);
        },
        [disabled, onPick],
    );

    const { brightness, blur } = STAGES[stage];

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 sm:text-xs">
                What is hiding in the shadow?
            </p>

            {/* Shadow image */}
            <div
                className="relative overflow-hidden rounded-3xl border-4 border-white bg-gray-100 shadow-xl"
                style={{ width: "clamp(8rem,28vw,13rem)", height: "clamp(8rem,28vw,13rem)" }}
            >
                {prompt?.imagePath ? (
                    <>
                        {/* Shadowed layer */}
                        <img
                            key={`shadow-${round?.roundId}`}
                            src={prompt.imagePath}
                            alt="Mystery shadow"
                            draggable={false}
                            className="absolute inset-0 h-full w-full object-contain p-3 transition-all duration-700"
                            style={{
                                filter: revealed
                                    ? "brightness(1) blur(0)"
                                    : `brightness(${brightness}) blur(${blur}px)`,
                            }}
                        />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                        ❓
                    </div>
                )}

                {/* Stage hint dots */}
                {!revealed && (
                    <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                        {STAGES.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${i <= stage ? "scale-110 bg-purple-400" : "bg-gray-300"}`}
                            />
                        ))}
                    </div>
                )}

                {/* Revealed badge */}
                {revealed && (
                    <div className="absolute inset-x-0 bottom-0 bg-emerald-500/80 py-1 text-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white">
                            Revealed!
                        </span>
                    </div>
                )}
            </div>

            {/* Options */}
            <div className="grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
                {options.map((opt) => {
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong?.includes(opt.id);
                    const isDisabled = correctId !== null && !isCorrect && !isWrong;

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={isWrong || isDisabled || isCorrect}
                            onClick={() => handlePick(opt)}
                            className={[
                                "relative aspect-square overflow-hidden rounded-2xl border-2",
                                "select-none transition-all duration-200",
                                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400",
                                isCorrect
                                    ? "scale-[1.06] border-emerald-400 bg-white shadow-[0_0_0_4px_rgba(16,185,129,0.2)]"
                                    : isWrong
                                      ? "scale-95 border-rose-400 bg-white opacity-50"
                                      : isDisabled
                                        ? "cursor-not-allowed border-gray-200 bg-white opacity-50"
                                        : "cursor-pointer border-purple-200 bg-white hover:-translate-y-1 hover:border-purple-400 hover:shadow-[0_6px_18px_rgba(124,58,237,0.25)]",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-label={`Pick ${opt.word}`}
                        >
                            <SmartImage
                                src={opt.imagePath}
                                label={opt.word}
                                className="absolute inset-0 h-full w-full"
                                imgClassName="w-full h-full object-contain p-2"
                            />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#160035]/70 via-[#160035]/20 to-transparent px-1.5 pb-1 pt-3">
                                <span
                                    className="block truncate text-center font-black uppercase text-white"
                                    style={{ fontSize: "clamp(0.55rem, 2vw, 0.72rem)" }}
                                >
                                    {opt.word}
                                </span>
                            </div>
                            {isCorrect && (
                                <div className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-black text-white shadow">
                                    ✓
                                </div>
                            )}
                            {isWrong && (
                                <div className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-xs font-black text-white shadow">
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

export default ShadowMatchRound;
