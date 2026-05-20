import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * Curated word→emoji map for text-only OptionCard tiles. Kept in
 * sync with WORD_EMOJIS in SmartImage.jsx and the EMOJI_MAP in
 * WordImageController so the kid sees the same icon everywhere.
 * Limited to the most common Team Together 1A vocabulary because
 * this map only fires when the round is image-to-word / listen-then-
 * spell — a small slice of total cards.
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
    return null; // no emoji — show plain text
};

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * Layout v5 fixes (per operator feedback May 2026):
 *  • Text-only cards (image-to-word / listen-then-spell) now show
 *    a curated emoji ABOVE the word so the card has visual
 *    interest — was just a coloured square with the word text.
 *  • Idle cards have a thicker dashed ring so the kid recognises
 *    them as buttons even on the SVG fallback. Operator complaint
 *    was that fallback tiles "looked decorative".
 *  • Picture cards keep the full-bleed image; speaker chip and
 *    label ribbon overlay the corners as before.
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
        idle:     "ring-2 ring-purple-200 ring-dashed shadow-md hover:ring-purple-400 hover:shadow-xl hover:-translate-y-1",
        correct:  "ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/60 scale-[1.04] z-10",
        wrong:    "ring-2 ring-rose-300 opacity-50 grayscale scale-[0.97] cursor-not-allowed",
        disabled: "ring-1 ring-gray-200 opacity-60 cursor-not-allowed",
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
                rounded-xl sm:rounded-2xl
                aspect-square sm:aspect-[4/3]
                bg-white transition-all duration-300
                ${stateBorder}
                ${className}
            `}
        >
            {/* Picture / text tile fills the whole card. No padding
                so illustrations read full-bleed; the SmartImage
                fallback gradient already adds visual interest.
                Text-only tiles also get an emoji above the word so
                the card never looks like a flat coloured square. */}
            {isTextOnly ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 px-2 gap-1 sm:gap-2">
                    {textEmoji ? (
                        <span className="text-3xl sm:text-4xl lg:text-5xl drop-shadow-sm leading-none">
                            {textEmoji}
                        </span>
                    ) : null}
                    <span className="text-sm sm:text-lg lg:text-xl font-black uppercase tracking-tight text-[#1E293B] text-center break-words leading-tight">
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
