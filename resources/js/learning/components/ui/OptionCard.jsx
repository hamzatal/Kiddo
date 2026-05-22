import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard v9 — modern "sticker" tappable card.
 *
 * What changed vs v8 (May 2026, operator feedback):
 *   "تصميم اخر غير التصميم الحالي لشكل بطاقات الخيارات لانو مش
 *    حلو ومش عصري ابدا" — old card relied on a thick coloured ring
 *   plus a soft glow and gradient. Pretty, but flat-feeling — kids
 *   couldn't sense the card was a button.
 *
 *   v9 replaces it with a Duolingo-style "3D button":
 *     • White card body, **thick lower border** (3-4px) in an
 *       accent colour, giving a solid offset shadow underneath.
 *     • On hover: the card lifts 1px and the offset shadow grows
 *       (looks like the card hovers over the floor).
 *     • On tap: the card "presses down" — translateY(2px) and the
 *       offset shadow shrinks to 1px. Feels like a real button.
 *     • Correct: lower border turns emerald, ✓ stamp at top-right
 *       with a brief sparkle burst (ambient celebration).
 *     • Wrong: gentle shake + the lower border turns rose.
 *     • Idle: a slow ambient float so the cards feel "alive" — kids
 *       see them as inviting, not static.
 *
 * Behaviour, props, and state machine are unchanged so every game
 * mode keeps working without modification.
 */

const TEXT_EMOJIS = {
    mum: "👩", mom: "👩", dad: "👨", brother: "🧒", sister: "👧",
    boy: "👦", girl: "👧", friend: "🤝", family: "👨‍👩‍👧‍👦",
    one: "1️⃣", two: "2️⃣", three: "3️⃣", four: "4️⃣", five: "5️⃣",
    six: "6️⃣", seven: "7️⃣", eight: "8️⃣", nine: "9️⃣", ten: "🔟",
    red: "🟥", blue: "🟦", green: "🟩", yellow: "🟨", orange: "🟧",
    purple: "🟪", pink: "🌸", brown: "🟫",
    book: "📖", pen: "🖊️", pencil: "✏️", ruler: "📏", crayon: "🖍️",
    bag: "🎒", eraser: "🧽",
    cat: "🐱", dog: "🐶", apple: "🍎", hello: "👋", hi: "👋", goodbye: "👋",
    sun: "☀️", star: "⭐",
    bird: "🐦", fish: "🐠", rabbit: "🐰", horse: "🐴", cow: "🐄",
    banana: "🍌", grape: "🍇", bread: "🍞", milk: "🥛", egg: "🥚",
    head: "🗣️", eye: "👁️", nose: "👃", mouth: "👄", hand: "✋",
    happy: "😊", sad: "😢",
    run: "🏃", jump: "🤸", swim: "🏊",
    house: "🏠", door: "🚪", bed: "🛏️", chair: "🪑", table: "🪑",
    shirt: "👕", shoes: "👟", hat: "👒", dress: "👗",
    tree: "🌳", flower: "🌸", cloud: "☁️", rain: "🌧️", moon: "🌙",
};

/**
 * Six pastel colour schemes — each card on a quiz page picks one
 * deterministically from its label hash so a child sees variety
 * across a 4-card row without us having to pass a colour prop.
 *
 * Each scheme provides:
 *   surface – flat pastel background
 *   border  – the thick lower border that gives the 3-D feel
 *   text    – brand text colour (~#xxx 700)
 *   shadow  – the offset shadow rgb (matches `border`, slightly
 *             darker), used in the `box-shadow` to sit BELOW the
 *             card — that's what makes it look like a 3-D button
 */
