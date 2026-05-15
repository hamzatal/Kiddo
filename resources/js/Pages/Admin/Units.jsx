import React, { useState } from "react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";

/**
 * Inline-editable list of units. Each row is a small form that PATCHes
 * /admin/units/{id} on blur; the UI shows a check mark for 1s after a
 * successful save so the admin knows it went through.
 */
const UnitRow = ({ u }) => {
    const [row, setRow] = useState(u);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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

    return (
        <div className="grid grid-cols-12 gap-3 items-start bg-white rounded-xl border border-gray-100 p-4 mb-3">
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

            <div className="col-span-12 md:col-span-4">
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
                                const formData = new FormData();
                                formData.append('image', file);
                                try {
                                    const res = await axios.post(`/admin/units/${u.id}/image`, formData);
                                    if (res.data?.ok) {
                                        setRow({ ...row, image_path: res.data.image_path });
                                        setSaved(true);
                                        setTimeout(() => setSaved(false), 1200);
                                    }
                                } catch (err) {
                                    setError('Upload failed');
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
        </div>
    );
};

const Units = ({ units }) => {
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

                {units.map((u) => (
                    <UnitRow key={u.id} u={u} />
                ))}
            </div>
        </AdminLayout>
    );
};

export default Units;
