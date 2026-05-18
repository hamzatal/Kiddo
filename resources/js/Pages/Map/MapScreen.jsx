import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/**
 * MapScreen — Adventure map (Kiddo v3).
 *
 * Hard layout rules this rewrite enforces:
 *   1. The whole page fits inside one viewport (h:100dvh) — no
 *      horizontal scroll, no vertical scroll on tablet+.
 *   2. The map area is fluid: scales the background image to fit
 *      using percentage-positioned pins. No min-width tricks.
 *   3. Sidebar is responsive across three sizes:
 *        • desktop (≥xl)  —  280 px expanded panel
 *        • tablet (lg-md) —  72 px icon-only rail
 *        • phone (<md)    —  off-canvas drawer triggered by ☰
 *      In every state the map keeps the rest of the room.
 *   4. The "Need Help?" button is bottom-centre of the map area.
 *   5. The Games Arena pin uses `/assets/lessons/toy/toy.png` —
 *      the same image asset used by Unit 5 — so it visually fits
 *      the map style. Placed below-left of "Family & Friends"
 *      so it doesn't collide with any unit node.
 */

const UNIT_VISUAL = {
    1: { image: "/assets/lessons/welcome/hut.png",         color: "#7C3AED", pos: { left: "21%", top: "38%" }, size: "w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 xl:w-44 xl:h-44" },
    2: { image: "/assets/lessons/family/treehouse.png",    color: "#2563EB", pos: { left: "52%", top: "32%" }, size: "w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 xl:w-44 xl:h-44" },
    3: { image: "/assets/lessons/schoolbag/bag.png",       color: "#DB2777", pos: { left: "75%", top: "66%" }, size: "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32" },
    4: { image: "/assets/lessons/classroom/desk.png",      color: "#D97706", pos: { left: "18%", top: "65%" }, size: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36" },
    5: { image: "/assets/lessons/toy/toy.png",             color: "#16A34A", pos: { left: "62%", top: "70%" }, size: "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32" },
};

// The Games Arena uses the toy image (operator's request). Sits
// to the LEFT of Family & Friends (U2) at roughly the same
// vertical level so it reads as a sibling adventure, not stuck
// somewhere off the map.
//   U2 (Family) is at 52% / 32% — we drop the arena at 36% / 33%
//   so the two pins sit on the same line with breathing room.
const ARENA_VISUAL = {
    image: "/assets/lessons/toy/toy.png",
    color: "#9333EA",
    pos: { left: "36%", top: "33%" },
    size: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36",
};

/** Resolve a unit's image with a graceful fallback.
 *
 * The map is now DB-driven: when the admin sets `map_x`, `map_y`,
 * `map_size`, `map_image_path` or `color_key` on a unit, those
 * values win. The hardcoded `UNIT_VISUAL` table above is just a
 * legacy fallback so existing units (and brand-new ones the admin
 * hasn't placed yet) still land somewhere visible. */
const resolveImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return "/" + String(path).replace(/^\//, "");
};
const COLOR_BY_KEY = {
    purple: "#7C3AED", blue: "#2563EB", pink: "#DB2777", amber: "#D97706",
    green:  "#16A34A", cyan: "#0EA5E9", rose: "#E11D48", indigo: "#4F46E5",
    teal:   "#0D9488", orange: "#EA580C",
};
const visualFor = (unit) => {
    const fallback = UNIT_VISUAL[unit?.id] || UNIT_VISUAL[unit?.number] || UNIT_VISUAL[1];
    if (!unit) return fallback;

    // Admin-set values from the new units columns take precedence.
    const dbImage = resolveImageUrl(unit.map_image_path || unit.image_path);
    const dbColor = COLOR_BY_KEY[unit.color_key] || null;
    const dbPos   = (unit.map_x !== null && unit.map_x !== undefined &&
                     unit.map_y !== null && unit.map_y !== undefined)
        ? { left: `${Number(unit.map_x)}%`, top: `${Number(unit.map_y)}%` }
        : null;

    return {
        image: dbImage || fallback.image,
        color: dbColor || fallback.color,
        pos:   dbPos   || fallback.pos,
        size:  unit.map_size || fallback.size,
    };
};

/* ─────────────────────────────────────────────────────────────
   UnitNode — one map pin (image + label + status badge)
   The label sits ABOVE and the stars/lesson chip sit BELOW so
   pins never overlap each other regardless of zoom level.
   ───────────────────────────────────────────────────────────── */
const UnitNode = ({ unit, onClick }) => {
    const v = visualFor(unit);
    const isDone   = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const stars = Math.max(0, Number(unit.stars_earned ?? unit.stars) || 0);

    return (
        <div
            className={`group flex flex-col items-center select-none ${isLocked ? "cursor-default" : "cursor-pointer"}`}
            onClick={!isLocked ? onClick : undefined}
            style={{ filter: isLocked ? "grayscale(70%) brightness(0.85)" : "none" }}
        >
            {/* Title pill (above) */}
            <div className="relative z-30 -mb-1 flex flex-col items-center gap-1 pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                {isActive && (
                    <span className="px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-orange-400 to-amber-500 rounded-full shadow-md border-2 border-white animate-bounce">
                        Now playing!
                    </span>
                )}
                <span
                    className="px-4 py-1.5 text-[11px] sm:text-xs font-black text-white rounded-full shadow-xl border-2 border-white/60 backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap"
                    style={{ backgroundColor: v.color }}
                >
                    <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-black shadow-inner">
                        {unit.number}
                    </span>
                    {unit.title}
                </span>
            </div>

            {/* The pin image */}
            <div className={`${v.size} relative flex items-center justify-center transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"} drop-shadow-2xl`}>
                <img
                    src={v.image}
                    alt={unit.title}
                    className="w-full h-full object-contain pointer-events-none"
                    onError={(e) => (e.currentTarget.style.opacity = "0.2")}
                />

                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur rounded-full w-12 h-12 flex items-center justify-center border-2 border-white/30 shadow-xl">
                            <span className="text-2xl">🔒</span>
                        </div>
                    </div>
                )}

                {isActive && (
                    <span className="absolute inset-0 rounded-full bg-white/25 animate-ping opacity-30 pointer-events-none" />
                )}
            </div>

            {/* Stars / hint pill (below) */}
            <div className="relative z-20 -mt-1 flex flex-col items-center gap-1 pointer-events-none">
                {isDone && stars > 0 && (
                    <span className="px-2.5 py-0.5 bg-white/95 rounded-full shadow border border-amber-100 flex items-center gap-0.5">
                        {stars <= 3 ? (
                            Array.from({ length: stars }).map((_, i) => <span key={i} className="text-xs">⭐</span>)
                        ) : (
                            <>
                                <span className="text-xs">⭐</span>
                                <span className="text-[10px] font-black text-amber-600 ml-0.5">×{stars}</span>
                            </>
                        )}
                    </span>
                )}
                {isActive && (
                    <span className="px-2.5 py-0.5 bg-white/95 rounded-full shadow border border-blue-100 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                        Lesson {unit.current_lesson || 1}
                    </span>
                )}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   ArenaNode — the Games Arena pin. Same visual language as
   UnitNode (image + pill + ping) so it feels native to the map.
   ───────────────────────────────────────────────────────────── */
