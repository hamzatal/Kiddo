/**
 * DailyQuestCard — three small goals that reset every midnight.
 *
 * Reads `props.dailyQuest` shared by HandleInertiaRequests
 * (computed by App\Services\DailyQuestService). Renders a header
 * with the X/3 progress, a list of the three quests, and a small
 * celebration line when all three are done.
 *
 * No claim/reward button: the engagement reward IS the streak day,
 * which is itself derived from today's activity. Keeping the flow
 * frictionless avoids a "dark pattern" feel for kids.
 */

import React from "react";
import { CheckCircle2, Sparkles, Flame } from "lucide-react";

import { useDailyQuest, useStreak } from "@/lib/usePageProps";
import { cn } from "@/lib/cn";

export default function DailyQuestCard({ className }) {
    const quest = useDailyQuest();
    const streak = useStreak();

    if (!quest) return null;

    const { quests = [], completed_count: completed = 0, total = 3, all_complete } = quest;

    return (
        <section
            aria-labelledby="daily-quest-heading"
            className={cn(
                "relative overflow-hidden rounded-2xl border border-purple-100 bg-white/95 p-3 shadow-sm",
                className,
            )}
        >
            {/* Header */}
            <header className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <Sparkles
                        className="h-4 w-4 text-amber-500"
                        aria-hidden="true"
                        fill="currentColor"
                    />
                    <h3
                        id="daily-quest-heading"
                        className="text-xs font-black uppercase tracking-widest text-purple-700"
                    >
                        Today's Quest
                    </h3>
                </div>
                <span
                    className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black",
                        all_complete
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-purple-100 text-purple-700",
                    )}
                >
                    {completed}/{total}
                </span>
            </header>

            {/* Quest list */}
            <ul className="flex flex-col gap-2" role="list">
                {quests.map((q) => (
                    <QuestRow key={q.id} quest={q} />
                ))}
            </ul>

            {/* Footer celebration when all 3 are complete */}
            {all_complete ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Flame
                            className="h-4 w-4 text-rose-500"
                            aria-hidden="true"
                            fill="currentColor"
                        />
                        <p className="text-[11px] font-black text-rose-700">
                            All done — streak banked!
                        </p>
                    </div>
                    {streak ? (
                        <span className="text-[10px] font-bold text-rose-500">
                            🔥 Day {streak.current}
                        </span>
                    ) : null}
                </div>
            ) : (
                <p className="mt-3 text-center text-[10px] font-semibold text-slate-400">
                    Finish all three to bank today's streak day.
                </p>
            )}
        </section>
    );
}

/**
 * One quest row: icon + text + progress bar (or check when complete).
 */
function QuestRow({ quest }) {
    const { icon, title, description, goal, progress, percent, completed } = quest;
    return (
        <li
            className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-1.5 transition-colors",
                completed ? "bg-emerald-50" : "bg-slate-50",
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg shadow-sm",
                    completed
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-700",
                )}
            >
                {completed ? <CheckCircle2 className="h-5 w-5" /> : icon}
            </span>

            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        "truncate text-[12px] font-black leading-tight",
                        completed ? "text-emerald-700" : "text-slate-900",
                    )}
                >
                    {title}
                </p>
                {/* Progress bar OR description text */}
                <div className="mt-1 flex items-center gap-2">
                    <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"
                        role="progressbar"
                        aria-label={title}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={goal}
                    >
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                completed
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-r from-purple-500 to-fuchsia-500",
                            )}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <span
                        className={cn(
                            "shrink-0 text-[10px] font-black tabular-nums",
                            completed ? "text-emerald-600" : "text-slate-500",
                        )}
                    >
                        {progress}/{goal}
                    </span>
                </div>
                <p className="mt-0.5 hidden truncate text-[10px] font-semibold text-slate-400 sm:block">
                    {description}
                </p>
            </div>
        </li>
    );
}
