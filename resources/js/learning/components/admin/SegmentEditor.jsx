import React, { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";

/**
 * Visual audio segment editor with rich controls.
 *
 * Uses the same playback strategy as the Admin → Audio Tracks page:
 * a plain <audio src={url}> with NO crossOrigin flag, so the browser
 * streams the NCCD MP3 directly without any CORS preflight.
 *
 * Operator features:
 *   • Click anywhere on the timeline to jump.
 *   • Drag the green/orange handles to fine-tune start/end visually.
 *   • Step buttons: -1s / -0.1s / +0.1s / +1s.
 *   • Stamp current playhead as start or end with one click.
 *   • Manual ms entry on both bounds.
 *   • Preview just the segment, looping if requested.
 *   • Optional "Auto-find this word" if a wordId is provided —
 *     calls /admin/words/{id}/auto-segment which runs Whisper on the
 *     linked track and writes start/end into the row.
 */
const fmt = (ms) => {
    if (ms == null || isNaN(ms)) return "—";
    const totalMs = Math.max(0, Math.round(ms));
    const s = Math.floor(totalMs / 1000);
    const msPart = String(totalMs % 1000).padStart(3, "0");
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}.${msPart}`;
};

const STEP_BUTTONS = [
    { label: "-1s",   delta: -1000 },
    { label: "-0.1s", delta: -100  },
    { label: "+0.1s", delta: +100  },
    { label: "+1s",   delta: +1000 },
];

const SegmentEditor = ({
    url,
    startMs: initStart,
    endMs: initEnd,
    onChange,
    onSave,
    saving,
    saved,
    wordId,         // optional — enables "Auto-find this word"
    trackCode,      // optional — informational badge
}) => {
    const audioRef = useRef(null);
    const timelineRef = useRef(null);
    const dragHandleRef = useRef(null); // 'start' | 'end' | 'playhead' | null

    const [start, setStart] = useState(initStart ?? null);
    const [end, setEnd] = useState(initEnd ?? null);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [loop, setLoop] = useState(false);
    const [autoBusy, setAutoBusy] = useState(false);
    const [autoMsg, setAutoMsg] = useState(null);
    const [ttsBusy, setTtsBusy] = useState(false);
    const [ttsMsg, setTtsMsg] = useState(null);
    const [rate, setRate] = useState(1);

    // keep state in sync if the parent switches to a different word
    useEffect(() => {
        setStart(initStart ?? null);
        setEnd(initEnd ?? null);
    }, [initStart, initEnd, url]);

    // Apply playback rate to the audio element whenever the user
    // toggles speed. 0.5x and 0.75x make it dramatically easier to
    // pinpoint exact word boundaries by ear.
    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        try { a.playbackRate = rate; } catch (_) {}
    }, [rate]);

    // Arrow-key seeking while the editor is mounted. Left/Right
    // nudge the playhead by 0.1s, with Shift jumping a full second.
    // Only fires when the user is NOT typing in an input/textarea
    // so the parent screen's Space/S/E shortcuts still play nicely.
    useEffect(() => {
        const handler = (e) => {
            const tag = (e.target && e.target.tagName) || "";
            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                e.target?.isContentEditable
            ) {
                return;
            }
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const step = e.shiftKey ? 1000 : 100;
            const a = audioRef.current;
            if (!a) return;
            const cur = a.currentTime * 1000;
            const next = e.key === "ArrowLeft" ? cur - step : cur + step;
            seekTo(next);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    const announce = useCallback(
        (s, e) => onChange?.({ startMs: s, endMs: e }),
        [onChange]
    );

    const seekTo = (ms) => {
        const a = audioRef.current;
        if (!a) return;
        const safe = Math.max(0, Math.min(duration || 0, ms));
        try {
            a.currentTime = safe / 1000;
            setPosition(safe);
        } catch (_) {}
    };

    const onTimeUpdate = () => {
        const a = audioRef.current;
        if (!a) return;
        const ms = a.currentTime * 1000;
        setPosition(ms);
        // Stop at endMs when previewing the segment
        if (previewMode && end != null && ms >= end) {
            if (loop && start != null) {
                a.currentTime = start / 1000;
            } else {
                a.pause();
                setPlaying(false);
                setPreviewMode(false);
            }
        }
    };

    const onLoaded = () => {
        const a = audioRef.current;
        if (!a) return;
        const d = a.duration * 1000 || 0;
        if (Number.isFinite(d) && d > 0) setDuration(d);
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

    const stop = () => {
        const a = audioRef.current;
        if (!a) return;
        a.pause();
        setPlaying(false);
        setPreviewMode(false);
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

    // Per-bound nudge buttons (e.g. "-0.1s" on the start handle)
    const nudge = (which, delta) => {
        if (which === "start") {
            const n = Math.max(0, Math.round((start ?? position) + delta));
            setStart(n);
            announce(n, end);
        } else {
            const n = Math.max(0, Math.round((end ?? position) + delta));
            setEnd(n);
            announce(start, n);
        }
    };

    // ───── Timeline interactions (click + drag) ─────

    const pixelToMs = (clientX) => {
        const tl = timelineRef.current;
        if (!tl || duration <= 0) return 0;
        const rect = tl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(ratio * duration);
    };

    const onTimelinePointerDown = (e) => {
        const tl = timelineRef.current;
        if (!tl) return;
        // Did we click directly on a handle? then start dragging it.
        const target = e.target;
        const handle = target?.dataset?.handle;
        if (handle === "start" || handle === "end") {
            dragHandleRef.current = handle;
        } else {
            // Plain click on the timeline = move playhead.
            dragHandleRef.current = "playhead";
            seekTo(pixelToMs(e.clientX));
        }
        tl.setPointerCapture?.(e.pointerId);
    };

    const onTimelinePointerMove = (e) => {
        const which = dragHandleRef.current;
        if (!which) return;
        const ms = pixelToMs(e.clientX);
        if (which === "start") {
            const safe = end != null ? Math.min(ms, end - 50) : ms;
            setStart(Math.max(0, safe));
            announce(Math.max(0, safe), end);
        } else if (which === "end") {
            const safe = start != null ? Math.max(ms, start + 50) : ms;
            setEnd(safe);
            announce(start, safe);
        } else if (which === "playhead") {
            seekTo(ms);
        }
    };

    const onTimelinePointerUp = (e) => {
        dragHandleRef.current = null;
        timelineRef.current?.releasePointerCapture?.(e.pointerId);
    };

    // ───── Whisper auto-segment for this single word ─────

    const autoFind = async () => {
        if (!wordId) return;
        setAutoBusy(true);
        setAutoMsg(null);
        try {
            const { data } = await axios.post(
                `/admin/words/${wordId}/auto-segment`
            );
            if (data?.ok) {
                setStart(data.segment_start_ms ?? null);
                setEnd(data.segment_end_ms ?? null);
                announce(data.segment_start_ms ?? null, data.segment_end_ms ?? null);
                setAutoMsg("✓ Found by Whisper");
            } else {
                setAutoMsg(data?.error || "Whisper could not find this word");
            }
        } catch (e) {
            setAutoMsg(
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                "Auto-find failed"
            );
        } finally {
            setAutoBusy(false);
            setTimeout(() => setAutoMsg(null), 4000);
        }
    };

    // ───── Generate child-friendly TTS clip for this word ─────
    //
    // When the linked NCCD track has no clear pronunciation of this
    // word (or the audio is missing entirely), the operator can ask
    // OpenAI's tts-1-hd model with the warm "shimmer" voice to
    // synthesise a fresh clip. The resulting mp3 is stored at
    // /assets/audio/tts/word_{id}.mp3 and the Word's audio_path is
    // pointed at it. Children then hear the same warm, clearly-
    // articulated voice everywhere the word appears.
    //
    // We POST to /admin/words/{id}/tts (already wired in routes/web.php)
    // which returns { ok, audio_path }. After a successful generation
    // we reload the page so the row picks up the new audio_path and
    // the audio editor re-mounts with the new file.

    const generateTts = async () => {
        if (!wordId) return;
        if (!confirm(
            "Generate a fresh child-friendly voice clip for this word?\n\n" +
            "This calls OpenAI tts-1-hd (~$0.001) and replaces any " +
            "existing per-word audio file. The browser will reload " +
            "so the new clip plays immediately."
        )) return;

        setTtsBusy(true);
        setTtsMsg("🎙 Generating warm child voice…");
        try {
            const { data } = await axios.post(
                `/admin/words/${wordId}/tts`,
                { overwrite: true },
            );
            if (data?.ok && data?.audio_path) {
                setTtsMsg("✓ Voice ready, reloading…");
                // Give the operator a moment to read the message, then
                // refresh so the row picks up the new audio_path.
                setTimeout(() => window.location.reload(), 800);
            } else {
                setTtsMsg(data?.error || data?.fallback || "TTS failed");
                setTimeout(() => setTtsMsg(null), 5000);
            }
        } catch (e) {
            setTtsMsg(
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                "TTS failed"
            );
            setTimeout(() => setTtsMsg(null), 5000);
        } finally {
            setTtsBusy(false);
        }
    };

    const pct = duration > 0 ? (position / duration) * 100 : 0;
    const startPct = duration > 0 && start != null ? (start / duration) * 100 : null;
    const endPct = duration > 0 && end != null ? (end / duration) * 100 : null;

    return (
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 mt-3">
            <audio
                ref={audioRef}
                src={url}
                preload="metadata"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoaded}
                onDurationChange={onLoaded}
                onEnded={() => {
                    setPlaying(false);
                    setPreviewMode(false);
                }}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
            />
            {/*
              NOTE: no `crossOrigin` attribute on purpose. The Admin →
              Audio Tracks page works perfectly because it points
              <audio> directly at the remote URL with no CORS flag —
              the browser allows playback + seeking + timeupdate as
              long as you don't ask for raw sample access.
            */}

            {/* Header row: track code + auto-find */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                {trackCode ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-white border border-purple-200 px-2 py-0.5 rounded-full">
                        {trackCode}
                    </span>
                ) : null}
                {wordId ? (
                    <button
                        onClick={autoFind}
                        type="button"
                        disabled={autoBusy}
                        className="text-[11px] font-black px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-sm disabled:opacity-50"
                        title="Use OpenAI Whisper to find this word's exact start/end inside the track"
                    >
                        {autoBusy ? "Finding…" : "✨ Auto-find this word"}
                    </button>
                ) : null}
                {wordId ? (
                    <button
                        onClick={generateTts}
                        type="button"
                        disabled={ttsBusy}
                        className="text-[11px] font-black px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm disabled:opacity-50"
                        title="Generate a warm, child-friendly voice clip for this word using OpenAI tts-1-hd (replaces the linked track audio)"
                    >
                        {ttsBusy ? "Generating…" : "🎙 Generate Voice"}
                    </button>
                ) : null}
                {autoMsg ? (
                    <span className="text-[11px] font-bold text-gray-600">
                        {autoMsg}
                    </span>
                ) : null}
                {ttsMsg ? (
                    <span className="text-[11px] font-bold text-emerald-600">
                        {ttsMsg}
                    </span>
                ) : null}
                <div className="ml-auto flex items-center gap-2">
                    {/*
                      Playback speed selector. Slowing the audio to
                      0.5x or 0.75x is a fast trick for finding the
                      exact start/end of a fast-spoken word.
                    */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                        {[0.5, 0.75, 1].map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setRate(r)}
                                className={
                                    "px-2 py-0.5 rounded text-[10px] font-black " +
                                    (rate === r
                                        ? "bg-purple-600 text-white"
                                        : "text-gray-500 hover:bg-gray-100")
                                }
                                title={`Play at ${r}x speed`}
                            >
                                {r}x
                            </button>
                        ))}
                    </div>
                    <label className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={loop}
                            onChange={(e) => setLoop(e.target.checked)}
                        />
                        Loop preview
                    </label>
                </div>
            </div>

            {/* Timeline (click-to-seek + drag handles) */}
            <div
                ref={timelineRef}
                onPointerDown={onTimelinePointerDown}
                onPointerMove={onTimelinePointerMove}
                onPointerUp={onTimelinePointerUp}
                onPointerCancel={onTimelinePointerUp}
                className="relative h-8 bg-white rounded-full border border-gray-200 overflow-hidden mb-2 cursor-pointer touch-none select-none"
                title="Click to seek. Drag the green/orange handles to set start/end."
            >
                {/* Segment highlight */}
                {startPct != null && endPct != null ? (
                    <div
                        className="absolute top-0 bottom-0 bg-purple-200/70 pointer-events-none"
                        style={{
                            left: `${Math.max(0, Math.min(100, startPct))}%`,
                            width: `${Math.max(0, Math.min(100, endPct - startPct))}%`,
                        }}
                    />
                ) : null}

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-rose-500 pointer-events-none"
                    style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
                />

                {/* Start handle */}
                {startPct != null ? (
                    <div
                        data-handle="start"
                        className="absolute -top-1 -bottom-1 w-3 bg-emerald-500 rounded-sm shadow-md hover:bg-emerald-400 cursor-ew-resize"
                        style={{ left: `calc(${startPct}% - 6px)` }}
                        title={`Drag start (currently ${fmt(start)})`}
                    >
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-black pointer-events-none">
                            S
                        </span>
                    </div>
                ) : null}

                {/* End handle */}
                {endPct != null ? (
                    <div
                        data-handle="end"
                        className="absolute -top-1 -bottom-1 w-3 bg-amber-500 rounded-sm shadow-md hover:bg-amber-400 cursor-ew-resize"
                        style={{ left: `calc(${endPct}% - 6px)` }}
                        title={`Drag end (currently ${fmt(end)})`}
                    >
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-black pointer-events-none">
                            E
                        </span>
                    </div>
                ) : null}
            </div>

            {/* Position scrubber */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    onClick={() => seekTo(Math.max(0, position - 1000))}
                    type="button"
                    className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-50"
                    title="Skip back 1 second"
                >
                    ⏪
                </button>
                <button
                    onClick={() => seekTo(Math.max(0, position - 100))}
                    type="button"
                    className="px-2 py-1 rounded-md bg-white border border-gray-200 text-[10px] font-black text-gray-700 hover:bg-gray-50"
                >
                    -0.1s
                </button>
                <input
                    type="range"
                    min={0}
                    max={Math.max(100, Math.round(duration))}
                    step={10}
                    value={Math.round(position)}
                    onChange={(e) => seekTo(Number(e.target.value))}
                    className="flex-1 accent-purple-600"
                />
                <button
                    onClick={() => seekTo(Math.min(duration, position + 100))}
                    type="button"
                    className="px-2 py-1 rounded-md bg-white border border-gray-200 text-[10px] font-black text-gray-700 hover:bg-gray-50"
                >
                    +0.1s
                </button>
                <button
                    onClick={() => seekTo(Math.min(duration, position + 1000))}
                    type="button"
                    className="px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-50"
                    title="Skip forward 1 second"
                >
                    ⏩
                </button>
            </div>

            {/* Readouts */}
            <div className="flex justify-between text-[11px] font-mono text-gray-600 mb-3 flex-wrap gap-2">
                <span>▶ {fmt(position)}</span>
                <span className="font-black text-emerald-600">start {fmt(start)}</span>
                <span className="font-black text-amber-600">end {fmt(end)}</span>
                <span>⏱ {fmt(duration)}</span>
            </div>

            {/* Primary controls */}
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
                <button
                    onClick={stop}
                    type="button"
                    disabled={!playing}
                    className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-black disabled:opacity-40"
                >
                    ■ Stop
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

            {/* Manual ms entry + per-bound nudge buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                        Start (ms)
                    </label>
                    <div className="flex items-center gap-1">
                        {STEP_BUTTONS.map((b) => (
                            <button
                                key={"s" + b.label}
                                onClick={() => nudge("start", b.delta)}
                                type="button"
                                className="px-1.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black hover:bg-emerald-100"
                                title={`Nudge start by ${b.label}`}
                            >
                                {b.label}
                            </button>
                        ))}
                        <input
                            type="number"
                            min={0}
                            value={start ?? ""}
                            onChange={(e) => changeStart(e.target.value)}
                            placeholder="e.g. 1800"
                            className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono text-[#1E293B]"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-400">
                        End (ms)
                    </label>
                    <div className="flex items-center gap-1">
                        {STEP_BUTTONS.map((b) => (
                            <button
                                key={"e" + b.label}
                                onClick={() => nudge("end", b.delta)}
                                type="button"
                                className="px-1.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-black hover:bg-amber-100"
                                title={`Nudge end by ${b.label}`}
                            >
                                {b.label}
                            </button>
                        ))}
                        <input
                            type="number"
                            min={0}
                            value={end ?? ""}
                            onChange={(e) => changeEnd(e.target.value)}
                            placeholder="e.g. 3600"
                            className="flex-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono text-[#1E293B]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
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
                    ← / → seek 0.1s · Shift+arrow 1s · Space play · S start · E end · Enter save
                </p>
            </div>
        </div>
    );
};

export default SegmentEditor;
