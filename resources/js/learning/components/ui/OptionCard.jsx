import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * Layout v4 fixes (per operator feedback):
 *  • Image frame is FULL-BLEED. We removed the heavy white border +
 *    inner padding so illustrations breathe edge-to-edge and look
 *    "fit to the card" instead of stamped inside a frame.
 *  • The picture itself is the dominant element. The label (when
 *    shown) sits in a translucent ribbon at the bottom of the card,
 *    overlaying the corner of the image rather than stealing height
 *    from it.
 *  • Speaker chip is also overlay-positioned so it doesn't push the
 *    image around. Shows up only when there's something playable.
 *  • State borders use a thin outline + state-coloured shadow ring
 *    so the visual cue lives outside the picture, not on top of it.
 *
 * Why each prop matters:
 *   • showLabel=false  — used by word-to-image / audio-to-image
 *                        rounds where revealing the word would
 *                        defeat the purpose of the round.
 *   • imagePath=null   — used by image-to-word / listen-then-spell
 *                        rounds where the OPTION is the answer
 *                        text, not a picture. We render a clean
 *                        text tile in that case.
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

    const stateBorder = {
        idle:     "ring-2 ring-white shadow-md hover:ring-purple-300 hover:shadow-xl hover:-translate-y-1",
        correct:  "ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/60 scale-[1.04] z-10",
        wrong:    "ring-2 ring-rose-300 opacity-50 grayscale scale-[0.97] cursor-not-allowed",
        disabled: "ring-1 ring-gray-200 opacity-60 cursor-not-allowed",
    }[state];

    const isTextOnly = !imagePath;

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
        } catch (_) { /* ignore */ }
        setSpeaking(false);
    };

    const canSpeak = showAudio && (audioClip?.src || audioClip?.tts || label);

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            className={`
                group relative overflow-hidden select-none
                rounded-xl sm:rounded-2xl
                aspect-square sm:aspect-[4/3]
                bg-white transition-all duration-300
                ${stateBorder}
                ${className}
            `}
        >
            {/* Picture / text tile fills the whole card. No padding
                so illustrations read full-bleed; the SmartImage
                fallback gradient already adds visual interest. */}
            {isTextOnly ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 px-2">
                    <span className="text-base sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-[#1E293B] text-center break-words leading-tight">
                        {label}
                    </span>
                </div>
            ) : (
                <SmartImage
                    src={imagePath}
                    label={label}
                    className="absolute inset-0 w-full h-full"
                    imgClassName="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform"
                />
            )}

            {/* Bottom label ribbon — only when the round style
                actually wants the word visible AND the option has
                a picture (text-only tiles already SHOW the word). */}
            {showLabel && label && !isTextOnly ? (
                <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-gradient-to-t from-black/55 via-black/35 to-transparent">
                    <span className="block text-[11px] sm:text-xs lg:text-sm font-black uppercase tracking-wide text-white text-center truncate drop-shadow">
                        {label}
                    </span>
                </div>
            ) : null}

            {/* Speaker chip — overlay top-left so it never affects layout */}
            {canSpeak ? (
                <div
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm shadow-md border-2 border-white z-20 cursor-pointer transition-all
                        ${speaking
                            ? "bg-amber-400 text-white scale-110"
                            : "bg-emerald-500/95 text-white opacity-85 group-hover:opacity-100 hover:scale-110 active:scale-95"
                        }`}
                    title={`Listen to "${label}"`}
                >
                    {speaking ? "⏸" : "🔊"}
                </div>
            ) : null}

            {/* Status pill — overlay top-right */}
            {state === "correct" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-emerald-500 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg animate-bounce text-sm">
                    ✓
                </div>
            )}
            {state === "wrong" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-rose-500 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg text-sm">
                    ✕
                </div>
            )}
        </button>
    );
};

export default OptionCard;
