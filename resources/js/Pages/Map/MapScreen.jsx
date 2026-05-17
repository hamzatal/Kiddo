import React, { useState, useEffect, useMemo } from "react";
import { router, usePage } from "@inertiajs/react";

/* ════════════════════════════════════════════════════════════════════
   VISUAL CONFIG — colours, icons, mascot per unit. Designed so the
   palette stays kid-friendly and distinct across all 6 units (and
   gracefully repeats if more units are added).
═══════════════════════════════════════════════════════════════════ */
const UNIT_THEME = [
    { emoji: "👋", color: "#7C3AED", gradient: "from-purple-400 to-violet-600", soft: "from-purple-50 to-purple-100" },
    { emoji: "👨‍👩‍👧", color: "#2563EB", gradient: "from-blue-400 to-indigo-600", soft: "from-blue-50 to-indigo-100" },
    { emoji: "🎒", color: "#DB2777", gradient: "from-pink-400 to-rose-600", soft: "from-pink-50 to-rose-100" },
    { emoji: "🏫", color: "#D97706", gradient: "from-amber-400 to-orange-600", soft: "from-amber-50 to-orange-100" },
    { emoji: "🧸", color: "#16A34A", gradient: "from-emerald-400 to-green-600", soft: "from-emerald-50 to-green-100" },
    { emoji: "🎓", color: "#0891B2", gradient: "from-cyan-400 to-teal-600", soft: "from-cyan-50 to-teal-100" },
];

/* ════════════════════════════════════════════════════════════════════
   StarRow — compact, capped at 3, never overflows the card. Renders
   as an inline pill so it sits naturally inside the title row.
═══════════════════════════════════════════════════════════════════ */
const StarRow = ({ count = 0, max = 3 }) => {
    const earned = Math.max(0, Math.min(count | 0, max));
    if (earned === 0) return null;
    return (
        <span className="inline-flex items-center gap-[1px] text-[10px] leading-none">
            {Array.from({ length: earned }).map((_, i) => (
                <span key={i} className="drop-shadow-sm select-none">⭐</span>
            ))}
        </span>
    );
};

