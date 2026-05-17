import React, { useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import AdminLayout from "@/learning/components/admin/AdminLayout";

const StatCard = ({ label, value, icon, color, hint, onClick }) => (
    <button
        onClick={onClick}
        className="text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition"
    >
        <div className="flex items-center gap-3 mb-2">
            <span
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: color + "15", color }}
            >
                {icon}
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {label}
            </p>
        </div>
        <p className="text-3xl font-black text-[#1E293B] leading-none">
            {value}
        </p>
        {hint ? (
            <p className="text-[11px] text-gray-400 font-semibold mt-2">
                {hint}
            </p>
        ) : null}
    </button>
);

const ActionTile = ({ label, hint, icon, onClick, busy, accent = "violet" }) => {
    const accents = {
        violet: "bg-violet-50 text-violet-700 hover:bg-violet-100",
        emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
        cyan: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
    };
    return (
        <button
            onClick={onClick}
            disabled={busy}
            className={`text-left rounded-2xl border border-gray-100 p-4 transition disabled:opacity-50 ${accents[accent]}`}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{icon}</span>
                <span className="font-black text-sm">{busy ? "Working…" : label}</span>
            </div>
            <p className="text-[11px] font-bold opacity-80">{hint}</p>
        </button>
    );
};

const Dashboard = ({ counts }) => {
    const [busy, setBusy] = useState(null);
    const [msg, setMsg] = useState(null);

    const runDiscover = async () => {
        if (!confirm("Auto-discover NCCD audio for grade 1, pages 4-43 (PB+AB)?\n\nIdempotent — safe to re-run anytime.")) return;
        setBusy("discover"); setMsg(null);
        try {
            const { data } = await axios.post("/admin/audio/discover", { grade: 1, page_from: 4, page_to: 43, book: "both" });
            setMsg(`✅ Discovered ${data.totals?.found ?? 0}/${data.totals?.tried ?? 0} URLs · +${data.totals?.created ?? 0} new tracks`);
        } catch (e) {
            setMsg("❌ " + (e?.response?.data?.error || "Discovery failed"));
        } finally {
            setBusy(null);
        }
    };

    const runAutoSegmentAll = async () => {
        if (!confirm("Run AI auto-segment on every audio track that has linked words?\n\nThis sends each track to OpenAI Whisper.")) return;
        setBusy("autoseg"); setMsg(null);
        try {
            const { data } = await axios.post("/admin/words/auto-segment-all", {});
            setMsg(`🤖 Matched ${data.words_matched}/${data.words_total} words across ${data.tracks_run} tracks.`);
        } catch (e) {
            setMsg("❌ " + (e?.response?.data?.error || "Auto-segment failed"));
        } finally {
            setBusy(null);
        }
    };

    const runHealthCheck = async () => {
        setBusy("health"); setMsg(null);
        try {
            const { data } = await axios.get("/admin/audio/check");
            setMsg(`🔎 ${data.healthy}/${data.total} URLs healthy · ${data.broken?.length || 0} broken`);
        } catch (e) {
            setMsg("❌ " + (e?.response?.data?.error || "Health check failed"));
        } finally {
            setBusy(null);
        }
    };

    return (
        <AdminLayout active="dashboard">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                        Control centre
                    </h1>
                    <p className="text-gray-500 font-bold text-sm mt-1">
                        Manage everything in Kiddo from one place — curriculum,
                        audio tracks, and the per-word segments the child hears
                        on each tap.
                    </p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Units"
                        value={counts.units}
                        icon="🗺️"
                        color="#7C3AED"
                        hint="Book units (0-5)"
                        onClick={() => router.visit("/admin/units")}
                    />
                    <StatCard
                        label="Lessons"
                        value={counts.lessons}
                        icon="📖"
                        color="#16A34A"
                        hint="All lessons across units"
                        onClick={() => router.visit("/admin/lessons")}
                    />
                    <StatCard
                        label="Words"
                        value={counts.words}
                        icon="🔤"
                        color="#0284C7"
                        hint="Vocabulary + phonics rows"
                        onClick={() => router.visit("/admin/words")}
                    />
                    <StatCard
                        label="Audio tracks"
                        value={counts.audioTracks}
                        icon="🎧"
                        color="#F59E0B"
                        hint="NCCD mp3/mp4 library"
                        onClick={() => router.visit("/admin/tracks")}
                    />
                    <StatCard
                        label="Linked to lessons"
                        value={counts.linkedTracks}
                        icon="🔗"
                        color="#14B8A6"
                        hint="Tracks already wired up"
                        onClick={() => router.visit("/admin/lessons")}
                    />
                    <StatCard
                        label="Words with segments"
                        value={counts.wordsWithSegments}
                        icon="✂️"
                        color="#EC4899"
                        hint="Words with start/end ms set"
                        onClick={() => router.visit("/admin/words")}
                    />
                </div>

                <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                    <h2 className="font-black text-[#1E293B] mb-3">
                        🤖 One-click AI actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <ActionTile
                            icon="🛰"
                            accent="violet"
                            label="Discover NCCD audio"
                            hint="Probe qr.nccd.gov.jo for every working mp3 and upsert audio_tracks."
                            onClick={runDiscover}
                            busy={busy === "discover"}
                        />
                        <ActionTile
                            icon="🤖"
                            accent="emerald"
                            label="AI auto-segment all"
                            hint="Whisper-transcribe every track and stamp per-word ms timestamps."
                            onClick={runAutoSegmentAll}
                            busy={busy === "autoseg"}
                        />
                        <ActionTile
                            icon="🔎"
                            accent="amber"
                            label="Check broken URLs"
                            hint="HEAD-probe every audio_track URL and report which ones 404."
                            onClick={runHealthCheck}
                            busy={busy === "health"}
                        />
                    </div>
                    {msg ? (
                        <p className="mt-3 text-xs font-black text-[#1E293B] bg-gray-50 border border-gray-100 rounded-lg p-2">
                            {msg}
                        </p>
                    ) : null}
                </section>

                <section className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                    <h2 className="font-black text-[#1E293B] mb-2">
                        What can I do here?
                    </h2>
                    <ul className="text-sm text-gray-600 font-semibold leading-relaxed list-disc pl-5 space-y-1">
                        <li>
                            <b>Words &amp; Segments</b> — pick a word, play its
                            track, set the exact start/end milliseconds with live
                            previewing. Bulk-delete duplicates, add new words,
                            run AI auto-segment per row or for the whole unit.
                        </li>
                        <li>
                            <b>Audio Tracks</b> — browse / edit / delete NCCD
                            tracks; click <b>Discover</b> to crawl qr.nccd.gov.jo
                            and import every working mp3 in one shot.
                        </li>
                        <li>
                            <b>Lessons</b> — change the title, type, page
                            number, JSON config, or the primary audio track.
                            AI ingest writes back <code>ai_summary</code>,
                            <code>ai_objectives</code> & <code>ai_sentences</code>.
                        </li>
                        <li>
                            <b>Units</b> — edit the 6 book units. Per-unit
                            buttons run AI ingest from audio (auto-add words +
                            details), generate child-friendly TTS clips for U0,
                            or delete the entire unit.
                        </li>
                    </ul>
                </section>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
