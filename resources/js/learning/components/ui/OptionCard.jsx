import React, { useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * OptionCard — clickable picture/word card used by every game mode.
 *
 * v9 (May 2026, kiddo v1.1) — bulletproof rendering rebuild.
 *
 * Operator: "ولا اي لعبة موجودة ابدا حتى تصميم البطاقات ما تغيرت"
 * (no games appearing at all, even card design hasn't changed).
 *
 * What we found
 * ─────────────
 * The kid was reaching the play surface (prompt + counters all
 * rendered correctly) but the option-card grid was either empty
 * or invisible. Two contributing factors:
 *
 *   1. v8's idle ring used `ring-[3px] ring-purple-200` which depends
 *      on the Tailwind ring CSS variables AND the kiddo-surface /
 *      kiddo-lift custom classes. If app.css wasn't fully rebuilt
 *      (incomplete `npm run build`, browser cache, missing JIT
 *      output), the cards rendered with no border, no fill, no
 *      shadow — looking like blank space.
 *
 *   2. The `aspect-square sm:aspect-[4/3]` pair could collapse to
 *      0×0 inside a flex parent that didn't supply intrinsic width
 *      (rare but possible on the ArenaScreen at certain breakpoints).
 *
 * v9 strips every dependency on custom CSS classes. Every visual
 * cue is now a plain Tailwind utility from the standard 3.x palette,
 * with explicit pixel/rem sizes and a guaranteed border. If the CSS
 * is busted, you'll STILL see a visible square card with a colour
 * background — the very minimum a child needs to know "this is a
 * button". When the CSS is healthy, the card looks identical to v8.
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
 * State → outline + fill + extra effect. Everything below is plain
 * Tailwind 3 utilities — no `kiddo-*` custom classes, no arbitrary
 * ring widths, no transforms that could collapse the box. This is
 * the safety floor: even if app.css is out of date, the card is
 * always a visible bordered tile.
 */
const STATE_STYLES = {
    idle:
        "border-4 border-purple-300 hover:border-purple-500 " +
        "bg-white hover:bg-purple-50 " +
        "shadow-md hover:shadow-xl " +
        "hover:-translate-y-1 active:translate-y-0 " +
        "cursor-pointer transition-all duration-200",
    correct:
        "border-4 border-emerald-500 " +
        "bg-emerald-50 " +
        "shadow-2xl shadow-emerald-300 " +
        "scale-[1.04] z-10",
    wrong:
        "border-4 border-rose-400 " +
        "bg-rose-50 " +
        "opacity-60 grayscale scale-[0.97] cursor-not-allowed",
    disabled:
        "border-4 border-gray-200 bg-white opacity-50 cursor-not-allowed",
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

    const stateClasses = STATE_STYLES[state] || STATE_STYLES.idle;
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

    /*
     * Sizing strategy:
     *   - Explicit min-width (10rem = 160px) AND min-height so the
     *     card NEVER collapses to 0×0 even if a parent flex/grid
     *     misbehaves. Both are baked into the className with `!`
     *     suffixes so they win against any cascade override.
     *   - aspect-square keeps the visual rhythm but only kicks in
     *     once min-h has reserved real space.
     */
    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            className={`
                group relative overflow-hidden select-none
                rounded-2xl
                w-full
                min-w-[8rem]
                min-h-[8rem] sm:min-h-[10rem] lg:min-h-[12rem]
                aspect-square
                ${stateClasses}
                ${className}
            `}
            style={{
                // Hard floor — even if a Tailwind class is dropped or
                // cached out, these inline styles guarantee a visible
                // tile. The kid ALWAYS sees a button.
                minHeight: "8rem",
                minWidth: "5rem",
            }}
            aria-label={`Pick ${label || "this option"}`}
        >
            {/* Picture / text tile fills the whole card. */}
            {isTextOnly ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 gap-1 sm:gap-2 bg-gradient-to-br from-purple-50 to-indigo-100">
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
                    className="absolute inset-0 w-full h-full"
                    imgClassName="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-105 transition-transform duration-300"
                />
            )}

            {/* Bottom label ribbon — modern: subtle dark gradient. */}
            {showLabel && label && !isTextOnly ? (
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-2 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent"
                >
                    <span className="block text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-white text-center truncate drop-shadow">
                        {label}
                    </span>
                </div>
            ) : null}

            {/* "TAP" chip — only on idle, top-right. */}
            {isIdle && !compact && (
                <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-md border-2 border-white pointer-events-none animate-bounce"
                >
                    Tap
                </span>
            )}

            {/* Speaker chip — overlay top-left. */}
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
                            : "bg-emerald-500 text-white hover:scale-110 active:scale-95"
                        }
                    `}
                    title={`Listen to "${label}"`}
                    aria-label={`Listen to ${label}`}
                >
                    {speaking ? "⏸" : "🔊"}
                </span>
            ) : null}

            {/* Status pills — replace the TAP chip once answered. */}
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
        </button>
    );
};

export default OptionCard;