/* ════════════════════════════════════════════════════════════════════
   UnitCard — a single node on the path. Stars now live INSIDE the
   title pill so they can never spill out and obscure the map.
═══════════════════════════════════════════════════════════════════ */
const UnitCard = ({ unit, theme, index, onClick }) => {
    const isDone   = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const totalLessons  = unit.lessonsCount  || unit.lessons_count  || 1;
    const currentLesson = unit.currentLesson || unit.current_lesson || 1;
    const starsEarned   = Math.max(0, Math.min(unit.stars_earned ?? unit.stars ?? 0, 3));

    return (
        <button
            type="button"
            onClick={!isLocked ? onClick : undefined}
            disabled={isLocked}
            className={`group relative flex flex-col items-center gap-2 transition-transform duration-300 outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 rounded-3xl
                ${isLocked
                    ? "cursor-not-allowed opacity-60 grayscale"
                    : "cursor-pointer hover:scale-105 active:scale-100"
                }
                ${isActive ? "scale-105" : ""}
            `}
        >
            {/* Active badge */}
            {isActive && (
                <span className="absolute -top-3 z-20 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-[9px] font-black px-3 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-white animate-bounce">
                    Playing Now!
                </span>
            )}

            {/* Main circle with mascot/emoji */}
            <div
                className={`relative w-[72px] h-[72px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-xl border-4 border-white/90
                    ${isActive ? "ring-4 ring-amber-300/70" : ""}
                `}
            >
                <span className="text-3xl sm:text-4xl drop-shadow-md select-none">
                    {isLocked ? "🔒" : theme.emoji}
                </span>

                {/* Done checkmark */}
                {isDone && (
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-white text-[11px] sm:text-xs font-black">✓</span>
                    </span>
                )}

                {/* Index number badge */}
                <span className="absolute -top-1 -left-1 w-6 h-6 sm:w-7 sm:h-7 bg-white text-gray-700 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-md border border-gray-100">
                    {unit.number ?? index}
                </span>
            </div>

            {/* Title pill — now contains the stars inline so they
                never overflow the card */}
            <div className="px-2.5 py-1 bg-white/95 backdrop-blur rounded-full shadow-md border border-gray-100 max-w-[140px] sm:max-w-[160px]">
                <p className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black text-gray-800 truncate">
                    <span className="truncate">{unit.title}</span>
                    {isDone && starsEarned > 0 ? <StarRow count={starsEarned} /> : null}
                </p>
            </div>

            {/* Lesson progress dots — only shown for the active card */}
            {isActive && totalLessons > 1 && (
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalLessons, 8) }).map((_, i) => (
                        <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all
                                ${i < currentLesson - 1
                                    ? "bg-green-500"
                                    : i === currentLesson - 1
                                      ? "bg-amber-400 ring-2 ring-amber-200"
                                      : "bg-white/70"}
                            `}
                        />
                    ))}
                </div>
            )}
        </button>
    );
};

/* ════════════════════════════════════════════════════════════════════
   PathConnector — short vertical bar between two adjacent unit cards.
   Green when the previous unit is finished, soft-white otherwise.
═══════════════════════════════════════════════════════════════════ */
const PathConnector = ({ done }) => (
    <div className="flex items-center justify-center py-1">
        <span className={`w-1 h-7 sm:h-9 rounded-full ${done ? "bg-green-400/90" : "bg-white/60"}`} />
    </div>
);

/* ════════════════════════════════════════════════════════════════════
   Sky background variants. The user can flip between them on the fly
   so they have at least two distinct looks for the same map.
═══════════════════════════════════════════════════════════════════ */
const BACKGROUNDS = [
    {
        id: "meadow",
        label: "Meadow",
        emoji: "🌿",
        // Bright sky → meadow, no external image needed
        sky: "bg-gradient-to-b from-[#74C7FF] via-[#B4E4FF] to-[#A8E29C]",
        accents: "meadow",
    },
    {
        id: "sunset",
        label: "Sunset",
        emoji: "🌅",
        sky: "bg-gradient-to-b from-[#FFB199] via-[#FF7E5F] to-[#FFD194]",
        accents: "sunset",
    },
    {
        id: "ocean",
        label: "Ocean",
        emoji: "🌊",
        sky: "bg-gradient-to-b from-[#0093E9] via-[#80D0C7] to-[#B5FFFC]",
        accents: "ocean",
    },
    {
        id: "image",
        label: "Storybook",
        emoji: "📖",
        // Real PNG asset — falls back to the meadow if the file is missing
        image: "/assets/ui/map/map-bg.png",
        sky: "bg-gradient-to-b from-[#87CEEB] via-[#B4E4FF] to-[#A8E29C]",
        accents: "meadow",
    },
];

const MapScreen = ({ user, units: propUnits }) => {
    const [soundOn, setSoundOn] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showQuizResult, setShowQuizResult] = useState(false);
    const [bgIdx, setBgIdx] = useState(() => {
        if (typeof window === "undefined") return 0;
        const saved = parseInt(window.localStorage?.getItem("kiddo.mapBg") ?? "0", 10);
        return Number.isFinite(saved) && saved >= 0 && saved < BACKGROUNDS.length ? saved : 0;
    });
    const bg = BACKGROUNDS[bgIdx];

    const cycleBackground = () => {
        const next = (bgIdx + 1) % BACKGROUNDS.length;
        setBgIdx(next);
        try { window.localStorage?.setItem("kiddo.mapBg", String(next)); } catch (_) {}
    };

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

    const totalStars = useMemo(() => {
        if (typeof user?.total_stars === "number") return user.total_stars;
        return units.reduce((sum, u) => sum + (u.stars_earned ?? u.stars ?? 0), 0);
    }, [user?.total_stars, units]);

    const unitsTotal = units.length || 5;
    const xp = user?.xp || 0;
    const maxXp = 600;
    const xpPct = Math.min((xp / maxXp) * 100, 100);
    const completionPct = unitsTotal > 0 ? Math.round((completedCount / unitsTotal) * 100) : 0;

    useEffect(() => {
        const onResize = () => setSidebarOpen(window.innerWidth >= 1024);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden font-sans">
            {/* ═══════════════ HEADER ═══════════════ */}
            <header className="h-16 sm:h-[72px] shrink-0 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm flex items-center z-50">
                <div className="w-full px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => router.visit("/")}
                            className="hover:scale-105 transition-transform shrink-0"
                            aria-label="Home"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-8 lg:h-10 object-contain drop-shadow-sm"
                                onError={(e) => { e.target.style.display = "none"; }}
                            />
                        </button>
                        <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-1.5 rounded-full border border-indigo-100">
                            <span className="text-lg">🗺️</span>
                            <span className="font-black text-indigo-700 text-xs">Adventure Map</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                        {/* XP bar (md+) */}
                        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                            <span className="font-black text-purple-600 text-[10px]">Lv.{user?.level || 1}</span>
                            <div className="w-20 lg:w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-1000"
                                    style={{ width: `${xpPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Stars total */}
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 sm:px-3 py-1.5 rounded-full">
                            <span className="text-base">⭐</span>
                            <span className="font-black text-amber-600 text-sm">{totalStars}</span>
                        </div>

                        {/* Background switcher */}
                        <button
                            onClick={cycleBackground}
                            className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1.5 rounded-full text-[11px] font-black text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                            title="Change map theme"
                            aria-label={`Background: ${bg.label}`}
                        >
                            <span className="text-base">{bg.emoji}</span>
                            <span>{bg.label}</span>
                        </button>

                        {/* Profile */}
                        <button
                            onClick={() => router.visit("/progress")}
                            className="flex items-center gap-2 bg-white border border-gray-200 p-1 pr-2 sm:pr-3 rounded-full shadow-sm hover:bg-gray-50"
                        >
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm border-2 border-white shadow-sm">👦🏻</div>
                            <span className="font-black text-[#1E293B] text-[10px] hidden sm:block max-w-[80px] truncate">
                                {user?.name || "Student"}
                            </span>
                        </button>

                        {/* Sound */}
                        <button
                            onClick={() => setSoundOn((s) => !s)}
                            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-base shadow-sm hover:bg-gray-50"
                            aria-label={soundOn ? "Mute" : "Unmute"}
                        >
                            {soundOn ? "🔊" : "🔇"}
                        </button>

                        {/* Mobile menu */}
                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="lg:hidden w-9 h-9 rounded-xl bg-[#1E293B] text-white flex items-center justify-center text-sm shadow-sm active:scale-95"
                            aria-label="Toggle menu"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════════════ MAIN BODY ═══════════════ */}
            <div className="flex-1 flex min-h-0 relative">
                {/* ─── MAP AREA ─── */}
                <main className="flex-1 relative overflow-auto hide-scrollbar">
                    {/* Sky gradient layer */}
                    <div className={`absolute inset-0 ${bg.sky} pointer-events-none`} />

                    {/* Optional storybook PNG layer (over the gradient) */}
                    {bg.image && (
                        <img
                            src={bg.image}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none mix-blend-soft-light"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                    )}

                    {/* Floating clouds (always shown) */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-[6%]  left-[8%]  w-32 h-12 bg-white/55 rounded-full blur-md  animate-[drift_22s_linear_infinite]" />
                        <div className="absolute top-[14%] right-[14%] w-40 h-14 bg-white/45 rounded-full blur-lg animate-[driftR_28s_linear_infinite]" />
                        <div className="absolute top-[4%]  left-[58%] w-28 h-10 bg-white/50 rounded-full blur-md  animate-[drift_20s_linear_infinite]" />
                        <div className="absolute top-[28%] left-[28%] w-24 h-9  bg-white/40 rounded-full blur-md  animate-[driftR_26s_linear_infinite]" />
                    </div>

                    {/* Theme accents — meadow hills, sunset sun, ocean waves */}
                    {bg.accents === "meadow" && (
                        <div className="absolute bottom-0 left-0 right-0 h-[28%] pointer-events-none">
                            <div className="absolute bottom-0 left-[-5%]  w-[60%] h-full       bg-[#7BC67E] rounded-t-[50%] opacity-70" />
                            <div className="absolute bottom-0 right-[-5%] w-[55%] h-[80%]      bg-[#5DB761] rounded-t-[50%] opacity-60" />
                            <div className="absolute bottom-0 left-[20%]  w-[40%] h-[55%]      bg-[#4FA757] rounded-t-[50%] opacity-50" />
                        </div>
                    )}
                    {bg.accents === "sunset" && (
                        <>
                            <div className="absolute top-[18%] right-[12%] w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-yellow-200/80 blur-2xl pointer-events-none" />
                            <div className="absolute top-[22%] right-[18%] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-300 shadow-[0_0_60px_rgba(255,221,89,0.6)] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 h-[24%] bg-gradient-to-t from-[#5B2A86] to-transparent pointer-events-none" />
                        </>
                    )}
                    {bg.accents === "ocean" && (
                        <div className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none">
                            <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-[#0077B6] to-transparent opacity-60" />
                            <div className="absolute bottom-[12%] left-[-10%] w-[40%] h-12 bg-white/60 rounded-full blur-md animate-[drift_18s_linear_infinite]" />
                            <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-10 bg-white/50 rounded-full blur-md animate-[driftR_22s_linear_infinite]" />
                        </div>
                    )}

                    {/* Path with unit nodes */}
                    <div className="relative z-10 flex flex-col items-center py-6 sm:py-10 px-4 min-h-full">
                        <h2 className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-white/70 shadow-md text-gray-800 font-black text-sm sm:text-base mb-5 sm:mb-7 flex items-center gap-2">
                            <span className="text-lg">🌍</span>
                            Your Learning Journey
                            <span className="text-[10px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">
                                {completedCount}/{unitsTotal}
                            </span>
                        </h2>

                        {/* Winding path — units zigzag left/right on tablet+ */}
                        <div className="flex flex-col items-center w-full max-w-sm">
                            {units.map((u, idx) => {
                                const theme = UNIT_THEME[idx % UNIT_THEME.length];
                                const prevDone = idx > 0 && units[idx - 1]?.status === "done";
                                const offset = idx % 2 === 0
                                    ? "sm:-translate-x-10 lg:-translate-x-14"
                                    : "sm:translate-x-10 lg:translate-x-14";
                                return (
                                    <React.Fragment key={u.id}>
                                        {idx > 0 && <PathConnector done={prevDone} />}
                                        <div className={`transition-transform ${offset}`}>
                                            <UnitCard
                                                unit={u}
                                                index={idx}
                                                theme={theme}
                                                onClick={() => router.visit(`/lesson/${u.id}`)}
                                            />
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* Trophy at the end */}
                        {units.length > 0 && (
                            <>
                                <PathConnector done={units[units.length - 1]?.status === "done"} />
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl border-4 border-white ${
                                    completedCount === unitsTotal
                                        ? "bg-gradient-to-br from-yellow-300 to-amber-500 animate-pulse"
                                        : "bg-gradient-to-br from-gray-200 to-gray-300 grayscale opacity-80"
                                }`}>
                                    <span className="text-3xl sm:text-4xl">🏆</span>
                                </div>
                                <p className="text-[10px] sm:text-xs font-black text-gray-700 bg-white/80 backdrop-blur px-3 py-1 rounded-full mt-2 shadow-sm border border-white/60">
                                    {completedCount === unitsTotal ? "Course Complete! 🎉" : `Finish all ${unitsTotal} units!`}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Floating help button */}
                    <button
                        onClick={() => router.visit("/help")}
                        className="fixed bottom-5 right-5 lg:right-[340px] z-30 bg-white/95 backdrop-blur text-purple-600 font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg border border-white/80 hover:scale-105 transition-transform flex items-center gap-1.5"
                    >
                        <span className="text-base">❓</span> Help
                    </button>
                </main>

                {/* ─── SIDEBAR ─── */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"} absolute lg:static right-0 top-0 h-full w-[280px] xl:w-[320px] shrink-0 bg-white border-l border-gray-100 z-40 shadow-2xl lg:shadow-none overflow-y-auto custom-scrollbar flex flex-col gap-3 p-4 transition-transform duration-300 lg:transition-none`}
                >
                    <div className="lg:hidden flex justify-end shrink-0">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs"
                            aria-label="Close menu"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Mission */}
                    <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                        <h3 className="font-black text-[#1E293B] text-xs flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span> Today's Mission
                        </h3>
                        <div className="flex items-center gap-3 mb-3 bg-white p-2.5 rounded-xl border border-white shadow-sm">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                                {activeUnit ? "🚀" : "🏆"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-[#1E293B] leading-tight truncate">
                                    {activeUnit ? activeUnit.title : "All Done!"}
                                </p>
                                <p className="text-[9px] text-indigo-500 font-bold mt-0.5">
                                    {activeUnit ? "Ready to play" : "Amazing work!"}
                                </p>
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
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-base font-black text-[#1E293B]">{completedCount}/{unitsTotal}</span>
                                <p className="text-[8px] text-gray-500 font-black uppercase mt-0.5">Units</p>
                            </div>
                            <div className="flex flex-col items-center bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                                <span className="text-base font-black text-amber-600 leading-none">{totalStars} ⭐</span>
                                <p className="text-[8px] text-gray-500 font-black uppercase mt-1">Stars</p>
                            </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-700"
                                style={{ width: `${completionPct}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-center text-gray-400 font-bold mt-1">
                            {completionPct}% complete
                        </p>
                    </div>

                    {/* Background switcher (mobile-friendly) */}
                    <div className="shrink-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-2 flex items-center gap-2">
                            <span>🎨</span> Map Theme
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {BACKGROUNDS.map((b, i) => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        setBgIdx(i);
                                        try { window.localStorage?.setItem("kiddo.mapBg", String(i)); } catch (_) {}
                                    }}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-[10px] font-black transition-all ${
                                        bgIdx === i
                                            ? "border-purple-400 bg-purple-50 text-purple-700"
                                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-purple-200"
                                    }`}
                                >
                                    <span className="text-xl">{b.emoji}</span>
                                    <span>{b.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Units list */}
                    <div className="shrink-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-2 flex items-center gap-2">
                            <span>🗺️</span> Units
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {units.map((u, idx) => {
                                const theme = UNIT_THEME[idx % UNIT_THEME.length];
                                const stars = Math.max(0, Math.min(u.stars_earned ?? u.stars ?? 0, 3));
                                return (
                                    <button
                                        key={u.id}
                                        onClick={u.status !== "locked" ? () => router.visit(`/lesson/${u.id}`) : undefined}
                                        disabled={u.status === "locked"}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-colors text-[10px] text-left ${
                                            u.status === "active"
                                                ? "border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100"
                                                : u.status === "done"
                                                  ? "border-green-100 bg-green-50/60 cursor-pointer hover:bg-green-100/70"
                                                  : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                        }`}
                                    >
                                        <span className="text-base">{u.status === "locked" ? "🔒" : theme.emoji}</span>
                                        <span className="font-black text-[#1E293B] flex-1 truncate">{u.title}</span>
                                        {u.status === "done" && stars > 0 ? (
                                            <span className="text-[9px] font-black text-amber-600 whitespace-nowrap">
                                                {stars}⭐
                                            </span>
                                        ) : u.status === "active" ? (
                                            <span className="text-xs">📍</span>
                                        ) : u.status === "done" ? (
                                            <span className="text-xs">✅</span>
                                        ) : null}
                                    </button>
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
                                <p className="text-[9px] text-purple-100 font-bold">
                                    Tap 🔊 on any word to hear it spoken aloud!
                                </p>
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
                    50% { transform: translateX(35px); }
                    100% { transform: translateX(0); }
                }
                @keyframes driftR {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(-35px); }
                    100% { transform: translateX(0); }
                }
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>

            {/* Quiz result overlay */}
            {showQuizResult && quizResult && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowQuizResult(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-5xl block mb-3">{quizResult.passed ? "🎉" : "💪"}</span>
                        <h2 className="text-2xl font-black text-gray-800 mb-2">
                            {quizResult.passed ? "Unit Complete!" : "Almost There!"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {quizResult.passed
                                ? `You scored ${quizResult.percent}% and earned ${quizResult.stars} stars!`
                                : `You scored ${quizResult.percent}%. Need 70% to pass. Try again!`}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {[1, 2, 3].map((s) => (
                                <span
                                    key={s}
                                    className={`text-3xl ${s <= (quizResult.stars || 0) ? "" : "opacity-20 grayscale"}`}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowQuizResult(false)}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg"
                        >
                            {quizResult.passed ? "Continue! →" : "Try Again →"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapScreen;
