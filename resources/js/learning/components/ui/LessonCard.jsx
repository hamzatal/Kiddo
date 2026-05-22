import React from "react";
import { cn } from "@/lib/cn";

/**
 * LessonCard — the canonical "this is a lesson" tile.
 *
 * v3 (May 2026) — restored the simpler, cleaner aesthetic that
 * operators preferred from the early-May design:
 *   "بدي ترجع شكل البطاقات الخاصة بالمراحل للشكل السابق لانه كان احلى بكثير"
 *
 * What changed vs v2:
 *   • SOLID pastel surface (no busy gradient) — the bg colour is
 *     now `kiddo-{tint}-100`, period. Easier on the eye, lets the
 *     image do the talking.
 *   • Number badge is a small chip pinned INSIDE the top-left
 *     corner of the card (no longer a floating circle hovering
 *     OUTSIDE the corner — that always looked like a clipping bug
 *     on smaller cards).
 *   • Title sits at the BOTTOM of the card in plain bold dark
 *     text — no transparent ribbon, no extra background panel.
 *   • Lock state is a single soft white circle centred on the
 *     image (matches the v0 design from Feb 2026).
 *   • Optional star strip + progress bar live in a small footer
 *     below the title only when we actually have data to show —
 *     so cards that don't track progress (marketing surfaces) stay
 *     visually clean.
 *   • Hover: subtle lift + soft star peek in the bottom-right
 *     corner (the "tap me!" affordance kids picked up on quickly).
 *
 * The full prop API is preserved so every existing caller keeps
 * working (Home, Map sidebar, admin lesson list).
 */

const PALETTES = {
    purple: {
        bg: "bg-purple-100",
        badge: "bg-purple-600",
        ring: "ring-purple-200/60 hover:ring-purple-400",
        hover: "hover:bg-purple-200/70",
        accent: "text-purple-700",
        bar: "from-purple-500 to-fuchsia-500",
    },
    blue: {
        bg: "bg-sky-100",
        badge: "bg-sky-600",
        ring: "ring-sky-200/60 hover:ring-sky-400",
        hover: "hover:bg-sky-200/70",
        accent: "text-sky-700",
        bar: "from-sky-500 to-blue-500",
    },
    green: {
        bg: "bg-emerald-100",
        badge: "bg-emerald-600",
        ring: "ring-emerald-200/60 hover:ring-emerald-400",
        hover: "hover:bg-emerald-200/70",
        accent: "text-emerald-700",
        bar: "from-emerald-500 to-green-500",
    },
    pink: {
        bg: "bg-rose-100",
        badge: "bg-rose-600",
        ring: "ring-rose-200/60 hover:ring-rose-400",
        hover: "hover:bg-rose-200/70",
        accent: "text-rose-700",
        bar: "from-rose-500 to-pink-500",
    },
    amber: {
        bg: "bg-amber-100",
        badge: "bg-amber-600",
        ring: "ring-amber-200/60 hover:ring-amber-400",
        hover: "hover:bg-amber-200/70",
        accent: "text-amber-700",
        bar: "from-amber-500 to-orange-500",
    },
};

