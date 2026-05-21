import React from "react";
import { cn } from "@/lib/cn";

/**
 * LessonCard — the canonical "this is a lesson" tile, used by the
 * home page (`/`), the admin lesson list, and any future surface
 * that needs to render a unit/lesson preview.
 *
 * v1.2 (May 2026) — bulletproof rebuild.
 *   v1.1 used the new `kiddo-surface` / `kiddo-lift` custom classes
 *   defined in app.css. If app.css wasn't fully rebuilt (incomplete
 *   `npm run build`, browser caching, missing JIT output), the card
 *   rendered with no background and no shadow — looking like blank
 *   space. v1.2 replaces every custom class with stock Tailwind 3
 *   utilities so the card renders identically regardless of cache
 *   state.
 *
 * Props:
 *   number        — int|string, shown in the top-left badge
 *   title         — string
 *   imagePath     — string (PNG/JPG/SVG path under /public)
 *   colorKey      — 'purple' | 'blue' | 'green' | 'pink' | 'amber'
 *   size          — 'sm' | 'md' | 'lg' (default: md)
 *   status        — 'active' | 'done' | 'locked'
 *   isLocked      — bool (legacy alias for status='locked')
 *   stars         — number (0-3) shown when status='done'
 *   progress      — { current, total } shown when status='active'
 *   onClick       — fired on tap when status !== 'locked'
 */

const PALETTES = {
    purple: {
        ring: "ring-purple-300/70 hover:ring-purple-500",
        ringActive: "ring-purple-500",
        bgTint: "bg-gradient-to-br from-purple-50 via-white to-purple-100",
        accent: "text-purple-700",
        badge: "from-purple-500 to-purple-700",
        bar: "from-purple-500 to-fuchsia-500",
        chip: "bg-purple-100 text-purple-700",
    },
    blue: {
        ring: "ring-blue-300/70 hover:ring-blue-500",
        ringActive: "ring-blue-500",
        bgTint: "bg-gradient-to-br from-sky-50 via-white to-blue-100",
        accent: "text-blue-700",
        badge: "from-sky-500 to-blue-700",
        bar: "from-sky-500 to-blue-500",
        chip: "bg-sky-100 text-sky-700",
    },
    green: {
        ring: "ring-emerald-300/70 hover:ring-emerald-500",
        ringActive: "ring-emerald-500",
        bgTint: "bg-gradient-to-br from-emerald-50 via-white to-green-100",
        accent: "text-emerald-700",
        badge: "from-emerald-500 to-green-700",
        bar: "from-emerald-500 to-green-500",
        chip: "bg-emerald-100 text-emerald-700",
    },
    pink: {
        ring: "ring-rose-300/70 hover:ring-rose-500",
        ringActive: "ring-rose-500",
        bgTint: "bg-gradient-to-br from-rose-50 via-white to-pink-100",
        accent: "text-rose-700",
        badge: "from-rose-500 to-pink-700",
        bar: "from-rose-500 to-pink-500",
        chip: "bg-rose-100 text-rose-700",
    },
    amber: {
        ring: "ring-amber-300/70 hover:ring-amber-500",
        ringActive: "ring-amber-500",
        bgTint: "bg-gradient-to-br from-amber-50 via-white to-orange-100",
        accent: "text-amber-700",
        badge: "from-amber-500 to-orange-700",
        bar: "from-amber-500 to-orange-500",
        chip: "bg-amber-100 text-amber-700",
    },
};

