/**
 * StreakCelebration — the once-per-day overlay that pops when a
 * learner's streak ticks up by one.
 *
 * Trigger logic lives in this component so any page that mounts it
 * (LessonScreen, QuizScreen, Arena, MapScreen) gets the celebration
 * "for free". The strategy:
 *
 *   1. Read today's date AND the current streak from props.streak.
 *   2. Compare both against `kiddo:streak-celebrated:<userId>` in
 *      sessionStorage. If the stored entry matches, do nothing.
 *   3. Otherwise show the overlay, write the new entry to storage,
 *      and auto-dismiss after CELEBRATE_MS so it doesn't block play.
 *
 * sessionStorage (not localStorage) is intentional: we want the
 * celebration once per "play session", not once per device.
 */

import React, { useEffect, useState } from "react";
import { Flame, X } from "lucide-react";

import { useAuthUser, useStreak } from "@/lib/usePageProps";
import { launchConfetti } from "@/learning/utils/confetti";
import { playCheer } from "@/learning/utils/soundEffects";
import { cn } from "@/lib/cn";

const CELEBRATE_MS = 4500;
const STORAGE_KEY = (uid) => `kiddo:streak-celebrated:${uid}`;

export default function StreakCelebration() {
    const user = useAuthUser();
    const streak = useStreak();
    const [open, setOpen] = useState(false);
    const [milestoneCopy, setMilestoneCopy] = useState(null);

    useEffect(() => {
        if (!user || !streak || streak.current <= 0 || !streak.active_today) return;

        // We can't read sessionStorage during render (jsdom-safe guard).
        let stored = null;
        try {
            stored = window.sessionStorage?.getItem(STORAGE_KEY(user.id));
        } catch {
            return; // Safari private mode → silently skip the celebration.
        }

        const today = streak.last_activity || new Date().toISOString().slice(0, 10);
        const signature = `${today}:${streak.current}`;
        if (stored === signature) return;

        try {
            window.sessionStorage?.setItem(STORAGE_KEY(user.id), signature);
        } catch {
            /* ignore */
        }

        setMilestoneCopy(milestoneFor(streak.current));
        setOpen(true);
        playCheer();
        launchConfetti(3500);

        const t = setTimeout(() => setOpen(false), CELEBRATE_MS);
        return () => clearTimeout(t);
    }, [user, streak]);

    if (!open || !streak) return null;

    return (
        <div
            role="alertdialog"
            aria-live="polite"
            aria-labelledby="streak-celeb-title"
            className="pointer-events-auto fixed inset-x-0 top-20 z-[80] flex justify-center px-4"
        >
            <div
                className={cn(
                    "relative flex max-w-sm items-center gap-3 overflow-hidden rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-amber-100 to-rose-100 p-4 pr-3 shadow-2xl",
                    "animate-fadeInScale",
                )}
            >
                <span
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-inner"
                >
                    <Flame
                        className="h-8 w-8 text-white drop-shadow"
                        fill="currentColor"
                    />
                </span>

                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">
                        Streak banked!
                    </p>
                    <h2
                        id="streak-celeb-title"
                        className="text-lg font-black text-slate-900"
                    >
                        {streak.current}-day streak
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                        {milestoneCopy ?? "Come back tomorrow to keep it going!"}
                    </p>
                </div>

                <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setOpen(false)}
                    className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/** Friendly milestone copy at common streak lengths. */
function milestoneFor(days) {
    if (days >= 100) return "100 days! Legendary learner. 🏅";
    if (days >= 30)  return "A whole month — you're on fire! 🔥";
    if (days >= 14)  return "Two weeks strong! Keep it up.";
    if (days >= 7)   return "One full week — amazing!";
    if (days >= 3)   return "Three days in a row!";
    if (days === 2)  return "Two days back-to-back!";
    return "Come back tomorrow to keep it going!";
}
