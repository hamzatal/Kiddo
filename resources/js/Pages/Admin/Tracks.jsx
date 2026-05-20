import React, { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import AdminLayout from "@/learning/components/admin/AdminLayout";
import PageHead from "@/learning/components/ui/PageHead";

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
    const [discovering, setDiscovering] = useState(false);
    const [discoverReport, setDiscoverReport] = useState(null);
    const [checking, setChecking] = useState(false);
    const [healthReport, setHealthReport] = useState(null);
    const [discoverOpts, setDiscoverOpts] = useState({ grade: 1, page_from: 4, page_to: 43, book: "both" });

    // ── AI auto-map (one-button full pipeline) state ─────────────
    const [autoMapBusy, setAutoMapBusy]       = useState(false);
    const [autoMapReport, setAutoMapReport]   = useState(null);
    const [autoMapElapsed, setAutoMapElapsed] = useState(0);
    const [autoMapOpts, setAutoMapOpts]       = useState({
        grade: 1, page_from: 4, page_to: 43, overwrite: false, skip_tts: false,
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

    const runDiscover = async () => {
        const sure = window.confirm(
            `Probe NCCD audio for grade ${discoverOpts.grade}, pages ${discoverOpts.page_from}-${discoverOpts.page_to} (${discoverOpts.book.toUpperCase()})?\n\nThis sends ~${(discoverOpts.page_to - discoverOpts.page_from + 1) * 7 * (discoverOpts.book === 'both' ? 2 : 1)} HEAD requests to qr.nccd.gov.jo and upserts every working URL into audio_tracks. Safe to re-run.`
        );
        if (!sure) return;
        setDiscovering(true); setDiscoverReport(null);
        try {
            const { data } = await axios.post("/admin/audio/discover", discoverOpts);
            setDiscoverReport(data);
            // Reload to pick up newly created tracks.
            setTimeout(() => router.reload({ only: ["tracks"] }), 500);
        } catch (e) {
            alert(e?.response?.data?.error || "Discovery failed");
        } finally {
            setDiscovering(false);
        }
    };

    const runHealthCheck = async () => {
        setChecking(true); setHealthReport(null);
        try {
            const { data } = await axios.get("/admin/audio/check");
            setHealthReport(data);
        } catch (e) {
            alert(e?.response?.data?.error || "Health check failed");
        } finally {
            setChecking(false);
        }
    };

    /**
     * One-button AI auto-map pipeline. Crawls every NCCD subfolder,
     * Whisper-transcribes each track, GPT-extracts vocabulary, links
     * everything to lessons + words, and finally fills in missing
     * audio with child-friendly TTS.
     *
     * Long-running by design (many minutes for a full grade) so we
     * tick a wall-clock timer in the UI while we wait.
     */
    const runAutoMap = async () => {
        const sure = window.confirm(
            `Run the full AI auto-map for grade ${autoMapOpts.grade}, pages ${autoMapOpts.page_from}-${autoMapOpts.page_to}?\n\n` +
            "This will:\n" +
            "  • Crawl every NCCD subfolder (ab/pb/new/part2)\n" +
            "  • Whisper-transcribe each new track\n" +
            "  • GPT-extract vocabulary + sentences per unit\n" +
            "  • Auto-link tracks to lessons by page\n" +
            "  • Auto-stamp Word segment timestamps\n" +
            (autoMapOpts.skip_tts ? "" : "  • Generate TTS clips for words still missing audio\n") +
            "\nIt may take several minutes and uses your OpenAI quota. Safe to re-run."
        );
        if (!sure) return;

        setAutoMapBusy(true);
        setAutoMapReport(null);
        setAutoMapElapsed(0);
        const startedAt = Date.now();
        const tick = setInterval(() => setAutoMapElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);

        try {
            const { data } = await axios.post("/admin/audio/auto-map", {
                grade:     autoMapOpts.grade,
                page_from: autoMapOpts.page_from,
                page_to:   autoMapOpts.page_to,
                overwrite: !!autoMapOpts.overwrite,
                skip_tts:  !!autoMapOpts.skip_tts,
            }, { timeout: 1000 * 60 * 30 });
            setAutoMapReport(data?.report || data);
            // Reload the tracks table so newly-created tracks appear.
            setTimeout(() => router.reload({ only: ["tracks"] }), 600);
        } catch (e) {
            alert(e?.response?.data?.error || e?.message || "Auto-map failed");
        } finally {
            clearInterval(tick);
            setAutoMapBusy(false);
        }
    };

    return (
        <AdminLayout active="tracks">
            <PageHead
                title="Audio Tracks"
                description="Browse and manage the NCCD audio track catalogue powering Kiddo lessons."
            />
            <div className="max-w-7xl mx-auto">
                <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-black text-[#1E293B]">
                            Audio Tracks
                        </h1>
                        <p className="text-gray-500 font-bold text-sm mt-1">
                            Every NCCD track known to Kiddo. Click to edit the
                            URL, label, kind; listen inline; delete orphans.
                            Or click <b>Discover</b> to auto-import every
                            working mp3 from qr.nccd.gov.jo.
                        </p>
                    </div>
                    <form onSubmit={submitSearch} className="flex gap-2 flex-wrap">
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
                        <button
                            type="button"
                            onClick={runHealthCheck}
                            disabled={checking}
                            className="px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-black disabled:opacity-50"
                            title="HEAD-probe every URL and report broken ones"
                        >
                            {checking ? '…' : '🔎 Check URLs'}
                        </button>
                    </form>
                </header>

                {/* AI Auto-map (one-button full pipeline) */}
                <div className="bg-gradient-to-br from-purple-50 via-fuchsia-50 to-amber-50 border-2 border-purple-200 rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="font-black text-base text-purple-700 flex items-center gap-2">
                                ✨ AI Auto-map curriculum
                                <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    one-click
                                </span>
                            </h2>
                            <p className="text-[11px] text-gray-600 font-semibold mt-1 max-w-prose leading-relaxed">
                                Walks the entire NCCD library
                                (<code>ab</code> · <code>pb</code> · <code>new</code> · <code>part2</code>),
                                Whisper-transcribes every audio file, uses GPT to extract vocabulary
                                + sentences per unit, links tracks to lessons by page, and stamps
                                <b> exact millisecond timestamps</b> on each Word — then optionally
                                fills any remaining gaps with a child-friendly OpenAI voice.
                                Fully idempotent — safe to re-run any time NCCD updates the audio.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                Grade
                                <input
                                    type="number" min={1} max={6}
                                    value={autoMapOpts.grade}
                                    onChange={(e) => setAutoMapOpts({ ...autoMapOpts, grade: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                From
                                <input
                                    type="number" min={1} max={200}
                                    value={autoMapOpts.page_from}
                                    onChange={(e) => setAutoMapOpts({ ...autoMapOpts, page_from: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                To
                                <input
                                    type="number" min={1} max={200}
                                    value={autoMapOpts.page_to}
                                    onChange={(e) => setAutoMapOpts({ ...autoMapOpts, page_to: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <button
                                onClick={runAutoMap}
                                disabled={autoMapBusy}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-black shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {autoMapBusy
                                    ? `Mapping… ${Math.floor(autoMapElapsed / 60)}:${String(autoMapElapsed % 60).padStart(2, "0")}`
                                    : "✨ Auto-map curriculum"}
                            </button>
                        </div>
                    </div>

                    {/* Toggles row */}
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-black text-gray-600">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoMapOpts.overwrite}
                                onChange={(e) => setAutoMapOpts({ ...autoMapOpts, overwrite: e.target.checked })}
                                className="w-3.5 h-3.5 accent-purple-600"
                            />
                            Overwrite existing segments
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoMapOpts.skip_tts}
                                onChange={(e) => setAutoMapOpts({ ...autoMapOpts, skip_tts: e.target.checked })}
                                className="w-3.5 h-3.5 accent-purple-600"
                            />
                            Skip TTS fill-in
                        </label>
                        <span className="text-gray-400 italic">
                            Tip: leave both off the first time — it gives the cleanest result.
                        </span>
                    </div>

                    {autoMapReport ? (
                        <div className="mt-4 bg-white border border-purple-100 rounded-xl p-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
                                {[
                                    ["🎵 Tracks found",     autoMapReport.totals?.tracks_found],
                                    ["📚 Lessons linked",   autoMapReport.totals?.tracks_linked],
                                    ["⏱ Words segmented",   autoMapReport.totals?.words_segmented],
                                    ["➕ Words added",       autoMapReport.totals?.words_added],
                                    ["📝 Lessons annotated",autoMapReport.totals?.lessons_annotated],
                                    ["✨ TTS generated",     autoMapReport.totals?.tts_generated],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-gradient-to-br from-purple-50 to-white p-2 rounded-lg border border-purple-100 text-center">
                                        <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-0.5">{label}</p>
                                        <p className="text-base font-black text-[#1E293B]">{value ?? 0}</p>
                                    </div>
                                ))}
                            </div>

                            {autoMapReport.units?.length ? (
                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-[9px] font-black uppercase text-gray-500 tracking-widest">
                                                <th className="px-2 py-1.5">Unit</th>
                                                <th className="px-2 py-1.5">Tracks</th>
                                                <th className="px-2 py-1.5">Transcribed</th>
                                                <th className="px-2 py-1.5">+Words</th>
                                                <th className="px-2 py-1.5">⏱ Words</th>
                                                <th className="px-2 py-1.5">Lessons</th>
                                                <th className="px-2 py-1.5">Errors</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {autoMapReport.units.map((u, i) => (
                                                <tr key={i} className="border-t border-gray-50">
                                                    <td className="px-2 py-1.5 font-black text-[#1E293B]">U{u.unit_number} · {u.unit}</td>
                                                    <td className="px-2 py-1.5 text-gray-600">{u.tracks ?? 0}</td>
                                                    <td className="px-2 py-1.5 text-gray-600">{u.transcribed ?? 0}</td>
                                                    <td className="px-2 py-1.5 text-emerald-600 font-black">{u.words_added ?? 0}</td>
                                                    <td className="px-2 py-1.5 text-purple-600 font-black">{u.words_segmented ?? 0}</td>
                                                    <td className="px-2 py-1.5 text-gray-600">
                                                        {u.lessons_linked ?? 0} linked
                                                        {u.lessons_annotated ? ` · ${u.lessons_annotated} note${u.lessons_annotated === 1 ? "" : "s"}` : ""}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-rose-600">
                                                        {u.errors?.length ? `${u.errors.length} ⚠` : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}

                            {autoMapReport.errors?.length ? (
                                <div className="mt-3 p-2 bg-rose-50 rounded-lg border border-rose-100">
                                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">
                                        ⚠ Pipeline-level issues
                                    </p>
                                    <ul className="text-[11px] font-mono text-rose-600 space-y-0.5 max-h-24 overflow-y-auto">
                                        {autoMapReport.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            ) : null}

                            {autoMapReport.tts?.errors?.length ? (
                                <details className="mt-3 text-[11px]">
                                    <summary className="cursor-pointer font-black text-amber-700">
                                        ⚠ TTS warnings ({autoMapReport.tts.errors.length})
                                    </summary>
                                    <ul className="mt-1 font-mono text-amber-700 space-y-0.5 max-h-32 overflow-y-auto pl-3">
                                        {autoMapReport.tts.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </details>
                            ) : null}

                            <p className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                                Started {autoMapReport.started_at?.replace("T", " ").slice(0, 19)} ·
                                Finished {autoMapReport.finished_at?.replace("T", " ").slice(0, 19)}
                            </p>
                        </div>
                    ) : null}
                </div>

                {/* Auto-discover panel */}
                <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4 mb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="font-black text-sm text-violet-700">
                                🤖 Auto-discover NCCD audio
                            </h2>
                            <p className="text-[11px] text-gray-600 font-semibold mt-1 max-w-prose">
                                Crawls every <code>p&lt;page&gt;.mp3</code> /
                                <code> p&lt;page&gt;.&lt;n&gt;.mp3</code> /
                                <code> p&lt;page&gt;.mp4</code> on
                                <code> qr.nccd.gov.jo</code> within the chosen
                                page range and upserts every URL that returns a
                                valid audio payload. Idempotent — safe to re-run.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-end gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                Grade
                                <input
                                    type="number" min={1} max={6}
                                    value={discoverOpts.grade}
                                    onChange={(e) => setDiscoverOpts({ ...discoverOpts, grade: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                From
                                <input
                                    type="number" min={1} max={200}
                                    value={discoverOpts.page_from}
                                    onChange={(e) => setDiscoverOpts({ ...discoverOpts, page_from: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                To
                                <input
                                    type="number" min={1} max={200}
                                    value={discoverOpts.page_to}
                                    onChange={(e) => setDiscoverOpts({ ...discoverOpts, page_to: Number(e.target.value) || 1 })}
                                    className="block w-16 mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm font-mono"
                                />
                            </label>
                            <label className="text-[10px] font-black uppercase text-gray-500">
                                Book
                                <select
                                    value={discoverOpts.book}
                                    onChange={(e) => setDiscoverOpts({ ...discoverOpts, book: e.target.value })}
                                    className="block mt-1 px-2 py-1 rounded-lg border border-gray-200 text-sm"
                                >
                                    <option value="both">both</option>
                                    <option value="pb">PB only</option>
                                    <option value="ab">AB only</option>
                                </select>
                            </label>
                            <button
                                onClick={runDiscover}
                                disabled={discovering}
                                className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-black disabled:opacity-50"
                            >
                                {discovering ? 'Probing…' : 'Discover'}
                            </button>
                        </div>
                    </div>
                    {discoverReport ? (
                        <div className="mt-3 p-3 rounded-xl bg-white border border-violet-100">
                            <p className="text-[11px] font-black text-violet-700">
                                Tried {discoverReport.totals?.tried ?? '?'} URLs ·
                                Found {discoverReport.totals?.found ?? '?'} valid ·
                                +{discoverReport.totals?.created ?? 0} new ·
                                ↻{discoverReport.totals?.updated ?? 0} updated
                            </p>
                        </div>
                    ) : null}

                    {healthReport ? (
                        <div className="mt-3 p-3 rounded-xl bg-white border border-amber-100">
                            <p className="text-[11px] font-black text-amber-700">
                                URL health: {healthReport.healthy ?? 0}/{healthReport.total ?? 0} working ·
                                {(healthReport.broken?.length ?? 0)} broken
                            </p>
                            {healthReport.broken?.length ? (
                                <ul className="mt-2 max-h-40 overflow-y-auto text-[10px] font-mono text-rose-700 space-y-0.5">
                                    {healthReport.broken.slice(0, 30).map((b) => (
                                        <li key={b.id}>{b.code} — {b.error}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </div>

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
