import React, { useEffect, useRef, useState } from "react";
import {
    useAudioSettings,
    setVolume,
    toggleMute,
} from "@/learning/utils/audioSettings";

/**
 * AudioControl — a compact pill that lets the kid (or parent) mute
 * the entire app and adjust the master volume from any lesson, quiz,
 * games arena, or map page.
 *
 * What it controls
 * ────────────────
 * The single pill drives the global `audioSettings` store, which is
 * read by:
 *   • playAudio.js / speakWord (clips + browser TTS)
 *   • soundEffects.js (every Web Audio beep — success / fail / click / cheer / star)
 *   • TrackPlayer.jsx (full NCCD audio tracks)
 * Toggling mute therefore silences the WHOLE play surface in one
 * tap — no rogue clip can keep playing through a stale <audio> tag.
 *
 * Layout
 * ──────
 * A round 🔊/🔇 button (always visible) plus a slide-out volume
 * slider that appears on hover/focus on desktop and on tap (toggled
 * pop-over) on touch devices. The pop-over auto-closes on outside
 * click and Escape so it never gets in the kid's way.
 *
 * Accessibility
 * ─────────────
 * • role="group" with aria-label so screen readers announce a single
 *   "Audio controls" landmark instead of two separate buttons.
 * • Slider is a native <input type="range"> with min/max/step + an
 *   aria-valuetext that reads "70 percent" instead of just "70" —
 *   matches WCAG 2.1 1.3.1 (Info and relationships).
 * • Mute button uses aria-pressed so AT users hear the current
 *   state, and a clear title (tooltip) for sighted users.
 *
 * Variants
 * ────────
 *   • size="sm"      — used by AppHeader (lesson / quiz / arena)
 *   • size="md"      — used by MapScreen header (slightly bigger)
 *   • placement="bottom" / "top" — controls where the popover opens.
 */
const AudioControl = ({
    size = "sm",
    placement = "bottom",
    className = "",
    label = "Audio",
}) => {
    const { muted, volume } = useAudioSettings();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const closeTimer = useRef(null);

    const sizes = {
        sm: {
            btn: "w-8 h-8 sm:w-9 sm:h-9 text-base",
            popover: "w-44",
        },
        md: {
            btn: "w-10 h-10 text-lg",
            popover: "w-56",
        },
    };
    const cls = sizes[size] || sizes.sm;
    const popPosition = placement === "top" ? "bottom-full mb-2" : "top-full mt-2";

    // Close on outside click + Escape.
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // Hover-open behaviour with a tiny delay so a casual mouse-cross
    // doesn't pop the panel. The delay gets cancelled if the cursor
    // re-enters before the timer fires.
    const onMouseEnter = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        setOpen(true);
    };
    const onMouseLeave = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 220);
    };

    const percent = Math.round((muted ? 0 : volume) * 100);

    return (
        <div
            ref={wrapRef}
            className={`relative ${className}`}
            role="group"
            aria-label={label}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <button
                type="button"
                onClick={(e) => {
                    // On touch, a tap should mute/unmute (the slider is
                    // available from the popover). On desktop, a click
                    // also toggles mute — power users learn this is a
                    // one-tap silencer; the slider is for fine-tuning.
                    e.preventDefault();
                    toggleMute();
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    // Defer so a click on the slider keeps focus inside the popover.
                    if (closeTimer.current) clearTimeout(closeTimer.current);
                    closeTimer.current = setTimeout(() => setOpen(false), 180);
                }}
                aria-pressed={muted}
                aria-label={muted ? "Sound is muted — tap to unmute" : "Mute sound"}
                title={muted ? "Sound off — tap to turn on" : `Sound on (${percent}%) — tap to mute`}
                className={`${cls.btn} rounded-xl flex items-center justify-center shrink-0 shadow-sm border transition-all
                    ${muted
                        ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                    }`}
            >
                {muted ? "🔇" : volume < 0.34 ? "🔈" : volume < 0.67 ? "🔉" : "🔊"}
            </button>

            {/* Popover with the volume slider. We render it into the
                same DOM tree (no portal) so it inherits the page's
                z-index stack — it sits above the main content but
                below the FoxHelper overlay (z-[60]) which is correct. */}
            {open && (
                <div
                    className={`absolute right-0 ${popPosition} z-50 ${cls.popover} bg-white/97 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-col gap-2 animate-fade-in-up`}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Volume
                        </span>
                        <span className="text-[10px] font-black text-purple-600">
                            {percent}%
                        </span>
                    </div>

                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        aria-label="Master volume"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                        aria-valuetext={`${percent} percent`}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-2 rounded-full bg-purple-100 accent-purple-600 cursor-pointer"
                    />

                    <button
                        type="button"
                        onClick={toggleMute}
                        className={`mt-1 w-full text-[10px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg transition-colors ${
                            muted
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        }`}
                    >
                        {muted ? "Turn sound on" : "Mute everything"}
                    </button>

                    <p className="text-[9px] text-gray-400 font-semibold leading-snug">
                        Affects games, lessons, quizzes, songs and the Fox helper.
                    </p>

                    <style>{`
                        @keyframes fade-in-up {
                            from { opacity: 0; transform: translateY(-4px) scale(0.97); }
                            to   { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .animate-fade-in-up { animation: fade-in-up 180ms ease-out forwards; }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default AudioControl;
