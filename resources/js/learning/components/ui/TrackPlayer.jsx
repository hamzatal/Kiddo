import React, { useEffect, useRef, useState } from "react";

/**
 * Plays an official NCCD audio track with a child-friendly UI.
 *
 * Accepts an audioTrack object with at least one of:
 *   { playUrl, localUrl, url, label, kind, segmentStartMs, segmentEndMs }
 *
 * By default plays the full MP3. Pass segmentStartMs/segmentEndMs (or
 * segment={{ startMs, endMs }}) to loop just one clip.
 */
const TrackPlayer = ({
    audioTrack,
    segment,
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

    const startMs = segment?.startMs ?? audioTrack?.segmentStartMs ?? null;
    const endMs = segment?.endMs ?? audioTrack?.segmentEndMs ?? null;

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
        try {
            audio.currentTime = startMs != null ? startMs / 1000 : 0;
        } catch (_) {}

        audio.play()
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
        if (endMs != null && a.currentTime >= endMs / 1000) {
            a.pause();
            setState("idle");
            setProgress(100);
            return;
        }
        setProgress((a.currentTime / a.duration) * 100);
    };

    const onEndedInternal = () => {
        setState("idle");
        setProgress(100);
        onEnded?.();
    };

    if (!src) return null;

    const isVideo = (audioTrack?.format || "mp3") === "mp4";

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

    return (
        <div
            className={`w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-md p-4 flex items-center gap-3 ${className}`}
        >
            <button
                type="button"
                onClick={toggle}
                disabled={state === "loading"}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl transition-all shrink-0 ${
                    state === "playing"
                        ? "bg-[#F59E0B] shadow-[0_5px_0_#B45309]"
                        : state === "error"
                            ? "bg-red-400 shadow-[0_5px_0_#B91C1C]"
                            : "bg-[#10B981] shadow-[0_5px_0_#059669] hover:translate-y-[1px] active:translate-y-[4px]"
                }`}
                aria-label={audioTrack?.label || "Play audio"}
            >
                {state === "loading" ? "⏳" : state === "playing" ? "⏸" : state === "error" ? "⚠" : "▶"}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
                        Official audio{isVideo ? " · video" : ""}
                    </span>
                    {audioTrack?.page ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            · p{audioTrack.page}
                        </span>
                    ) : null}
                </div>
                <p className="text-xs font-bold text-[#1E293B] truncate">
                    {audioTrack?.label || "Listen to the track"}
                </p>
                <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {state === "error" && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold">
                        Couldn't load track
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
