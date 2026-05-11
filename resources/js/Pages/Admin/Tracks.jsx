import React, { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";

const TrackRow = ({ t, onDelete }) => {
    const [row, setRow] = useState(t);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async (patch) => {
        setSaving(true);
        try {
            const { data } = await axios.patch(`/admin/tracks/${t.id}`, patch);
            if (data.ok) {
                setRow(data.track);
                setSaved(true);
                setTimeout(() => setSaved(false), 1000);
            }
        } finally {
            setSaving(false);
        }
    };

    const del = async () => {
        if (!confirm(`Delete track "${row.code}"?`)) return;
        try {
            await axios.delete(`/admin/tracks/${t.id}`);
            onDelete?.(t.id);
        } catch (e) {
            alert(e?.response?.data?.error || "Delete failed");
        }
    };

    return (
        <tr className="border-t border-gray-50">
            <td className="px-3 py-2 text-xs font-black text-[#1E293B] whitespace-nowrap">
                {row.code}
            </td>
            <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                {row.source} · p{row.page}.{row.track_no}
            </td>
            <td className="px-3 py-2">
                <input
                    value={row.label || ""}
                    onChange={(e) => setRow({ ...row, label: e.target.value })}
                    onBlur={() => save({ label: row.label })}
                    className="w-full text-xs text-[#1E293B] bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    value={row.kind || ""}
                    onChange={(e) => setRow({ ...row, kind: e.target.value })}
                    onBlur={() => save({ kind: row.kind })}
                    className="w-28 text-xs text-gray-600 bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    value={row.url || ""}
                    onChange={(e) => setRow({ ...row, url: e.target.value })}
                    onBlur={() => save({ url: row.url })}
                    className="w-full text-[11px] text-gray-500 font-mono bg-transparent border-b border-gray-100 focus:border-purple-300 outline-none py-1"
                />
            </td>
            <td className="px-3 py-2 text-[10px] text-center">
                <audio controls preload="none" src={row.url} style={{ height: 28 }}></audio>
            </td>
            <td className="px-3 py-2 text-[10px] text-gray-400 whitespace-nowrap">
                {row.lessons_count || 0} link{row.lessons_count === 1 ? "" : "s"}
            </td>
            <td className="px-3 py-2 text-right whitespace-nowrap">
                {saving && <span className="text-gray-400 text-[10px] mr-2">saving…</span>}
                {saved && <span className="text-emerald-500 mr-2">✓</span>}
                <button
                    onClick={del}
                    className="text-rose-500 hover:text-rose-700 text-xs font-black"
                    title="Delete track"
                >
                    🗑
                </button>
            </td>
        </tr>
    );
};

const Tracks = ({ tracks, search }) => {
    const [q, setQ] = useState(search || "");
    const [rows, setRows] = useState(tracks.data);
    const [creating, setCreating] = useState(false);
    const [newRow, setNewRow] = useState({
        code: "", source: "ab", book_type: "ab", page: 1, track_no: 1,
        label: "", kind: "other", url: "", format: "mp3",
    });

    const submitSearch = (e) => {
        e.preventDefault();
        router.visit(`/admin/tracks?q=${encodeURIComponent(q)}`);
    };

    const create = async () => {
        try {
            const { data } = await axios.post("/admin/tracks", newRow);
            if (data.ok) {
                setRows([data.track, ...rows]);
                setCreating(false);
                setNewRow({ ...newRow, code: "", label: "", url: "" });
            }
        } catch (e) {
            alert(e?.response?.data?.message || "Create failed");
        }
    };

    return (
        <AdminLayout active="tracks">
            <div className="max-w-7xl mx-auto">
                <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">
                            Audio Tracks
                        </h1>
                        <p className="text-gray-500 font-bold text-sm mt-1">
                            Every NCCD track known to Kiddo. Click to edit the
                            URL, label, kind; listen inline; delete orphans.
                        </p>
                    </div>
                    <form onSubmit={submitSearch} className="flex gap-2">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search code / label / URL…"
                            className="px-3 py-2 rounded-xl border border-gray-200 text-sm"
                        />
                        <button className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-black">
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-black"
                        >
                            + New
                        </button>
                    </form>
                </header>

                {creating ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                        <h2 className="font-black text-sm mb-3 text-[#1E293B]">
                            New track
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                ["code", "Code (e.g. PB40)"],
                                ["source", "Source (ab/pb/part2/new_g1)"],
                                ["book_type", "Book type (ab/pb)"],
                                ["page", "Page"],
                                ["track_no", "Track no."],
                                ["label", "Label"],
                                ["kind", "Kind"],
                                ["url", "URL"],
                                ["format", "Format (mp3/mp4)"],
                            ].map(([k, label]) => (
                                <label key={k} className="flex flex-col text-[10px] font-black uppercase text-gray-400">
                                    {label}
                                    <input
                                        value={newRow[k] ?? ""}
                                        onChange={(e) => setNewRow({ ...newRow, [k]: e.target.value })}
                                        className="mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-sans normal-case text-[#1E293B]"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={create} className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-black">
                                Save
                            </button>
                            <button onClick={() => setCreating(false)} className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-black">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50">
                                <th className="px-3 py-2">Code</th>
                                <th className="px-3 py-2">Source</th>
                                <th className="px-3 py-2">Label</th>
                                <th className="px-3 py-2">Kind</th>
                                <th className="px-3 py-2">URL</th>
                                <th className="px-3 py-2">Preview</th>
                                <th className="px-3 py-2">Linked</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((t) => (
                                <TrackRow
                                    key={t.id}
                                    t={t}
                                    onDelete={(id) =>
                                        setRows(rows.filter((r) => r.id !== id))
                                    }
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {tracks.links ? (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {tracks.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`px-3 py-1 rounded-lg text-xs font-black ${
                                    link.active
                                        ? "bg-[#7C3AED] text-white"
                                        : link.url
                                          ? "bg-white border border-gray-200 text-gray-600"
                                          : "opacity-40"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
};

export default Tracks;
