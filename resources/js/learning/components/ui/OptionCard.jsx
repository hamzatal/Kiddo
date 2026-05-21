import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * v8 (May 2026, kiddo v1.1) — modernised, quieter, more consistent.
 *
 * Why we touched this again
 * ─────────────────────────
 * v7 fixed the "kid sees only the audio button" complaint by
 * cranking every visual signal up: thick purple ring, animated
 * pulse halo, bouncing TAP chip, heavy bottom ribbon. It worked,
 * but the cards now read as *busy* against the rest of the modern
 * card system (LessonCard, GameShell, etc.). Operator's v1.1
 * feedback: "العاب جودة عالية وتصميم عصري ومرتب".
 *
 * v8 strips the noise without losing the legibility:
 *   • Single-layer ring (no more ring + shadow + pulse stack).
 *   • `kiddo-lift` shared lift token so the hover feel matches
 *     LessonCard exactly.
 *   • Soft pulse uses the new (quieter) optionPulse keyframe.
 *   • TAP badge is smaller, sits flush in the top-right corner,
 *     uses the same purple chip shape as our progress pills.
 *   • Bottom label ribbon switched to a subtle dark-purple
 *     gradient with rounded-bottom that hugs the card border —
 *     the previous opaque purple slab competed with the picture.
 *   • New `winFlash` celebration on correct picks: a quick gold
 *     halo + scale that telegraphs success in 350ms before the
 *     parent advances to the next round.
 *   • `compact` prop for the dense Arena grid where the TAP chip
 *     would otherwise overlap a small card.
 */

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

const OptionCard = ({
    imagePath,
    label,
    audioClip,
    wordId,
    state = "idle",
    onClick,
    showLabel = true,
    showAudio = true,
    compact = false,
    className = "",
}) => {
    const [speaking, setSpeaking] = useState(false);

    // Layered state classes. Idle is intentionally quiet — single
    // thick ring + soft surface gradient. Hover/focus uses the
    // shared `kiddo-lift` so it matches LessonCard. Correct/wrong
    // are loud on purpose so feedback registers in 200ms.
    const stateClasses = {
        idle:
            "kiddo-lift cursor-pointer " +
            "ring-[3px] ring-purple-200 hover:ring-purple-500 " +
            "bg-gradient-to-br from-white via-purple-50/70 to-indigo-50/80 " +
            "shadow-[0_4px_14px_-4px_rgba(124,58,237,0.18)] " +
            "animate-optionPulse",
        correct:
            "ring-[4px] ring-emerald-500 " +
            "bg-gradient-to-br from-emerald-50 via-white to-emerald-100 " +
            "shadow-[0_14px_36px_-8px_rgba(16,185,129,0.55)] " +
            "scale-[1.04] z-10 animate-correctPop",
        wrong:
            "ring-[3px] ring-rose-400 " +
            "bg-gradient-to-br from-rose-50 via-white to-rose-50 " +
            "opacity-65 grayscale scale-[0.97] cursor-not-allowed animate-shake",
        disabled:
            "ring-2 ring-gray-200 bg-white/90 opacity-55 cursor-not-allowed",
    }[state];

    const isTextOnly = !imagePath;
    const textEmoji = isTextOnly ? pickTextEmoji(label) : null;
    const isIdle = state === "idle";

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
                ${stateClasses}
                ${className}
            `}
            aria-label={`Pick ${label || "this option"}`}
        >
            {/* Picture / text tile fills the whole card. */}
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
                    imgClassName="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-300"
                />
            )}

            {/* Bottom label ribbon — modern: subtle dark gradient
                that hugs the bottom corners. Hidden for text-only
                tiles (the word is already centred there). */}
            {showLabel && label && !isTextOnly ? (
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-2 bg-gradient-to-t from-purple-900/75 via-purple-900/35 to-transparent"
                >
                    <span className="block text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-white text-center truncate drop-shadow">
                        {label}
                    </span>
                </div>
            ) : null}

            {/* "TAP" chip — only on idle, top-right, smaller and
                tidier than v7. Uses our shared purple chip palette
                so it visually rhymes with the progress pills in
                AppHeader and StageBreadcrumb. */}
            {isIdle && !compact && (
                <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md border-2 border-white animate-tapBadge pointer-events-none"
                >
                    Tap
                </span>
            )}

            {/* Speaker chip — overlay top-left so it never affects
                layout. Smaller in compact mode for the Arena's
                3-card row. */}
            {canSpeak ? (
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`
                        absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20
                        rounded-full flex items-center justify-center
                        text-sm sm:text-base shadow-md border-2 border-white
                        transition-all cursor-pointer
                        ${compact ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-9 sm:h-9"}
                        ${speaking
                            ? "bg-amber-400 text-white scale-110"
                            : "bg-emerald-500 text-white opacity-90 group-hover:opacity-100 hover:scale-110 active:scale-95"
                        }
                    `}
                    title={`Listen to "${label}"`}
                    aria-label={`Listen to ${label}`}
                >
                    {speaking ? "⏸" : "🔊"}
                </span>
            ) : null}

            {/* Status pill — top-right, replaces the TAP chip once
                the user has answered. */}
            {state === "correct" && (
                <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-emerald-500 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg animate-bounce text-base"
                >
                    ✓
                </span>
            )}
            {state === "wrong" && (
                <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 bg-rose-500 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black border-2 border-white shadow-lg text-base"
                >
                    ✕
                </span>
            )}

            {/* Gold "win flash" halo on the correct pick — fires
                via animate-correctPop applied to the card itself
                AND a quick translucent overlay so the success feels
                like a small fireworks burst rather than a colour
                change. The overlay vanishes after 480ms. */}
            {state === "correct" && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-amber-300/0 via-amber-300/40 to-yellow-200/0 mix-blend-screen animate-fade-in"
                />
            )}
        </button>
    );
};

export default OptionCard;
