import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

const TEXT_EMOJIS = {
    mum: "👩",
    mom: "👩",
    dad: "👨",
    brother: "🧒",
    sister: "👧",
    boy: "👦",
    girl: "👧",
    friend: "🤝",
    family: "👨‍👩‍👧‍👦",
    one: "1️⃣",
    two: "2️⃣",
    three: "3️⃣",
    four: "4️⃣",
    five: "5️⃣",
    six: "6️⃣",
    seven: "7️⃣",
    eight: "8️⃣",
    nine: "9️⃣",
    ten: "🔟",
    red: "🟥",
    blue: "🟦",
    green: "🟩",
    yellow: "🟨",
    orange: "🟧",
    purple: "🟪",
    pink: "🌸",
    brown: "🟫",
    book: "📖",
    pen: "🖊️",
    pencil: "✏️",
    ruler: "📏",
    crayon: "🖍️",
    bag: "🎒",
    eraser: "🧽",
    cat: "🐱",
    dog: "🐶",
    apple: "🍎",
    hello: "👋",
    hi: "👋",
    goodbye: "👋",
    sun: "☀️",
    star: "⭐",
    bird: "🐦",
    fish: "🐠",
    rabbit: "🐰",
    horse: "🐴",
    cow: "🐄",
    banana: "🍌",
    grape: "🍇",
    bread: "🍞",
    milk: "🥛",
    egg: "🥚",
    head: "🗣️",
    eye: "👁️",
    nose: "👃",
    mouth: "👄",
    hand: "✋",
    happy: "😊",
    sad: "😢",
    run: "🏃",
    jump: "🤸",
    swim: "🏊",
    house: "🏠",
    door: "🚪",
    bed: "🛏️",
    chair: "🪑",
    table: "🪑",
    shirt: "👕",
    shoes: "👟",
    hat: "👒",
    dress: "👗",
    tree: "🌳",
    flower: "🌸",
    cloud: "☁️",
    rain: "🌧️",
    moon: "🌙",
};

const CARD_COLORS = [
    { from: "#EDE9FE", to: "#DDD6FE", text: "#5B21B6" },
    { from: "#DBEAFE", to: "#BFDBFE", text: "#1E40AF" },
    { from: "#D1FAE5", to: "#A7F3D0", text: "#065F46" },
    { from: "#FEF3C7", to: "#FDE68A", text: "#92400E" },
    { from: "#FCE7F3", to: "#FBCFE8", text: "#9D174D" },
    { from: "#CFFAFE", to: "#A5F3FC", text: "#164E63" },
    { from: "#FFE4E6", to: "#FECDD3", text: "#9F1239" },
    { from: "#E0E7FF", to: "#C7D2FE", text: "#3730A3" },
    { from: "#CCFBF1", to: "#99F6E4", text: "#134E4A" },
    { from: "#FFEDD5", to: "#FED7AA", text: "#9A3412" },
];

