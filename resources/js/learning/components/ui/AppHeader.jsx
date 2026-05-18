import React from "react";
import { router } from "@inertiajs/react";

/**
 * AppHeader — unified, responsive header for every lesson / quiz / game page.
 *
 * Layout (left → right):
 *   1. Back-to-map (X) button
 *   2. Two-line stack:
 *        line 1: UNIT • LESSON N OF M  ·  TYPE PILL  (e.g. "VOCAB GAME")
 *        line 2: progress bar with N/M label
 *   3. Stars + XP indicators (≥ md)
 *
 * The lesson-of-N badge and the type pill are now *part of the title row*
 * so a child can always tell at a glance:
 *   - which unit they're playing
 *   - which lesson within that unit
 *   - what kind of activity it is (Intro / Vocab / Story / Quiz …)
 *
 * Fully responsive: stacks gracefully from 320 px phones up to 4K
 * monitors. Truncation is permitted on narrow screens but the type
 * pill and the N/M counter never collapse below readable size.
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
    <header className="relative z-30 shrink-0 px-2 sm:px-4 lg:px-6 pt-2.5 pb-2 lg:pt-3.5 lg:pb-3 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Back to map */}
        <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-200 transition-all shrink-0"
          aria-label="Back to map"
          title="Back to map"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title block — two lines */}
        <div className="flex-1 min-w-0">
          {/* Line 1: UNIT • LESSON N OF M · TYPE PILL */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            {unitTitle && (
              <span className="text-[10px] sm:text-xs lg:text-sm font-black text-gray-800 uppercase tracking-wide truncate min-w-0">
                {unitTitle}
              </span>
            )}

            {/* Lesson N of M — always visible, never truncates. The
                'of M' part hides on tiny phones (<= 360 px) so the
                unit title can keep some room. */}
            {total > 0 && (
              <span
                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-wider"
                style={{
                  backgroundColor: `${modeColor}1A`,
                  color: modeColor,
                  border: `1px solid ${modeColor}33`,
                }}
                title={`Lesson ${current} of ${total}`}
              >
                <span className="hidden xs:inline">Lesson</span>
                <span className="xs:hidden">L</span>
                {current}
                <span className="hidden sm:inline opacity-70">/{total}</span>
              </span>
            )}

            {/* Mode pill — what kind of activity is this? */}
            {modeLabel && (
              <span
                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-wider"
                style={{
                  backgroundColor: `${modeColor}`,
                  color: "#fff",
                }}
                title={`Activity type: ${modeLabel}`}
              >
                <span className="text-[10px] sm:text-xs">{modeIcon}</span>
                <span className="hidden sm:inline">{modeLabel}</span>
              </span>
            )}
          </div>

          {/* Line 2: progress bar + lesson title hint */}
          {total > 0 && (
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="flex-1 h-2 sm:h-2.5 lg:h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: `linear-gradient(90deg, ${modeColor}, ${modeColor}CC)`,
                  }}
                />
              </div>
              {lessonTitle ? (
                <span className="hidden md:inline text-[11px] lg:text-xs font-bold text-gray-500 truncate max-w-[16ch] lg:max-w-[28ch]">
                  {lessonTitle}
                </span>
              ) : null}
              <span className="text-[10px] sm:text-xs lg:text-sm font-black shrink-0" style={{ color: modeColor }}>
                {current}/{total}
              </span>
            </div>
          )}
        </div>

        {/* Stars indicator (md+) */}
        {totalStars !== undefined && totalStars !== null && (
          <div className="hidden md:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full shadow-sm shrink-0">
            <span className="text-base lg:text-lg">⭐</span>
            <span className="font-black text-amber-600 text-xs lg:text-sm">{totalStars}</span>
          </div>
        )}

        {/* XP indicator (lg+) */}
        {xp !== undefined && xp !== null && (
          <div className="hidden lg:flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full shadow-sm shrink-0">
            <span className="text-base">⚡</span>
            <span className="font-black text-purple-600 text-xs">{xp} XP</span>
          </div>
        )}

        {/* Custom right slot */}
        {rightContent}
      </div>

      <style>{`
        /* Tailwind doesn't ship an 'xs' breakpoint by default;
           define one inline for the sub-380px phones we still support. */
        @media (min-width: 400px) { .xs\\:inline { display: inline; } .xs\\:hidden { display: none; } }
      `}</style>
    </header>
  );
};

export default AppHeader;
