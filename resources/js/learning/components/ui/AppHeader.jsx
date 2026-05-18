import React from "react";
import { router } from "@inertiajs/react";

/**
 * AppHeader — unified header for every lesson / quiz / arena page.
 *
 * Layout: back button · title block (unit · lesson chip · type pill
 * · progress bar) · stars · XP. Always one row, never wraps.
 *
 * v3 polish:
 *  • Slimmer height (h-12 / h-14) so games get more vertical room.
 *  • Compact stars/XP — only the icon + value, no padding hog.
 *  • Truncated unit titles get a tooltip via title attribute.
 *  • Lesson chip + type pill are coloured the same as the active
 *    mode so the kid recognises where they are at a glance.
 */
const AppHeader = ({
    unitTitle = "",
    lessonTitle = "",
    modeLabel = "",
    modeIcon = "📖",
    modeColor = "#7C3AED",
    current = 1,
    total = 1,
    totalStars,
    xp,
    onBack,
    rightContent,
}) => {
    const progressPct = total > 0 ? Math.min(100, ((current - 1) / total) * 100) : 0;

    const handleBack = () => {
        if (onBack) onBack();
        else router.visit("/map");
    };

    return (
        <header className="relative z-30 shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
                {/* Back to map */}
                <button
                    onClick={handleBack}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-200 transition-all shrink-0"
                    aria-label="Back to map"
                    title="Back to map"
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Title block */}
                <div className="flex-1 min-w-0">
                    {/* Line 1: chips */}
                    <div className="flex items-center gap-1.5 mb-1">
                        {unitTitle && (
                            <span
                                className="text-[10px] sm:text-xs font-black text-gray-800 uppercase tracking-wide truncate min-w-0"
                                title={unitTitle}
                            >
                                {unitTitle}
                            </span>
                        )}

                        {total > 0 && (
                            <span
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
                                style={{
                                    backgroundColor: `${modeColor}1A`,
                                    color: modeColor,
                                    border: `1px solid ${modeColor}33`,
                                }}
                                title={`Lesson ${current} of ${total}`}
                            >
                                <span className="hidden xs:inline">L</span>
                                {current}
                                <span className="hidden sm:inline opacity-70">/{total}</span>
                            </span>
                        )}

                        {modeLabel && (
                            <span
                                className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white"
                                style={{ backgroundColor: modeColor }}
                                title={`Activity type: ${modeLabel}`}
                            >
                                <span>{modeIcon}</span>
                                <span className="hidden sm:inline">{modeLabel}</span>
                            </span>
                        )}
                    </div>

                    {/* Line 2: progress bar */}
                    {total > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${progressPct}%`,
                                        background: `linear-gradient(90deg, ${modeColor}, ${modeColor}CC)`,
                                    }}
                                />
                            </div>
                            {lessonTitle ? (
                                <span className="hidden md:inline text-[10px] font-bold text-gray-500 truncate max-w-[16ch] lg:max-w-[28ch]" title={lessonTitle}>
                                    {lessonTitle}
                                </span>
                            ) : null}
                            <span className="text-[10px] font-black shrink-0" style={{ color: modeColor }}>
                                {current}/{total}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stars */}
                {totalStars !== undefined && totalStars !== null && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shadow-sm shrink-0">
                        <span className="text-sm">⭐</span>
                        <span className="font-black text-amber-600 text-[11px] sm:text-xs">{totalStars}</span>
                    </div>
                )}

                {/* XP — desktop only */}
                {xp !== undefined && xp !== null && (
                    <div className="hidden lg:flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full shadow-sm shrink-0">
                        <span className="text-sm">⚡</span>
                        <span className="font-black text-purple-600 text-[11px]">{xp}</span>
                    </div>
                )}

                {rightContent}
            </div>

            <style>{`
                @media (min-width: 400px) { .xs\\:inline { display: inline; } .xs\\:hidden { display: none; } }
            `}</style>
        </header>
    );
};

export default AppHeader;
