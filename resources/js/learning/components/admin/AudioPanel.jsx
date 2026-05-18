import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

/**
 * AudioPanel — full-control audio editor for a single Word row.
 *
 * Tabs:
 *   1. Upload     — pick any mp3/wav/m4a/ogg from the operator's
 *                   computer. JSON-base64 path for tiny clips,
 *                   multipart fallback for big files.
 *   2. Record     — MediaRecorder hook into the browser microphone
 *                   so a teacher can record their own voice in one
 *                   click and save it as the word's clip.
 *   3. Library    — browse every NCCD/uploaded AudioTrack grouped
 *                   by book + page, with search + preview. Picking
 *                   a row writes the audio_track_id directly.
 *   4. AI Voice   — regenerate the OpenAI TTS clip with a custom
 *                   voice (Nova / Shimmer / Coral / Sage / …) and
 *                   optional free-form personality instructions.
 *
 * State is owned by this component; the parent only receives the
 * updated row via the `onChange(updatedWord)` callback after every
 * successful action so it can refresh its local copy.
 */
const TABS = [
    { id: "upload",  label: "Upload file",   icon: "📁" },
    { id: "record",  label: "Record voice",  icon: "🎙" },
    { id: "library", label: "Curriculum library", icon: "📚" },
    { id: "ai",      label: "AI voice",      icon: "✨" },
];

