import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ══════════════════════════════════════════════════════════
   ألوان اللوحات (Pills)
══════════════════════════════════════════════════════════ */
const PILL_COLORS = {
    "bg-[#7C3AED]": "bg-[#7C3AED]",
    "bg-[#2563EB]": "bg-[#2563EB]",
    "bg-[#DB2777]": "bg-[#DB2777]",
    "bg-[#D97706]": "bg-[#D97706]",
    "bg-[#16A34A]": "bg-[#16A34A]",
};

/* ══════════════════════════════════════════════════════════
   VISUAL CONFIG
══════════════════════════════════════════════════════════ */
const VISUAL_CONFIG = {
    1: {
        imagePath: "/assets/lessons/welcome/hut.png",
        color: "bg-[#7C3AED]",
        pos: { left: "20.5%", top: "37%" },
        customSize: "w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52",
    },
    2: {
        imagePath: "/assets/lessons/family/treehouse.png",
        color: "bg-[#2563EB]",
        pos: { left: "51.2%", top: "33%" },
        customSize: "w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52",
    },
    3: {
        imagePath: "/assets/lessons/schoolbag/bag.png",
        color: "bg-[#DB2777]",
        pos: { left: "72%", top: "65%" },
        customSize: "w-24 h-24 sm:w-32 sm:h-32",
    },
    4: {
        imagePath: "/assets/lessons/classroom/desk.png",
        color: "bg-[#D97706]",
        pos: { left: "18%", top: "63%" },
        customSize: "w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44",
    },
    5: {
        imagePath: "/assets/lessons/toy/toy.png",
        color: "bg-[#16A34A]",
        pos: { left: "45%", top: "69%" },
        customSize: "w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40",
    },
};

