/**
 * StreakBadge — flame counter for the daily-streak feature.
 *
 * The shape comes from `props.streak` (shared by HandleInertiaRequests
 * and computed by StreakService) so this component is purely
 * presentational. If the user is signed out, the badge renders nothing.
 *
 * Three visual states drive the colour + tooltip copy:
 *   • fresh    → played today, streak is locked in for the day
 *   • in-grace → played yesterday, banner urges them to play today
 *   • broken   → streak is 0; we still show a friendly "Start a streak!"
 *                pill so the kid knows the feature exists
 *
 * Sizes: `sm` for the navbar, `lg` for the parent dashboard hero card.
 */

import React from "react";
import { Flame } from "lucide-react";
import { Link } from "@inertiajs/react";

import { useStreak } from "@/lib/usePageProps";
import { cn } from "@/lib/cn";

const TONE = {
    fresh: {
        ring:  "ring-orange-300/60",
        bg:    "bg-gradient-to-br from-amber-400 to-rose-500",
        flame: "text-amber-200",
        label: "text-white",
        title: "Play tomorrow to keep your streak alive!",
    },
    "in-grace": {
        ring:  "ring-amber-300/60",
        bg:    "bg-gradient-to-br from-amber-300 to-amber-500",
        flame: "text-amber-100",
        label: "text-amber-50",
        title: "Play today before midnight to keep your streak!",
    },
    broken: {
        ring:  "ring-slate-200",
        bg:    "bg-slate-100",
        flame: "text-slate-400",
        label: "text-slate-500",
        title: "Play one lesson today to start a streak!",
    },
};

const SIZES = {
    sm: {
        wrap:  "h-9 gap-1.5 px-3 py-1 text-sm",
        flame: "h-4 w-4",
        count: "text-sm",
        label: "text-[10px]",
    },
    md: {
        wrap:  "h-11 gap-2 px-4 py-1.5 text-base",
        flame: "h-5 w-5",
        count: "text-lg",
        label: "text-[11px]",
    },
    lg: {
        wrap:  "h-14 gap-2 px-5 py-2 text-lg",
        flame: "h-6 w-6",
        count: "text-2xl",
        label: "text-xs",
    },
};

export default function StreakBadge({
    size = "sm",
    href = "/progress",
    className,
}) {
    const streak = useStreak();
    if (!streak) return null;

    const tone = TONE[streak.status] ?? TONE.broken;
    const sz = SIZES[size] ?? SIZES.sm;
    const count = streak.current ?? 0;

    const Wrapper = href ? Link : "div";
    const wrapperProps = href
        ? { href, "aria-label": `${count}-day streak. Open the parent dashboard.` }
        : {};

    return (
        <Wrapper
            {...wrapperProps}
            title={tone.title}
            className={cn(
                "inline-flex select-none items-center rounded-full ring-1 transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
                tone.ring,
                tone.bg,
                sz.wrap,
                href && count > 0 && "hover:scale-105",
                className,
            )}
        >
            {/* The flame gets a subtle pulse only on a live streak. */}
            <Flame
                aria-hidden="true"
                className={cn(
                    sz.flame,
                    tone.flame,
                    streak.status === "fresh" && "animate-pulse",
                )}
                fill="currentColor"
            />
            {count > 0 ? (
                <>
                    <span className={cn("font-black leading-none", sz.count, tone.label)}>
                        {count}
                    </span>
                    <span className={cn("font-bold uppercase tracking-widest leading-none", sz.label, tone.label)}>
                        day{count === 1 ? "" : "s"}
                    </span>
                </>
            ) : (
                <span className={cn("font-black leading-none", sz.label, tone.label)}>
                    Start a streak!
                </span>
            )}
        </Wrapper>
    );
}
