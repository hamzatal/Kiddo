import React from "react";

/**
 * StageBreadcrumb — the persistent "Where am I?" pill anchored at
 * the BOTTOM-CENTER of every play surface (LessonScreen, QuizScreen,
 * ArenaScreen). It tells the kid exactly which unit, which lesson,
 * and which activity type they're currently on, so they always
 * have a sense of place — like a tiny mini-map on the bottom edge.
 *
 * Why bottom-center?
 *   • The top is reserved for AppHeader (back button, mode pill,
 *     stars, audio control) — already crowded.
 *   • The bottom-right has the floating "Skip / Next / Finish" pill.
 *   • The bottom-left has FoxHelper.
 *   • The center is the only edge slot that doesn't compete with
 *     anything, and it's where eyes naturally drift between rounds.
 *
 * Visual language matches the existing AppHeader pills exactly so it
 * feels like the same system, not a new widget:
 *   • white/95 + backdrop-blur capsule
 *   • mode-coloured accent dots
 *   • mode icon on the left, unit/lesson on the right
 *
 * The component renders nothing if no useful information is provided
 * (so a misconfigured page can't show a half-empty pill).
 */
const StageBreadcrumb = ({
    unitTitle,
    unitNumber,
    lessonTitle,
    lessonNumber,
    totalLessons,
    modeLabel,
    modeIcon = "🎯",
    modeColor = "#7C3AED",
    /**
     * Visual-only override for special surfaces. e.g. the Games
     * Arena passes {label:"Mixed practice", icon:"🏆"} and HIDES the
     * lesson chip because every round draws from a different unit.
     */
    hideLesson = false,
    /**
     * When the host page has its own floating right-anchored button
     * (e.g. the green Skip / End / Finish pill), this prop nudges
     * the breadcrumb left a touch so the two never collide on tiny
     * phones (<360px). Default centred.
     */
    align = "center",
    className = "",
}) => {
    const hasUnit = !!unitTitle;
    const hasLesson = !hideLesson && (lessonNumber || totalLessons);
    if (!hasUnit && !hasLesson && !modeLabel) return null;

    const alignment =
        align === "left"
            ? "left-3 sm:left-4"
            : align === "right"
            ? "right-3 sm:right-4"
            : "left-1/2 -translate-x-1/2";

    return (
        <nav
            aria-label="Current lesson location"
            className={`stage-breadcrumb fixed bottom-2 sm:bottom-3 ${alignment} z-30 max-w-[92vw] pointer-events-none ${className}`}
        >
            <div
                className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full shadow-xl border-2 border-white/70 px-2.5 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-3"
                style={{ boxShadow: `0 8px 24px ${modeColor}33` }}
            >
                {/* Mode icon — matches the AppHeader's mode pill so
                    the kid associates the colour at the top with the
                    indicator at the bottom. */}
                <span
                    className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-inner border-2 border-white"
                    style={{ backgroundColor: `${modeColor}1A`, color: modeColor }}
                    aria-hidden="true"
                >
                    {modeIcon}
                </span>

                {/* Unit chip */}
                {hasUnit && (
                    <div className="flex flex-col leading-tight min-w-0">
                        <span
                            className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest"
                            style={{ color: modeColor }}
                        >
                            {unitNumber !== undefined && unitNumber !== null
                                ? `Unit ${unitNumber}`
                                : "Now playing"}
                        </span>
                        <span
                            className="text-[10px] sm:text-xs font-black text-gray-800 truncate max-w-[24vw] sm:max-w-[18ch]"
                            title={unitTitle}
                        >
                            {unitTitle}
                        </span>
                    </div>
                )}

                {/* Visual divider — only shown when both halves are present */}
                {hasUnit && hasLesson && (
                    <span
                        aria-hidden="true"
                        className="hidden sm:block w-px h-6 bg-gray-200 self-center"
                    />
                )}

                {/* Lesson chip */}
                {hasLesson && (
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400">
                            Lesson
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-gray-800 whitespace-nowrap">
                            {lessonNumber || "?"}
                            {totalLessons ? (
                                <span className="text-gray-400 font-bold">
                                    {" / "}
                                    {totalLessons}
                                </span>
                            ) : null}
                        </span>
                    </div>
                )}

                {/* Mode label — desktop only, doubles as a redundant
                    label for the icon so even non-readers learn what
                    each colour means. */}
                {modeLabel && (
                    <span
                        className="hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{
                            backgroundColor: `${modeColor}1A`,
                            color: modeColor,
                            border: `1px solid ${modeColor}33`,
                        }}
                    >
                        {modeLabel}
                    </span>
                )}

                {/* Optional second-line lesson title — only shown on
                    very wide screens where there's room. Truncates
                    cleanly so a long title never wraps the pill. */}
                {lessonTitle && (
                    <span
                        className="hidden xl:inline text-[10px] font-bold text-gray-400 truncate max-w-[22ch]"
                        title={lessonTitle}
                    >
                        · {lessonTitle}
                    </span>
                )}
            </div>

            {/* Auto-hide on short landscape phones (e.g. iPhone in
                landscape) where every pixel of vertical space matters
                for the play surface. The breakpoint matches the
                "phone landscape" media query used elsewhere in the
                app. The kid still has the AppHeader at the top so
                navigation context is never lost. */}
            <style>{`
                @media (max-height: 480px) and (orientation: landscape) {
                    .stage-breadcrumb { display: none !important; }
                }
            `}</style>
        </nav>
    );
};

export default StageBreadcrumb;