function classifyAudioPath(path) {
    if (!path) return "none";
    const p = String(path).replace(/^\//, "");
    if (p.startsWith("assets/audio/tts/"))            return "tts";
    if (p.startsWith("assets/uploads/words/audio/"))  return "upload";
    return "manual"; // hand-edited / seeded path
}

function fmtBytes(n) {
    if (!n) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(2) + " MB";
}

const AudioPanel = ({ word, onChange, onClose }) => {
    const [tab, setTab] = useState("upload");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    const audioPath = word.audio_path
        ? "/" + String(word.audio_path).replace(/^\//, "")
        : null;
    const audioKind = classifyAudioPath(word.audio_path);
    const trackInfo = word.audio_track || null;

    // Library state
    const [library, setLibrary] = useState(null);
    const [libQuery, setLibQuery] = useState("");
    const [libBook,  setLibBook]  = useState(null);

    // Voice state
    const [voice, setVoice] = useState("nova");
    const [instructions, setInstructions] = useState("");

    // Recorder state
    const [recState, setRecState] = useState("idle"); // idle | rec | done
    const [recBlob,  setRecBlob]  = useState(null);
    const [recTime,  setRecTime]  = useState(0);
    const recorderRef = useRef(null);
    const chunksRef   = useRef([]);
    const tickRef     = useRef(null);

    useEffect(() => {
        if (tab === "library" && !library) loadLibrary();
        if (tab === "ai" && !library) loadLibrary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    useEffect(() => () => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
            try { recorderRef.current.stop(); } catch (_) {}
        }
        if (tickRef.current) clearInterval(tickRef.current);
    }, []);

    async function loadLibrary() {
        try {
            const { data } = await axios.get("/admin/audio/library");
            setLibrary(data);
            const firstBook = Object.keys(data?.books || {})[0];
            if (firstBook) setLibBook(firstBook);
        } catch (e) {
            setError("Could not load audio library: " + (e?.message || ""));
        }
    }

    function update(payload) {
        if (payload?.word) onChange?.(payload.word);
        else if (payload?.audio_path) {
            onChange?.({ ...word, audio_path: payload.audio_path,
                audio_track_id: null, segment_start_ms: null, segment_end_ms: null });
        }
    }

    function showInfo(msg) {
        setInfo(msg);
        setTimeout(() => setInfo(null), 2500);
    }

    // ── Upload tab ───────────────────────────────────────────────
    async function uploadFile(file) {
        if (!file) return;
        if (file.size > 25 * 1024 * 1024) {
            setError(`File is too large (${fmtBytes(file.size)}). Max 25 MB.`);
            return;
        }
        setBusy(true); setError(null);
        try {
            // For tiny files (<1.5MB) prefer base64 JSON to bypass nginx/php
            // POST size limits. Bigger files go through multipart.
            if (file.size < 1.5 * 1024 * 1024) {
                const dataUrl = await readAsDataUrl(file);
                const { data } = await axios.post(
                    `/admin/words/${word.id}/audio`,
                    { audio_base64: dataUrl },
                    { headers: { "Content-Type": "application/json" } }
                );
                if (!data.ok) throw new Error(data.error || "Upload failed");
                update(data);
            } else {
                const fd = new FormData();
                fd.append("audio", file);
                const { data } = await axios.post(`/admin/words/${word.id}/audio`, fd);
                if (!data.ok) throw new Error(data.error || "Upload failed");
                update(data);
            }
            showInfo(`Saved ${fmtBytes(file.size)} clip.`);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Upload failed");
        } finally { setBusy(false); }
    }

    function readAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload  = () => resolve(r.result);
            r.onerror = () => reject(r.error);
            r.readAsDataURL(file);
        });
    }

    // ── Recorder tab ─────────────────────────────────────────────
    async function startRecording() {
        if (recState === "rec") return;
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mime =
                MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
                MediaRecorder.isTypeSupported("audio/webm")             ? "audio/webm" :
                MediaRecorder.isTypeSupported("audio/mp4")              ? "audio/mp4"  :
                "";
            const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            chunksRef.current = [];
            rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunksRef.current.push(ev.data); };
            rec.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
                setRecBlob(blob);
                setRecState("done");
                if (tickRef.current) clearInterval(tickRef.current);
            };
            recorderRef.current = rec;
            rec.start();
            setRecState("rec");
            setRecTime(0);
            tickRef.current = setInterval(() => setRecTime((t) => t + 1), 1000);
        } catch (e) {
            setError("Microphone access denied or not available.");
        }
    }

    function stopRecording() {
        if (recorderRef.current && recorderRef.current.state === "recording") {
            recorderRef.current.stop();
        }
    }

    function discardRecording() {
        setRecBlob(null);
        setRecState("idle");
        setRecTime(0);
    }

    async function saveRecording() {
        if (!recBlob) return;
        setBusy(true); setError(null);
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload  = () => resolve(r.result);
                r.onerror = () => reject(r.error);
                r.readAsDataURL(recBlob);
            });
            const { data } = await axios.post(
                `/admin/words/${word.id}/audio`,
                { audio_base64: dataUrl },
                { headers: { "Content-Type": "application/json" } }
            );
            if (!data.ok) throw new Error(data.error || "Save failed");
            update(data);
            discardRecording();
            showInfo("Recording saved.");
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Save failed");
        } finally { setBusy(false); }
    }

    // ── Library tab ──────────────────────────────────────────────
    const libraryRows = useMemo(() => {
        if (!library?.books) return [];
        const all = library.books[libBook] || [];
        if (!libQuery.trim()) return all;
        const q = libQuery.trim().toLowerCase();
        return all.filter((t) =>
            (t.code  || "").toLowerCase().includes(q) ||
            (t.label || "").toLowerCase().includes(q) ||
            String(t.page || "").includes(q)
        );
    }, [library, libBook, libQuery]);

    async function pickTrack(track) {
        setBusy(true); setError(null);
        try {
            const { data } = await axios.patch(`/admin/words/${word.id}`, {
                audio_track_id: track.id,
                // The track has no segment yet — leave start/end null so
                // the lesson plays the full clip and the admin can
                // refine timestamps via the "Set segment" editor.
                segment_start_ms: null,
                segment_end_ms:   null,
                // Drop any per-word file binding so the row falls back
                // to the shared track.
                audio_path: null,
            });
            if (!data.ok) throw new Error(data.error || "Could not link track");
            onChange?.(data.word);
            showInfo(`Linked to ${track.code}.`);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Link failed");
        } finally { setBusy(false); }
    }

    // ── AI voice tab ─────────────────────────────────────────────
    async function regenerateTts() {
        setBusy(true); setError(null);
        try {
            const { data } = await axios.post(`/admin/words/${word.id}/tts`, {
                voice: voice || null,
                instructions: instructions.trim() || null,
            });
            if (!data.ok) throw new Error(data.error || "TTS failed");
            update(data);
            showInfo("New AI voice clip generated.");
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "TTS failed");
        } finally { setBusy(false); }
    }

    // ── Clear ────────────────────────────────────────────────────
    async function clearAudio() {
        if (!window.confirm(`Clear all audio binding for "${word.word}"?`)) return;
        setBusy(true); setError(null);
        try {
            const { data } = await axios.post(`/admin/words/${word.id}/clear-audio`);
            if (!data.ok) throw new Error(data.error || "Clear failed");
            onChange?.(data.word);
            showInfo("Audio cleared.");
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Clear failed");
        } finally { setBusy(false); }
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 mt-3">
            <header className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-[#1E293B]">
                        🎧 Audio control · <span className="text-purple-600">{word.word}</span>
                    </h3>
                    <CurrentSourcePill kind={audioKind} track={trackInfo} path={audioPath} />
                </div>
                <div className="flex items-center gap-2">
                    {audioPath || trackInfo ? (
                        <PreviewButton path={audioPath} track={trackInfo}
                            startMs={word.segment_start_ms} endMs={word.segment_end_ms} />
                    ) : (
                        <span className="text-[10px] font-black text-gray-400">No audio yet</span>
                    )}
                    <button type="button" onClick={clearAudio} disabled={busy}
                        className="text-[11px] font-black text-rose-600 hover:text-rose-800 disabled:opacity-40">
                        Clear all
                    </button>
                    {onClose ? (
                        <button type="button" onClick={onClose}
                            className="text-[11px] font-black text-gray-500 hover:text-gray-800">
                            Close ✕
                        </button>
                    ) : null}
                </div>
            </header>

            <nav className="flex gap-1 flex-wrap border-b border-purple-100 mb-3">
                {TABS.map((t) => {
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id} type="button"
                            onClick={() => setTab(t.id)}
                            className={
                                "px-3 py-1.5 text-[11px] font-black rounded-t-lg transition-colors " +
                                (active
                                    ? "bg-white text-purple-700 shadow-sm border-x border-t border-purple-100"
                                    : "text-gray-500 hover:text-purple-600")
                            }>
                            {t.icon} {t.label}
                        </button>
                    );
                })}
            </nav>

            <div className="bg-white rounded-lg border border-purple-100 p-4 min-h-[160px]">
                {tab === "upload" ? (
                    <UploadTab onPick={uploadFile} busy={busy} />
                ) : null}

                {tab === "record" ? (
                    <RecordTab
                        state={recState}
                        time={recTime}
                        blob={recBlob}
                        onStart={startRecording}
                        onStop={stopRecording}
                        onDiscard={discardRecording}
                        onSave={saveRecording}
                        busy={busy}
                    />
                ) : null}

                {tab === "library" ? (
                    <LibraryTab
                        library={library}
                        rows={libraryRows}
                        book={libBook} setBook={setLibBook}
                        query={libQuery} setQuery={setLibQuery}
                        onPick={pickTrack}
                        currentTrackId={word.audio_track_id}
                        busy={busy}
                    />
                ) : null}

                {tab === "ai" ? (
                    <AiVoiceTab
                        voices={library?.voices || []}
                        voice={voice} setVoice={setVoice}
                        instructions={instructions} setInstructions={setInstructions}
                        onGenerate={regenerateTts}
                        busy={busy}
                    />
                ) : null}
            </div>

            {error ? (
                <p className="text-xs text-rose-600 font-bold mt-2">⚠️ {error}</p>
            ) : null}
            {info ? (
                <p className="text-xs text-emerald-600 font-bold mt-2">✓ {info}</p>
            ) : null}
        </div>
    );
};

