import React, { useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import SegmentEditor from "@/learning/components/admin/SegmentEditor";

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

function WordRow({ w, tracks, onFocusRow, isFocused }) {
    const [row, setRow] = useState(w);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);
    const rowRef = useRef(null);

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
                                // Pre-flight: catch oversize files before
                                // they hit the network. Server cap is 20MB.
                                const MAX_BYTES = 20 * 1024 * 1024;
                                if (file.size > MAX_BYTES) {
                                    setError(`Image is too large (${(file.size/1024/1024).toFixed(1)}MB). Max 20 MB.`);
                                    e.target.value = "";
                                    return;
                                }
                                if (!file.type.startsWith("image/")) {
                                    setError("Please pick an image file (JPG, PNG, GIF, WebP, SVG).");
                                    e.target.value = "";
                                    return;
                                }
                                const formData = new FormData();
                                formData.append('image', file);
                                try {
                                    const res = await axios.post(`/admin/words/${w.id}/image`, formData);
                                    if (res.data?.ok) {
                                        setRow({ ...row, image_path: res.data.image_path });
                                        setError(null);
                                    }
                                } catch (err) {
                                    const status = err?.response?.status;
                                    const msg =
                                        err?.response?.data?.error ||
                                        err?.response?.data?.message ||
                                        (status === 413
                                            ? "Image too large for the server (raise post_max_size / upload_max_filesize)."
                                            : "Image upload failed");
                                    setError(msg);
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
                        <label className="text-[10px] font-black uppercase text-gray-400">
                            Audio track
                            <select
                                value={
                                    row.audio_track_id == null
                                        ? ""
                                        : String(row.audio_track_id)
                                }
                                onChange={(e) => {
                                    const id =
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value);
                                    setRow(
                                        Object.assign({}, row, {
                                            audio_track_id: id,
                                        })
                                    );
                                    save({ audio_track_id: id });
                                }}
                                className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-xs font-sans text-[#1E293B]"
                            >
                                <option value="">-- none --</option>
                                {tracks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.code} - {t.label ? t.label.slice(0, 40) : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
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

                <div className="shrink-0 text-right">
                    <button
                        type="button"
                        onClick={toggleOpen}
                        disabled={!trackUrl}
                        className={segBtnCls}
                    >
                        {segBtnLabel}
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
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkMsg, setBulkMsg] = useState(null);
    const fileRef = useRef(null);

    // Run Whisper across every visible word that still has a missing
    // start or end. We fire requests one track at a time (the service
    // updates every word linked to that track in a single Whisper call,
    // so we de-dup by track id to avoid burning credit). When done we
    // reload the `words` Inertia prop to show the new bounds.
    async function autoFindAllUnset() {
        const targets = (words?.data || []).filter(
            (w) => w.audio_track_id && (w.segment_start_ms == null || w.segment_end_ms == null)
        );
        if (targets.length === 0) {
            setBulkMsg("Nothing to do — every word already has a segment.");
            setTimeout(() => setBulkMsg(null), 3000);
            return;
        }
        setBulkBusy(true);
        setBulkMsg(`Running Whisper on ${targets.length} words...`);
        // De-dup so we only call once per unique track id. Each call
        // populates every word linked to that track in one shot.
        const seenTracks = new Set();
        const wordsToCall = [];
        for (const w of targets) {
            if (!seenTracks.has(w.audio_track_id)) {
                seenTracks.add(w.audio_track_id);
                wordsToCall.push(w);
            }
        }
        let matched = 0;
        let failed = 0;
        for (const w of wordsToCall) {
            try {
                const { data } = await axios.post(`/admin/words/${w.id}/auto-segment`);
                if (data?.ok) matched++;
                else failed++;
            } catch (_) {
                failed++;
            }
            setBulkMsg(`Done ${matched + failed}/${wordsToCall.length} tracks · ${matched} matched`);
        }
        setBulkBusy(false);
        setBulkMsg(`Finished: ${matched} tracks succeeded, ${failed} failed. Refreshing...`);
        router.reload({ only: ["words"], onSuccess: () => setTimeout(() => setBulkMsg(null), 4000) });
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
                const fd = new FormData();
                fd.append("image", fileRef.current.files[0]);
                fd.append("folder", (draft.category || draft.word).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 32));
                const r = await axios.post("/admin/uploads", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                imagePath = r.data.path;
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
            setErr(e?.response?.data?.message || "Create failed");
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
                        <button
                            type="button"
                            onClick={autoFindAllUnset}
                            disabled={bulkBusy}
                            className="px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-sm font-black disabled:opacity-50"
                            title="Run Whisper on every visible word that still has a missing start/end"
                        >
                            {bulkBusy ? "Whispering..." : "✨ Auto-find all unset"}
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

                {bulkMsg ? (
                    <div className="mb-4 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                        {bulkMsg}
                    </div>
                ) : null}

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

                {visibleWords.map((w) => (
                    <WordRow
                        key={w.id}
                        w={w}
                        tracks={tracks}
                        isFocused={focusedRowId === w.id}
                        onFocusRow={setFocusedRowId}
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
