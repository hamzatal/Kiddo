import React, { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

const PALETTE = [
    {
        from: "#fb7185",
        to: "#f43f5e",
        shine: "rgba(255,255,255,0.35)",
        shadow: "rgba(244,63,94,0.45)",
    },
    {
        from: "#a78bfa",
        to: "#7c3aed",
        shine: "rgba(255,255,255,0.30)",
        shadow: "rgba(124,58,237,0.45)",
    },
    {
        from: "#38bdf8",
        to: "#0284c7",
        shine: "rgba(255,255,255,0.35)",
        shadow: "rgba(14,165,233,0.45)",
    },
    {
        from: "#34d399",
        to: "#059669",
        shine: "rgba(255,255,255,0.30)",
        shadow: "rgba(16,185,129,0.45)",
    },
    {
        from: "#fbbf24",
        to: "#d97706",
        shine: "rgba(255,255,255,0.35)",
        shadow: "rgba(245,158,11,0.45)",
    },
    {
        from: "#f472b6",
        to: "#db2777",
        shine: "rgba(255,255,255,0.30)",
        shadow: "rgba(236,72,153,0.45)",
    },
];

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function rng(id, seed) {
    return (hashStr(String(id) + seed) % 1000) / 1000;
}

const BalloonPopRound = ({ round, onPick, correctId, wrong, disabled }) => {
    const prompt = round?.prompt;
    const options = round?.options || [];

    const [popped, setPopped] = useState({});
    const containerRef = useRef(null);

    useEffect(() => {
        setPopped({});
        if (prompt?.audioClip) {
            const t = setTimeout(() => playAudio(prompt.audioClip), 350);
            return () => clearTimeout(t);
        }
    }, [round?.roundId]);

    const handlePop = useCallback(
        (opt) => {
            if (disabled || popped[opt.id]) return;
            playClick();
            setPopped((p) => ({ ...p, [opt.id]: true }));
            if (opt.isCorrect) {
                playSuccess();
                const el = containerRef.current;
                if (el) {
                    const r = el.getBoundingClientRect();
                    launchStars(r.left + r.width / 2, r.top + r.height / 2.5, 8);
                }
            } else {
                playFail();
            }
            setTimeout(() => onPick?.(opt), 220);
        },
        [disabled, popped, onPick],
    );

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-4">
            {/* Prompt */}
            <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-8 sm:py-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 sm:text-[10px]">
                    Pop the right balloon!
                </p>
                {prompt?.text && (
                    <h2
                        className="text-center font-black text-gray-800"
                        style={{ fontSize: "clamp(1.25rem, 5vw, 2rem)" }}
                    >
                        {prompt.text}
                    </h2>
                )}
                {prompt?.audioClip && (
                    <button
                        type="button"
                        onClick={() => playAudio(prompt.audioClip)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-lg text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                        aria-label="Listen again"
                    >
                        🔊
                    </button>
                )}
            </div>

            {/* Balloon arena */}
            <div
                className="relative mx-auto w-full max-w-lg"
                style={{ height: "clamp(180px, 38vw, 300px)" }}
            >
                {options.map((opt, idx) => {
                    const pal = PALETTE[idx % PALETTE.length];
                    const driftDur = 4 + rng(opt.id, "dur") * 3;
                    const driftAmp = 20 + rng(opt.id, "amp") * 22;
                    const startY = 8 + rng(opt.id, "y") * 55;
                    const startX = (idx / Math.max(options.length, 1)) * 72 + rng(opt.id, "x") * 12;
                    const isPopped = popped[opt.id];
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong?.includes(opt.id);
                    const balloonSize = "clamp(68px, 16vw, 96px)";

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={isPopped || disabled}
                            onClick={() => handlePop(opt)}
                            className={[
                                "absolute select-none",
                                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80",
                                isPopped
                                    ? "pointer-events-none scale-[2] opacity-0 transition-all duration-300"
                                    : "cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-95",
                            ].join(" ")}
                            style={{
                                left: `${startX}%`,
                                top: `${startY}%`,
                                animation: !isPopped
                                    ? `balloonFloat ${driftDur}s ease-in-out infinite alternate`
                                    : undefined,
                                animationDelay: `${rng(opt.id, "delay") * -3}s`,
                                "--amp": `${driftAmp}px`,
                            }}
                            aria-label={`Pop balloon: ${opt.word}`}
                        >
                            <div
                                className="relative flex flex-col items-center"
                                style={{ width: balloonSize }}
                            >
                                {/* Oval body */}
                                <div
                                    className="relative flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[50%] px-1.5"
                                    style={{
                                        aspectRatio: "3/4",
                                        background: `radial-gradient(circle at 35% 30%, ${pal.from}, ${pal.to})`,
                                        boxShadow: `0 8px 20px ${pal.shadow}, inset 0 -4px 8px rgba(0,0,0,0.18)`,
                                        outline: isCorrect ? "3px solid white" : undefined,
                                        outlineOffset: isCorrect ? "2px" : undefined,
                                    }}
                                >
                                    {/* Glare */}
                                    <div
                                        className="pointer-events-none absolute rounded-full"
                                        style={{
                                            top: "10%",
                                            left: "18%",
                                            width: "32%",
                                            height: "22%",
                                            background: pal.shine,
                                            filter: "blur(2px)",
                                        }}
                                        aria-hidden="true"
                                    />

                                    {opt.imagePath && (
                                        <SmartImage
                                            src={opt.imagePath}
                                            label={opt.word}
                                            className="overflow-hidden rounded-full bg-white/20"
                                            style={{
                                                width: "clamp(28px,7vw,40px)",
                                                height: "clamp(28px,7vw,40px)",
                                            }}
                                            imgClassName="w-full h-full object-contain"
                                        />
                                    )}

                                    <span
                                        className="z-10 break-words text-center font-black uppercase leading-tight tracking-wide text-white drop-shadow"
                                        style={{
                                            fontSize: "clamp(0.5rem, 1.8vw, 0.75rem)",
                                            maxWidth: "88%",
                                        }}
                                    >
                                        {opt.word}
                                    </span>
                                </div>

                                {/* String */}
                                <div
                                    className="mx-auto h-4 w-px bg-gray-400/60 sm:h-5"
                                    aria-hidden="true"
                                />

                                {/* Status pip */}
                                {isCorrect && (
                                    <div className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[10px] font-black text-white shadow">
                                        ✓
                                    </div>
                                )}
                                {isWrong && (
                                    <div className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-black text-white shadow">
                                        ✕
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <style>{`
                @keyframes balloonFloat {
                    0%   { transform: translateY(0) rotate(-2.5deg); }
                    100% { transform: translateY(calc(-1 * var(--amp, 28px))) rotate(2.5deg); }
                }
            `}</style>
        </div>
    );
};

export default BalloonPopRound;