const ArenaNode = ({ unlocked, arena }) => {
    // Allow admin to override the Arena image via `arena.image_path`
    // and the size via `arena.size`. Otherwise fall back to the
    // hardcoded ARENA_VISUAL defaults.
    const v = {
        image: arena?.image_path
            ? (/^https?:\/\//i.test(arena.image_path) ? arena.image_path : "/" + String(arena.image_path).replace(/^\//, ""))
            : ARENA_VISUAL.image,
        color: ARENA_VISUAL.color,
        size:  arena?.size || ARENA_VISUAL.size,
    };
    return (
        <div
            className={`group flex flex-col items-center select-none ${unlocked ? "cursor-pointer" : "cursor-default"}`}
            onClick={unlocked ? () => router.visit("/arena") : undefined}
            style={{ filter: unlocked ? "none" : "grayscale(60%) brightness(0.85)" }}
        >
            <div className="relative z-30 -mb-1 flex flex-col items-center gap-1 pointer-events-none transition-transform duration-300 group-hover:-translate-y-1">
                {unlocked && (
                    <span className="px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full shadow-md border-2 border-white animate-bounce -rotate-2">
                        Mixed practice!
                    </span>
                )}
                <span
                    className="px-4 py-1.5 text-[11px] sm:text-xs font-black text-white rounded-full shadow-xl border-2 border-white/60 backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap"
                    style={{ backgroundColor: v.color }}
                >
                    <span className="text-sm leading-none">🏆</span>
                    Games Arena
                </span>
            </div>

            <div className={`${v.size} relative flex items-center justify-center transition-transform duration-300 ${unlocked ? "group-hover:scale-105" : ""} drop-shadow-2xl`}>
                <img
                    src={v.image}
                    alt="Games Arena"
                    className="w-full h-full object-contain pointer-events-none"
                    onError={(e) => (e.currentTarget.style.opacity = "0.2")}
                />
                {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur rounded-full w-12 h-12 flex items-center justify-center border-2 border-white/30 shadow-xl">
                            <span className="text-2xl">🔒</span>
                        </div>
                    </div>
                )}
                {unlocked && (
                    <span className="absolute inset-0 rounded-full bg-white/25 animate-ping opacity-30 pointer-events-none" />
                )}
            </div>

            <div className="relative z-20 -mt-1 flex flex-col items-center gap-1 pointer-events-none">
                <span className="px-2.5 py-0.5 bg-white/95 rounded-full shadow border border-fuchsia-100 text-[9px] font-black text-fuchsia-700 uppercase tracking-widest">
                    {unlocked ? "All units · all words" : "Finish a lesson"}
                </span>
            </div>
        </div>
    );
};

