import React, { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import SegmentEditor from "@/learning/components/admin/SegmentEditor";

const TYPE_BADGE_CLS =
    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full";

function WordRow({ w, tracks }) {
    const [row, setRow] = useState(w);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

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
    const trackUrl = track ? track.url : null;

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

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex items-start gap-4 flex-wrap">
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
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
                        onClick={() => setOpen(!open)}
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
                <SegmentEditor
                    url={trackUrl}
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
            ) : null}
        </div>
    );
}

function Words({ units, tracks, words, selected, search }) {
    const [unit, setUnit] = useState(selected || "");
    const [q, setQ] = useState(search || "");

    function onFilter(e) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (unit) params.set("unit", unit);
        if (q) params.set("q", q);
        router.visit("/admin/words?" + params.toString());
    }

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
                    <form onSubmit={onFilter} className="flex gap-2 flex-wrap">
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
                    </form>
                </header>

                {words.data.map((w) => (
                    <WordRow key={w.id} w={w} tracks={tracks} />
                ))}

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
