import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard - Reusable clickable card for game modes.
 *
 * Shows an image (with elegant fallback when missing) + optional
 * label. A small speaker button in the top-left lets the child hear
 * the word pronounced. The button uses `speakWord()` which:
 *
 *   1. plays the segment from the NCCD audio track when available,
 *   2. otherwise asks the server to synthesise a child-friendly
 *      OpenAI TTS clip and plays the cached mp3,
 *   3. otherwise falls back to the browser's speechSynthesis.
 *
 * Fully responsive: square on mobile, fixed height on tablet+.
 */
const OptionCard = ({
    imagePath,
    label,
    audioClip,
    wordId,
    state = "idle",      // idle | correct | wrong | disabled
    onClick,
    showLabel = true,
    showAudio = true,
    className = "",
}) => {
    const [speaking, setSpeaking] = useState(false);

    const base =
        "group relative p-3 sm:p-4 lg:p-5 bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all duration-300 shadow-sm flex flex-col items-center justify-center select-none";

    const stateClass = {
        idle:     "border-white hover:border-purple-300 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0",
        correct:  "border-green-500 bg-green-50 scale-105 z-10 shadow-2xl ring-4 ring-green-200 animate-[pop_0.4s_ease-out]",
        wrong:    "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed",
        disabled: "border-gray-100 opacity-60 cursor-not-allowed",
    }[state];

    /**
     * Play this word's audio. Stops propagation so tapping the speaker
     * doesn't count as a "pick this answer" click.
     */
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
            // The wordId is preferred — it lets the server reuse a
            // cached mp3 across kids. If it's missing, we still try
            // by-text synthesis using the label.
            await speakWord({
                wordId: wordId || audioClip?.wordId || null,
                label,
                audioClip,
            });
        } catch (_) {}
        setSpeaking(false);
    };

    // Show the speaker if we have anything pronounceable.
    const canSpeak = showAudio && (audioClip?.src || audioClip?.tts || label);

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            className={`${base} ${stateClass} aspect-square sm:aspect-auto sm:h-40 lg:h-44 xl:h-52 ${className}`}
        >
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <SmartImage
                    src={imagePath}
                    label={label}
                    className="w-full h-full"
                    imgClassName="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                />
            </div>

            {showLabel && label ? (
                <span className="mt-2 text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-gray-800 truncate max-w-full">
                    {label}
                </span>
            ) : null}

            {/* Speaker button — auto-generates TTS when there's no
                real audio for this word, so the child can always
                hear the pronunciation. */}
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
                <div className="absolute -top-3 -right-3 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg animate-bounce">
                    ✓
                </div>
            )}
            {state === "wrong" && (
                <div className="absolute -top-3 -right-3 bg-red-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg">
                    ✕
                </div>
            )}

            <style>{`
                @keyframes pop {
                    0% { transform: scale(0.92); }
                    60% { transform: scale(1.08); }
                    100% { transform: scale(1.05); }
                }
            `}</style>
        </button>
    );
};

export default OptionCard;