/* ══════════════════════════════════════════════════════════
   UnitNode
══════════════════════════════════════════════════════════ */
const UnitNode = ({ unit, onClick }) => {
    const isDone = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const visual = VISUAL_CONFIG[unit.id] || VISUAL_CONFIG[1];
    const subLessonsArray = Array.from({ length: unit.lessons_count || 1 }).map(
        (_, i) => i < (unit.current_lesson || 1) - 1,
    );

    return (
        <div
            className={`flex flex-col items-center gap-2 select-none transition-transform duration-300 ${isLocked ? "cursor-default" : "cursor-pointer group"}`}
            style={{
                filter: isLocked ? "grayscale(80%) opacity(0.7)" : "none",
            }}
            onClick={!isLocked ? onClick : undefined}
        >
            <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 pb-2 flex flex-col items-center gap-1.5 w-max pointer-events-none z-30 transition-transform group-hover:-translate-y-2">
                {isActive && (
                    <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg rotate-2 animate-bounce whitespace-nowrap border-2 border-white pointer-events-auto">
                        Current Adventure!
                    </div>
                )}
                <div
                    className={`${visual.color} text-white px-5 py-1.5 rounded-full font-black text-[12px] shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-auto border-2 border-white/40 backdrop-blur-md`}
                >
                    <span className="bg-white/30 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-inner">
                        {unit.number}
                    </span>
                    {unit.title}
                </div>
            </div>

            <div
                className={`${visual.customSize} flex items-center justify-center relative transition-transform duration-500 ${isActive ? "scale-110 drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]" : "drop-shadow-xl group-hover:scale-105"}`}
            >
                <img
                    src={visual.imagePath}
                    alt={unit.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-black/50 backdrop-blur-md rounded-full w-14 h-14 flex items-center justify-center shadow-2xl border-2 border-white/20">
                            <span className="text-3xl drop-shadow-md">🔒</span>
                        </div>
                    </div>
                )}
                {isActive && (
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-40 pointer-events-none" />
                )}
            </div>

            <div className="absolute top-[90%] left-1/2 -translate-x-1/2 pt-2 flex flex-col items-center gap-2 w-max pointer-events-none z-20">
                {isDone && (() => {
                    // Compact star pill: cap at 3 actual stars; show
                    // "⭐ ×N" when the kid has earned more so the
                    // pill never overflows the unit card or covers
                    // adjacent map nodes (was a real problem with
                    // 15-star units).
                    const total = Math.max(0, Number(unit.stars_earned ?? unit.stars) || 0);
                    if (total === 0) return null;
                    if (total <= 3) {
                        return (
                            <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm shadow-lg border border-gray-100 flex gap-0.5">
                                {Array.from({ length: total }).map((_, i) => (
                                    <span key={i} className="drop-shadow-sm">⭐</span>
                                ))}
                            </div>
                        );
                    }
                    return (
                        <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-gray-100 flex items-center gap-1">
                            <span className="text-sm drop-shadow-sm">⭐</span>
                            <span className="text-[11px] font-black text-amber-600 leading-none">×{total}</span>
                        </div>
                    );
                })()}

                {isActive && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1.5 bg-white/90 p-1.5 rounded-full shadow-lg border border-gray-100 pointer-events-auto backdrop-blur-md">
                            {subLessonsArray.map((done, i) => (
                                <div
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border transition-all shadow-inner
                                    ${done ? "bg-[#16A34A] text-white border-green-400" : "bg-gray-100 text-gray-400 border-gray-200"}`}
                                >
                                    {unit.number}.{i + 1}
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/95 text-[10px] font-black text-[#1E293B] px-4 py-1.5 rounded-full shadow-lg text-center border border-gray-100 pointer-events-auto">
                            Lesson {unit.id}.{unit.current_lesson || 1}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   ArenaNode — mixed-review pin floating above the map
   ══════════════════════════════════════════════════════════ */
const ArenaNode = ({ unlocked }) => (
    <div
        className={`flex flex-col items-center gap-2 select-none transition-transform duration-300 ${
            unlocked ? "cursor-pointer group" : "cursor-default"
        }`}
        style={{ filter: unlocked ? "none" : "grayscale(60%) opacity(0.65)" }}
        onClick={unlocked ? () => router.visit("/arena") : undefined}
    >
        {/* Top label */}
        <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 pb-2 flex flex-col items-center gap-1.5 w-max pointer-events-none z-30 transition-transform group-hover:-translate-y-2">
            {unlocked && (
                <div className="bg-gradient-to-r from-fuchsia-500 to-amber-400 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg -rotate-2 animate-bounce whitespace-nowrap border-2 border-white pointer-events-auto">
                    Mixed Practice!
                </div>
            )}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-1.5 rounded-full font-black text-[12px] shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-auto border-2 border-white/40 backdrop-blur-md">
                <span className="text-base leading-none">🏆</span>
                Games Arena
            </div>
        </div>

        {/* The pin itself */}
        <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 flex items-center justify-center relative drop-shadow-xl group-hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-300 via-pink-300 to-amber-200 rounded-[2rem] rotate-3 shadow-2xl border-4 border-white/70" />
            <div className="absolute inset-2 bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 rounded-[1.6rem] -rotate-2 flex items-center justify-center shadow-inner">
                <span className="text-5xl sm:text-6xl drop-shadow-lg">🎮</span>
            </div>
            {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-black/55 backdrop-blur-md rounded-full w-14 h-14 flex items-center justify-center shadow-2xl border-2 border-white/20">
                        <span className="text-3xl">🔒</span>
                    </div>
                </div>
            )}
            {unlocked && (
                <div className="absolute inset-0 rounded-[2rem] bg-white/20 animate-ping opacity-30 pointer-events-none" />
            )}
        </div>

        {/* Bottom hint pill */}
        <div className="absolute top-[90%] left-1/2 -translate-x-1/2 pt-2 flex flex-col items-center gap-2 w-max pointer-events-none z-20">
            <div className="bg-white/95 backdrop-blur px-4 py-1.5 rounded-full shadow-lg border border-gray-100 text-[10px] font-black text-purple-600">
                {unlocked ? "All units · all words" : "Finish a lesson to unlock"}
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════
   MapScreen
══════════════════════════════════════════════════════════ */
const MapScreen = ({ user, units: propUnits, arena }) => {
    const [soundOn, setSoundOn] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showQuizResult, setShowQuizResult] = useState(false);

    const { flash } = usePage().props;
    const quizResult = flash?.quizResult;

    const units = propUnits || [];
    const completedCount = units.filter((u) => u.status === "done").length;
    const activeUnit = units.find((u) => u.status === "active");

    // Show quiz completion celebration
    useEffect(() => {
        if (quizResult?.passed) {
            setShowQuizResult(true);
            // Import dynamically to avoid issues
            import("@/learning/utils/confetti").then(({ launchConfetti }) => launchConfetti(4000));
            import("@/learning/utils/soundEffects").then(({ playCheer }) => playCheer());
        }
    }, [quizResult]);

    // FIX 11: compute total stars either from the backend (user.total_stars)
    // or by summing per-unit earned stars on the frontend as a fallback.
    const totalStars =
        typeof user?.total_stars === "number"
            ? user.total_stars
            : units.reduce((sum, u) => sum + (u.stars_earned || u.stars || 0), 0);

    const unitsTotal = units.length || 3;

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
        // الهيكلة الأساسية: الطول 100vh وممنوع السكرول الخارجي
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#B8E4FF] font-sans">
            {/* ── HEADER (ثابت لا يتأثر بالسكرول) ── */}
            <header className="h-[72px] shrink-0 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm flex items-center z-50">
                <div className="w-full px-4 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit("/")}
                            className="hover:scale-105 transition-transform shrink-0"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-9 lg:h-10 object-contain drop-shadow-sm"
                            />
                        </button>
                        <div className="hidden lg:block w-px h-8 bg-gray-200" />
                        <div className="hidden lg:flex items-center gap-2 bg-[#F0F4FF] px-4 py-2 rounded-full border border-[#E0E7FF]">
                            <span className="text-xl leading-none">🗺️</span>
                            <span className="font-black text-[#4338CA] text-xs tracking-wide">
                                Adventure Map
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full shadow-inner">
                            <span className="font-black text-[#7C3AED] text-xs uppercase tracking-widest">
                                Lv.{user?.level || 1}
                            </span>
                            <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-1000"
                                    style={{ width: `${xpPct}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-gray-500 font-bold">
                                {xp}/{maxXp}
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full shadow-sm max-w-[160px]">
                            <span className="text-lg leading-none drop-shadow-sm shrink-0">
                                ⭐
                            </span>
                            <span className="font-black text-amber-600 text-sm leading-none truncate">
                                {totalStars}
                            </span>
                        </div>

                        <button
                            onClick={() => router.visit("/progress")}
                            className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 pr-4 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white shadow-sm shrink-0">
                                👦🏻
                            </div>
                            <span className="font-black text-[#1E293B] text-[11px] hidden sm:block">
                                {user?.name || "Student"}
                            </span>
                        </button>

                        <button
                            onClick={() => setSoundOn((s) => !s)}
                            className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm hover:bg-gray-50 transition-all"
                        >
                            {soundOn ? "🔊" : "🔇"}
                        </button>

                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="lg:hidden w-11 h-11 rounded-xl bg-[#1E293B] text-white flex items-center justify-center shadow-sm active:scale-95"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </header>

            {/* ── MAIN BODY (الحاوية المرنة) ── */}
            <div className="flex-1 flex min-h-0 relative">
                {/* ── MAP AREA ── */}
                <main className="flex-1 relative overflow-auto hide-scrollbar bg-[#90D4F5] flex items-center justify-center">
                    <div className="relative w-full h-full min-w-[1200px] min-h-[700px] lg:min-w-0 lg:min-h-[600px] xl:min-h-[720px] 2xl:min-h-[820px] lg:aspect-[16/9] lg:h-auto max-w-[1800px] 2xl:max-w-[2200px] mx-auto">
                        <img
                            src="/assets/ui/map/map-bg.png"
                            alt="Map Environment"
                            className="absolute inset-0 w-full h-full object-cover lg:object-contain drop-shadow-sm"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-blue-900/10 pointer-events-none z-[1]" />

                        <div className="absolute inset-0 z-10">
                            {units.map((u) => {
                                const pos = VISUAL_CONFIG[u.id]?.pos || {
                                    left: "50%",
                                    top: "50%",
                                };
                                return (
                                    <div
                                        key={u.id}
                                        className="absolute -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: pos.left, top: pos.top }}
                                    >
                                        <UnitNode
                                            unit={u}
                                            onClick={
                                                u.status === "locked"
                                                    ? () => {}
                                                    : () =>
                                                          router.visit(
                                                              `/lesson/${u.id}`,
                                                          )
                                            }
                                        />
                                    </div>
                                );
                            })}

                            {/* Games Arena pin — sits in the top-right of the
                                map between U1 and U2 so it never overlaps a
                                unit node. Hidden when nothing is unlocked
                                yet, but the prop is still passed so the
                                Inertia hydration is stable. */}
                            {arena ? (
                                <div
                                    className="absolute -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: "87%", top: "12%" }}
                                >
                                    <ArenaNode unlocked={!!arena.unlocked} />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <button
                        onClick={() => router.visit("/contact")}
                        className="fixed bottom-6 right-6 lg:right-[340px] z-30 bg-white/95 backdrop-blur text-[#7C3AED] font-black text-sm px-6 py-3.5 rounded-2xl shadow-2xl border border-white hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <span className="text-lg">❓</span> Need Help?
                    </button>
                </main>

                {/* ── SIDEBAR (إصلاح جذري لهيكلية السايد بار) ── */}
                {/* تم التأكد من إعطائه h-full و overflow-y-auto ليعمل بشكل مستقل وبدون أي قص للبيانات */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} absolute lg:static right-0 top-0 h-full w-[300px] xl:w-[340px] 2xl:w-[380px] shrink-0 bg-[#F8FAFC] lg:bg-white border-l border-gray-200 z-40 shadow-2xl lg:shadow-[-10px_0_30px_rgba(0,0,0,0.05)] overflow-y-auto custom-scrollbar flex flex-col gap-4 p-5 transition-transform duration-300 lg:transition-none`}
                >
                    {/* زر إغلاق للموبايل */}
                    <div className="lg:hidden flex justify-end shrink-0">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-black"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Mission Card - تصميم بلوك متماسك يمنع القص */}
                    <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[1.25rem] p-4 border border-indigo-100 shadow-sm">
                        <h3 className="font-black text-[#1E293B] text-[13px] flex items-center gap-2 mb-3">
                            <span className="text-xl">🎯</span> Today's Mission
                        </h3>
                        <div className="flex items-center gap-3 mb-4 bg-white p-3 rounded-xl border border-white shadow-sm">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl shrink-0 shadow-inner">
                                🚀
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                                <p className="text-[13px] font-black text-[#1E293B] leading-tight break-words">
                                    {activeUnit
                                        ? activeUnit.title
                                        : "All Units Done! 🎉"}
                                </p>
                                <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase tracking-widest">
                                    {activeUnit
                                        ? "Ready to play"
                                        : "Amazing Job!"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() =>
                                router.visit(
                                    activeUnit
                                        ? `/lesson/${activeUnit.id}`
                                        : "/progress",
                                )
                            }
                            className="w-full bg-[#10B981] text-white py-3 rounded-xl font-black text-[13px] shadow-[0_4px_0_#059669] hover:shadow-[0_2px_0_#059669] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                        >
                            {activeUnit
                                ? "START ADVENTURE ➔"
                                : "VIEW REWARDS ➔"}
                        </button>
                    </div>

                    {/* Progress Stats */}
                    <div className="shrink-0 bg-white rounded-[1.25rem] p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-[13px] mb-3 flex items-center gap-2">
                            <span>📊</span> My Progress
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 border border-slate-100">
                                    <span className="text-base font-black text-[#1E293B]">
                                        {completedCount}/{unitsTotal}
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest text-center">
                                    Units Done
                                </p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 border border-amber-100 text-xl font-black text-amber-600">
                                    {totalStars > 0 ? totalStars : "⭐"}
                                </div>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest text-center break-words whitespace-normal leading-tight max-w-full">
                                    Total Stars
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Map Index */}
                    <div className="shrink-0 bg-white rounded-[1.25rem] p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-[13px] mb-3 flex items-center gap-2">
                            <span>🗺️</span> Map Index
                        </h3>
                        <div className="flex flex-col gap-2">
                            {units.map((u) => {
                                const visual =
                                    VISUAL_CONFIG[u.id] || VISUAL_CONFIG[1];
                                return (
                                    <div
                                        key={u.id}
                                        onClick={
                                            u.status !== "locked"
                                                ? () =>
                                                      router.visit(
                                                          `/lesson/${u.id}`,
                                                      )
                                                : undefined
                                        }
                                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors
                                         ${
                                             u.status === "active"
                                                 ? "border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100"
                                                 : u.status === "done"
                                                   ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                                                   : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                         }`}
                                    >
                                        <div
                                            className={`${visual.color} w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm`}
                                        >
                                            {u.number}
                                        </div>
                                        <p className="text-[11px] font-black text-[#1E293B] flex-1 truncate">
                                            {u.title}
                                        </p>
                                        <span className="text-sm bg-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                                            {u.status === "done"
                                                ? "✅"
                                                : u.status === "active"
                                                  ? "📍"
                                                  : "🔒"}
                                        </span>
                                    </div>
                                );
                            })}

                            {/* Games Arena entry — sits at the bottom of
                                the Map Index so the kid recognises it as
                                a separate "always-on" practice mode. */}
                            {arena ? (
                                <div
                                    onClick={
                                        arena.unlocked
                                            ? () => router.visit("/arena")
                                            : undefined
                                    }
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors mt-1 ${
                                        arena.unlocked
                                            ? "border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-amber-50 cursor-pointer hover:from-fuchsia-100"
                                            : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                    }`}
                                >
                                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm">
                                        🏆
                                    </div>
                                    <p className="text-[11px] font-black text-[#1E293B] flex-1 truncate">
                                        Games Arena
                                    </p>
                                    <span className="text-sm bg-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                                        {arena.unlocked ? "🎮" : "🔒"}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Mascot Tip */}
                    <div className="shrink-0 mt-auto bg-[#7C3AED] rounded-[1.25rem] p-4 relative overflow-hidden shadow-lg border border-[#6D28D9]">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex items-center gap-3 relative z-10">
                            <img
                                src="/assets/ui/mascot/fox-hint.png"
                                alt="Fox Tip"
                                className="w-12 h-12 object-contain drop-shadow-md"
                                onError={(e) =>
                                    (e.target.style.display = "none")
                                }
                            />
                            <div>
                                <p className="font-black text-white text-[11px] mb-0.5">
                                    Parent's Tip:
                                </p>
                                <p className="text-[10px] text-purple-100 font-bold leading-tight">
                                    Check the dashboard to view certificates!
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <style>{`
                /* إخفاء السكرول بار للخريطة */
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                /* سكرول بار أنيق للسايد بار */
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94A3B8; }

                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>

            {/* Quiz completion celebration overlay */}
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
                        <button
                            onClick={() => setShowQuizResult(false)}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg"
                        >
                            {quizResult.passed ? 'Continue Adventure! →' : 'Try Again →'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