// ── Sub-views ──────────────────────────────────────────────────

function CurrentSourcePill({ kind, track, path }) {
    if (track) {
        return (
            <span className="text-[10px] font-black bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                📚 NCCD · {track.code}
            </span>
        );
    }
    if (kind === "tts") {
        return (
            <span className="text-[10px] font-black bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                ✨ AI voice
            </span>
        );
    }
    if (kind === "upload") {
        return (
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                📁 Custom upload
            </span>
        );
    }
    if (kind === "manual") {
        return (
            <span className="text-[10px] font-black bg-amber-100 text-amber-700 rounded-full px-2 py-0.5"
                title={path || ""}>
                ✍️ Manual path
            </span>
        );
    }
    return (
        <span className="text-[10px] font-black bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
            🤐 Falls back to TTS
        </span>
    );
}

function PreviewButton({ path, track, startMs, endMs }) {
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const stopAt = useRef(null);

    const url = useMemo(() => {
        if (path) return path;
        if (track?.url) return track.url;
        return null;
    }, [path, track]);

    useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        const onEnd = () => setPlaying(false);
        el.addEventListener("ended", onEnd);
        return () => el.removeEventListener("ended", onEnd);
    }, []);

    function toggle() {
        const el = audioRef.current;
        if (!el || !url) return;
        if (playing) {
            el.pause();
            setPlaying(false);
            return;
        }
        try {
            el.currentTime = startMs != null ? startMs / 1000 : 0;
        } catch (_) {}
        if (endMs != null) {
            stopAt.current = endMs / 1000;
            const tick = () => {
                if (stopAt.current != null && el.currentTime >= stopAt.current) {
                    el.pause();
                    setPlaying(false);
                }
            };
            el.ontimeupdate = tick;
        } else {
            el.ontimeupdate = null;
        }
        el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }

    if (!url) return null;
    return (
        <>
            <button type="button" onClick={toggle}
                className="text-[11px] font-black px-2 py-1 rounded-lg bg-emerald-500 text-white">
                {playing ? "⏸ Pause" : "▶ Preview"}
            </button>
            <audio ref={audioRef} src={url} preload="metadata" />
        </>
    );
}

