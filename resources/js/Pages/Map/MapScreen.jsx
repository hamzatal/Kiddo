import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ══════════════════════════════════════════════════════════
   VISUAL CONFIG — colours & icons per unit
══════════════════════════════════════════════════════════ */
const UNIT_THEME = [
    { emoji: "🏠", color: "#7C3AED", gradient: "from-purple-400 to-violet-600", light: "bg-purple-50 border-purple-200" },
    { emoji: "👨‍👩‍👧", color: "#2563EB", gradient: "from-blue-400 to-indigo-600", light: "bg-blue-50 border-blue-200" },
    { emoji: "🎒", color: "#DB2777", gradient: "from-pink-400 to-rose-600", light: "bg-pink-50 border-pink-200" },
    { emoji: "🏫", color: "#D97706", gradient: "from-amber-400 to-orange-600", light: "bg-amber-50 border-amber-200" },
    { emoji: "🧸", color: "#16A34A", gradient: "from-emerald-400 to-green-600", light: "bg-emerald-50 border-emerald-200" },
    { emoji: "🎓", color: "#0891B2", gradient: "from-cyan-400 to-teal-600", light: "bg-cyan-50 border-cyan-200" },
];

/* ══════════════════════════════════════════════════════════
   UnitCard — clean card-based node (replaces the old absolute-positioned approach)
══════════════════════════════════════════════════════════ */
const UnitCard = ({ unit, theme, onClick }) => {
    const isDone = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const totalLessons = unit.lessonsCount || unit.lessons_count || 1;
    const currentLesson = unit.currentLesson || unit.current_lesson || 1;
    const starsEarned = Math.min(unit.stars_earned ?? unit.stars ?? 0, 3);

    return (
        <div
            onClick={!isLocked ? onClick : undefined}
            className={`relative flex flex-col items-center transition-all duration-300 ${
                isLocked ? "cursor-not-allowed opacity-50 grayscale" : "cursor-pointer"
            } ${isActive ? "scale-105" : "hover:scale-105"}`}
        >
            {/* Active badge */}
            {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-[9px] font-black px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-white animate-bounce">
                    Playing Now!
                </div>
            )}

            {/* Main circle */}
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-xl border-4 border-white/80 ${
                isActive ? "ring-4 ring-amber-300/60" : ""
            }`}>
                <span className="text-3xl sm:text-4xl drop-shadow-md select-none">
                    {isLocked ? "🔒" : theme.emoji}
                </span>

                {/* Done checkmark */}
                {isDone && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-white text-xs font-black">✓</span>
                    </div>
                )}
            </div>

            {/* Title pill */}
            <div className="mt-2 px-3 py-1 bg-white/95 backdrop-blur rounded-full shadow-md border border-gray-100 max-w-[140px]">
                <p className="text-[10px] sm:text-[11px] font-black text-gray-800 text-center truncate">
                    {unit.title}
                </p>
            </div>

            {/* Stars (only if earned and done) */}
            {isDone && starsEarned > 0 && (
                <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: starsEarned }).map((_, i) => (
                        <span key={i} className="text-sm">⭐</span>
                    ))}
                </div>
            )}

            {/* Lesson progress dots (only if active) */}
            {isActive && totalLessons > 1 && (
                <div className="flex gap-1 mt-1.5">
                    {Array.from({ length: Math.min(totalLessons, 8) }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${
                                i < currentLesson - 1
                                    ? "bg-green-500"
                                    : i === currentLesson - 1
                                      ? "bg-amber-400 ring-2 ring-amber-200"
                                      : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   Path connector between units
══════════════════════════════════════════════════════════ */
const PathConnector = ({ done }) => (
    <div className="flex items-center justify-center py-1">
        <div className={`w-1 h-8 sm:h-10 rounded-full ${done ? "bg-green-300" : "bg-gray-200"}`} />
    </div>
);

/* ══════════════════════════════════════════════════════════
   MapScreen — Full redesign with vertical path layout
══════════════════════════════════════════════════════════ */
const MapScreen = ({ user, units: propUnits }) => {
    const [soundOn, setSoundOn] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showQuizResult, setShowQuizResult] = useState(false);

    const { flash } = usePage().props;
    const quizResult = flash?.quizResult;

    const units = propUnits || [];
    const completedCount = units.filter((u) => u.status === "done").length;
    const activeUnit = units.find((u) => u.status === "active");

    useEffect(() => {
        if (quizResult?.passed) {
            setShowQuizResult(true);
            import("@/learning/utils/confetti").then(({ launchConfetti }) => launchConfetti(4000));
            import("@/learning/utils/soundEffects").then(({ playCheer }) => playCheer());
        }
    }, [quizResult]);

    const totalStars =
        typeof user?.total_stars === "number"
            ? user.total_stars
            : units.reduce((sum, u) => sum + (u.stars_earned || 0), 0);

    const unitsTotal = units.length || 5;
    const xp = user?.xp || 0;
    const maxXp = 600;
    const xpPct = Math.min((xp / maxXp) * 100, 100);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 1024) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden font-sans">
            {/* ── HEADER ── */}
            <header className="h-16 sm:h-[72px] shrink-0 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm flex items-center z-50">
                <div className="w-full px-4 lg:px-8 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.visit("/")} className="hover:scale-105 transition-transform shrink-0">
                            <img src="/assets/ui/hero/title-logo.png" alt="Kiddo" className="h-8 lg:h-10 object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-1.5 rounded-full border border-indigo-100">
                            <span className="text-lg">🗺️</span>
                            <span className="font-black text-indigo-700 text-xs">Adventure Map</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* XP bar */}
                        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                            <span className="font-black text-purple-600 text-[10px]">Lv.{user?.level || 1}</span>
                            <div className="w-20 lg:w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-1000" style={{ width: `${xpPct}%` }} />
                            </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
                            <span className="text-base">⭐</span>
                            <span className="font-black text-amber-600 text-sm">{totalStars}</span>
                        </div>

                        {/* Profile */}
                        <button onClick={() => router.visit("/progress")} className="flex items-center gap-2 bg-white border border-gray-200 p-1 pr-3 rounded-full shadow-sm hover:bg-gray-50">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white shadow-sm">👦🏻</div>
                            <span className="font-black text-[#1E293B] text-[10px] hidden sm:block">{user?.name || "Student"}</span>
                        </button>

                        {/* Sound */}
                        <button onClick={() => setSoundOn((s) => !s)} className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-lg shadow-sm hover:bg-gray-50">
                            {soundOn ? "🔊" : "🔇"}
                        </button>

                        {/* Mobile menu */}
                        <button onClick={() => setSidebarOpen((v) => !v)} className="lg:hidden w-9 h-9 rounded-xl bg-[#1E293B] text-white flex items-center justify-center text-sm shadow-sm active:scale-95">
                            ☰
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY ── */}
            <div className="flex-1 flex min-h-0 relative">
                {/* ── MAP AREA — gradient sky background with floating clouds ── */}
                <main className="flex-1 relative overflow-auto hide-scrollbar">
                    {/* Layered gradient background — sky to grass */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#B4E4FF] to-[#90EE90] pointer-events-none" />
                    {/* Subtle cloud shapes */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[8%] left-[10%] w-32 h-12 bg-white/40 rounded-full blur-md animate-[drift_20s_linear_infinite]" />
                        <div className="absolute top-[15%] right-[20%] w-40 h-14 bg-white/30 rounded-full blur-lg animate-[drift_25s_linear_infinite_reverse]" />
                        <div className="absolute top-[5%] left-[55%] w-28 h-10 bg-white/35 rounded-full blur-md animate-[drift_18s_linear_infinite]" />
                    </div>
                    {/* Subtle hills at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[25%] pointer-events-none">
                        <div className="absolute bottom-0 left-[-5%] w-[60%] h-full bg-[#7BC67E] rounded-t-[50%] opacity-60" />
                        <div className="absolute bottom-0 right-[-5%] w-[55%] h-[80%] bg-[#5DB761] rounded-t-[50%] opacity-50" />
                    </div>

                    {/* Map path with unit nodes */}
                    <div className="relative z-10 flex flex-col items-center py-8 sm:py-12 px-4 min-h-full">
                        <h2 className="text-white font-black text-lg sm:text-xl drop-shadow-lg mb-6 flex items-center gap-2">
                            <span className="text-2xl">🌍</span> Your Learning Journey
                        </h2>

                        {/* Winding path — units zigzag left/right */}
                        <div className="flex flex-col items-center w-full max-w-sm">
                            {units.map((u, idx) => {
                                const theme = UNIT_THEME[idx % UNIT_THEME.length];
                                const prevDone = idx > 0 && units[idx - 1]?.status === "done";
                                const offset = idx % 2 === 0 ? "sm:-translate-x-8" : "sm:translate-x-8";

                                return (
                                    <React.Fragment key={u.id}>
                                        {idx > 0 && <PathConnector done={prevDone} />}
                                        <div className={`transition-transform ${offset}`}>
                                            <UnitCard
                                                unit={u}
                                                theme={theme}
                                                onClick={() => router.visit(`/lesson/${u.id}`)}
                                            />
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Finish flag after all units */}
                        {units.length > 0 && (
                            <>
                                <PathConnector done={units[units.length - 1]?.status === "done"} />
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-xl border-4 border-white">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <p className="text-xs font-black text-white/90 mt-2 drop-shadow">Course Complete!</p>
                            </>
                        )}
                    </div>

                    {/* Help button */}
                    <button
                        onClick={() => router.visit("/help")}
                        className="fixed bottom-5 right-5 lg:right-[350px] z-30 bg-white/95 backdrop-blur text-purple-600 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg border border-white/80 hover:scale-105 transition-transform flex items-center gap-1.5"
                    >
                        <span className="text-base">❓</span> Help
                    </button>
                </main>

                {/* ── SIDEBAR ── */}
                <aside className={`${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} absolute lg:static right-0 top-0 h-full w-[280px] xl:w-[320px] shrink-0 bg-white border-l border-gray-100 z-40 shadow-2xl lg:shadow-none overflow-y-auto custom-scrollbar flex flex-col gap-3 p-4 transition-transform duration-300 lg:transition-none`}>
                    {/* Close mobile */}
                    <div className="lg:hidden flex justify-end shrink-0">
                        <button onClick={() => setSidebarOpen(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs">✕</button>
                    </div>

                    {/* Mission */}
                    <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                        <h3 className="font-black text-[#1E293B] text-xs flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span> Today's Mission
                        </h3>
                        <div className="flex items-center gap-3 mb-3 bg-white p-2.5 rounded-xl border border-white shadow-sm">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl shrink-0">🚀</div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-[#1E293B] leading-tight truncate">
                                    {activeUnit ? activeUnit.title : "All Done! 🎉"}
                                </p>
                                <p className="text-[9px] text-indigo-500 font-bold mt-0.5">{activeUnit ? "Ready to play" : "Amazing!"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.visit(activeUnit ? `/lesson/${activeUnit.id}` : "/progress")}
                            className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-black text-xs shadow-[0_3px_0_#059669] hover:translate-y-[1px] hover:shadow-[0_1px_0_#059669] transition-all"
                        >
                            {activeUnit ? "START ➔" : "VIEW REWARDS ➔"}
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="shrink-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-2 flex items-center gap-2">
                            <span>📊</span> Progress
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-lg font-black text-[#1E293B]">{completedCount}/{unitsTotal}</span>
                                <p className="text-[8px] text-gray-500 font-black uppercase mt-0.5">Units</p>
                            </div>
                            <div className="flex flex-col items-center bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                                <span className="text-lg font-black text-amber-600">{totalStars}⭐</span>
                                <p className="text-[8px] text-gray-500 font-black uppercase mt-0.5">Stars</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="shrink-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-2 flex items-center gap-2">
                            <span>🗺️</span> Units
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {units.map((u, idx) => {
                                const theme = UNIT_THEME[idx % UNIT_THEME.length];
                                return (
                                    <div
                                        key={u.id}
                                        onClick={u.status !== "locked" ? () => router.visit(`/lesson/${u.id}`) : undefined}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-[10px] ${
                                            u.status === "active" ? "border-blue-200 bg-blue-50 cursor-pointer" :
                                            u.status === "done" ? "border-green-100 bg-green-50/50 cursor-pointer" :
                                            "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                        }`}
                                    >
                                        <span className="text-base">{u.status === "locked" ? "🔒" : theme.emoji}</span>
                                        <span className="font-black text-[#1E293B] flex-1 truncate">{u.title}</span>
                                        {u.status === "done" && <span className="text-xs">✅</span>}
                                        {u.status === "active" && <span className="text-xs">📍</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="shrink-0 mt-auto bg-purple-600 rounded-2xl p-3 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                        <div className="flex items-center gap-2 relative z-10">
                            <span className="text-2xl">🦊</span>
                            <div>
                                <p className="font-black text-white text-[10px]">Tip:</p>
                                <p className="text-[9px] text-purple-100 font-bold">Complete all units to unlock the trophy!</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }

                @keyframes drift {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(30px); }
                    100% { transform: translateX(0); }
                }
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>

            {/* Quiz result overlay */}
            {showQuizResult && quizResult && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setShowQuizResult(false)}>
                    <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <span className="text-5xl block mb-3">{quizResult.passed ? '🎉' : '💪'}</span>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">
                            {quizResult.passed ? 'Unit Complete!' : 'Almost There!'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {quizResult.passed 
                              ? `You scored ${quizResult.percent}% and earned ${quizResult.stars} stars!`
                              : `You scored ${quizResult.percent}%. Need 70% to pass. Try again!`
                            }
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`text-3xl ${s <= (quizResult.stars || 0) ? '' : 'opacity-20 grayscale'}`}>⭐</span>
                            ))}
                        </div>
                        <button onClick={() => setShowQuizResult(false)} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg">
                            {quizResult.passed ? 'Continue! →' : 'Try Again →'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
