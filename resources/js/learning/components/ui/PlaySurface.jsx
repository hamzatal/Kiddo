import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { playClick } from "@/learning/utils/soundEffects";

/**
 * FIX 4 — Shared play-screen shell for lessons, quizzes and games.
 * Replaces the older "white card on pastel blob" look with a single
 * cohesive system:
 *
 *   • full viewport gradient background
 *   • floating top app-bar (pill): back, title chip, mode chip,
 *     progress dots (round-by-round) and a sound toggle
 *   • bottom mascot ribbon with a speech bubble that reflects the
 *     current round / hint
 *   • children render in a centered, card-less area — each activity
 *     can paint its own card style
 *
 * Props:
 *   unitTitle         — string shown in the title chip (e.g. "U0 · Welcome")
 *   modeIcon, modeLabel — small chip that announces the activity
 *   progressCurrent   — 0-indexed current round
 *   progressTotal     — total rounds in this stage (for the dots)
 *   roundResults      — optional [{ correct }] used to colour the dots
 *   mascotMessage     — text the fox is saying right now
 *   soundOn / onToggleSound — controls the speaker icon in the bar
 *   onBack            — overrides the default "/map" navigation
 *   children          — the actual activity content
 */
const PlaySurface = ({
    unitTitle = "Lesson",
    modeIcon = "🎮",
    modeLabel = "Play",
    modeColor = "#10B981",
    progressCurrent = 0,
    progressTotal = 0,
    roundResults = [],
    mascotMessage = "Let's play!",
    soundOn = true,
    onToggleSound,
    onBack,
    bookPage = null,
    children,
}) => {
    // Local fallback so callers that don't pass soundOn still get a
    // working toggle (we just don't gate audio on it — the consumer
    // is responsible for actually muting if needed).
    const [localSound, setLocalSound] = useState(soundOn);
    const sound = onToggleSound ? soundOn : localSound;

    const toggleSound = () => {
        playClick();
        if (onToggleSound) onToggleSound(!sound);
        else setLocalSound((v) => !v);
    };

    const handleBack = () => {
        playClick();
        if (onBack) return onBack();
        router.visit("/map");
    };

    // FIX 12 — keep the title narrow at 1366px so the chip + mode chip
    // + dots + sound toggle never wrap. We trim with CSS truncation.
    return (
        <div
            className="ps-root min-h-[100dvh] w-full font-sans flex flex-col relative overflow-hidden"
            style={{
                background:
                    "linear-gradient(135deg,#FFF7E5 0%,#FFE3F1 50%,#E5F0FF 100%)",
            }}
        >
            {/* Floating top app-bar */}
            <header className="relative z-30 px-3 sm:px-5 lg:px-8 pt-3">
                <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[100rem] mx-auto bg-white/90 backdrop-blur-md border border-white shadow-md rounded-full pl-2 pr-2 py-2 flex items-center gap-2">
                    <button
                        onClick={handleBack}
                        className="shrink-0 w-9 h-9 rounded-full bg-white border border-gray-100 hover:bg-gray-50 text-[#1E293B] font-black flex items-center justify-center shadow-sm"
                        aria-label="Back to map"
                    >
                        ⬅
                    </button>

                    <span className="ps-title-chip inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 truncate max-w-[14ch] sm:max-w-[20ch] lg:max-w-[28ch]">
                        {unitTitle}
                    </span>

                    <span
                        className="shrink-0 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full"
                        style={{
                            color: modeColor,
                            backgroundColor: `${modeColor}1A`,
                            border: `1px solid ${modeColor}33`,
                        }}
                    >
                        <span className="text-sm leading-none">{modeIcon}</span>
                        <span className="hidden sm:inline">{modeLabel}</span>
                    </span>

                    {/* Progress dots — round-by-round, NOT a percentage bar */}
                    {progressTotal > 0 ? (
                        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
                            {Array.from({ length: progressTotal }).map((_, i) => {
                                const r = roundResults[i];
                                const done = r !== undefined;
                                const isCurrent = i === progressCurrent;
                                let cls = "w-2.5 h-2.5 rounded-full transition-all";
                                if (done && r?.correct) cls += " bg-emerald-400";
                                else if (done && !r?.correct) cls += " bg-rose-300";
                                else if (isCurrent)
                                    cls += " bg-[#7C3AED] scale-125 ring-2 ring-purple-200";
                                else cls += " bg-gray-200";
                                return <span key={i} className={cls} />;
                            })}
                        </div>
                    ) : (
                        <div className="flex-1" />
                    )}

                    {bookPage ? (
                        <span className="hidden md:inline text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">
                            p{bookPage}
                        </span>
                    ) : null}

                    <button
                        type="button"
                        onClick={toggleSound}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-base shadow-sm border transition-colors ${
                            sound
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : "bg-white text-gray-400 border-gray-200"
                        }`}
                        aria-label={sound ? "Mute sounds" : "Unmute sounds"}
                        title={sound ? "Sound on" : "Sound off"}
                    >
                        {sound ? "🔊" : "🔇"}
                    </button>
                </div>
            </header>

            {/* Activity area — card-less, the activity owns its visuals */}
            <main className="flex-1 relative z-10 w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[100rem] mx-auto flex justify-center items-start px-4 lg:px-8 py-5 sm:py-8 pb-32">
                {children}
            </main>

            {/* Bottom mascot ribbon */}
            <footer className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
                <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[100rem] mx-auto px-3 sm:px-6 pb-3 sm:pb-4">
                    <div className="pointer-events-auto flex items-end gap-3">
                        <img
                            src="/assets/ui/mascot/fox-main.png"
                            alt="Kiddo Fox"
                            className="w-16 sm:w-20 lg:w-24 h-auto object-contain drop-shadow-lg shrink-0"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <div className="relative bg-white border border-white/80 rounded-2xl rounded-bl-sm shadow-md px-4 py-2 max-w-[18rem] sm:max-w-md">
                            <p className="text-xs sm:text-sm font-black text-[#1E293B] leading-snug">
                                {mascotMessage}
                            </p>
                            <span className="absolute left-[-8px] bottom-2 w-3 h-3 rotate-45 bg-white border-l border-b border-white/80" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PlaySurface;
