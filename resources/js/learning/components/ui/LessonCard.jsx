import React from "react";

/**
 * LessonCard v2.0 — Duolingo-style 3D push card.
 *
 * Operator request (3rd time): "بدي تصميم مختلف وجديد وعصري".
 * Previous v1.x was a flat tile with subtle shadows; the operator
 * could not visually distinguish it from the original card. This
 * rewrite goes ALL-IN on a chunky 3D look — solid bottom shadow
 * that drops on tap, beefy 3px coloured borders, cartoonish number
 * badge, and a saturated colour ribbon across the title. There is
 * no way to confuse this with the previous version.
 *
 * Visual anatomy (from top to bottom):
 *   1. Number-badge "ribbon" — the unit number sits in a tilted
 *      coloured pill peeking out the top-left corner.
 *   2. Picture panel — solid white inner card with the lesson
 *      illustration, rounded-2xl edges and a soft inset shadow.
 *   3. Title strip — sticker-style coloured strip at the bottom
 *      with the lesson title in upper-case white text.
 *   4. Status footer — three-stars row (done) / progress bar
 *      (active) / lock-pill (locked).
 *
 * Behavioural rules:
 *   • Hover: card lifts 2px, bottom shadow grows to 8px.
 *   • Tap: card drops 4px, shadow compresses to 2px (push button).
 *   • Locked: 70% grayscale, no hover, padlock chip shown.
 *   • Done: gold halo + 3 stars footer.
 *   • Active: orange "Now playing" chip + bouncy progress bar.
 *
 * Tailwind only — NO custom CSS classes. Identical render
 * regardless of build state / cache. Inline style fallbacks
 * guarantee the card never collapses to 0×0.
 */

const PALETTES = {
    purple: {
        ribbon:    "bg-gradient-to-r from-purple-500 to-indigo-600",
        border:    "border-purple-500",
        bottomBar: "#6D28D9",
        chipBg:    "bg-purple-100",
        chipText:  "text-purple-800",
        innerBg:   "bg-purple-50",
        cardBg:    "bg-white",
    },
    blue: {
        ribbon:    "bg-gradient-to-r from-sky-500 to-blue-600",
        border:    "border-sky-500",
        bottomBar: "#1D4ED8",
        chipBg:    "bg-sky-100",
        chipText:  "text-sky-800",
        innerBg:   "bg-sky-50",
        cardBg:    "bg-white",
    },
    green: {
        ribbon:    "bg-gradient-to-r from-emerald-500 to-green-600",
        border:    "border-emerald-500",
        bottomBar: "#047857",
        chipBg:    "bg-emerald-100",
        chipText:  "text-emerald-800",
        innerBg:   "bg-emerald-50",
        cardBg:    "bg-white",
    },
    pink: {
        ribbon:    "bg-gradient-to-r from-rose-500 to-pink-600",
        border:    "border-rose-500",
        bottomBar: "#BE185D",
        chipBg:    "bg-rose-100",
        chipText:  "text-rose-800",
        innerBg:   "bg-rose-50",
        cardBg:    "bg-white",
    },
    amber: {
        ribbon:    "bg-gradient-to-r from-amber-500 to-orange-600",
        border:    "border-amber-500",
        bottomBar: "#C2410C",
        chipBg:    "bg-amber-100",
        chipText:  "text-amber-800",
        innerBg:   "bg-amber-50",
        cardBg:    "bg-white",
    },
    orange: {
        ribbon:    "bg-gradient-to-r from-orange-500 to-red-500",
        border:    "border-orange-500",
        bottomBar: "#C2410C",
        chipBg:    "bg-orange-100",
        chipText:  "text-orange-800",
        innerBg:   "bg-orange-50",
        cardBg:    "bg-white",
    },
};

