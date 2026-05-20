import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * Curated word→emoji map for text-only OptionCard tiles. Kept in
 * sync with WORD_EMOJIS in SmartImage.jsx and the EMOJI_MAP in
 * WordImageController so the kid sees the same icon everywhere.
 */
const TEXT_EMOJIS = {
    mum: "👩", mom: "👩", dad: "👨", brother: "🧒", sister: "👧",
    boy: "👦", girl: "👧", friend: "🤝", family: "👨‍👩‍👧‍👦",
    one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣",
    six: "6️⃣", seven: "7️⃣", eight: "8️⃣", nine: "9️⃣", ten: "🔟",
    red: "🟥", blue: "🟦", green: "🟩", yellow: "🟨",
    orange: "🟧", purple: "🟪", pink: "🌸", brown: "🟫",
    book: "📖", pen: "🖊️", pencil: "✏️", ruler: "📏", crayon: "🖍️",
    bag: "🎒", eraser: "🧽",
    cat: "🐱", dog: "🐶", apple: "🍎",
    hello: "👋", hi: "👋", goodbye: "👋",
    sun: "☀️", star: "⭐",
};

const pickTextEmoji = (label) => {
    if (!label) return "✨";
    const key = String(label).trim().toLowerCase();
    if (TEXT_EMOJIS[key]) return TEXT_EMOJIS[key];
    for (const part of key.split(/\s+/)) {
        if (TEXT_EMOJIS[part]) return TEXT_EMOJIS[part];
    }
    return null;
};

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * v7 (May 2026) — visibility overhaul.
 *   Operator complaint: "the page looks empty, kid only sees the
 *   audio button and the words 'Blue', 'Red' as plain text".
 *
 *   Root cause: previous styling was `bg-white` + a 2px purple
 *   ring on a near-white page background, with `aspect-square` the
 *   only height controller. On systems where Tailwind's aspect-
 *   ratio utility wasn't applied (older builds, missing CSS) the
 *   card collapsed to ~1 line tall, and even when sized correctly
 *   the white-on-white card was almost invisible at a glance.
 *
 *   This rewrite:
 *     • Replaces `bg-white` with a soft tinted gradient that
 *       contrasts against the page.
 *     • Bumps the idle ring from `ring-2 ring-purple-300` to
 *       `ring-4 ring-purple-400`, making the card border
 *       unmistakable on every theme.
 *     • Adds an explicit `min-h-[8rem] sm:min-h-[10rem]` fallback
 *       so even without Tailwind's aspect-ratio plugin the card
 *       has guaranteed vertical presence.
 *     • Adds a pulsing "TAP" badge in the top-right of every idle
 *       card so first-time learners have an unambiguous "this is
 *       a button" signal alongside the speaker chip.
 *     • Tightens the gradient/text contrast on the text-only
 *       fallback so 'Blue' / 'Red' / 'Mum' tiles read as buttons
 *       and not as labels stuck on a blank panel.
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

    const stateClasses = {
        idle:
            // Tidy modern look — soft 3-stop gradient on the surface,
            // a single thick purple ring (was 4px ring + 8px stacked
            // shadow which felt visually noisy), and a clean
            // elevation shadow that scales smoothly on hover. The
            // animated TAP badge already signals "this is a button"
            // so we don't need a heavy ring + halo combo on top.
            "ring-[3px] ring-purple-300 " +
            "shadow-[0_6px_18px_-4px_rgba(124,58,237,0.25)] " +
            "bg-gradient-to-br from-white via-purple-50/60 to-indigo-50 " +
            "hover:ring-purple-500 hover:ring-4 " +
            "hover:shadow-[0_12px_28px_-6px_rgba(124,58,237,0.45)] " +
            "hover:-translate-y-1 hover:scale-[1.03] " +
            "active:translate-y-0 active:scale-[0.98] " +
            "animate-optionPulse cursor-pointer",
        correct:
            "ring-4 ring-emerald-500 " +
            "shadow-[0_12px_30px_-6px_rgba(16,185,129,0.55)] " +
            "bg-gradient-to-br from-emerald-50 via-white to-emerald-100 " +
            "scale-[1.04] z-10 animate-correctPop",
        wrong:
            "ring-[3px] ring-rose-400 " +
            "bg-gradient-to-br from-rose-50 via-white to-rose-50 " +
            "opacity-60 grayscale scale-[0.97] cursor-not-allowed animate-shake",
        disabled:
            "ring-2 ring-gray-200 bg-white opacity-60 cursor-not-allowed",
    }[state];

    const isTextOnly = !imagePath;
    const textEmoji = isTextOnly ? pickTextEmoji(label) : null;

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
                rounded-2xl sm:rounded-3xl
                w-full
                min-h-[8rem] sm:min-h-[10rem] lg:min-h-[12rem]
                aspect-square sm:aspect-[4/3]
                transition-all duration-300
                ${stateClasses}
                ${className}
            `}
            aria-label={`Pick ${label || "this option"}`}
        >
            {/* Picture / text tile fills the whole card. No padding
                so illustrations read full-bleed. Text-only tiles
                centre an emoji + word over a tinted background. */}
            {isTextOnly ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 gap-1 sm:gap-2">
                    {textEmoji ? (
                        <span className="text-4xl sm:text-5xl lg:text-6xl drop-shadow-sm leading-none">
                            {textEmoji}
                        </span>
                    ) : null}
                    <span className="text-base sm:text-lg lg:text-xl font-black uppercase tracking-tight text-[#1E293B] text-center break-words leading-tight">
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

            {/* Bottom label ribbon — modernised with a subtle
                gradient (was an opaque black 65% ribbon that felt
                visually heavy on a kid-facing UI). The new ribbon
                blends into the card edge so the picture stays the
                hero and the word reads as a clean caption. */}
            {showLabel && label && !isTextOnly ? (
                <div className="absolute inset-x-0 bottom-0 px-2 pt-3 pb-1.5 bg-gradient-to-t from-purple-900/70 via-purple-900/30 to-transparent">
                    <span className="block text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-white text-center truncate drop-shadow">
                        {label}
                    </span>
                </div>
            ) : null}

            {/* "TAP" badge — pulses on idle cards so first-time
                learners have an unambiguous "this is a button"
                signal even when the picture/word looks decorative.
                Auto-hides on correct/wrong/disabled states. */}
            {state === "idle" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md border-2 border-white animate-tapBadge pointer-events-none z-10">
                    Tap
                </div>
            )}

            {/* Speaker chip — overlay top-left so it never affects layout */}
            {canSpeak ? (
                <div
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base shadow-md border-2 border-white z-20 cursor-pointer transition-all
                        ${speaking
                            ? "bg-amber-400 text-white scale-110"
                            : "bg-emerald-500 text-white opacity-90 group-hover:opacity-100 hover:scale-110 active:scale-95"
                        }`}
                    title={`Listen to "${label}"`}
                    aria-label={`Listen to ${label}`}
                >
                    {speaking ? "⏸" : "🔊"}
                </div>
            ) : null}

            {/* Status pill — overlay top-right (replaces TAP badge
                once the user has answered) */}
            {state === "correct" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-emerald-500 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg animate-bounce text-base z-20">
                    ✓
                </div>
            )}
            {state === "wrong" && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-rose-500 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg text-base z-20">
                    ✕
                </div>
            )}
        </button>
    );
};

export default OptionCard;