function UploadTab({ onPick, busy }) {
    const inputRef = useRef(null);
    return (
        <div className="text-center">
            <p className="text-xs font-bold text-gray-500 mb-3">
                Drop in any <code className="text-purple-600">mp3 / wav / m4a / ogg / webm</code> recording.
                Tiny clips are sent as JSON; bigger ones use multipart upload.
            </p>
            <input ref={inputRef} type="file" accept="audio/*" hidden
                onChange={(e) => onPick?.(e.target.files?.[0])} />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
                className="px-5 py-3 rounded-xl bg-[#7C3AED] text-white text-sm font-black shadow-md disabled:opacity-50">
                {busy ? "Uploading…" : "📁 Choose audio file"}
            </button>
            <p className="text-[10px] font-black text-gray-400 mt-3 uppercase tracking-widest">
                Max 25 MB · Replaces the previous clip
            </p>
        </div>
    );
}

function RecordTab({ state, time, blob, onStart, onStop, onDiscard, onSave, busy }) {
    const previewUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
    const mm = String(Math.floor(time / 60)).padStart(2, "0");
    const ss = String(time % 60).padStart(2, "0");

    return (
        <div className="text-center">
            {state === "rec" ? (
                <>
                    <div className="text-3xl font-black text-rose-600 mb-2 animate-pulse">
                        ● Recording
                    </div>
                    <p className="font-mono text-2xl text-[#1E293B] mb-3">{mm}:{ss}</p>
                    <button type="button" onClick={onStop}
                        className="px-5 py-3 rounded-xl bg-rose-500 text-white text-sm font-black shadow-md">
                        ⏹ Stop
                    </button>
                </>
            ) : null}

            {state === "idle" ? (
                <>
                    <p className="text-xs font-bold text-gray-500 mb-3">
                        Record your own voice for this word using the browser microphone.
                    </p>
                    <button type="button" onClick={onStart}
                        className="px-5 py-3 rounded-xl bg-rose-500 text-white text-sm font-black shadow-md">
                        🎙 Start recording
                    </button>
                    <p className="text-[10px] font-black text-gray-400 mt-3 uppercase tracking-widest">
                        Browser will ask for microphone permission
                    </p>
                </>
            ) : null}

            {state === "done" && blob ? (
                <>
                    <p className="text-xs font-bold text-gray-500 mb-2">
                        Listen back, then save or re-record.
                    </p>
                    <audio controls src={previewUrl} className="mx-auto mb-3" />
                    <div className="flex justify-center gap-2 flex-wrap">
                        <button type="button" onClick={onSave} disabled={busy}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-black shadow-md disabled:opacity-50">
                            {busy ? "Saving…" : "✓ Save as audio"}
                        </button>
                        <button type="button" onClick={onDiscard}
                            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm font-black">
                            ↺ Re-record
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function LibraryTab({ library, rows, book, setBook, query, setQuery, onPick, currentTrackId, busy }) {
    if (!library) {
        return <p className="text-xs font-bold text-gray-400 text-center py-6">Loading curriculum library…</p>;
    }
    const books = Object.keys(library.books || {});
    if (!books.length) {
        return <p className="text-xs font-bold text-gray-400 text-center py-6">
            No tracks indexed yet. Run <code>Audio › Discover NCCD</code> first.
        </p>;
    }

    return (
        <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
                <div className="flex gap-1">
                    {books.map((b) => (
                        <button key={b} type="button" onClick={() => setBook(b)}
                            className={
                                "px-3 py-1 rounded-lg text-[11px] font-black " +
                                (book === b
                                    ? "bg-[#7C3AED] text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                            }>
                            {b} ({library.summary?.[b] || 0})
                        </button>
                    ))}
                </div>
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search code / label / page…"
                    className="flex-1 min-w-[160px] px-2 py-1 rounded-lg border border-gray-200 text-xs" />
            </div>

            <div className="max-h-[260px] overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                {rows.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 text-center py-6">No matches.</p>
                ) : null}
                {rows.map((t) => {
                    const linked = currentTrackId === t.id;
                    return (
                        <div key={t.id} className={
                            "flex items-center gap-3 px-3 py-2 text-xs " +
                            (linked ? "bg-emerald-50" : "hover:bg-purple-50")
                        }>
                            <span className="font-mono font-black text-purple-700 w-14 shrink-0">
                                {t.code}
                            </span>
                            <span className="text-gray-400 w-10 shrink-0">
                                p{t.page}
                            </span>
                            <span className="flex-1 truncate text-[#1E293B] font-bold">
                                {t.label || "—"}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                {t.format}
                            </span>
                            <audio src={t.url} controls preload="none"
                                style={{ height: 28, width: 160 }} />
                            <button type="button" onClick={() => onPick(t)} disabled={busy || linked}
                                className={
                                    "px-3 py-1 rounded-lg text-[11px] font-black shrink-0 " +
                                    (linked
                                        ? "bg-emerald-100 text-emerald-700 cursor-default"
                                        : "bg-[#7C3AED] text-white hover:bg-[#6D28D9] disabled:opacity-50")
                                }>
                                {linked ? "✓ Linked" : "Use"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AiVoiceTab({ voices, voice, setVoice, instructions, setInstructions, onGenerate, busy }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-500 mb-3">
                Regenerate the OpenAI text-to-speech clip with a different voice or
                personality. Picks <code>gpt-4o-mini-tts</code> when your account
                supports it; falls back to <code>tts-1-hd</code> otherwise.
            </p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Voice
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
                {(voices.length ? voices : [
                    { id: "nova",    label: "Nova",    hint: "Bright, expressive · default for kids" },
                    { id: "shimmer", label: "Shimmer", hint: "Soft, warm · gentle for Welcome unit" },
                    { id: "coral",   label: "Coral",   hint: "Playful · stories/songs" },
                    { id: "sage",    label: "Sage",    hint: "Calm narrator · clear instructions" },
                ]).map((v) => {
                    const active = voice === v.id;
                    return (
                        <button key={v.id} type="button" onClick={() => setVoice(v.id)}
                            title={v.hint}
                            className={
                                "px-3 py-1.5 rounded-lg text-[11px] font-black border " +
                                (active
                                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300")
                            }>
                            {v.label}
                        </button>
                    );
                })}
            </div>

            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Personality instructions <span className="font-mono lowercase text-gray-300">(optional)</span>
            </label>
            <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder='e.g. "Speak like a warm kindergarten teacher introducing this word for the very first time."'
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-sans text-[#1E293B]"
            />
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Leave instructions empty to use the smart default for this word's type.
                </p>
                <button type="button" onClick={onGenerate} disabled={busy}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-black shadow-md disabled:opacity-50">
                    {busy ? "Generating…" : "✨ Generate AI voice"}
                </button>
            </div>
        </div>
    );
}

export default AudioPanel;