const SIZES = {
    sm: { outer: "rounded-2xl p-2.5", image: "h-16 sm:h-20", badge: "h-6 w-6 text-[11px]", title: "text-[11px] sm:text-xs", footer: "text-[9px]" },
    md: { outer: "rounded-3xl p-3 sm:p-4", image: "h-24 sm:h-28 lg:h-32", badge: "h-7 w-7 text-[13px]", title: "text-xs sm:text-sm", footer: "text-[10px]" },
    lg: { outer: "rounded-[2rem] p-4 sm:p-5", image: "h-32 sm:h-40 lg:h-48", badge: "h-9 w-9 text-base", title: "text-sm sm:text-base lg:text-lg", footer: "text-[11px]" },
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
    const sz = SIZES[size] || SIZES.md;

    const resolvedStatus = status || (isLocked ? "locked" : "active");
    const locked = resolvedStatus === "locked";
    const done = resolvedStatus === "done";
    const active = resolvedStatus === "active";

    const handleClick = (e) => {
        if (locked) return;
        onClick?.(e);
    };

    const showFooter = (active && progress) || (done && stars > 0);

    return (
        <button
            type="button"
            disabled={locked}
            onClick={handleClick}
            aria-label={`${title}${locked ? " (locked)" : ""}`}
            aria-disabled={locked}
            className={cn(
                "group relative w-full h-full text-left select-none flex flex-col",
                "border-2 border-white shadow-md ring-2 transition-all duration-200 ease-out",
                sz.outer,
                palette.bg,
                locked
                    ? "ring-gray-200 opacity-65 grayscale-[40%] cursor-not-allowed"
                    : cn(palette.ring, palette.hover, "cursor-pointer hover:-translate-y-1.5 hover:shadow-xl"),
                className,
            )}
            style={{ minHeight: "10rem" }}
        >
            {/* Number badge — pinned INSIDE top-left, not floating
                outside. Looks intentional at every size. */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute left-2 top-2 z-20 inline-flex items-center justify-center",
                    "rounded-full font-black text-white shadow-md border-2 border-white",
                    palette.badge,
                    sz.badge,
                )}
            >
                {number ?? "?"}
            </span>

            {/* Done tick — tiny chip top-right, only on completed
                cards. Replaces the chunky "Now playing" bouncing
                tag from v2. */}
            {done && (
                <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow text-white text-[11px] font-black"
                >
                    ✓
                </span>
            )}

            {/* Image — centred, reasonable max height per size. */}
            <div className={cn("flex flex-1 items-center justify-center overflow-hidden", sz.image)}>
                {imagePath ? (
                    <img
                        src={imagePath}
                        alt=""
                        loading="lazy"
                        className={cn(
                            "h-full w-full object-contain drop-shadow-md transition-transform duration-300",
                            !locked && "group-hover:scale-105",
                        )}
                        onError={(e) => {
                            e.currentTarget.style.opacity = "0.25";
                        }}
                    />
                ) : (
                    <span className="text-3xl opacity-40">📚</span>
                )}
            </div>

            {/* Lock — soft white circle centred on the image, only
                shown for locked cards. Same visual the kids learned
                in v0. */}
            {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-[2px]">
                        <span aria-label="Locked" className="text-2xl">🔒</span>
                    </div>
                </div>
            )}

            {/* Title — plain bold dark text at the bottom of the
                card. No ribbon, no extra panel. */}
            <div className="mt-2 px-1 text-center">
                <p
                    className={cn(
                        "font-black leading-tight text-slate-900 line-clamp-2",
                        sz.title,
                    )}
                >
                    {title}
                </p>
            </div>

            {/* Optional footer — stars (done) OR progress (active).
                Renders nothing when there's no useful data, keeping
                marketing surfaces (where progress isn't passed)
                visually clean. */}
            {showFooter && (
                <div className="mt-1.5 px-1 flex items-center justify-center gap-1.5">
                    {done ? (
                        [1, 2, 3].map((s) => (
                            <span
                                key={s}
                                className={cn(
                                    sz.footer,
                                    s <= (stars || 0) ? "drop-shadow" : "opacity-25 grayscale",
                                )}
                                aria-hidden="true"
                            >
                                ⭐
                            </span>
                        ))
                    ) : (
                        <>
                            <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden border border-white">
                                <div
                                    className={cn(
                                        "h-full bg-gradient-to-r rounded-full transition-all duration-500",
                                        palette.bar,
                                    )}
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
                            <span className={cn("shrink-0 font-black uppercase tracking-wider tabular-nums", sz.footer, palette.accent)}>
                                {progress.current}/{progress.total}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Tap-to-play affordance — tiny star peek bottom-right
                on hover. The colour matches the palette so it never
                looks bolted on. */}
            {!locked && !done && (
                <span
                    className={cn(
                        "absolute bottom-2 right-2.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100",
                        palette.accent,
                    )}
                    aria-hidden="true"
                >
                    ⭐
                </span>
            )}
        </button>
    );
};

export default LessonCard;
