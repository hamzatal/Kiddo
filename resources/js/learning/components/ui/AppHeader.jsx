import React from "react";
import { router } from "@inertiajs/react";

/**
 * AppHeader - Unified, responsive header used by lesson, quiz, and game pages.
 *
 * Features:
 *   - Back to map button (with X icon)
 *   - Unit + lesson title (responsive truncation)
 *   - Progress bar
 *   - Mode badge (icon + label)
 *   - Optional AI badge
 *   - Optional total stars / XP indicators
 *   - Fully responsive (mobile to 24-inch)
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
  hideOnSmall = false,
}) => {
  const progressPct = total > 0 ? ((current - 1) / total) * 100 : 0;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.visit("/map");
    }
  };

  return (
    <header className="relative z-30 shrink-0 px-3 sm:px-4 lg:px-6 pt-3 pb-2 lg:pt-4 lg:pb-3 bg-white/70 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px] mx-auto flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors shrink-0"
          aria-label="Back to map"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title and progress area */}
        <div className="flex-1 min-w-0">
          {(unitTitle || lessonTitle) && (
            <div className="flex items-center gap-2 mb-1">
              {unitTitle && (
                <span className="text-[10px] sm:text-xs lg:text-sm font-black text-gray-700 uppercase tracking-wider truncate">
                  {unitTitle}
                </span>
              )}
              {lessonTitle && (
                <>
                  <span className="text-gray-300 text-xs hidden sm:inline">•</span>
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-gray-500 hidden sm:inline truncate">
                    {lessonTitle}
                  </span>
                </>
              )}
            </div>
          )}

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
              <span className="text-[10px] sm:text-xs lg:text-sm font-black shrink-0" style={{ color: modeColor }}>
                {current}/{total}
              </span>
            </div>
          )}
        </div>

        {/* Stars indicator */}
        {totalStars !== undefined && totalStars !== null && (
          <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full shadow-sm">
            <span className="text-base lg:text-lg">⭐</span>
            <span className="font-black text-amber-600 text-xs lg:text-sm">{totalStars}</span>
          </div>
        )}

        {/* XP indicator */}
        {xp !== undefined && xp !== null && (
          <div className="hidden lg:flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-base">⚡</span>
            <span className="font-black text-purple-600 text-xs">{xp} XP</span>
          </div>
        )}

        {/* Mode badge */}
        {modeLabel && (
          <div
            className="shrink-0 hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs lg:text-sm font-black"
            style={{ backgroundColor: `${modeColor}15`, color: modeColor }}
          >
            <span className="text-sm sm:text-base">{modeIcon}</span>
            <span className={hideOnSmall ? "hidden md:inline" : ""}>{modeLabel}</span>
          </div>
        )}

        {/* Custom right content (e.g. user avatar) */}
        {rightContent}
      </div>
    </header>
  );
};

export default AppHeader;