const SIZES = {
    sm: {
        outer: "rounded-2xl p-2.5",
        image: "h-16 sm:h-20",
        badge: "w-7 h-7 text-[11px]",
        title: "text-[11px] sm:text-xs",
        bar: "h-1",
    },
    md: {
        outer: "rounded-3xl p-3 sm:p-4",
        image: "h-24 sm:h-28 lg:h-32",
        badge: "w-9 h-9 text-sm",
        title: "text-xs sm:text-sm",
        bar: "h-1.5",
    },
    lg: {
        outer: "rounded-[2rem] p-4 sm:p-5",
        image: "h-32 sm:h-40 lg:h-48",
        badge: "w-11 h-11 text-base",
        title: "text-sm sm:text-base lg:text-lg",
        bar: "h-2",
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
    const sz = SIZES[size] || SIZES.md;

    const resolvedStatus = status || (isLocked ? "locked" : "active");
    const locked = resolvedStatus === "locked";
    const done = resolvedStatus === "done";
    const active = resolvedStatus === "active";

    const handleClick = (e) => {
        if (locked) return;
        onClick?.(e);
    };

    return (
        <button
            type="button"
            disabled={locked}
            onClick={handleClick}
            aria-label={`${title}${locked ? " (locked)" : ""}`}
            aria-disabled={locked}
            className={cn(
                "group relative w-full h-full text-left select-none",
                "ring-[3px] transition-all duration-200",
                sz.outer,
                palette.bgTint,
                locked
                    ? "opacity-65 grayscale-[40%] cursor-not-allowed ring-gray-200"
                    : active
                    ? cn(palette.ringActive, "shadow-lg hover:-translate-y-1 hover:shadow-xl cursor-pointer")
                    : cn(palette.ring, "hover:-translate-y-1 hover:shadow-xl cursor-pointer"),
                "shadow-md",
                className,
            )}
            style={{ minHeight: "10rem" }}
        >
            {/* Number badge — top-left */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute -top-2 -left-2 z-20 flex items-center justify-center",
                    "rounded-full font-black text-white border-[3px] border-white",
                    "bg-gradient-to-br shadow-md",
                    sz.badge,
                    palette.badge,
                )}
            >
                {number ?? "?"}
            </span>

            {/* Now playing chip */}
            {active && (
                <span className="absolute -top-2 right-2 z-20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-400 to-amber-500 shadow-md border-2 border-white animate-bounce">
                    Now playing
                </span>
            )}

            {/* Lock chip */}
            {locked && (
                <span className="absolute -top-2 right-2 z-20 w-9 h-9 rounded-full bg-white border-2 border-gray-200 shadow flex items-center justify-center text-base">
                    🔒
                </span>
            )}

            {/* Image */}
            <div
                className={cn(
                    "relative w-full flex items-center justify-center overflow-hidden rounded-2xl",
                    "bg-white/60",
                    sz.image,
                )}
            >
                {imagePath ? (
                    <img
                        src={imagePath}
                        alt=""
                        loading="lazy"
                        className={cn(
                            "max-h-full w-auto object-contain drop-shadow-md transition-transform duration-300",
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

            {/* Title */}
            <div className="mt-2 px-1 text-center">
                <p
                    className={cn(
                        "font-black leading-tight text-slate-800 line-clamp-2",
                        sz.title,
                    )}
                >
                    {title}
                </p>
            </div>

            {/* Status footer */}
            <div className="mt-2 px-1 min-h-[18px] flex items-center justify-center">
                {done ? (
                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full",
                            "text-[10px] font-black",
                            palette.chip,
                        )}
                    >
                        {[1, 2, 3].map((s) => (
                            <span
                                key={s}
                                className={cn(
                                    "text-xs leading-none",
                                    s <= (stars || 0)
                                        ? "drop-shadow"
                                        : "opacity-25 grayscale",
                                )}
                                aria-hidden="true"
                            >
                                ⭐
                            </span>
                        ))}
                    </span>
                ) : active && progress ? (
                    <div className="w-full flex items-center gap-1.5">
                        <div
                            className={cn(
                                "flex-1 bg-gray-200/70 rounded-full overflow-hidden",
                                sz.bar,
                            )}
                        >
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
                        <span
                            className={cn(
                                "shrink-0 text-[9px] font-black uppercase tracking-wider tabular-nums",
                                palette.accent,
                            )}
                        >
                            {progress.current}/{progress.total}
                        </span>
                    </div>
                ) : locked ? (
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Locked
                    </span>
                ) : (
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Tap to play
                    </span>
                )}
            </div>
        </button>
    );
};

export default LessonCard;