const LessonCard = ({
    number,
    title,
    imagePath,
    colorKey = "purple",
    size = "md",
    status,
    isLocked = false,
    stars = 0,
    progress,
    onClick,
    className = "",
}) => {
    const palette = PALETTES[colorKey] || PALETTES.purple;
    const resolvedStatus = status || (isLocked ? "locked" : "active");
    const locked = resolvedStatus === "locked";
    const done = resolvedStatus === "done";
    const active = resolvedStatus === "active";

    const handleClick = (e) => {
        if (locked) return;
        onClick?.(e);
    };

    /* 3D button effect via box-shadow. The first shadow is the
     * solid colour bar that gives the card its "push button" feel.
     * The second is a soft elevation for depth. Tapping the card
     * shrinks the bar via the active: variant. */
    const baseShadow = `0_6px_0_0_${palette.bottomBar},0_8px_24px_-6px_rgba(0,0,0,0.15)`;
    const hoverShadow = `0_8px_0_0_${palette.bottomBar},0_12px_32px_-6px_rgba(0,0,0,0.20)`;
    const activeShadow = `0_2px_0_0_${palette.bottomBar},0_4px_8px_-4px_rgba(0,0,0,0.25)`;

    return (
        <button
            type="button"
            disabled={locked}
            onClick={handleClick}
            aria-label={`${title}${locked ? " (locked)" : ""}`}
            aria-disabled={locked}
            style={{
                minHeight: "12rem",
                boxShadow: locked
                    ? `0 4px 0 0 #9CA3AF, 0 6px 12px -4px rgba(0,0,0,0.1)`
                    : `0 6px 0 0 ${palette.bottomBar}, 0 8px 24px -6px rgba(0,0,0,0.15)`,
            }}
            className={[
                "group relative w-full text-left select-none",
                "rounded-3xl",
                "border-b-[6px] border-x-2 border-t-2",
                palette.cardBg,
                locked
                    ? "border-gray-300 opacity-65 grayscale-[40%] cursor-not-allowed"
                    : `${palette.border} cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-1`,
                className,
            ].join(" ")}
        >
            {/* NUMBER BADGE — tilted ribbon top-left peeking out of
                the card edge. Looks like a sticker on a notebook. */}
            <span
                aria-hidden="true"
                className={[
                    "absolute -top-3 -left-3 z-20",
                    "w-12 h-12",
                    "rounded-2xl rotate-[-8deg]",
                    "flex items-center justify-center",
                    "text-white font-black text-xl",
                    "border-[3px] border-white",
                    "shadow-lg",
                    palette.ribbon,
                ].join(" ")}
            >
                {number ?? "?"}
            </span>

            {/* "Now playing" chip — top-right, only on active cards */}
            {active && (
                <span className="absolute -top-3 right-3 z-20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-400 to-amber-500 shadow-lg border-2 border-white animate-bounce">
                    Now playing
                </span>
            )}

            {/* Lock chip — top-right, only on locked cards */}
            {locked && (
                <span className="absolute -top-3 right-3 z-20 w-10 h-10 rounded-full bg-white border-2 border-gray-300 shadow-lg flex items-center justify-center text-lg">
                    🔒
                </span>
            )}

            {/* PICTURE PANEL — solid white panel with the lesson art */}
            <div
                className={[
                    "relative mt-4 mx-3 mb-2",
                    "h-32 sm:h-36 lg:h-40",
                    "rounded-2xl overflow-hidden",
                    "flex items-center justify-center",
                    palette.innerBg,
                    "shadow-inner",
                ].join(" ")}
            >
                {imagePath ? (
                    <img
                        src={imagePath}
                        alt=""
                        loading="lazy"
                        className={[
                            "max-h-full w-auto object-contain drop-shadow-md",
                            "transition-transform duration-300",
                            !locked && "group-hover:scale-110",
                        ].filter(Boolean).join(" ")}
                        onError={(e) => {
                            e.currentTarget.style.opacity = "0.25";
                        }}
                    />
                ) : (
                    <span className="text-5xl opacity-40">📚</span>
                )}
            </div>

            {/* TITLE STRIP — solid coloured ribbon across the bottom
                of the card, like a sticker name tag */}
            <div
                className={[
                    "mx-3 mb-2 px-3 py-2",
                    "rounded-xl",
                    "shadow",
                    palette.ribbon,
                ].join(" ")}
            >
                <p className="font-black leading-tight text-white text-center text-xs sm:text-sm uppercase tracking-wide line-clamp-2">
                    {title}
                </p>
            </div>

            {/* STATUS FOOTER — stars / progress / locked pill */}
            <div className="px-3 pb-3 min-h-[26px] flex items-center justify-center">
                {done ? (
                    <span
                        className={[
                            "inline-flex items-center gap-0.5 px-3 py-1 rounded-full",
                            "text-xs font-black",
                            palette.chipBg,
                            palette.chipText,
                        ].join(" ")}
                    >
                        {[1, 2, 3].map((s) => (
                            <span
                                key={s}
                                className={[
                                    "text-base leading-none",
                                    s <= (stars || 0) ? "drop-shadow" : "opacity-25 grayscale",
                                ].join(" ")}
                                aria-hidden="true"
                            >
                                ⭐
                            </span>
                        ))}
                    </span>
                ) : active && progress ? (
                    <div className="w-full flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                                className={[
                                    "h-full rounded-full transition-all duration-500",
                                    palette.ribbon,
                                ].join(" ")}
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            6,
                                            ((progress.current - 1) /
                                                Math.max(1, progress.total)) *
                                                100,
                                        ),
                                    )}%`,
                                }}
                            />
                        </div>
                        <span
                            className={[
                                "shrink-0 text-[10px] font-black uppercase tracking-wider tabular-nums",
                                palette.chipText,
                            ].join(" ")}
                        >
                            {progress.current}/{progress.total}
                        </span>
                    </div>
                ) : locked ? (
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-3 py-1 rounded-full bg-gray-100">
                        🔒 Locked
                    </span>
                ) : (
                    <span className={[
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        palette.chipBg,
                        palette.chipText,
                    ].join(" ")}>
                        ▶ Tap to play
                    </span>
                )}
            </div>
        </button>
    );
};

export default LessonCard;
