import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard — clickable card for game modes (Kiddo v3).
 *
 * Shows an image (with elegant fallback when missing) + optional
 * label. A small speaker button in the top-left lets the child hear
 * the word pronounced.
 *
 * Layout v3:
 *  • Always `aspect-square` on phones, `aspect-[4/3]` on tablet+,
 *    so the grid lays out as an even matrix and the picture frame
 *    has consistent proportions.
 *  • Padding scales with size so big illustrations breathe and
 *    `object-contain` never crops the image edges.
 *  • Speaker button stays in the top-left even on tiny phones.
 */
const OptionCard = ({
    imagePath,
    label,
    audioClip,
    wordId,
    state = "idle",
    onClick,
    showLabel = true,
    showAudio = true,
    className = "",
}) => {
    const [speaking, setSpeaking] = useState(false);

    const base =
        "group relative p-2 sm:p-3 lg:p-4 bg-white/95 backdrop-blur rounded-xl sm:rounded-2xl border-2 sm:border-[3px] transition-all duration-300 shadow-sm flex flex-col items-center justify-center select-none";

    const stateClass = {
        idle:     "border-white hover:border-purple-300 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0",
        correct:  "border-green-500 bg-green-50 scale-105 z-10 shadow-2xl ring-4 ring-green-200",
        wrong:    "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed",
        disabled: "border-gray-100 opacity-60 cursor-not-allowed",
    }[state];

    const handleSpeak = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (speaking) {
            stopAllAudio();
            setSpeaking(false);
            return;
        }
        setSpeaking(true);
        try {
            await speakWord({
                wordId: wordId || audioClip?.wordId || null,
                label,
                audioClip,
            });
        } catch (_) {}
        setSpeaking(false);
    };

    const canSpeak = showAudio && (audioClip?.src || audioClip?.tts || label);

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            className={`${base} ${stateClass} aspect-square sm:aspect-[4/3] ${className}`}
        >
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <SmartImage
                    src={imagePath}
                    label={label}
                    className="w-full h-full"
                    imgClassName="max-w-full max-h-full object-contain drop-shadow group-hover:scale-105 transition-transform"
                />
            </div>

            {showLabel && label ? (
                <span className="mt-1.5 text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-wide text-gray-800 truncate max-w-full">
                    {label}
                </span>
            ) : null}

            {canSpeak ? (
                <div
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm shadow-md border-2 border-white transition-all z-20 cursor-pointer
                        ${speaking
                            ? "bg-amber-400 text-white scale-110"
                            : "bg-emerald-500 text-white opacity-80 group-hover:opacity-100 hover:scale-110 active:scale-95"
                        }`}
                    title={`Listen to "${label}"`}
                >
                    {speaking ? "⏸" : "🔊"}
                </div>
            ) : null}

            {state === "correct" && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-3 border-white shadow-lg animate-bounce text-sm">
                    ✓
                </div>
            )}
            {state === "wrong" && (
                <div className="absolute -top-2 -right-2 bg-red-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-3 border-white shadow-lg text-sm">
                    ✕
                </div>
            )}
        </button>
    );
};

export default OptionCard;
