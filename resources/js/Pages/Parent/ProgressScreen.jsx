import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import ParentAIInsight from "@/learning/components/ai/ParentAIInsight";

const ProgressScreen = ({ user, stats, unitsList, achievements = [], errorAnalysis = [] }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const unitColors = ["#7C3AED", "#16A34A", "#2563EB", "#DB2777", "#D97706"];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const completion = stats?.completionPercentage || 0;

    return (
        <div className="h-[100dvh] w-screen bg-[#F4F8FB] font-sans flex overflow-hidden relative">
            {/* خلفية ديناميكية */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-4000" />
            </div>

            {/* SIDEBAR */}
            <aside
                className={`${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                } fixed lg:static left-0 top-0 h-full w-[280px] bg-white/95 backdrop-blur-2xl border-r border-gray-100 z-50 shadow-2xl lg:shadow-[10px_0_30px_rgba(0,0,0,0.02)] flex flex-col transition-transform duration-300`}
            >
                {/* Logo & Close */}
                <div className="h-[72px] px-6 flex items-center justify-between border-b border-gray-50 shrink-0">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-9 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => router.visit("/")}
                    />
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black"
                    >
                        ✕
                    </button>
                </div>

                {/* Student Profile */}
                <div className="p-6 shrink-0 border-b border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                        Student Profile
                    </p>
                    <div className="flex items-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-3.5 rounded-2xl border border-blue-100 shadow-sm">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-blue-50 shrink-0">
                            👦🏻
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-black text-[13px] text-[#1E293B] truncate leading-tight">
                                {user?.name || "Student"}
                            </h4>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                Level {user?.level || 1}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 px-4 py-3.5 bg-[#7C3AED] text-white rounded-2xl font-black text-[13px] shadow-[0_4px_15px_rgba(124,58,237,0.2)]">
                        <span className="text-lg">📊</span> Dashboard
                    </div>
                    <div
                        onClick={() => router.visit("/map")}
                        className="flex items-center gap-3 px-4 py-3.5 text-gray-500 hover:bg-gray-50 hover:text-[#1E293B] rounded-2xl font-black text-[13px] cursor-pointer transition-all"
                    >
                        <span className="text-lg grayscale opacity-70">🗺️</span>
                        Adventure Map
                    </div>
                </nav>

                {/* Bottom card */}
                <div className="p-6 shrink-0 relative overflow-hidden">
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-3">
                        <img
                            src="/assets/ui/rewards/star.png"
                            className="w-10 h-10 object-contain drop-shadow-sm"
                            alt="Stars"
                            onError={(e) =>
                                (e.currentTarget.outerHTML = "<span>⭐</span>")
                            }
                        />
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase">
                                Total Stars
                            </p>
                            <p className="text-xl font-black text-amber-500 leading-none">
                                {user?.total_stars || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 z-10 relative">
                {/* Mobile header */}
                <header className="lg:hidden h-[72px] bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg shadow-sm border border-gray-100"
                        >
                            ☰
                        </button>
                        <h1 className="font-black text-[#1E293B] text-lg">
                            Dashboard
                        </h1>
                    </div>
                    <button
                        onClick={() => router.visit("/map")}
                        className="w-10 h-10 bg-[#7C3AED] text-white rounded-xl flex items-center justify-center shadow-[0_3px_0_#5B21B6] text-sm"
                    >
                        🗺️
                    </button>
                </header>

                <main className="flex-1 overflow-auto custom-scrollbar p-5 sm:p-8 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-fade-in-up">
                        {/* Desktop header */}
                        <div className="hidden lg:flex justify-between items-end mb-4">
                            <div>
                                <h1 className="text-4xl font-black text-[#1E293B] tracking-tight">
                                    Parent Dashboard
                                </h1>
                                <p className="text-gray-500 font-bold mt-2">
                                    Track {user?.name}&apos;s learning
                                    adventure.
                                </p>
                            </div>
                            <button
                                onClick={() => router.visit("/map")}
                                className="bg-white text-[#7C3AED] px-8 py-3.5 rounded-2xl font-black shadow-sm border border-gray-100 hover:bg-gray-50 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                🗺️ Back to Map
                            </button>
                        </div>

                        {/* Banner */}
                        <div className="bg-gradient-to-r from-[#7C3AED] to-[#C84BFF] rounded-[2.5rem] p-8 sm:p-10 shadow-xl relative overflow-hidden text-white border border-white/20">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10 w-full sm:w-2/3">
                                <h2 className="text-3xl sm:text-4xl font-black mb-3 drop-shadow-sm">
                                    Great Progress! 🌟
                                </h2>
                                <p className="text-purple-100 font-medium text-sm sm:text-base leading-relaxed">
                                    {user?.name || "Your child"} has completed{" "}
                                    <span className="font-black text-white">
                                        {completion}%
                                    </span>{" "}
                                    of the English curriculum. Keep up the
                                    amazing work!
                                </p>
                            </div>
                            <img
                                src="/assets/ui/mascot/fox-main.png"
                                alt="Fox"
                                className="absolute -right-6 -bottom-6 h-[110%] object-contain drop-shadow-2xl pointer-events-none hidden sm:block"
                                onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                }
                            />
                        </div>

                        {/* AI Insight card (uses OpenAI if configured, safe fallback otherwise) */}
                        <ParentAIInsight
                            childName={user?.name || "your child"}
                            aiEnabled={usePage().props?.ai?.enabled}
                        />

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                            {/* Left column */}
                            <div className="xl:col-span-2 flex flex-col gap-6 sm:gap-8">
                                {/* Quick stats */}
                                <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col items-center justify-center p-5 bg-purple-50 rounded-[1.5rem] border border-purple-100">
                                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-3">
                                            Completion
                                        </p>
                                        <div className="relative w-20 h-20 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle
                                                    cx="40"
                                                    cy="40"
                                                    r="34"
                                                    fill="none"
                                                    stroke="#E9E2FF"
                                                    strokeWidth="8"
                                                    className="translate-x-[-40px] translate-y-[-40px]"
                                                />
                                                <circle
                                                    cx="40"
                                                    cy="40"
                                                    r="34"
                                                    fill="none"
                                                    stroke="#7C3AED"
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${
                                                        2 *
                                                        Math.PI *
                                                        34 *
                                                        (completion / 100)
                                                    } ${2 * Math.PI * 34}`}
                                                    className="translate-x-[-40px] translate-y-[-40px] transition-all duration-1000"
                                                />
                                            </svg>
                                            <span className="absolute font-black text-lg text-[#7C3AED]">
                                                {completion}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-5 bg-amber-50 rounded-[1.5rem] border border-amber-100">
                                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3">
                                            Total Stars
                                        </p>
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-2">
                                            ⭐
                                        </div>
                                        <span className="font-black text-2xl text-amber-600">
                                            {user?.total_stars || 0}
                                        </span>
                                    </div>

                                    <div className="col-span-2 md:col-span-1 flex flex-col itemscenter justify-center p-5 bg-blue-50 rounded-[1.5rem] border border-blue-100">
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3">
                                            Current Unit
                                        </p>
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm mb-2">
                                            🚀
                                        </div>
                                        <span className="font-black text-[12px] text-[#1E293B] text-center leading-tight truncate px-2 w-full">
                                            {stats?.latestLesson ||
                                                "Welcome Island"}
                                        </span>
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                                    <h3 className="font-black text-lg text-[#1E293B] mb-5">
                                        🏆 Recent Achievements
                                    </h3>
                                    {achievements && achievements.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {achievements.map((badge, i) => (
                                                <div
                                                    key={`${badge.label}-${i}`}
                                                    className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all"
                                                >
                                                    <img
                                                        src={`/assets/ui/rewards/${badge.img}`}
                                                        className="w-14 h-14 object-contain"
                                                        alt={badge.label}
                                                        onError={(e) =>
                                                            (e.currentTarget.outerHTML =
                                                                '<span class="text-3xl">🏅</span>')
                                                        }
                                                    />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 flex flex-col items-center gap-3 text-center">
                                            <span className="text-4xl">🌱</span>
                                            <p className="font-black text-[#1E293B] text-sm">
                                                Keep playing to earn badges!
                                            </p>
                                            <p className="text-[11px] text-gray-500 font-semibold max-w-xs leading-relaxed">
                                                Finish a lesson or collect stars
                                                and your first achievement will
                                                appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Error Analysis Section */}
                                <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
                                    <h3 className="font-black text-lg text-[#1E293B] mb-2">
                                        🔍 Error Analysis
                                    </h3>
                                    <p className="text-xs text-gray-500 font-bold mb-5">
                                        Words your child found difficult — practice these at home!
                                    </p>
                                    {errorAnalysis && errorAnalysis.length > 0 ? (
                                        <div className="space-y-3">
                                            {errorAnalysis.map((err, i) => (
                                                <div
                                                    key={`err-${i}`}
                                                    className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg font-black text-red-500 shadow-sm border border-red-100">
                                                            {err.count}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[#1E293B] text-sm uppercase">{err.word}</p>
                                                            {err.wrongChoices && err.wrongChoices.length > 0 && (
                                                                <p className="text-[10px] text-red-400 font-bold">
                                                                    Confused with: {err.wrongChoices.slice(0, 3).join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: Math.min(err.count, 5) }).map((_, j) => (
                                                            <span key={j} className="w-2 h-2 rounded-full bg-red-300" />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 flex flex-col items-center gap-3 text-center bg-green-50 rounded-2xl border border-green-100">
                                            <span className="text-3xl">🌟</span>
                                            <p className="font-black text-green-700 text-sm">No errors yet!</p>
                                            <p className="text-[11px] text-green-600 font-semibold">
                                                Your child is doing great. Errors will appear here when they happen so you can help them practice.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right column: units */}
                            <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 h-fit">
                                <h3 className="font-black text-lg text-[#1E293B] mb-6">
                                    🗺️ Unit Breakdown
                                </h3>
                                <div className="space-y-6">
                                    {(unitsList || []).map((unit, index) => (
                                        <div key={unit.id} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-black text-[9px] text-gray-500">
                                                        {unit.id}
                                                    </div>
                                                    <h4 className="font-black text-[13px] text-[#1E293B]">
                                                        {unit.name}
                                                    </h4>
                                                </div>
                                                <span className="font-black text-[11px] text-gray-400">
                                                    {unit.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000"
                                                    style={{
                                                        width: `${unit.percentage}%`,
                                                        backgroundColor:
                                                            unitColors[
                                                                index %
                                                                    unitColors.length
                                                            ],
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-2.5 flex justify-between items-center">
                                                <div className="flex gap-1">
                                                    {Array.from({
                                                        length: 3,
                                                    }).map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`text-[10px] ${
                                                                i < unit.stars
                                                                    ? "grayscale-0"
                                                                    : "grayscale opacity-30"
                                                            }`}
                                                        >
                                                            ⭐
                                                        </span>
                                                    ))}
                                                </div>
                                                <span
                                                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest
                          ${
                              unit.status === "done"
                                  ? "bg-green-100 text-green-600"
                                  : unit.status === "active"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-400"
                          }`}
                                                >
                                                    {unit.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
        </div>
    );
};

export default ProgressScreen;
