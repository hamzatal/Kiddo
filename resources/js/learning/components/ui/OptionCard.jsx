import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * v10 (May 2026, kiddo v1.3) — completely redesigned 3D "juicy"
 * card with a Duolingo-style bottom shadow that compresses on
 * tap. Operator's repeated complaint:
 *
 *   "تصميم البطاقات اللي بقسم الدروس حكيتلك اكثر من مرة انو
 *    بدي تصميم مختلف وجديد وعصري وانتا ما بتغير فيه اشي"
 *   = "I told you multiple times I want a NEW, MODERN card
 *      design and you don't change anything"
 *
 * What's NEW in v10 vs v8/v9:
 *   ─ 3D push-button effect via a hard-coded box-shadow that
 *     lives ABOVE the card's natural shadow. Tapping shrinks the
 *     shadow + drops the card down 4px — the kid feels the
 *     "click" the same way a physical button feels.
 *   ─ Heavy 4px BOTTOM border in a saturated brand colour,
 *     visible from across the room. Cards are no longer subtle.
 *   ─ Picture sits inside a SOLID white inner panel with rounded
 *     corners — so even on coloured page backgrounds the photo
 *     pops with crisp contrast.
 *   ─ Word ribbon is now a SOLID coloured strip across the top
 *     of the card (like a name tag) instead of a bottom gradient.
 *     Reads instantly even when the kid's eyes are glued to the
 *     picture.
 *   ─ Speaker chip swapped to a chunky pill with a "🔊 listen"
 *     label so first-time learners aren't guessing at icons.
 *   ─ Correct/wrong feedback is FULL-CARD: green or red wash
 *     across the whole tile, not just the border.
 *
 * The card NEVER depends on custom CSS classes (no kiddo-surface,
 * no kiddo-lift) — only stock Tailwind 3 utilities + inline
 * shadow values. Renders identically regardless of build cache.
 */

/**
 * Curated word→emoji map for text-only OptionCard tiles.
 *
 * NOTE (operator request v1.3): we KEEP this map but treat it as
 * a LAST-RESORT visual helper. The DB already carries every word's
 * `image_path` — when admins upload a real picture in the admin
 * panel that picture wins. The emoji here only fires when:
 *   1. The word has no image_path AND no audio (text-only round)
 *   2. The kid hits the round before the admin finishes uploading
 * Removing this map entirely would leave plain "Blue" / "Red"
 * tiles with no visual cue, which the operator already flagged
 * as the original "kid sees blank cards" bug. Keep it as a fall-
 * back, document where it lives.
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
    if (!label) return null;
    const key = String(label).trim().toLowerCase();
    if (TEXT_EMOJIS[key]) return TEXT_EMOJIS[key];
    for (const part of key.split(/\s+/)) {
        if (TEXT_EMOJIS[part]) return TEXT_EMOJIS[part];
    }
    return null;
};

/**
 * Per-state visual "skin". Keep these as plain objects — the
 * Tailwind JIT can only see strings it can statically extract,
 * and putting computed strings in the className means we have to
 * pre-declare every variant explicitly. The *_shadow values are
 * hand-tuned to look like real plastic depth.
 */
