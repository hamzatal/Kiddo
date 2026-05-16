import React, { useEffect, useRef, useState } from "react";

/**
 * Visual audio segment editor.
 *
 * Given a track URL and a { startMs, endMs } pair, lets the admin:
 *   • play the full track
 *   • stamp "start" at the current playhead
 *   • stamp "end" at the current playhead
 *   • fine-tune start/end manually in milliseconds
 *   • preview just the segment (stops at end automatically)
 *
 * Emits `onChange({ startMs, endMs })` as soon as the admin edits
 * either value, and `onSave()` when they press the Save button —
 * the parent is responsible for persisting.
 */
const fmt = (ms) => {
    if (ms == null || isNaN(ms)) return "—";
    const s = Math.floor(ms / 1000);
    const msPart = String(Math.floor(ms % 1000)).padStart(3, "0");
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}.${msPart}`;
};

const SegmentEditor = ({
    url,
    startMs: initStart,
    endMs: initEnd,
    onChange,
    onSave,
    saving,
    saved,
}) => {
    const audioRef = useRef(null);
    const [start, setStart] = useState(initStart ?? null);
    const [end, setEnd] = useState(initEnd ?? null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // keep state in sync if the parent switches to a different word
    useEffect(() => {
        setStart(initStart ?? null);
        setEnd(initEnd ?? null);
    }, [initStart, initEnd, url]);

    const announce = (s, e) => {
        onChange?.({ startMs: s, endMs: e });
    };

    const onTimeUpdate = () => {
        const a = audioRef.current;
        if (!a) return;
        setPosition(a.currentTime * 1000);
        // Stop at endMs when previewing the segment
        if (previewMode && end != null && a.currentTime * 1000 >= end) {
            a.pause();
            setPlaying(false);
            setPreviewMode(false);
        }
    };

    const onLoaded = () => {
        const a = audioRef.current;
        if (!a) return;
        setDuration(a.duration * 1000 || 0);
    };

    const playFull = () => {
        setPreviewMode(false);
        const a = audioRef.current;
        if (!a) return;
        if (playing) {
            a.pause();
            setPlaying(false);
            return;
        }
        a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    const playSegment = () => {
        if (start == null) return;
        const a = audioRef.current;
        if (!a) return;
        a.currentTime = start / 1000;
        setPreviewMode(true);
        a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    };

    const stampStart = () => {
        const v = Math.round(position);
        setStart(v);
        announce(v, end);
    };
    const stampEnd = () => {
        const v = Math.round(position);
        setEnd(v);
        announce(start, v);
    };

    const clearSegment = () => {
        setStart(null);
        setEnd(null);
        announce(null, null);
    };

    const changeStart = (v) => {
        const n = v === "" ? null : Math.max(0, Number(v) || 0);
        setStart(n);
        announce(n, end);
    };
    const changeEnd = (v) => {
        const n = v === "" ? null : Math.max(0, Number(v) || 0);
        setEnd(n);
        announce(start, n);
    };

    const pct = duration > 0 ? (position / duration) * 100 : 0;
    const startPct = duration > 0 && start != null ? (start / duration) * 100 : null;
    const endPct = duration > 0 && end != null ? (end / duration) * 100 : null;

    return (
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 mt-3">
            <audio
                ref={audioRef}
                src={url}
                preload="auto"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoaded}
                onEnded={() => {
                    setPlaying(false);
                    setPreviewMode(false);
                }}
                onError={(e) => {
                    console.warn('Audio load error, trying direct URL');
                }}
            />
            {/*
              NOTE: no `crossOrigin` attribute on purpose. The Admin →
              Audio Tracks page works perfectly because it points
              <audio> directly at the remote URL with no CORS flag —
              the browser allows playback + seeking + timeupdate as
              long as you don't ask for raw sample access. Adding
              crossOrigin="anonymous" forces a CORS preflight that
              qr.nccd.gov.jo rejects.
            */}

            {/* Timeline */}
            <div className="relative h-6 bg-white rounded-full border border-gray-200 overflow-hidden mb-2">
                {/* Segment highlight */}
                {startPct != null && endPct != null ? (
                    <div
                        className="absolute top-0 bottom-0 bg-purple-200/70"
                        style={{
                            left: `${Math.max(0, Math.min(100, startPct))}%`,
                            width: `${Math.max(0, Math.min(100, endPct - startPct))}%`,
                        }}
                    />
                ) : null}
                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                    style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
                />
                {/* Start marker */}
                {startPct != null ? (
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-emerald-500"
                        style={{ left: `${startPct}%` }}
                        title={`start @ ${fmt(start)}`}
                    />
                ) : null}
                {/* End marker */}
                {endPct != null ? (
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-amber-500"
                        style={{ left: `${endPct}%` }}
                        title={`end @ ${fmt(end)}`}
                    />
                ) : null}
            </div>

            {/* Readouts */}
            <div className="flex justify-between text-[11px] font-mono text-gray-600 mb-3">
                <span>▶ {fmt(position)}</span>
                <span className="font-black text-emerald-600">start {fmt(start)}</span>
                <span className="font-black text-amber-600">end {fmt(end)}</span>
                <span>⏱ {fmt(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={playFull}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-black shadow-sm"
                >
                    {playing && !previewMode ? "⏸ Pause" : "▶ Play full"}
                </button>
                <button
                    onClick={playSegment}
                    type="button"
                    disabled={start == null || end == null}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-sm disabled:opacity-40"
                >
                    ▶ Preview segment
                </button>
                <span className="h-5 w-px bg-gray-200 mx-1" />
                <button
                    onClick={stampStart}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black"
                    title="Set segment start to current playhead"
                >
                    Set start here
                </button>
                <button
                    onClick={stampEnd}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-black"
                    title="Set segment end to current playhead"
                >
                    Set end here
                </button>
                <button
                    onClick={clearSegment}
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-black"
                >
                    Clear
                </button>
            </div>

            {/* Manual ms entry */}
            <div className="grid grid-cols-2 gap-3 mt-3">
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Start (ms)
                    <input
                        type="number"
                        min={0}
                        value={start ?? ""}
                        onChange={(e) => changeStart(e.target.value)}
                        placeholder="e.g. 1800"
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono text-[#1E293B]"
                    />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400">
                    End (ms)
                    <input
                        type="number"
                        min={0}
                        value={end ?? ""}
                        onChange={(e) => changeEnd(e.target.value)}
                        placeholder="e.g. 3600"
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono text-[#1E293B]"
                    />
                </label>
            </div>

            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={onSave}
                    disabled={saving}
                    type="button"
                    className="px-4 py-2 rounded-lg bg-[#1E293B] text-white text-xs font-black shadow-sm disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save segment"}
                </button>
                {saved ? (
                    <span className="text-emerald-600 text-xs font-black">
                        ✓ Saved
                    </span>
                ) : null}
                <p className="text-[10px] text-gray-400 ml-auto">
                    Start &lt; End · both in milliseconds
                </p>
            </div>
        </div>
    );
};

export default SegmentEditor;