const CARD_SCHEMES = [
    { surface: "#F5F3FF", border: "#7C3AED", text: "#5B21B6", shadow: "#5B21B6", glow: "rgba(124,58,237,0.18)" },
    { surface: "#EFF6FF", border: "#3B82F6", text: "#1E40AF", shadow: "#1E3A8A", glow: "rgba(59,130,246,0.18)" },
    { surface: "#ECFDF5", border: "#10B981", text: "#047857", shadow: "#065F46", glow: "rgba(16,185,129,0.18)" },
    { surface: "#FEF3C7", border: "#F59E0B", text: "#92400E", shadow: "#78350F", glow: "rgba(245,158,11,0.18)" },
    { surface: "#FCE7F3", border: "#EC4899", text: "#9D174D", shadow: "#831843", glow: "rgba(236,72,153,0.18)" },
    { surface: "#CFFAFE", border: "#06B6D4", text: "#155E75", shadow: "#164E63", glow: "rgba(6,182,212,0.18)" },
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

    // Deterministic colour scheme — same word always gets the same
    // sticker colour across a session so kids can rely on it.
    const scheme = CARD_SCHEMES[hashStr(label || "") % CARD_SCHEMES.length];
    const isTextOnly = !imagePath;
    const textEmoji = isTextOnly ? pickTextEmoji(label) : null;

    // Resolve state styling — the offset shadow IS the 3-D look.
    // We compute it inline so each scheme picks up the right tint.
    const stateBorderColor =
        state === "correct" ? "#10B981" :
        state === "wrong"   ? "#F43F5E" :
        scheme.border;
    const stateShadowColor =
        state === "correct" ? "#065F46" :
        state === "wrong"   ? "#9F1239" :
        scheme.shadow;
    const stateSurface =
        state === "correct" ? "#ECFDF5" :
        state === "wrong"   ? "#FFE4E6" :
        isTextOnly ? scheme.surface : "#FFFFFF";

    /**
     * The offset shadow that gives the card its 3-D button feel.
     *
     *   idle/hover : 5px down — the card is "lifted off the page".
     *   pressed    : 1px down — the kid sees the card depress.
     *   correct    : 0px (flat) + green halo + scale up — celebrate.
     *   wrong      : 1px down — feels weighed down.
     *   disabled   : 2px down — neutral, no halo.
     */
    const buttonStyle = (() => {
        const base = {
            backgroundColor: stateSurface,
            borderColor: stateBorderColor,
            color: scheme.text,
            "--oc-shadow": stateShadowColor,
            "--oc-glow": scheme.glow,
        };
        if (state === "correct") {
            return {
                ...base,
                boxShadow:
                    `0 0 0 4px ${stateShadowColor}66,` +
                    ` 0 0 0 8px ${stateShadowColor}33,` +
                    ` 0 6px 18px ${stateShadowColor}55`,
                transform: "translateY(-2px) scale(1.04)",
            };
        }
        if (state === "wrong") {
            return {
                ...base,
                boxShadow: `0 1px 0 ${stateShadowColor}, 0 4px 10px ${scheme.glow}`,
                transform: "translateY(0)",
            };
        }
        if (state === "disabled") {
            return {
                ...base,
                boxShadow: `0 2px 0 ${stateShadowColor}80`,
                transform: "translateY(0)",
                opacity: 0.55,
            };
        }
        // idle
        return {
            ...base,
            boxShadow: `0 5px 0 ${stateShadowColor}, 0 9px 18px ${scheme.glow}`,
            transform: "translateY(0)",
        };
    })();

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

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            style={buttonStyle}
            className={[
                "oc-sticker",
                "group relative select-none overflow-visible",
                "aspect-square w-full rounded-[1.4rem]",
                "border-b-[6px]",
                "transition-all duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/60",
                state === "idle"  ? "oc-sticker--idle  hover:-translate-y-1 active:translate-y-[3px]" : "",
                state === "correct" ? "oc-sticker--correct" : "",
                state === "wrong"   ? "animate-shake" : "",
                state === "wrong" || state === "disabled" || state === "correct"
                    ? "cursor-default" : "cursor-pointer",
                className,
            ].filter(Boolean).join(" ")}
            aria-label={`Pick ${label || "this option"}`}
        >
            {/* Inner content surface — wraps the visual content so we
                can keep the thick lower border on the OUTER button
                without distorting the image's aspect ratio. */}
            <div className="absolute inset-0 rounded-[1.2rem] overflow-hidden">
                {/* Text-only tile */}
                {isTextOnly ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-2">
                        {textEmoji && (
                            <span
                                className="select-none leading-none drop-shadow-sm oc-emoji"
                                style={{ fontSize: "clamp(2rem, 9vw, 3rem)" }}
                            >
                                {textEmoji}
                            </span>
                        )}
                        <span
                            className="break-words text-center font-black uppercase leading-tight tracking-wide"
                            style={{ fontSize: "clamp(0.72rem, 3vw, 1.05rem)", color: scheme.text }}
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
                        imgClassName="w-full h-full object-contain p-4 sm:p-5 group-hover:scale-[1.06] transition-transform duration-300 oc-img"
                    />
                )}

                {/* Word ribbon — image cards only. White chip with
                    accent border, sits just above the bottom border
                    so it doesn't touch the 3-D edge. */}
                {showLabel && label && !isTextOnly && (
                    <div className="pointer-events-none absolute inset-x-2 bottom-1.5 z-20 flex justify-center">
                        <span
                            className="inline-block max-w-full truncate rounded-full bg-white/95 px-2.5 py-0.5 font-black uppercase tracking-wide shadow-sm"
                            style={{
                                fontSize: "clamp(0.62rem, 2.5vw, 0.85rem)",
                                color: scheme.text,
                                border: `1.5px solid ${scheme.border}66`,
                            }}
                        >
                            {label}
                        </span>
                    </div>
                )}
            </div>

            {/* Speaker chip — always visible top-left, sits ABOVE the
                inner clip box so the chip is never trimmed. */}
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

            {/* Correct ✓ stamp + sparkle burst */}
            {state === "correct" && (
                <>
                    <div className="absolute right-1.5 top-1.5 z-30 flex h-7 w-7 animate-bounce items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-black text-white shadow-lg sm:right-2 sm:top-2 sm:h-8 sm:w-8">
                        ✓
                    </div>
                    <span className="oc-sparkle-burst pointer-events-none" aria-hidden="true">
                        <span className="oc-spark oc-spark-tl">✨</span>
                        <span className="oc-spark oc-spark-tr">⭐</span>
                        <span className="oc-spark oc-spark-bl">⭐</span>
                        <span className="oc-spark oc-spark-br">✨</span>
                    </span>
                </>
            )}

            {/* Wrong ✕ stamp */}
            {state === "wrong" && (
                <div className="absolute right-1.5 top-1.5 z-30 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-sm font-black text-white shadow-lg sm:right-2 sm:top-2 sm:h-8 sm:w-8">
                    ✕
                </div>
            )}

            <style>{`
                /* Idle: subtle floating wiggle so the cards feel
                   "alive". Pauses on hover/focus so the kid's
                   target doesn't dance away. */
                .oc-sticker--idle { animation: oc-float 3.6s ease-in-out infinite; }
                .oc-sticker--idle:hover,
                .oc-sticker--idle:focus-visible { animation-play-state: paused; }
                @keyframes oc-float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50%      { transform: translateY(-2px) rotate(-0.4deg); }
                }

                /* Correct: brief celebration pop on top of the
                   transform we already applied via inline style. */
                .oc-sticker--correct { animation: oc-correct-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes oc-correct-pop {
                    0%   { transform: translateY(0) scale(1); }
                    35%  { transform: translateY(-6px) scale(1.10); }
                    70%  { transform: translateY(-1px) scale(1.04); }
                    100% { transform: translateY(-2px) scale(1.04); }
                }

                /* Image tile inner image — gentle idle bob to add
                   life to picture cards specifically. */
                .oc-sticker--idle .oc-img { animation: oc-img-bob 4s ease-in-out infinite; }
                @keyframes oc-img-bob {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-2px); }
                }

                /* Text-only emoji wiggle — even gentler (we don't
                   want it to compete with the float). */
                .oc-sticker--idle .oc-emoji { animation: oc-emoji-wiggle 3.4s ease-in-out infinite; }
                @keyframes oc-emoji-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    50%      { transform: rotate(-6deg); }
                }

                /* Sparkle burst on correct — four tiny stars shoot
                   outward from the card centre once. */
                .oc-sparkle-burst { position: absolute; inset: 0; z-index: 25; }
                .oc-spark {
                    position: absolute; top: 50%; left: 50%;
                    font-size: 22px;
                    will-change: transform, opacity;
                }
                .oc-spark-tl { animation: oc-spark-tl 800ms ease-out forwards; }
                .oc-spark-tr { animation: oc-spark-tr 800ms ease-out forwards; }
                .oc-spark-bl { animation: oc-spark-bl 800ms ease-out forwards; }
                .oc-spark-br { animation: oc-spark-br 800ms ease-out forwards; }
                @keyframes oc-spark-tl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-200%, -200%) scale(1.1) rotate(-30deg); opacity: 0; } }
                @keyframes oc-spark-tr { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate( 100%, -200%) scale(1.1) rotate( 30deg); opacity: 0; } }
                @keyframes oc-spark-bl { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(-200%,  100%) scale(1.1) rotate( 45deg); opacity: 0; } }
                @keyframes oc-spark-br { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate( 100%,  100%) scale(1.1) rotate(-45deg); opacity: 0; } }

                @media (prefers-reduced-motion: reduce) {
                    .oc-sticker--idle,
                    .oc-sticker--idle .oc-img,
                    .oc-sticker--idle .oc-emoji,
                    .oc-sticker--correct,
                    .oc-spark { animation: none !important; }
                }
            `}</style>
        </button>
    );
};

export default OptionCard;