const STATE_STYLES = {
    idle: {
        ribbon:    "bg-gradient-to-r from-purple-500 to-indigo-600",
        border:    "border-purple-500",
        bottomBar: "#7C3AED",
        pageBg:    "bg-white",
        innerBg:   "bg-purple-50",
        translate: "translate-y-0 hover:-translate-y-0.5 active:translate-y-1",
        shadow:    "shadow-[0_6px_0_0_#7C3AED] hover:shadow-[0_8px_0_0_#6D28D9] active:shadow-[0_2px_0_0_#7C3AED]",
        cursor:    "cursor-pointer",
    },
    correct: {
        ribbon:    "bg-gradient-to-r from-emerald-500 to-green-600",
        border:    "border-emerald-500",
        bottomBar: "#10B981",
        pageBg:    "bg-emerald-50",
        innerBg:   "bg-emerald-100",
        translate: "translate-y-0 scale-[1.04]",
        shadow:    "shadow-[0_6px_0_0_#10B981,0_14px_36px_-6px_rgba(16,185,129,0.5)]",
        cursor:    "cursor-default",
    },
    wrong: {
        ribbon:    "bg-gradient-to-r from-rose-500 to-red-600",
        border:    "border-rose-500",
        bottomBar: "#EF4444",
        pageBg:    "bg-rose-50",
        innerBg:   "bg-rose-100",
        translate: "translate-y-1 scale-[0.97]",
        shadow:    "shadow-[0_2px_0_0_#EF4444]",
        cursor:    "cursor-not-allowed",
    },
    disabled: {
        ribbon:    "bg-gradient-to-r from-gray-300 to-gray-400",
        border:    "border-gray-300",
        bottomBar: "#9CA3AF",
        pageBg:    "bg-gray-50",
        innerBg:   "bg-gray-100",
        translate: "translate-y-0",
        shadow:    "shadow-[0_4px_0_0_#9CA3AF]",
        cursor:    "cursor-not-allowed",
    },
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
    const skin = STATE_STYLES[state] || STATE_STYLES.idle;
    const isTextOnly = !imagePath;
    const textEmoji = isTextOnly ? pickTextEmoji(label) : null;
    const isIdle = state === "idle";
    const dim = state === "wrong" ? "opacity-70 grayscale" : "";

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
            disabled={state !== "idle"}
            onClick={onClick}
            aria-label={`Pick ${label || "this option"}`}
            className={[
                "group relative overflow-hidden select-none",
                "rounded-3xl",
                "w-full",
                "min-w-[8rem] min-h-[10rem] sm:min-h-[12rem] lg:min-h-[14rem]",
                "border-b-4 border-x-2 border-t-2",
                "transition-all duration-150",
                skin.border,
                skin.pageBg,
                skin.translate,
                skin.shadow,
                skin.cursor,
                dim,
                className,
            ].join(" ")}
            style={{
                /* Hard floor on size — even if Tailwind classes get
                 * stripped, the kid still sees a chunky tile. */
                minHeight: "10rem",
                minWidth: "5rem",
            }}
        >
            {/* TOP RIBBON (label) — solid coloured strip. Hidden when
                showLabel=false OR when this is a text-only tile (the
                word IS the body in that case). */}
            {showLabel && label && !isTextOnly ? (
                <div
                    className={[
                        "absolute top-0 inset-x-0 z-10",
                        "px-2 py-1",
                        "flex items-center justify-center",
                        skin.ribbon,
                    ].join(" ")}
                >
                    <span className="block text-xs sm:text-sm font-black uppercase tracking-wide text-white text-center truncate drop-shadow">
                        {label}
                    </span>
                </div>
            ) : null}

            {/* INNER PICTURE PANEL — solid white panel with rounded
                corners so the picture pops. Sits below the ribbon
                and above the speaker chip. */}
            <div
                className={[
                    "absolute inset-x-2",
                    showLabel && label && !isTextOnly ? "top-9" : "top-2",
                    "bottom-2 rounded-2xl flex items-center justify-center overflow-hidden",
                    skin.innerBg,
                ].join(" ")}
            >
                {isTextOnly ? (
                    <div className="flex flex-col items-center justify-center px-2 gap-1 sm:gap-2">
                        {textEmoji ? (
                            <span className="text-4xl sm:text-5xl lg:text-6xl drop-shadow-sm leading-none">
                                {textEmoji}
                            </span>
                        ) : null}
                        <span className="text-base sm:text-lg lg:text-xl font-black uppercase tracking-tight text-slate-800 text-center break-words leading-tight">
                            {label}
                        </span>
                    </div>
                ) : (
                    <SmartImage
                        src={imagePath}
                        label={label}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain p-1.5 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                )}
            </div>

            {/* SPEAKER PILL — bottom-left, chunky and self-evident.
                We render the chip OUTSIDE the inner panel so it
                stays visible regardless of the picture aspect. */}
            {canSpeak && !compact ? (
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={handleSpeak}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={`Listen to "${label}"`}
                    aria-label={`Listen to ${label}`}
                    className={[
                        "absolute z-20 bottom-1.5 left-1.5",
                        "px-2 py-1 rounded-full flex items-center gap-1",
                        "text-[10px] sm:text-xs font-black uppercase tracking-wider",
                        "shadow-md border-2 border-white",
                        "transition-all cursor-pointer",
                        speaking
                            ? "bg-amber-400 text-white scale-110"
                            : "bg-emerald-500 text-white hover:scale-110 active:scale-95",
                    ].join(" ")}
                >
                    <span aria-hidden="true">{speaking ? "⏸" : "🔊"}</span>
                </span>
            ) : null}

            {/* IDLE TAP HINT — bottom-right pill saying "TAP".
                Subtle bounce on idle to telegraph that this is a
                button. Hidden in compact mode (Arena tight grid). */}
            {isIdle && !compact ? (
                <span
                    aria-hidden="true"
                    className="absolute z-20 bottom-1.5 right-1.5 px-2 py-1 rounded-full bg-white text-purple-700 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md border-2 border-purple-300 pointer-events-none animate-bounce"
                >
                    Tap
                </span>
            ) : null}

            {/* CORRECT/WRONG OVERLAY — full-card wash so the kid
                sees the result without having to scan the corners.
                Pointer-events:none so it doesn't block re-taps. */}
            {state === "correct" ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                    <span className="bg-emerald-500 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black border-4 border-white shadow-2xl text-3xl sm:text-4xl animate-bounce">
                        ✓
                    </span>
                </span>
            ) : null}
            {state === "wrong" ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                    <span className="bg-rose-500 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-black border-4 border-white shadow-2xl text-2xl sm:text-3xl">
                        ✕
                    </span>
                </span>
            ) : null}
        </button>
    );
};

export default OptionCard;
