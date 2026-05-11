import React from "react";
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

const Dashboard = ({ counts }) => {
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
                    <h2 className="font-black text-[#1E293B] mb-2">
                        What can I do here?
                    </h2>
                    <ul className="text-sm text-gray-600 font-semibold leading-relaxed list-disc pl-5 space-y-1">
                        <li>
                            <b>Words &amp; Segments</b> — the main control
                            screen. Pick a word, play its track, and set the
                            exact start/end milliseconds with live previewing.
                            No file downloads needed.
                        </li>
                        <li>
                            <b>Audio Tracks</b> — add / edit / delete NCCD
                            tracks, change the URL, override the label, kind,
                            or the optional local cached path.
                        </li>
                        <li>
                            <b>Lessons</b> — change the title, type, page
                            number, JSON config, or the primary audio track of
                            any lesson.
                        </li>
                        <li>
                            <b>Units</b> — edit the 6 book units (title,
                            description, cover image, colour key).
                        </li>
                    </ul>
                </section>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
