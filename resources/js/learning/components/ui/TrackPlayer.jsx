import React, { useEffect, useRef, useState } from "react";

/**
 * Plays an official NCCD audio track with a child-friendly UI.
 *
 * Accepts an audioTrack object with at least one of:
 *   { playUrl, localUrl, url, label, kind }
 *
 * Prefers localUrl (cached /assets/audio/nccd/...) over the remote NCCD
 * URL, so lessons keep working even if qr.nccd.gov.jo is unreachable.
 *
 * Emits `onEnded` when playback finishes so the parent screen can
 * enable the "Continue" button, award stars, etc.
 */
const TrackPlayer = ({
    audioTrack,
    compact = false,
    autoPlay = false,
    onEnded,
    className = "",
}) => {
    const audioRef = useRef(null);
    const [state, setState] = useState("idle"); // idle | loading | playing | error
    const [progress, setProgress] = useState(0);

    const src =
        audioTrack?.playUrl || audioTrack?.localUrl || audioTrack?.url || null;

    // Auto-play on mount if requested (most browsers require a user
    // gesture; we attempt it but silently fall back to idle).
    useEffect(() => {
        if (!src || !autoPlay) return;
        tryPlay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, autoPlay]);

    const tryPlay = () => {
        if (!src) return;
        const audio = audioRef.current;
        if (!audio) return;

        setState("loading");
        audio.currentTime = 0;
        audio
            .play()
            .then(() => setState("playing"))
            .catch(() => setState("error"));
    };

    const pause = () => {
        audioRef.current?.pause();
        setState("idle");
    };

    const toggle = () => (state === "playing" ? pause() : tryPlay());

    const onTimeUpdate = () => {
        const a = audioRef.current;
        if (!a?.duration) return;
        setProgress((a.currentTime / a.duration) * 100);
    };

    const onEndedInternal = () => {
        setState("idle");
        setProgress(100);
        onEnded?.();
    };

    if (!src) {
        return null;
    }

    const isVideo = (audioTrack?.format || "mp3") === "mp4";

    // Compact pill (used inside game rounds)
    if (compact) {
        return (
            <button
                type="button"
                onClick={toggle}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white bg-white/90 backdrop-blur-md shadow-sm hover:shadow-md transition ${className}`}
                aria-label={audioTrack?.label || "Play audio"}
            >
                <span className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm">
                    {state === "playing" ? "⏸" : "▶"}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-gray-600">
                    {audioTrack?.label ? "Track" : "Listen"}
                </span>
                <audio
                    ref={audioRef}
                    src={src}
                    preload="metadata"
                    onEnded={onEndedInternal}
                    onError={() => setState("error")}
                    onTimeUpdate={onTimeUpdate}
                />
            </button>
        );
    }

    // Full card (used on intro lessons)
    return (
        <div
            className={`w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 flex items-center gap-4 ${className}`}
        >
            <button
                type="button"
                onClick={toggle}
                disabled={state === "loading"}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl transition-all shrink-0 ${
                    state === "playing"
                        ? "bg-[#F59E0B] shadow-[0_6px_0_#B45309]"
                        : state === "error"
                            ? "bg-red-400 shadow-[0_6px_0_#B91C1C]"
                            : "bg-[#10B981] shadow-[0_6px_0_#059669] hover:translate-y-[2px] active:translate-y-[6px]"
                }`}
                aria-label={audioTrack?.label || "Play audio"}
            >
                {state === "loading"
                    ? "⏳"
                    : state === "playing"
                        ? "⏸"
                        : state === "error"
                            ? "⚠"
                            : "▶"}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">
                        Official audio{isVideo ? " • video" : ""}
                    </span>
                    {audioTrack?.page ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            · page {audioTrack.page}
                        </span>
                    ) : null}
                </div>
                <p className="text-sm font-bold text-[#1E293B] truncate">
                    {audioTrack?.label || "Listen to the track"}
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {state === "error" && (
                    <p className="text-[11px] text-red-500 mt-1 font-bold">
                        Couldn't load this track. Try again.
                    </p>
                )}
            </div>

            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onEnded={onEndedInternal}
                onError={() => setState("error")}
                onTimeUpdate={onTimeUpdate}
            />
        </div>
    );
};

export default TrackPlayer;
