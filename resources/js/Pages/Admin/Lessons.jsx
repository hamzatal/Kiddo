import React, { useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import { shrinkForAdminUpload, isSupportedImage, MAX_INPUT_BYTES } from "@/learning/utils/imageUpload";

const LESSON_TYPES = [
    "intro", "vocab-game", "phonics-game", "review",
    "story", "song", "project", "picture-dict", "quiz",
    "draw-circle", "match-connect",
    "memory-flip", "bubble-pop", "sequence-build",
];

/**
 * FIX 9.5 — inline mini-form to attach a new word to a specific
 * lesson without leaving the lessons admin page. Uploads an optional
 * image, links an audio track + segment range, then POSTs to
 * /admin/words. Collapsed by default to keep the row compact.
 */
const InlineWordAdd = ({ unitId, tracks }) => {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    const [ok, setOk] = useState(false);
    const fileRef = useRef(null);
    const [draft, setDraft] = useState({
        word: "",
        type: "vocab",
        category: "",
        image_path: "",
        audio_track_id: "",
        segment_start_ms: "",
        segment_end_ms: "",
    });

    const submit = async () => {
        if (!draft.word.trim()) {
            setErr("Word is required");
            return;
        }
        setBusy(true);
        setErr(null);
        setOk(false);
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
            const payload = {
                unit_id: unitId,
                word: draft.word.trim(),
                type: draft.type || "vocab",
                category: draft.category || null,
                image_path: imagePath,
                audio_track_id: draft.audio_track_id ? Number(draft.audio_track_id) : null,
                segment_start_ms: draft.segment_start_ms === "" ? null : Number(draft.segment_start_ms),
                segment_end_ms: draft.segment_end_ms === "" ? null : Number(draft.segment_end_ms),
            };
            const { data } = await axios.post("/admin/words", payload);
            if (data.ok) {
                setOk(true);
                setDraft({
                    word: "",
                    type: "vocab",
                    category: "",
                    image_path: "",
                    audio_track_id: draft.audio_track_id, // keep selection
                    segment_start_ms: "",
                    segment_end_ms: "",
                });
                if (fileRef.current) fileRef.current.value = "";
                setTimeout(() => setOk(false), 1600);
            }
        } catch (e) {
            setErr(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Create failed");
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-[11px] font-black text-purple-600 hover:text-purple-800 mt-2"
            >
                ＋ Add a word to this unit
            </button>
        );
    }

    return (
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3 mt-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-purple-700">
                    New word for this unit
                </p>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-xs text-gray-400 hover:text-gray-700"
                >
                    Hide
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm normal-case text-[#1E293B]"
                    />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Category
                    <input
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm normal-case text-[#1E293B]"
                    />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Audio track
                    <select
                        value={draft.audio_track_id}
                        onChange={(e) => setDraft({ ...draft, audio_track_id: e.target.value })}
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-xs"
                    >
                        <option value="">-- none --</option>
                        {tracks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.code}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Segment start (ms)
                    <input
                        type="number"
                        value={draft.segment_start_ms}
                        onChange={(e) => setDraft({ ...draft, segment_start_ms: e.target.value })}
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400">
                    Segment end (ms)
                    <input
                        type="number"
                        value={draft.segment_end_ms}
                        onChange={(e) => setDraft({ ...draft, segment_end_ms: e.target.value })}
                        className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                    />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-400 md:col-span-2">
                    Image (upload)
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="w-full mt-1 text-xs"
                    />
                </label>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-black disabled:opacity-50"
                >
                    {busy ? "Saving…" : "Add word"}
                </button>
                {ok ? (
                    <span className="text-emerald-600 text-xs font-black">✓ Added</span>
                ) : null}
                {err ? (
                    <span className="text-rose-500 text-[10px] font-bold">{err}</span>
                ) : null}
            </div>
        </div>
    );
};

const LessonRow = ({ l, onRemoved }) => {
    const [row, setRow] = useState(l);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const save = async (patch) => {
        setSaving(true);
        try {
            const { data } = await axios.patch(`/admin/lessons/${l.id}`, patch);
            if (data.ok) {
                setRow({ ...row, ...data.lesson });
                setSaved(true);
                setTimeout(() => setSaved(false), 1000);
            }
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        const sure = window.confirm(
            `Delete lesson "${row.title}" (L${row.lesson_number})? This cannot be undone.`
        );
        if (!sure) return;
        setDeleting(true);
        try {
            const { data } = await axios.delete(`/admin/lessons/${l.id}`);
            if (data.ok) onRemoved?.(l.id);
        } catch (e) {
            alert(e?.response?.data?.error || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex items-start gap-4 flex-wrap">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-purple-50 text-purple-700 font-black flex flex-col items-center justify-center">
                    <span className="text-xs">L</span>
                    <span className="text-lg leading-none">{l.lesson_number}</span>
                </div>

                <div className="flex-1 min-w-[260px]">
                    <input
                        value={row.title}
                        onChange={(e) => setRow({ ...row, title: e.target.value })}
                        onBlur={() => save({ title: row.title })}
                        className="w-full text-base font-black text-[#1E293B] bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                    />
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {l.unit_title}
                        </span>
                        <select
                            value={row.type}
                            onChange={(e) => save({ type: e.target.value })}
                            className="text-[11px] font-black px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700"
                        >
                            {LESSON_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                        <label className="text-[10px] font-black text-gray-400 uppercase">Page</label>
                        <input
                            type="number"
                            value={row.page_number || ""}
                            onChange={(e) => setRow({ ...row, page_number: Number(e.target.value) || null })}
                            onBlur={() => save({ page_number: row.page_number })}
                            className="w-16 text-xs font-black text-[#1E293B] border-b border-gray-100 focus:border-purple-300 outline-none py-0.5"
                        />
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-[11px]">
                    {l.audio_track ? (
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black">
                            🎧 {l.audio_track.code}
                        </span>
                    ) : (
                        <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-400 font-black">
                            no track
                        </span>
                    )}
                    {saving && <span className="text-gray-400">saving…</span>}
                    {saved && <span className="text-emerald-500">✓</span>}
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={deleting}
                        className="px-2 py-1 rounded-lg text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                        title="Delete this lesson"
                    >
                        {deleting ? '…' : '🗑'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Lessons = ({ units, lessons, selected, tracks = [] }) => {
    const [unit, setUnit] = useState(selected || "");
    const [list, setList] = useState(lessons);
    const [creating, setCreating] = useState(false);
    const [draft, setDraft] = useState({
        unit_id: selected || (units[0]?.id ?? ""),
        title: "",
        type: "vocab-game",
        page_number: "",
        audio_track_id: "",
    });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);

    const grouped = useMemo(() => {
        const g = {};
        list.forEach((l) => {
            g[l.unit_id] = g[l.unit_id] || [];
            g[l.unit_id].push(l);
        });
        return g;
    }, [list]);

    const onUnitChange = (id) => {
        setUnit(id);
        router.visit(id ? `/admin/lessons?unit=${id}` : "/admin/lessons");
    };

    const submitNew = async () => {
        if (!draft.unit_id || !draft.title.trim()) {
            setErr("Unit + title are required");
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const { data } = await axios.post("/admin/lessons", {
                unit_id: Number(draft.unit_id),
                title: draft.title.trim(),
                type: draft.type,
                page_number: draft.page_number === "" ? null : Number(draft.page_number),
                audio_track_id: draft.audio_track_id ? Number(draft.audio_track_id) : null,
            });
            if (data.ok) {
                setCreating(false);
                router.reload({ only: ["lessons"] });
            }
        } catch (e) {
            setErr(e?.response?.data?.message || "Create failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <AdminLayout active="lessons">
            <div className="max-w-6xl mx-auto">
                <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">
                            Lessons
                        </h1>
                        <p className="text-gray-500 font-bold text-sm mt-1">
                            Edit title, type, book page and audio track. Add new
                            lessons or attach extra words to a unit inline.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={unit}
                            onChange={(e) => onUnitChange(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-gray-200 font-black text-sm"
                        >
                            <option value="">All units</option>
                            {units.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.code} · {u.title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setCreating((v) => !v)}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-black"
                        >
                            {creating ? "Cancel" : "+ New lesson"}
                        </button>
                    </div>
                </header>

                {creating ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
                        <h2 className="font-black text-sm mb-3 text-[#1E293B]">
                            Create a new lesson
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Unit *
                                <select
                                    value={draft.unit_id}
                                    onChange={(e) => setDraft({ ...draft, unit_id: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                >
                                    {units.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.code} · {u.title}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400 md:col-span-2">
                                Title *
                                <input
                                    value={draft.title}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm normal-case text-[#1E293B]"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Type
                                <select
                                    value={draft.type}
                                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                                    className="w-full mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                >
                                    {LESSON_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-400">
                                Page #
                                <input
                                    type="number"
                                    value={draft.page_number}
                                    onChange={(e) => setDraft({ ...draft, page_number: e.target.value })}
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
                                        <option key={t.id} value={t.id}>
                                            {t.code} · {t.label?.slice(0, 40) || ""}
                                        </option>
                                    ))}
                                </select>
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
                                {busy ? "Saving…" : "Save lesson"}
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

                {Object.entries(grouped).map(([uid, rows]) => {
                    const u = units.find((x) => x.id === Number(uid));
                    return (
                        <section key={uid} className="mb-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                                {u?.code} — {u?.title}
                            </h2>
                            {rows.map((l) => (
                                <LessonRow
                                    key={l.id}
                                    l={l}
                                    onRemoved={(id) => setList(list.filter((x) => x.id !== id))}
                                />
                            ))}
                            {/* FIX 9.5 — inline word adder for this unit */}
                            <InlineWordAdd unitId={Number(uid)} tracks={tracks} />
                        </section>
                    );
                })}
            </div>
        </AdminLayout>
    );
};

export default Lessons;
