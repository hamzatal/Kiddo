import React, { useState } from "react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import { shrinkForAdminUpload, isSupportedImage, MAX_INPUT_BYTES } from "@/learning/utils/imageUpload";

/**
 * Inline-editable list of units. Each row is a small form that PATCHes
 * /admin/units/{id} on blur; the UI shows a check mark for 1s after a
 * successful save so the admin knows it went through.
 */
const UnitRow = ({ u, onRemoved }) => {
    const [row, setRow] = useState(u);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [ingesting, setIngesting] = useState(false);
    const [ttsBusy, setTtsBusy] = useState(false);
    const [aiReport, setAiReport] = useState(null);

    const save = async () => {
        setSaving(true);
        setError(null);
        try {
            const { data } = await axios.patch(`/admin/units/${u.id}`, {
                title: row.title,
                description: row.description,
                image_path: row.image_path,
                color_key: row.color_key,
            });
            if (data.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 1200);
            }
        } catch (e) {
            setError(e?.response?.data?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async () => {
        const sure = window.confirm(
            `Delete unit "${u.title}" and ALL its lessons & words? This cannot be undone.`
        );
        if (!sure) return;
        try {
            const { data } = await axios.delete(`/admin/units/${u.id}`);
            if (data.ok) onRemoved?.(u.id);
        } catch (e) {
            setError(e?.response?.data?.error || 'Delete failed');
        }
    };

    const aiIngest = async () => {
        const sure = window.confirm(
            `AI-ingest unit "${u.title}"?\n\nThis will:\n• Transcribe every PB audio in the unit's pages with Whisper.\n• Use GPT to extract vocabulary, summary, objectives & sentences.\n• Add missing Word rows + auto-segment them.\n\nMay take 30-90 seconds.`
        );
        if (!sure) return;
        setIngesting(true); setAiReport(null); setError(null);
        try {
            const { data } = await axios.post(`/admin/units/${u.id}/ai-ingest`);
            setAiReport(data.report || null);
            if (!data.ok && data.report?.errors?.length) {
                setError(data.report.errors[0]);
            }
        } catch (e) {
            setError(e?.response?.data?.error || e?.response?.data?.report?.errors?.[0] || 'AI ingest failed');
        } finally {
            setIngesting(false);
        }
    };

    const ttsAll = async () => {
        const sure = window.confirm(
            `Generate child-friendly voice clips for every word in "${u.title}"?\n\nUseful for U0 Welcome — uses OpenAI TTS so each word has a clean, isolated pronunciation.`
        );
        if (!sure) return;
        setTtsBusy(true); setError(null);
        try {
            const { data } = await axios.post(`/admin/units/${u.id}/tts-fallback`);
            if (data.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 1500);
            } else {
                setError(data?.error || 'TTS generation failed');
            }
        } catch (e) {
            setError(e?.response?.data?.error || 'TTS failed');
        } finally {
            setTtsBusy(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <div className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-12 md:col-span-1 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-black flex items-center justify-center">
                    {u.code}
                </span>
            </div>

            <div className="col-span-12 md:col-span-3">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                    Title
                </label>
                <input
                    value={row.title || ""}
                    onChange={(e) => setRow({ ...row, title: e.target.value })}
                    onBlur={save}
                    className="w-full text-sm font-black text-[#1E293B] bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </div>

            <div className="col-span-12 md:col-span-3">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                    Description
                </label>
                <input
                    value={row.description || ""}
                    onChange={(e) => setRow({ ...row, description: e.target.value })}
                    onBlur={save}
                    className="w-full text-xs text-gray-600 font-semibold bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </div>

            <div className="col-span-8 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                    Image
                </label>
                <div className="flex items-center gap-2 mt-1">
                    {row.image_path && (
                        <img
                            src={"/" + String(row.image_path).replace(/^\//, "")}
                            alt="unit"
                            className="w-8 h-8 object-contain rounded"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    )}
                    <label className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                        Upload
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
                                    // Resize-on-the-client → base64 JSON.
                                    // Bypasses PHP/nginx multipart size limits.
                                    const dataUrl = await shrinkForAdminUpload(file);
                                    const res = await axios.post(
                                        `/admin/units/${u.id}/image`,
                                        { image_base64: dataUrl },
                                        { headers: { "Content-Type": "application/json" } }
                                    );
                                    if (res.data?.ok) {
                                        setRow({ ...row, image_path: res.data.image_path });
                                        setSaved(true);
                                        setTimeout(() => setSaved(false), 1200);
                                    } else {
                                        setError(res.data?.error || 'Upload failed');
                                    }
                                } catch (err) {
                                    setError(
                                        err?.response?.data?.error ||
                                        err?.message ||
                                        'Upload failed'
                                    );
                                } finally {
                                    e.target.value = "";
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            <div className="col-span-4 md:col-span-1">
                <label className="text-[10px] font-black text-gray-400 uppercase">
                    Colour
                </label>
                <input
                    value={row.color_key || ""}
                    onChange={(e) => setRow({ ...row, color_key: e.target.value })}
                    onBlur={save}
                    placeholder="purple"
                    className="w-full text-xs font-black text-[#1E293B] bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </div>

            <div className="col-span-12 md:col-span-1 flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400">
                    {u.real_count} lesson{u.real_count === 1 ? "" : "s"}
                </span>
                {saving && <span className="text-[10px] text-gray-400">saving…</span>}
                {saved && <span className="text-emerald-500 text-sm">✓</span>}
                {error && <span className="text-rose-500 text-[10px]">{error}</span>}
            </div>

            <div className="col-span-12 flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-50">
                <button
                    onClick={aiIngest}
                    disabled={ingesting}
                    className="px-2 py-1 rounded-lg text-[11px] font-black bg-violet-50 text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                    title="Use Whisper + GPT to add words and details from this unit's audio"
                >
                    {ingesting ? '🤖 Ingesting…' : '🤖 AI ingest from audio'}
                </button>
                <button
                    onClick={ttsAll}
                    disabled={ttsBusy}
                    className="px-2 py-1 rounded-lg text-[11px] font-black bg-cyan-50 text-cyan-700 hover:bg-cyan-100 disabled:opacity-50"
                    title="Generate child-friendly voice for every word in this unit"
                >
                    {ttsBusy ? '🎙 Generating…' : '🎙 TTS for all words'}
                </button>
                <button
                    onClick={onDelete}
                    className="px-2 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 hover:bg-rose-100"
                    title="Delete this unit and everything inside it"
                >
                    🗑 Delete unit
                </button>
            </div>

            {aiReport ? (
                <div className="col-span-12 mt-2 p-3 rounded-xl bg-violet-50/60 border border-violet-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-violet-700 mb-2">
                        AI ingest report
                    </p>
                    <ul className="text-[11px] text-gray-600 font-semibold space-y-0.5">
                        <li>Tracks transcribed: <b>{aiReport.transcribed}/{aiReport.tracks}</b></li>
                        <li>Vocabulary added: <b className="text-emerald-600">+{aiReport.vocab_added}</b></li>
                        <li>Vocabulary updated: <b>{aiReport.vocab_updated}</b></li>
                        <li>Lessons annotated: <b>{aiReport.lessons_touched}</b></li>
                        {aiReport.errors?.length ? (
                            <li className="text-rose-500">
                                {aiReport.errors.length} warning{aiReport.errors.length === 1 ? '' : 's'}: {aiReport.errors[0]}
                            </li>
                        ) : null}
                    </ul>
                </div>
            ) : null}
            </div>
        </div>
    );
};

const Units = ({ units }) => {
    const [list, setList] = useState(units);
    const [showCreate, setShowCreate] = useState(false);
    const [newUnit, setNewUnit] = useState({ title: '', description: '', code: '', unit_number: '', color_key: 'purple' });
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!newUnit.title || !newUnit.code || !newUnit.unit_number) return;
        setCreating(true);
        try {
            const { data } = await axios.post('/admin/units', {
                ...newUnit,
                unit_number: Number(newUnit.unit_number),
            });
            if (data.ok) {
                window.location.reload();
            }
        } catch (e) {
            alert(e?.response?.data?.message || 'Create failed');
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminLayout active="units">
            <div className="max-w-6xl mx-auto">
                <header className="mb-5 flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">Units</h1>
                        <p className="text-gray-500 font-bold text-sm mt-1">
                            Inline-editable. Changes save automatically when you leave a field.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-sm shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                        + Add Unit
                    </button>
                </header>

                {showCreate && (
                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 mb-5">
                        <h3 className="font-black text-sm text-emerald-700 mb-3">Create New Unit</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <input value={newUnit.title} onChange={(e) => setNewUnit({...newUnit, title: e.target.value})} placeholder="Title" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                            <input value={newUnit.code} onChange={(e) => setNewUnit({...newUnit, code: e.target.value})} placeholder="Code (U3)" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                            <input value={newUnit.unit_number} onChange={(e) => setNewUnit({...newUnit, unit_number: e.target.value})} placeholder="Number" type="number" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                            <input value={newUnit.color_key} onChange={(e) => setNewUnit({...newUnit, color_key: e.target.value})} placeholder="Color" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                            <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-sm disabled:opacity-50">
                                {creating ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                )}

                {list.map((u) => (
                    <UnitRow
                        key={u.id}
                        u={u}
                        onRemoved={(id) => setList(list.filter((x) => x.id !== id))}
                    />
                ))}
            </div>
        </AdminLayout>
    );
};

export default Units;
