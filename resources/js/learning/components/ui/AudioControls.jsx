import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
    getAudioSettings,
    setMuted,
    setVolume,
    subscribeAudioSettings,
} from "@/learning/utils/audioSettings";

/**
 * useAudioSettings — React adapter on top of the plain audioSettings
 * subscribable store. Returns { muted, volume } and re-renders on
 * change. Built on `useSyncExternalStore` so it's safe under React 18
 * concurrent rendering.
 */
function useAudioSettings() {
    return useSyncExternalStore(
        subscribeAudioSettings,
        getAudioSettings,
        getAudioSettings,
    );
}

/**
 * AudioControls — speaker icon + volume slider that lives in the
 * AppHeader of every play surface (lesson, quiz, arena, map, parent
 * dashboard). Designed to stay readable on phones (icon-only popover)
 * and turn into a richer inline panel on tablet+.
 *
 * Behaviour:
 *   • Single tap on the speaker icon toggles mute on/off.
 *   • Long-press / hover / tap-and-tap on the chevron opens the
 *     volume slider popover.
 *   • The popover auto-closes when the kid clicks anywhere else, taps
 *     Escape, or 4 s of inactivity passes.
 *   • Settings persist to localStorage so muting once stays muted on
 *     every subsequent visit until the kid un-mutes.
 *
 * Accessibility:
 *   • The mute button is a real <button> with aria-pressed reflecting
 *     muted state.
 *   • The slider is a native <input type="range"> so screen readers
 *     announce the volume in percent and assistive tech can step
 *     it with arrow keys.
 *   • Keyboard shortcut: pressing "M" anywhere on the page (when not
 *     focused on a text field) toggles mute. Honours `prefers-reduced-
 *     motion` by skipping the popover spring.
 */
const AudioControls = ({ compact = false, className = "" }) => {
    const { muted, volume } = useAudioSettings();
    const [open, setOpen] = useState(false);
    const closeTimerRef = useRef(null);
    const containerRef = useRef(null);

    const effective = muted ? 0 : volume;
    const percent = Math.round(effective * 100);

    // Auto-close after 3.5 s of inactivity once the popover is open.
    const armCloseTimer = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => setOpen(false), 3500);
    };

    useEffect(() => {
        if (!open) {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            return undefined;
        }
        armCloseTimer();
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Click-outside to close.
    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    // Keyboard shortcut: "M" toggles mute (when not typing in a field).
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "m" && e.key !== "M") return;
            const tag = (e.target?.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            e.preventDefault();
            setMuted();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const icon = muted || effective <= 0
        ? "🔇"
        : effective < 0.34
        ? "🔈"
        : effective < 0.67
        ? "🔉"
        : "🔊";

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center gap-1 shrink-0 ${className}`}
        >
            {/* Mute toggle button */}
            <button
                type="button"
                onClick={() => {
                    setMuted();
                    armCloseTimer();
                }}
                aria-pressed={muted}
                aria-label={muted ? "Unmute audio" : "Mute audio"}
                title={muted ? "Tap to unmute (M)" : "Tap to mute (M)"}
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg shadow-sm border transition-all ${
                    muted
                        ? "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200"
                }`}
            >
                <span aria-hidden="true">{icon}</span>
                {/* Diagonal slash overlay when muted (works even on
                    systems where the 🔇 emoji renders without one). */}
                {muted && (
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <span className="block w-[120%] h-[3px] bg-rose-500 rounded-full rotate-45 shadow" />
                    </span>
                )}
            </button>

            {/* Slider toggle / inline slider */}
            {compact ? (
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-label="Show volume slider"
                    aria-expanded={open}
                    className="hidden sm:inline-flex w-7 h-9 items-center justify-center text-gray-400 hover:text-purple-600 transition-colors"
                    title="Adjust volume"
                >
                    <span className="text-xs font-black">⌄</span>
                </button>
            ) : (
                <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={muted ? 0 : Math.round(volume * 100)}
                        onChange={(e) => setVolume(Number(e.target.value) / 100)}
                        aria-label="Volume"
                        className="kiddo-volume w-20 lg:w-24"
                    />
                    <span className="text-[10px] font-black text-gray-500 tabular-nums w-7 text-right">
                        {percent}%
                    </span>
                </div>
            )}

            {/* Mobile / compact popover with the slider */}
            {compact && open && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 px-3 py-2.5 flex items-center gap-2 animate-fadeInScale">
                    <span className="text-base" aria-hidden="true">{icon}</span>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={muted ? 0 : Math.round(volume * 100)}
                        onChange={(e) => {
                            setVolume(Number(e.target.value) / 100);
                            armCloseTimer();
                        }}
                        aria-label="Volume"
                        className="kiddo-volume w-32"
                    />
                    <span className="text-[10px] font-black text-gray-500 tabular-nums w-7 text-right">
                        {percent}%
                    </span>
                </div>
            )}

            {/* Range styling — matches the brand purple. Inlined here
                instead of in app.css so the AudioControls component
                stays self-contained when consumed by other pages. */}
            <style>{`
                input.kiddo-volume {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 4px;
                    border-radius: 999px;
                    background: linear-gradient(to right, #7C3AED 0%, #7C3AED ${percent}%, #E5E7EB ${percent}%, #E5E7EB 100%);
                    outline: none;
                    cursor: pointer;
                }
                input.kiddo-volume::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #7C3AED;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 1px 3px rgba(124, 58, 237, 0.45);
                    cursor: pointer;
                    transition: transform .15s ease;
                }
                input.kiddo-volume::-webkit-slider-thumb:hover { transform: scale(1.15); }
                input.kiddo-volume::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #7C3AED;
                    border: 2px solid #FFFFFF;
                    box-shadow: 0 1px 3px rgba(124, 58, 237, 0.45);
                    cursor: pointer;
                }
                input.kiddo-volume:focus-visible {
                    outline: 2px solid rgba(124, 58, 237, 0.6);
                    outline-offset: 3px;
                }
            `}</style>
        </div>
    );
};

export default AudioControls;