/* ═════════════════════════════════════════════════════════════
   MapScreen
   ═════════════════════════════════════════════════════════════ */
const MapScreen = ({ user, units: propUnits, arena }) => {
    const [soundOn, setSoundOn] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showQuizResult, setShowQuizResult] = useState(false);

    const { flash } = usePage().props || {};
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

    const totalStars = typeof user?.total_stars === "number"
        ? user.total_stars
        : units.reduce((sum, u) => sum + (u.stars_earned || u.stars || 0), 0);
    const unitsTotal = units.length || 5;

    const xp = user?.xp || 0;
    const maxXp = 600;
    const xpPct = Math.min((xp / maxXp) * 100, 100);

    return (
        <div className="h-[100dvh] w-screen flex flex-col overflow-hidden bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-50 font-sans">
            {/* ─── HEADER ─────────────────────────────────────── */}
            <header className="h-14 sm:h-16 lg:h-[68px] shrink-0 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-sm flex items-center z-50">
                <div className="w-full px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <button
                            onClick={() => router.visit("/")}
                            className="hover:scale-105 transition-transform shrink-0"
                            aria-label="Home"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-7 sm:h-8 lg:h-9 object-contain"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        </button>
                        <div className="hidden lg:flex items-center gap-2 bg-[#F0F4FF] px-3 py-1.5 rounded-full border border-[#E0E7FF]">
                            <span className="text-base leading-none">🗺️</span>
                            <span className="font-black text-[#4338CA] text-[11px] tracking-wide">Adventure Map</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Level + XP — desktop only */}
                        <div className="hidden xl:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                            <span className="font-black text-[#7C3AED] text-[10px] uppercase tracking-widest">Lv.{user?.level || 1}</span>
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]" style={{ width: `${xpPct}%` }} />
                            </div>
                            <span className="text-[9px] text-gray-500 font-bold">{xp}</span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
                            <span className="text-sm leading-none">⭐</span>
                            <span className="font-black text-amber-600 text-[11px] sm:text-xs">{totalStars}</span>
                        </div>

                        {/* User chip */}
                        <button
                            onClick={() => router.visit("/progress")}
                            className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-200 p-1 pr-3 rounded-full shadow-sm hover:bg-gray-50 transition"
                        >
                            <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs border-2 border-white shadow-inner">👦🏻</span>
                            <span className="font-black text-[#1E293B] text-[10px] hidden md:block max-w-[80px] truncate">{user?.name || "Student"}</span>
                        </button>

                        {/* Sound toggle */}
                        <button
                            onClick={() => setSoundOn((s) => !s)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-base shadow-sm hover:bg-gray-50"
                            aria-label="Toggle sound"
                        >
                            {soundOn ? "🔊" : "🔇"}
                        </button>

                        {/* Mobile drawer toggle */}
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-lg bg-[#1E293B] text-white flex items-center justify-center shadow-sm"
                            aria-label="Open menu"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── BODY: map + sidebar ───────────────────────── */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Map area — fluid, fits viewport, no horizontal scroll */}
                <main className="flex-1 relative bg-[#A6DBF6] overflow-hidden">
                    {/* Map background */}
                    <div className="absolute inset-0">
                        <img
                            src="/assets/ui/map/map-bg.png"
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/5 via-transparent to-blue-900/10 pointer-events-none" />
                    </div>

                    {/* Pin layer */}
                    <div className="absolute inset-0">
                        {units.map((u) => {
                            const v = visualFor(u);
                            return (
                                <div
                                    key={u.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: v.pos.left, top: v.pos.top }}
                                >
                                    <UnitNode
                                        unit={u}
                                        onClick={u.status === "locked" ? undefined : () => router.visit(`/lesson/${u.id}`)}
                                    />
                                </div>
                            );
                        })}

                        {arena ? (
                            <div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: arena.map_x != null ? `${Number(arena.map_x)}%` : ARENA_VISUAL.pos.left,
                                    top:  arena.map_y != null ? `${Number(arena.map_y)}%` : ARENA_VISUAL.pos.top,
                                }}
                            >
                                <ArenaNode unlocked={!!arena.unlocked} arena={arena} />
                            </div>
                        ) : null}
                    </div>

                    {/* Centered "Need Help?" button */}
                    <button
                        onClick={() => router.visit("/help")}
                        className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-4 z-30 bg-white/95 backdrop-blur text-[#7C3AED] font-black text-[11px] sm:text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xl border border-white hover:scale-105 transition-transform flex items-center gap-1.5"
                    >
                        <span className="text-sm">❓</span> Need Help?
                    </button>
                </main>

                {/* ─── SIDEBAR ─────────────────────────────── */}
                {/* Three states:
                      • desktop xl+: 280px expanded panel
                      • tablet lg-md: 64px icon rail with tooltips
                      • phone <md: off-canvas drawer (drawerOpen state)
                   The desktop expanded panel renders a compact summary
                   of mission + stats + nav so it never needs internal
                   scroll on a 720p tablet. */}
                <Sidebar
                    units={units}
                    activeUnit={activeUnit}
                    completedCount={completedCount}
                    unitsTotal={unitsTotal}
                    totalStars={totalStars}
                    arena={arena}
                    drawerOpen={drawerOpen}
                    onCloseDrawer={() => setDrawerOpen(false)}
                />
            </div>

            {/* Quiz result overlay */}
            {showQuizResult && quizResult ? (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={() => setShowQuizResult(false)}
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in"
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
                        <div className="flex items-center justify-center gap-2 mb-5">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`text-3xl ${s <= (quizResult.stars || 0) ? "" : "opacity-20 grayscale"}`}>⭐</span>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowQuizResult(false)}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg"
                        >
                            {quizResult.passed ? "Continue Adventure! →" : "Try Again →"}
                        </button>
                    </div>
                </div>
            ) : null}

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
            `}</style>
        </div>
    );
};

/* ═════════════════════════════════════════════════════════════
   Sidebar — three responsive sizes (drawer / rail / panel)
   ═════════════════════════════════════════════════════════════ */
const Sidebar = ({ units, activeUnit, completedCount, unitsTotal, totalStars, arena, drawerOpen, onCloseDrawer }) => {
    return (
        <>
            {/* Desktop expanded panel (xl+) */}
            <aside className="hidden xl:flex w-[280px] shrink-0 flex-col bg-white border-l border-gray-100 shadow-lg">
                <ExpandedSidebarContent
                    activeUnit={activeUnit}
                    completedCount={completedCount}
                    unitsTotal={unitsTotal}
                    totalStars={totalStars}
                    units={units}
                    arena={arena}
                />
            </aside>

            {/* Tablet/laptop icon rail (lg) */}
            <aside className="hidden lg:flex xl:hidden w-[64px] shrink-0 flex-col bg-white border-l border-gray-100 shadow-lg items-center py-3 gap-2">
                <RailButton
                    icon="🚀"
                    title={activeUnit ? activeUnit.title : "All done!"}
                    onClick={() => activeUnit && router.visit(`/lesson/${activeUnit.id}`)}
                    accent="#10B981"
                />
                <RailButton
                    icon="🏆"
                    title="Games Arena"
                    onClick={() => arena?.unlocked && router.visit("/arena")}
                    disabled={!arena?.unlocked}
                    accent="#9333EA"
                />
                <div className="my-2 w-8 h-px bg-gray-200" />
                {units.map((u) => (
                    <RailButton
                        key={u.id}
                        icon={u.status === "done" ? "✅" : u.status === "active" ? "📍" : "🔒"}
                        title={u.title}
                        onClick={() => u.status !== "locked" && router.visit(`/lesson/${u.id}`)}
                        disabled={u.status === "locked"}
                        accent={u.status === "active" ? "#3B82F6" : "#94A3B8"}
                    />
                ))}
                <div className="flex-1" />
                <RailButton
                    icon="📊"
                    title="Progress"
                    onClick={() => router.visit("/progress")}
                    accent="#F59E0B"
                />
            </aside>

            {/* Phone drawer (<lg) */}
            <aside
                className={`lg:hidden fixed top-0 right-0 h-[100dvh] w-[280px] max-w-[80vw] bg-white border-l border-gray-100 shadow-2xl z-[60] transform transition-transform duration-300 ${
                    drawerOpen ? "translate-x-0" : "translate-x-full"
                } flex flex-col`}
            >
                <div className="flex justify-end p-3 shrink-0">
                    <button
                        onClick={onCloseDrawer}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-black"
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>
                <ExpandedSidebarContent
                    activeUnit={activeUnit}
                    completedCount={completedCount}
                    unitsTotal={unitsTotal}
                    totalStars={totalStars}
                    units={units}
                    arena={arena}
                    onNavigate={onCloseDrawer}
                />
            </aside>
            {drawerOpen ? (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={onCloseDrawer}
                    className="lg:hidden fixed inset-0 z-[55] bg-black/40"
                />
            ) : null}
        </>
    );
};

const RailButton = ({ icon, title, onClick, disabled, accent }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        disabled={disabled}
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100 bg-white hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ borderColor: disabled ? undefined : `${accent}33` }}
    >
        {icon}
    </button>
);

const ExpandedSidebarContent = ({ activeUnit, completedCount, unitsTotal, totalStars, units, arena, onNavigate }) => {
    const go = (path) => {
        onNavigate?.();
        router.visit(path);
    };
    return (
        <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 overflow-y-auto custom-scroll">
            {/* Today's mission */}
            <div className="shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-3 border border-indigo-100 shadow-sm">
                <h3 className="font-black text-[#1E293B] text-xs flex items-center gap-1.5 mb-2">
                    <span className="text-base">🎯</span> Today's Mission
                </h3>
                <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-xl">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                        🚀
                    </div>
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="text-[11px] font-black text-[#1E293B] truncate">
                            {activeUnit ? activeUnit.title : "All Units Done!"}
                        </span>
                        <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest">
                            {activeUnit ? "Ready to play" : "Amazing job!"}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => go(activeUnit ? `/lesson/${activeUnit.id}` : "/progress")}
                    className="w-full bg-[#10B981] text-white py-2.5 rounded-xl font-black text-[11px] shadow-[0_3px_0_#059669] hover:translate-y-[1px] transition-all"
                >
                    {activeUnit ? "START ADVENTURE →" : "VIEW REWARDS →"}
                </button>
            </div>

            {/* Quick stats */}
            <div className="shrink-0 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm text-center">
                    <p className="text-base font-black text-[#1E293B] leading-none mb-1">
                        {completedCount}/{unitsTotal}
                    </p>
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Units done</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100 shadow-sm text-center">
                    <p className="text-base font-black text-amber-600 leading-none mb-1">⭐ {totalStars}</p>
                    <p className="text-[8px] text-amber-700 font-black uppercase tracking-widest">Stars</p>
                </div>
            </div>

            {/* Map index — units + arena */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                <h3 className="font-black text-[#1E293B] text-xs mb-2 flex items-center gap-1.5">
                    <span>🗺️</span> Map Index
                </h3>
                <div className="flex flex-col gap-1.5">
                    {units.map((u) => {
                        const color = visualFor(u).color;
                        return (
                            <div
                                key={u.id}
                                onClick={u.status !== "locked" ? () => go(`/lesson/${u.id}`) : undefined}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition ${
                                    u.status === "active"
                                        ? "border-blue-200 bg-blue-50 cursor-pointer hover:bg-blue-100"
                                        : u.status === "done"
                                        ? "border-green-200 bg-green-50 cursor-pointer hover:bg-green-100"
                                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white font-black text-[9px] shrink-0"
                                    style={{ backgroundColor: color }}
                                >
                                    {u.number}
                                </span>
                                <span className="text-[10px] font-black text-[#1E293B] flex-1 truncate">{u.title}</span>
                                <span className="text-xs">
                                    {u.status === "done" ? "✅" : u.status === "active" ? "📍" : "🔒"}
                                </span>
                            </div>
                        );
                    })}

                    {arena ? (
                        <div
                            onClick={arena.unlocked ? () => go("/arena") : undefined}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition mt-1 ${
                                arena.unlocked
                                    ? "border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-pink-50 cursor-pointer hover:from-fuchsia-100"
                                    : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px]">
                                🏆
                            </span>
                            <span className="text-[10px] font-black text-[#1E293B] flex-1 truncate">Games Arena</span>
                            <span className="text-xs">{arena.unlocked ? "🎮" : "🔒"}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Mascot tip */}
            <div className="mt-auto bg-[#7C3AED] rounded-2xl p-3 relative overflow-hidden shadow-md border border-[#6D28D9] shrink-0">
                <div className="flex items-center gap-2 relative z-10">
                    <img
                        src="/assets/ui/mascot/fox-hint.png"
                        alt="Fox tip"
                        className="w-10 h-10 object-contain drop-shadow-md shrink-0"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="min-w-0">
                        <p className="font-black text-white text-[10px] leading-tight">Parent's Tip:</p>
                        <p className="text-[9px] text-purple-100 font-bold leading-snug">
                            Visit the dashboard for certificates &amp; reports.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default MapScreen;
