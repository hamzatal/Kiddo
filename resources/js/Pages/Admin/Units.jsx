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
                    Image path
                </label>
                <input
                    value={row.image_path || ""}
                    onChange={(e) => setRow({ ...row, image_path: e.target.value })}
                    onBlur={save}
                    className="w-full text-[11px] text-gray-500 font-mono bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
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
    return (
        <AdminLayout active="units">
            <div className="max-w-6xl mx-auto">
                <header className="mb-5">
                    <h1 className="text-2xl font-black text-[#1E293B]">
                        Units
                    </h1>
                    <p className="text-gray-500 font-bold text-sm mt-1">
                        Inline-editable. Changes save automatically when you
                        leave a field.
                    </p>
                </header>

                {units.map((u) => (
                    <UnitRow key={u.id} u={u} />
                ))}
            </div>
        </AdminLayout>
    );
};

export default Units;
