import React from "react";

/**
 * ModeHint — a shared "what should I do right now?" instruction line.
 *
 * Why this exists:
 *   The operator reported children getting stuck on the Listen-and-
 *   Choose lesson — they hear the audio, see three colour cards, but
 *   nothing tells them to tap the right card. The audio button reads
 *   "Tap to listen again" so the kid thinks the speaker IS the answer.
 *
 *   Most game modes already had a small instruction string in tiny
 *   10px purple text near the prompt, but the wording, position and
 *   prominence varied wildly. This component standardises the
 *   "next-step" hint across every mode so the kid always knows what
 *   to do next, no matter which game variant the lesson rotated to.
 *
 * Visual design:
 *   - Pill-shaped chip with a soft drop shadow and a coloured dot
 *     prefix so it reads like a friendly nudge, not a header.
 *   - Bigger than the old 10px prompt (text-sm on mobile, text-base
 *     on tablet) so a 6-year-old reading the early-reader font
 *     doesn't have to squint.
 *   - Optional `pulse` prop drives a gentle attention animation when
 *     a mode wants to draw the eye (e.g. ListeningGame after the
 *     audio finishes — "now tap a picture!").
 *   - Optional `tone` ("hint" | "action" | "success" | "warn")
 *     swaps the colour scheme so a single component covers every
 *     state ("Listen carefully" → blue; "Now tap a picture" →
 *     emerald + pulse; "Try a different one!" → amber, etc.).
 *
 * The design intentionally mirrors the existing "👈 Tap a word to
 * start" / "✨ Now tap the picture →" pattern that MatchConnect /
 * WordPicConnect / DragDrop already use successfully — those modes
 * never reported stuck-state issues, so we know the affordance works
 * when it's actually present.
 */

const TONES = {
    hint: {
        wrap: "bg-white/95 border-purple-100 text-[#1E293B]",
        dot:  "bg-purple-500",
    },
    action: {
        wrap: "bg-emerald-50 border-emerald-200 text-emerald-800",
        dot:  "bg-emerald-500",
    },
    success: {
        wrap: "bg-emerald-100 border-emerald-300 text-emerald-900",
        dot:  "bg-emerald-600",
    },
    warn: {
        wrap: "bg-amber-50 border-amber-200 text-amber-900",
        dot:  "bg-amber-500",
    },
};

const ModeHint = ({
    text,
    icon = null,
    tone = "hint",
    pulse = false,
    className = "",
    ariaLive = "polite",
}) => {
    if (!text) return null;
    const palette = TONES[tone] || TONES.hint;

    return (
        <div
            // aria-live="polite" so a screen reader (or a parent reading
            // along) announces the new instruction when it changes,
            // without interrupting the audio prompt.
            aria-live={ariaLive}
            className={`
                relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2
                rounded-full border-2 shadow-sm
                font-black text-xs sm:text-sm lg:text-base
                ${palette.wrap}
                ${pulse ? "kiddo-mode-hint-pulse" : ""}
                ${className}
            `}
        >
            {icon ? (
                <span aria-hidden="true" className="text-base sm:text-lg leading-none shrink-0">
                    {icon}
                </span>
            ) : (
                <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${palette.dot}`} />
            )}
            <span className="leading-tight">{text}</span>

            {/* Local style so the pulse animation is self-contained
                and doesn't depend on a global @keyframes. We avoid
                Tailwind's `animate-pulse` because it lowers opacity
                to 50% which is too dim for a primary call-to-action. */}
            <style>{`
                @keyframes kiddoModeHintPulse {
                    0%, 100% { transform: scale(1);     box-shadow: 0 0 0 0   rgba(16,185,129,0.40); }
                    50%      { transform: scale(1.04);  box-shadow: 0 0 0 10px rgba(16,185,129,0);    }
                }
                .kiddo-mode-hint-pulse {
                    animation: kiddoModeHintPulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    will-change: transform, box-shadow;
                }
                @media (prefers-reduced-motion: reduce) {
                    .kiddo-mode-hint-pulse { animation: none; }
                }
            `}</style>
        </div>
    );
};

export default ModeHint;
