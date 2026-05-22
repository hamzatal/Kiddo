import React from "react";

/**
 * StageBreadcrumb — the persistent "Where am I?" pill that tells
 * the kid which unit, lesson, and game type they're currently on.
 *
 * v2 (May 2026) — moved from BOTTOM-CENTER to TOP-CENTER, docked
 * directly under the AppHeader.
 *
 * Why the move?
 *   The previous bottom-anchored pill kept colliding with the
 *   center-positioned action buttons inside several game modes
 *   (Continue, Reveal, Check answer, Next round) — operators
 *   reported "البطاقة الصغيرة اللي بتكون اسفل كل درس فيها مشكلة
 *   انها احيانا بتغطي على زر الانتقال للمرحلة الثانية او الموافق
 *   او غيرها". The whole bottom edge is now reserved for
 *   game-level CTAs and the floating Skip/Next pill on the right.
 *
 *   Top-docked feels natural too: the AppHeader already shows
 *   "where I am" at a glance (back button + unit/lesson chips +
 *   stars), and the breadcrumb extends that information one notch
 *   lower without competing with it. Eyes that scan a page
 *   top-to-bottom hit the breadcrumb second, then the play area.
 *
 * Behaviour:
 *   • Renders nothing if no useful information is provided.
 *   • Keeps the same colour-language and shape as the AppHeader
 *     pills so it feels like the same system, not a new widget.
 *   • Auto-hides on short landscape phones (≤480px tall) where
 *     every pixel of vertical space matters for the play surface.
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
     * Arena passes {label:"Mixed practice", icon:"🏆"} and HIDES
     * the lesson chip because every round draws from a different
     * unit.
     */
    hideLesson = false,
    className = "",
}) => {
    const hasUnit = !!unitTitle;
    const hasLesson = !hideLesson && (lessonNumber || totalLessons);
    if (!hasUnit && !hasLesson && !modeLabel) return null;

    return (
        <nav
            aria-label="Current lesson location"
            className={`stage-breadcrumb relative z-20 w-full flex justify-center pt-2 pb-1 px-3 pointer-events-none ${className}`}
        >
            <div
                className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-full shadow-md border-2 border-white/70 px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-3 max-w-[92vw]"
                style={{ boxShadow: `0 6px 18px ${modeColor}26` }}
            >
                {/* Mode icon — matches the AppHeader's mode pill so
                    the kid associates the colour at the top with the
                    indicator just below it. */}
                <span
                    className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-sm shadow-inner border-2 border-white"
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
                    very wide screens. Truncates cleanly. */}
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
                landscape) where vertical space is precious. */}
            <style>{`
                @media (max-height: 480px) and (orientation: landscape) {
                    .stage-breadcrumb { display: none !important; }
                }
            `}</style>
        </nav>
    );
};

export default StageBreadcrumb;
