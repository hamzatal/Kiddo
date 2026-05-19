import React, { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import SegmentEditor from "@/learning/components/admin/SegmentEditor";
import AudioPanel from "@/learning/components/admin/AudioPanel";
import { shrinkForAdminUpload, isSupportedImage, MAX_INPUT_BYTES } from "@/learning/utils/imageUpload";

const TYPE_BADGE_CLS =
    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full";

/**
 * Format playback length in seconds with 2 decimal places, or "—" when
 * either side of the segment is not yet set.
 */
function formatSegmentLength(startMs, endMs) {
    if (startMs == null || endMs == null) return "—";
    const diff = Math.max(0, endMs - startMs) / 1000;
    return diff.toFixed(2) + "s";
}

function WordRow({ w, tracks, onFocusRow, isFocused, onRemoved, isSelected, onToggleSelect }) {
    const [row, setRow] = useState(w);
    const [open, setOpen] = useState(false);
    const [audioOpen, setAudioOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const rowRef = useRef(null);

    async function onDelete() {
        const sure = window.confirm(
            `Delete the word "${row.word}" permanently? This cannot be undone.`
        );
        if (!sure) return;
        setDeleting(true);
        setError(null);
        try {
            const res = await axios.delete("/admin/words/" + w.id);
            if (res.data && res.data.ok) {
                onRemoved?.(w.id);
            } else {
                setError(res.data?.error || "Delete failed");
                setDeleting(false);
            }
        } catch (e) {
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                "Delete failed";
            setError(msg);
            setDeleting(false);
        }
    }

    const track = useMemo(
        function () {
            return (
                tracks.find((t) => t.id === row.audio_track_id) ||
                row.audio_track ||
                null
            );
        },
        [row.audio_track_id, tracks, row.audio_track]
    );
    // Use the raw NCCD URL directly — exactly like the Admin → Audio
    // Tracks page does. <audio src={url}> with no crossOrigin flag
    // plays NCCD MP3s flawlessly even though qr.nccd.gov.jo doesn't
    // send CORS headers. Going through /api/audio/{code} adds a 302
    // redirect that some browsers treat differently for `preload=auto`,
    // which was the reason segment playback was failing here.
    const trackUrl = track ? track.url : null;
    // Keep proxy URL handy as a manual fallback if a future track
    // has only a `local_path` and no remote URL.
    const trackProxyUrl = track ? `/api/audio/${track.code}` : null;

    async function save(extra) {
        setSaving(true);
        setError(null);
        try {
            const payload = {
                word: row.word,
                category: row.category,
                type: row.type,
                image_path: row.image_path,
                audio_path: row.audio_path,
                audio_track_id: row.audio_track_id,
                segment_start_ms: row.segment_start_ms,
                segment_end_ms: row.segment_end_ms,
            };
            if (extra) Object.assign(payload, extra);
            const res = await axios.patch("/admin/words/" + w.id, payload);
            if (res.data && res.data.ok) {
                setRow(Object.assign({}, row, res.data.word || {}));
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
            } else if (res.data && res.data.error) {
                setError(res.data.error);
            }
        } catch (e) {
            const msg =
                (e.response && e.response.data && (e.response.data.error || e.response.data.message)) ||
                "Save failed";
            setError(msg);
        } finally {
            setSaving(false);
        }
    }

    const hasSegment =
        row.segment_start_ms != null && row.segment_end_ms != null;

    let segBtnCls = "px-3 py-1.5 rounded-lg text-xs font-black ";
    if (hasSegment) {
        segBtnCls += "bg-emerald-100 text-emerald-700";
    } else if (trackUrl) {
        segBtnCls += "bg-amber-50 text-amber-700";
    } else {
        segBtnCls += "bg-gray-100 text-gray-400";
    }

    let segBtnLabel = "No track";
    if (hasSegment) {
        segBtnLabel =
            "Segment " + row.segment_start_ms + "ms -> " + row.segment_end_ms + "ms";
    } else if (trackUrl) {
        segBtnLabel = "Set segment";
    }

    // Signal to the parent page which row is currently "active" (editor
    // open) so the keyboard shortcuts know where to route keypresses.
    function toggleOpen() {
        const next = !open;
        setOpen(next);
        if (next && onFocusRow) onFocusRow(w.id);
        if (!next && isFocused && onFocusRow) onFocusRow(null);
    }

    useEffect(() => {
        // If the parent switches focus away (because another row opened),
        // collapse our editor to avoid multiple editors listening at once.
        if (open && !isFocused) setOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused]);

    return (
        <div
            ref={rowRef}
            data-word-row-id={w.id}
            className={`bg-white rounded-xl border ${
                isFocused ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-100"
            } p-4 mb-3`}
        >
            <div className="flex items-start gap-4 flex-wrap">
                <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={(e) => onToggleSelect?.(w.id, e.target.checked)}
                    className="mt-2 w-4 h-4 accent-purple-600"
                    title="Select for bulk delete"
                />
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                    {row.image_path ? (
                        <img
                            src={"/" + String(row.image_path).replace(/^\//, "")}
                            alt={row.word}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.currentTarget.style.opacity = "0.3";
                            }}
                        />
                    ) : (
                        <span className="text-2xl text-gray-300">?</span>
                    )}
                    {/* Image upload overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                        <span className="text-white text-xs font-black">📷</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > MAX_INPUT_BYTES) {
                                    setError(`File is too large (${(file.size/1024/1024).toFixed(1)} MB). Max 20 MB.`);
                                    e.target.value = "";
                                    return;
                                }
                                if (!isSupportedImage(file)) {
                                    setError("Please pick an image file (JPG, PNG, GIF, WebP, SVG, BMP).");
                                    e.target.value = "";
                                    return;
                                }
                                try {
                                    setError(null);
                                    // Resize in the browser BEFORE uploading
                                    // to avoid PHP/nginx POST size limits.
                                    const dataUrl = await shrinkForAdminUpload(file);
                                    const res = await axios.post(
                                        `/admin/words/${w.id}/image`,
                                        { image_base64: dataUrl },
                                        { headers: { "Content-Type": "application/json" } }
                                    );
                                    if (res.data?.ok) {
                                        setRow({ ...row, image_path: res.data.image_path });
                                    } else {
                                        setError(res.data?.error || "Image upload failed");
                                    }
                                } catch (err) {
                                    setError(
                                        err?.response?.data?.error ||
                                        err?.message ||
                                        "Image upload failed"
                                    );
                                } finally {
                                    e.target.value = "";
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            value={row.word}
                            onChange={(e) =>
                                setRow(Object.assign({}, row, { word: e.target.value }))
                            }
                            onBlur={() => save()}
                            className="text-base font-black text-[#1E293B] bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1 min-w-[160px]"
                        />
                        <span className={TYPE_BADGE_CLS + " bg-gray-50 text-gray-500"}>
                            {row.type}
                        </span>
                        {row.category ? (
                            <span className={TYPE_BADGE_CLS + " bg-blue-50 text-blue-700"}>
                                {row.category}
                            </span>
                        ) : null}
                        <span className="text-[10px] font-black text-gray-400 uppercase">
                            {row.unit_title}
                        </span>
                        {/* Compact playback length — helps spot overly long clips. */}
                        <span
                            className={
                                TYPE_BADGE_CLS +
                                " " +
                                (hasSegment
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-50 text-gray-400")
                            }
                            title="Playback length (end - start)"
                        >
                            ⏱ {formatSegmentLength(row.segment_start_ms, row.segment_end_ms)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                            Image path
                            <input
                                value={row.image_path || ""}
                                onChange={(e) =>
                                    setRow(
                                        Object.assign({}, row, {
                                            image_path: e.target.value,
                                        })
                                    )
                                }
                                onBlur={() => save()}
                                className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-xs font-mono text-gray-700"
                            />
                        </label>
                        <div className="text-[10px] font-black uppercase text-gray-400">
                            Audio source
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !audioOpen;
                                    setAudioOpen(next);
                                    if (next && onFocusRow) onFocusRow(w.id);
                                }}
                                className={
                                    "w-full mt-1 flex items-center justify-between gap-2 px-2 py-2 rounded-lg border text-xs font-bold normal-case " +
                                    (audioOpen
                                        ? "bg-purple-50 border-purple-200 text-purple-700"
                                        : "bg-white border-gray-200 text-[#1E293B] hover:border-purple-200")
                                }
                            >
                                <span className="truncate">
                                    {row.audio_track
                                        ? `📚 NCCD · ${row.audio_track.code}`
                                        : (function () {
                                            const p = row.audio_path
                                                ? String(row.audio_path).replace(/^\//, "")
                                                : "";
                                            if (p.startsWith("assets/audio/tts/")) return "✨ AI voice clip";
                                            if (p.startsWith("assets/uploads/words/audio/")) return "📁 Custom upload";
                                            if (p) return "✍️ " + p.split("/").pop();
                                            return "🤐 Falls back to TTS";
                                        })()}
                                </span>
                                <span className="text-[10px] font-black text-purple-500 shrink-0">
                                    {audioOpen ? "Hide ▲" : "Edit 🎧"}
                                </span>
                            </button>
                        </div>
                        <label className="text-[10px] font-black uppercase text-gray-400">
                            Category
                            <input
                                value={row.category || ""}
                                onChange={(e) =>
                                    setRow(
                                        Object.assign({}, row, {
                                            category: e.target.value,
                                        })
                                    )
                                }
                                onBlur={() => save()}
                                placeholder="colour / family / s ..."
                                className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-xs font-sans text-[#1E293B]"
                            />
                        </label>
                    </div>
                </div>

                <div className="shrink-0 text-right flex flex-col items-end gap-1">
                    <button
                        type="button"
                        onClick={toggleOpen}
                        disabled={!trackUrl}
                        className={segBtnCls}
                    >
                        {segBtnLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-3 py-1 rounded-lg text-[11px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                        title="Permanently delete this word"
                    >
                        {deleting ? "Deleting…" : "🗑 Delete word"}
                    </button>
                    <div className="text-[10px] mt-1">
                        {saving ? (
                            <span className="text-gray-400">saving...</span>
                        ) : null}
                        {saved ? (
                            <span className="text-emerald-500">saved</span>
                        ) : null}
                        {error ? (
                            <span className="text-rose-500">{error}</span>
                        ) : null}
                    </div>
                </div>
            </div>

            {audioOpen ? (
                <AudioPanel
                    word={row}
                    onClose={() => setAudioOpen(false)}
                    onChange={(next) => {
                        // The backend always returns the freshly-loaded
                        // word with its audio_track relationship eager-
                        // loaded, so we just spread it on top of our row
                        // state to stay in sync.
                        setRow((prev) => Object.assign({}, prev, next));
                    }}
                />
            ) : null}

            {open && trackUrl ? (
                <>
                    <SegmentEditor
                        url={trackUrl}
                        wordId={w.id}
                        trackCode={track?.code}
                        startMs={row.segment_start_ms}
                        endMs={row.segment_end_ms}
                        saving={saving}
                        saved={saved}
                        onChange={(payload) =>
                            setRow(
                                Object.assign({}, row, {
                                    segment_start_ms: payload.startMs,
                                    segment_end_ms: payload.endMs,
                                })
                            )
                        }
                        onSave={() =>
                            save({
                                segment_start_ms: row.segment_start_ms,
                                segment_end_ms: row.segment_end_ms,
                            })
                        }
                    />
                    <p className="text-[11px] font-bold text-gray-500 mt-2 px-1">
                        <span className="font-black text-purple-600">Keyboard:</span>{" "}
                        Space = play, S = set start, E = set end, Enter = save
                    </p>
                </>
            ) : null}
        </div>
    );
}

function Words({ units, tracks, words, selected, search }) {
    const [unit, setUnit] = useState(selected || "");
    const [q, setQ] = useState(search || "");
    const [onlyUnset, setOnlyUnset] = useState(false);
    const [focusedRowId, setFocusedRowId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [draft, setDraft] = useState({
        unit_id: selected || (units[0]?.id ?? ""),
        word: "",
        type: "vocab",
        category: "",
        audio_track_id: "",
        image_path: "",
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const fileRef = useRef(null);
    // Bulk selection set + duplicates panel state.
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [dupOpen, setDupOpen] = useState(false);
    const [dupBusy, setDupBusy] = useState(false);
    const [dupReport, setDupReport] = useState(null);
    const [autoSegBusy, setAutoSegBusy] = useState(false);
    const [autoSegReport, setAutoSegReport] = useState(null);
    const [bulkBusy, setBulkBusy] = useState(false);

    function toggleSelect(id, on) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });
    }

    async function bulkDelete() {
        if (selectedIds.size === 0) return;
        const sure = window.confirm(
            `Delete ${selectedIds.size} word${selectedIds.size === 1 ? "" : "s"} permanently? This cannot be undone.`
        );
        if (!sure) return;
        setBulkBusy(true);
        try {
            const { data } = await axios.post("/admin/words/bulk-delete", {
                ids: Array.from(selectedIds),
            });
            if (data.ok) {
                setSelectedIds(new Set());
                router.reload({ only: ["words"] });
            }
        } catch (e) {
            alert(e?.response?.data?.error || e?.response?.data?.message || "Bulk delete failed");
        } finally {
            setBulkBusy(false);
        }
    }

    async function loadDuplicates() {
        setDupBusy(true);
        try {
            const { data } = await axios.get("/admin/words/duplicates");
            setDupReport(data);
            setDupOpen(true);
        } catch (e) {
            alert(e?.response?.data?.error || "Could not load duplicates");
        } finally {
            setDupBusy(false);
        }
    }

    async function runAutoSegmentAll(mode = "track") {
        const isCross = mode === "cross-track";
        const sure = window.confirm(
            isCross
                ? "AI cross-track auto-segment: the AI will Whisper-transcribe EVERY audio track in the project " +
                  "and try to match every word in the database against every transcript.\n\n" +
                  "First run can take a few minutes; subsequent runs are essentially free because each " +
                  "transcript is cached on disk.\n\n" +
                  (unit
                      ? "Only words from the currently-filtered unit will be updated."
                      : "Words from every unit will be updated.") +
                  "\n\nProceed?"
                : unit
                    ? "AI auto-segment every track linked to words in this unit? Sends each track to OpenAI Whisper."
                    : "AI auto-segment every track that has linked words? This may make many Whisper API calls.",
        );
        if (!sure) return;
        setAutoSegBusy(true);
        setAutoSegReport(null);
        try {
            const { data } = await axios.post(
                "/admin/words/auto-segment-all",
                {
                    unit_id: unit || null,
                    mode,
                },
                // The cross-track sweep can take a few minutes the
                // very first time it runs (every NCCD track has to
                // be downloaded + Whisper-transcribed before the
                // matcher can run). Default axios timeout (0) lets
                // the request complete naturally.
                { timeout: isCross ? 1000 * 60 * 30 : 1000 * 60 * 10 },
            );
            setAutoSegReport(data);
            setTimeout(() => router.reload({ only: ["words"] }), 800);
        } catch (e) {
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e?.message ||
                "Auto-segment failed";
            alert(`Auto-segment failed: ${msg}`);
        } finally {
            setAutoSegBusy(false);
        }
    }

    function onFilter(e) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (unit) params.set("unit", unit);
        if (q) params.set("q", q);
        router.visit("/admin/words?" + params.toString());
    }

    async function submitNew() {
        if (!draft.unit_id || !draft.word.trim()) {
            setErr("Unit + word are required");
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            let imagePath = draft.image_path || null;
            if (fileRef.current?.files?.[0]) {
                const file = fileRef.current.files[0];
                if (file.size > MAX_INPUT_BYTES) {
                    throw new Error(`Image is too large (${(file.size/1024/1024).toFixed(1)} MB). Max 20 MB.`);
                }
                if (!isSupportedImage(file)) {
                    throw new Error("Pick a JPG, PNG, GIF, WebP, SVG or BMP image.");
                }
                // Browser-side resize → JSON base64 so PHP/nginx never sees a big POST.
                const dataUrl = await shrinkForAdminUpload(file);
                const r = await axios.post(
                    "/admin/uploads/image",
                    {
                        image_base64: dataUrl,
                        folder: (draft.category || draft.word).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 32),
                    },
                    { headers: { "Content-Type": "application/json" } }
                );
                imagePath = r.data?.path || r.data?.image_path;
            }
            const { data } = await axios.post("/admin/words", {
                unit_id: Number(draft.unit_id),
                word: draft.word.trim(),
                type: draft.type || "vocab",
                category: draft.category || null,
                image_path: imagePath,
                audio_track_id: draft.audio_track_id ? Number(draft.audio_track_id) : null,
            });
            if (data.ok) {
                setCreating(false);
                router.reload({ only: ["words"] });
            }
        } catch (e) {
            setErr(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Create failed");
        } finally {
            setBusy(false);
        }
    }

    // Client-side filter for rows with at least one missing segment bound.
    const visibleWords = useMemo(() => {
        const all = words?.data || [];
        if (!onlyUnset) return all;
        return all.filter(
            (w) => w.segment_start_ms == null || w.segment_end_ms == null
        );
    }, [words, onlyUnset]);

    // Global keyboard shortcuts for the currently-focused (open) row.
    // Space = click "Play full"; S = "Set start here"; E = "Set end here";
    // Enter = "Save segment". We look up the buttons by data attribute
    // inside the active row so we don't need to hoist the SegmentEditor
    // internals into this page.
    useEffect(() => {
        if (!focusedRowId) return;

        const pickBtn = (labels) => {
            const rowEl = document.querySelector(
                '[data-word-row-id="' + focusedRowId + '"]'
            );
            if (!rowEl) return null;
            const btns = Array.from(rowEl.querySelectorAll("button"));
            for (const b of btns) {
                const txt = (b.textContent || "").trim().toLowerCase();
                for (const l of labels) {
                    if (txt.includes(l)) return b;
                }
            }
            return null;
        };

        const handler = (e) => {
            // Ignore keypresses happening inside form fields so typing
            // "e" into a category input doesn't trigger "Set end here".
            const tag = (e.target && e.target.tagName) || "";
            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                e.target?.isContentEditable
            ) {
                return;
            }

            if (e.code === "Space") {
                const b = pickBtn(["play full", "pause"]);
                if (b) {
                    e.preventDefault();
                    b.click();
                }
            } else if (e.key === "s" || e.key === "S") {
                const b = pickBtn(["set start"]);
                if (b) {
                    e.preventDefault();
                    b.click();
                }
            } else if (e.key === "e" || e.key === "E") {
                const b = pickBtn(["set end"]);
                if (b) {
                    e.preventDefault();
                    b.click();
                }
            } else if (e.key === "Enter") {
                const b = pickBtn(["save segment"]);
                if (b) {
                    e.preventDefault();
                    b.click();
                }
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [focusedRowId]);

    const unsetCount = (words?.data || []).filter(
        (w) => w.segment_start_ms == null || w.segment_end_ms == null
    ).length;

    return (
        <AdminLayout active="words">
            <div className="max-w-6xl mx-auto">
                <header className="mb-5 flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">
                            Words &amp; Segments
                        </h1>
                        <p className="text-gray-500 font-bold text-sm mt-1">
                            The main control screen. For each word, pick an
                            audio track and define the exact millisecond
                            segment. No file downloads needed.
                        </p>
                    </div>
                    <form onSubmit={onFilter} className="flex gap-2 flex-wrap items-center">
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 font-black text-sm"
                        >
                            <option value="">All units</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.code} - {u.title}
                                </option>
                            ))}
                        </select>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search word / category..."
                            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                        />
                        <button className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-black">
                            Filter
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreating((v) => !v)}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-black"
                        >
                            {creating ? "Cancel" : "+ New word"}
                        </button>
                        <label
                            className={
                                "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black cursor-pointer select-none " +
                                (onlyUnset
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : "bg-white border-gray-200 text-gray-500")
                            }
                            title="Show only words whose segment start or end is not set yet"
                        >
                            <input
                                type="checkbox"
                                checked={onlyUnset}
                                onChange={(e) => setOnlyUnset(e.target.checked)}
                                className="w-3.5 h-3.5"
                            />
                            Only unset segments ({unsetCount})
                        </label>
                    </form>
                </header>

                {creating ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
                        <h2 className="font-black text-sm mb-3 text-[#1E293B]">
                            Create a new word
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Unit *
                                <select
                                    value={draft.unit_id}
                                    onChange={(e) => setDraft({ ...draft, unit_id: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                >
                                    {units.map((u) => (
                                        <option key={u.id} value={u.id}>{u.code} · {u.title}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Word *
                                <input
                                    value={draft.word}
                                    onChange={(e) => setDraft({ ...draft, word: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm normal-case text-[#1E293B]"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Type
                                <input
                                    value={draft.type}
                                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Category
                                <input
                                    value={draft.category}
                                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400 md:col-span-2">
                                Audio track
                                <select
                                    value={draft.audio_track_id}
                                    onChange={(e) => setDraft({ ...draft, audio_track_id: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                >
                                    <option value="">-- none --</option>
                                    {tracks.map((t) => (
                                        <option key={t.id} value={t.id}>{t.code}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400 md:col-span-2">
                                Image (upload)
                                <input ref={fileRef} type="file" accept="image/*" className="w-full mt-1 text-xs" />
                            </label>
                        </div>
                        {err ? (
                            <p className="text-xs text-rose-500 font-bold mt-2">{err}</p>
                        ) : null}
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={submitNew}
                                disabled={busy}
                                className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-black disabled:opacity-50"
                            >
                                {busy ? "Saving…" : "Save word"}
                            </button>
                            <button
                                onClick={() => setCreating(false)}
                                className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-black"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* Bulk action toolbar — visible whenever there are
                    rows on the page so admins can delete duplicates,
                    select-all, run AI auto-segment, etc. */}
                <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-4 flex items-center gap-2 flex-wrap text-xs">
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 font-black text-gray-600">
                        <input
                            type="checkbox"
                            checked={visibleWords.length > 0 && visibleWords.every((w) => selectedIds.has(w.id))}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedIds(new Set([...selectedIds, ...visibleWords.map((w) => w.id)]));
                                } else {
                                    const next = new Set(selectedIds);
                                    visibleWords.forEach((w) => next.delete(w.id));
                                    setSelectedIds(next);
                                }
                            }}
                            className="w-3.5 h-3.5 accent-purple-600"
                        />
                        Select all on page
                    </label>
                    <span className="text-gray-400 font-bold">
                        {selectedIds.size} selected
                    </span>
                    <button
                        type="button"
                        onClick={bulkDelete}
                        disabled={selectedIds.size === 0 || bulkBusy}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 text-white font-black disabled:opacity-40"
                        title="Delete every selected word"
                    >
                        {bulkBusy ? "Deleting…" : `🗑 Delete selected (${selectedIds.size})`}
                    </button>
                    <button
                        type="button"
                        onClick={loadDuplicates}
                        disabled={dupBusy}
                        className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-black disabled:opacity-40"
                        title="Show all words duplicated within the same unit"
                    >
                        {dupBusy ? "Scanning…" : "🔍 Find duplicates"}
                    </button>
                    <button
                        type="button"
                        onClick={() => runAutoSegmentAll("track")}
                        disabled={autoSegBusy}
                        className="px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 font-black disabled:opacity-40"
                        title="Whisper every track that already has linked words and auto-fill segment timestamps"
                    >
                        {autoSegBusy ? "🤖 Working…" : "🤖 AI auto-segment (linked tracks)"}
                    </button>
                    <button
                        type="button"
                        onClick={() => runAutoSegmentAll("cross-track")}
                        disabled={autoSegBusy}
                        className="px-3 py-1.5 rounded-lg bg-fuchsia-600 text-white font-black disabled:opacity-40"
                        title="The AI listens to EVERY audio track in the curriculum and matches every word in the database against every transcript (with same-unit preference). Transcripts are cached after the first run."
                    >
                        {autoSegBusy ? "✨ Listening…" : "✨ AI sweep entire curriculum"}
                    </button>
                </div>

                {dupOpen && dupReport ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-black text-amber-800">
                                🔍 Duplicate words by unit ({dupReport.duplicates?.length || 0} groups)
                            </h2>
                            <button
                                type="button"
                                onClick={() => setDupOpen(false)}
                                className="text-xs text-amber-700 hover:text-amber-900 font-black"
                            >
                                Close
                            </button>
                        </div>
                        {dupReport.duplicates?.length ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {dupReport.duplicates.map((d) => (
                                    <div key={`${d.unit_id}-${d.word}`} className="bg-white rounded-lg border border-amber-100 p-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-black text-[#1E293B]">{d.word}</span>
                                            <span className="text-[10px] font-black uppercase text-gray-400">{d.unit}</span>
                                            <span className="text-[10px] font-black bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                                                {d.count} copies
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // Pre-select every duplicate copy except the first one.
                                                    const ids = (d.rows || []).slice(1).map((r) => r.id);
                                                    setSelectedIds((prev) => new Set([...prev, ...ids]));
                                                }}
                                                className="ml-auto text-[11px] font-black text-rose-600 hover:text-rose-800"
                                            >
                                                Mark extras for delete
                                            </button>
                                        </div>
                                        <ul className="mt-1 text-[11px] text-gray-500 font-mono space-x-3">
                                            {(d.rows || []).map((r) => (
                                                <span key={r.id} className={selectedIds.has(r.id) ? "text-rose-600 line-through" : ""}>
                                                    #{r.id}{r.has_segment ? "·✂" : ""}
                                                </span>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs font-bold text-gray-500">No duplicates 🎉</p>
                        )}
                    </div>
                ) : null}

                {autoSegReport ? (
                    <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-4">
                        <p className="text-sm font-black text-violet-800">
                            {autoSegReport.mode === "cross-track" ? "✨" : "🤖"}{" "}
                            {autoSegReport.mode === "cross-track"
                                ? "Cross-curriculum sweep"
                                : "Auto-segment"}{" "}
                            summary: {autoSegReport.words_matched}/
                            {autoSegReport.words_total} words matched across{" "}
                            {autoSegReport.tracks_run} tracks
                            {typeof autoSegReport.tracks_cached === "number" &&
                            autoSegReport.tracks_cached > 0
                                ? ` · ${autoSegReport.tracks_cached} cached`
                                : ""}
                            .
                        </p>
                        {autoSegReport.error ? (
                            <p className="mt-1 text-xs font-bold text-rose-600">
                                ⚠ {autoSegReport.error}
                            </p>
                        ) : null}
                        {autoSegReport.report?.length ? (
                            <ul className="mt-2 max-h-40 overflow-y-auto text-[11px] font-mono text-gray-700 space-y-0.5">
                                {autoSegReport.report.slice(0, 50).map((r, i) => (
                                    <li key={i}>
                                        {r.track}: {r.matched}/{r.total}{" "}
                                        {r.error ? `· ${r.error}` : ""}
                                        {r.message ? `· ${r.message}` : ""}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : null}

                {visibleWords.map((w) => (
                    <WordRow
                        key={w.id}
                        w={w}
                        tracks={tracks}
                        isFocused={focusedRowId === w.id}
                        onFocusRow={setFocusedRowId}
                        onRemoved={() => router.reload({ only: ["words"] })}
                        isSelected={selectedIds.has(w.id)}
                        onToggleSelect={toggleSelect}
                    />
                ))}

                {visibleWords.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 font-bold text-sm bg-white rounded-xl border border-gray-100">
                        No words match your filters.
                    </div>
                ) : null}

                {words.links ? (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {words.links.map((link, i) => {
                            let cls = "px-3 py-1 rounded-lg text-xs font-black ";
                            if (link.active) {
                                cls += "bg-[#7C3AED] text-white";
                            } else if (link.url) {
                                cls += "bg-white border border-gray-200 text-gray-600";
                            } else {
                                cls += "opacity-40";
                            }
                            return (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    className={cls}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
}

export default Words;
