import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";

const LessonRow = ({ l }) => {
    const [row, setRow] = useState(l);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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
                            {["intro", "vocab-game", "phonics-game", "review", "story", "song", "project", "picture-dict", "quiz"].map((t) => (
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
                </div>
            </div>
        </div>
    );
};

const Lessons = ({ units, lessons, selected }) => {
    const [unit, setUnit] = useState(selected || "");

    const grouped = useMemo(() => {
        const g = {};
        lessons.forEach((l) => {
            g[l.unit_id] = g[l.unit_id] || [];
            g[l.unit_id].push(l);
        });
        return g;
    }, [lessons]);

    const onUnitChange = (id) => {
        setUnit(id);
        router.visit(id ? `/admin/lessons?unit=${id}` : "/admin/lessons");
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
                            Edit title, type, book page and audio track.
                        </p>
                    </div>
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
                </header>

                {Object.entries(grouped).map(([uid, rows]) => {
                    const u = units.find((x) => x.id === Number(uid));
                    return (
                        <section key={uid} className="mb-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                                {u?.code} — {u?.title}
                            </h2>
                            {rows.map((l) => (
                                <LessonRow key={l.id} l={l} />
                            ))}
                        </section>
                    );
                })}
            </div>
        </AdminLayout>
    );
};

export default Lessons;