function hashStr(str) {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

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
 * OptionCard v8 — unified card for all game modes.
 *
 * - Image cards: full-bleed picture with word ribbon at bottom.
 * - Text-only cards: emoji + bold word on a deterministic gradient.
 * - Speaker chip: always visible top-left.
 * - State ring/shadow system: idle → correct → wrong → disabled.
 * - Removed "TAP" badge — hover lift is sufficient affordance.
 * - Aspect ratio: always square for consistent grid alignment.
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

    const colorScheme = CARD_COLORS[hashStr(label || "") % CARD_COLORS.length];
    const isTextOnly = !imagePath;
    const textEmoji = isTextOnly ? pickTextEmoji(label) : null;

    const stateStyles = {
        idle: {
            ring: "ring-[3px] ring-purple-300/80 hover:ring-purple-500 hover:ring-4",
            shadow: "shadow-[0_4px_14px_rgba(124,58,237,0.18),0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_28px_rgba(124,58,237,0.32)]",
            transform:
                "hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.97] active:translate-y-0",
            bg: "",
            cursor: "cursor-pointer",
            overlay: null,
        },
        correct: {
            ring: "ring-4 ring-emerald-500",
            shadow: "shadow-[0_0_0_6px_rgba(16,185,129,0.18),0_8px_24px_rgba(16,185,129,0.28)] scale-[1.04] z-10",
            transform: "",
            bg: "",
            cursor: "",
            overlay: "absolute inset-0 bg-emerald-400/15 z-0",
        },
        wrong: {
            ring: "ring-[3px] ring-rose-400",
            shadow: "",
            transform: "scale-[0.96]",
            bg: "",
            cursor: "cursor-not-allowed",
            overlay: "absolute inset-0 bg-rose-400/10 z-0",
        },
        disabled: {
            ring: "ring-2 ring-gray-200/80",
            shadow: "",
            transform: "",
            bg: "",
            cursor: "cursor-not-allowed",
            overlay: null,
        },
    };

    const s = stateStyles[state] || stateStyles.idle;

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
            await speakWord({ wordId: wordId || audioClip?.wordId || null, label, audioClip });
        } catch (_) {}
        setSpeaking(false);
    };

    const canSpeak = showAudio && (audioClip?.src || audioClip?.tts || label);

    const cardBg = isTextOnly
        ? { background: `linear-gradient(145deg, ${colorScheme.from}, ${colorScheme.to})` }
        : { background: "linear-gradient(145deg, #ffffff, #faf5ff)" };

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            style={cardBg}
            className={[
                "group relative select-none overflow-hidden",
                "aspect-square w-full rounded-2xl",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400",
                s.ring,
                s.shadow,
                s.transform,
                s.cursor,
                state === "wrong" || state === "disabled" ? "opacity-55" : "opacity-100",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            aria-label={`Pick ${label || "this option"}`}
        >
            {/* State colour overlay */}
            {s.overlay && <div className={s.overlay} aria-hidden="true" />}

            {/* Text-only tile */}
            {isTextOnly ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-2">
                    {textEmoji && (
                        <span
                            className="select-none leading-none drop-shadow-sm"
                            style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)" }}
                        >
                            {textEmoji}
                        </span>
                    )}
                    <span
                        className="break-words text-center font-black uppercase leading-tight tracking-wide"
                        style={{ fontSize: "clamp(0.7rem, 3vw, 1rem)", color: colorScheme.text }}
                    >
                        {label}
                    </span>
                </div>
            ) : (
                /* Image tile */
                <SmartImage
                    src={imagePath}
                    label={label}
                    className="absolute inset-0 z-10 h-full w-full"
                    imgClassName="w-full h-full object-contain p-2.5 sm:p-3 group-hover:scale-[1.06] transition-transform duration-300"
                />
            )}

            {/* Word ribbon — image cards only */}
            {showLabel && label && !isTextOnly && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#160035]/75 via-[#160035]/25 to-transparent px-2 pb-1.5 pt-4">
                    <span
                        className="block truncate text-center font-black uppercase tracking-wide text-white drop-shadow"
                        style={{ fontSize: "clamp(0.6rem, 2.4vw, 0.85rem)" }}
                    >
                        {label}
                    </span>
                </div>
            )}

            {/* Speaker chip — always visible top-left */}
            {canSpeak && (
                <div
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label={`Listen to "${label}"`}
                    title={`Listen to "${label}"`}
                    className={[
                        "absolute left-1.5 top-1.5 z-30 sm:left-2 sm:top-2",
                        "h-7 w-7 rounded-full sm:h-8 sm:w-8",
                        "flex items-center justify-center text-xs sm:text-sm",
                        "cursor-pointer border-2 border-white shadow-md",
                        "transition-all duration-150",
                        speaking
                            ? "scale-110 bg-amber-400 text-white"
                            : "bg-emerald-500 text-white hover:scale-110 hover:bg-emerald-600 active:scale-95",
                    ].join(" ")}
                >
                    {speaking ? "⏸" : "🔊"}
                </div>
            )}

            {/* Correct tick */}
            {state === "correct" && (
                <div className="absolute right-1.5 top-1.5 z-30 flex h-7 w-7 animate-bounce items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-black text-white shadow-lg sm:right-2 sm:top-2 sm:h-8 sm:w-8">
                    ✓
                </div>
            )}

            {/* Wrong cross */}
            {state === "wrong" && (
                <div className="absolute right-1.5 top-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-sm font-black text-white shadow-lg sm:right-2 sm:top-2 sm:h-8 sm:w-8">
                    ✕
                </div>
            )}
        </button>
    );
};

export default OptionCard;
