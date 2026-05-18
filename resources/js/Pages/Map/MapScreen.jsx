import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ══════════════════════════════════════════════════════════
   COLOUR PALETTE
   We map a small number of admin-friendly colour keys to
   solid Tailwind classes. The admin enters a key (purple,
   blue, pink, amber, green, cyan, rose, indigo) in
   `unit.color_key` and the map renders the matching pill.
══════════════════════════════════════════════════════════ */
const COLOR_BY_KEY = {
    purple: "bg-[#7C3AED]",
    blue:   "bg-[#2563EB]",
    pink:   "bg-[#DB2777]",
    amber:  "bg-[#D97706]",
    green:  "bg-[#16A34A]",
    cyan:   "bg-[#0EA5E9]",
    rose:   "bg-[#E11D48]",
    indigo: "bg-[#4F46E5]",
    teal:   "bg-[#0D9488]",
    orange: "bg-[#EA580C]",
};

const DEFAULT_SIZE = "w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44";

/* Resolve a stored image path into a URL the browser can load.
   Accepts: absolute http(s), or paths like "assets/lessons/..." */
function resolveImage(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return "/" + String(path).replace(/^\//, "");
}

/* Auto-layout fallback used when admin hasn't placed a unit yet.
   Distributes nodes along a curve so a brand-new unit lands
   somewhere visible instead of stacking at (50,50). */
function autoLayoutPos(index, total) {
    const t = total <= 1 ? 0.5 : index / (total - 1);
    const left = 15 + t * 70;
    const top  = 35 + Math.sin(t * Math.PI) * 20;
    return { left, top };
}

/* ══════════════════════════════════════════════════════════
   UnitNode
══════════════════════════════════════════════════════════ */
const UnitNode = ({ unit, onClick }) => {
    const isDone = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const colorClass = COLOR_BY_KEY[unit.color_key] || COLOR_BY_KEY.purple;
    const sizeClass  = unit.map_size || DEFAULT_SIZE;
    const imgSrc     = resolveImage(unit.map_image_path || unit.image_path);

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
                    className={`${colorClass} text-white px-5 py-1.5 rounded-full font-black text-[12px] shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-auto border-2 border-white/40 backdrop-blur-md`}
                >
                    <span className="bg-white/30 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-inner">
                        {unit.number}
                    </span>
                    {unit.title}
                </div>
            </div>

            <div
                className={`${sizeClass} flex items-center justify-center relative transition-transform duration-500 ${isActive ? "scale-110 drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]" : "drop-shadow-xl group-hover:scale-105"}`}
            >
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={unit.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                    />
                ) : (
                    <div className={`w-full h-full rounded-full ${colorClass} opacity-90 flex items-center justify-center text-3xl font-black text-white shadow-inner`}>
                        {unit.number}
                    </div>
                )}
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
                    // pill never overflows the unit card.
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
   ArenaNode — mixed-review pin, positioned dynamically by
   the server (left of Unit 2 by request, with toy.png).
   ══════════════════════════════════════════════════════════ */
const ArenaNode = ({ arena, unlocked }) => {
    const sizeClass = arena?.size || "w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40";
    const imgSrc    = resolveImage(arena?.image_path || "assets/lessons/toy/toy.png");

    return (
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
                    <span className="text-base leading-none">🧸</span>
                    {arena?.title || "Games Arena"}
                </div>
            </div>

            {/* The pin itself — uses the toy.png by request, with the
                same drop-shadow + ping rings as the unit pins so it
                feels native to the map. */}
            <div className={`${sizeClass} flex items-center justify-center relative drop-shadow-xl group-hover:scale-105 transition-transform`}>
                <img
                    src={imgSrc}
                    alt={arena?.title || "Games Arena"}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-black/55 backdrop-blur-md rounded-full w-14 h-14 flex items-center justify-center shadow-2xl border-2 border-white/20">
                            <span className="text-3xl">🔒</span>
                        </div>
                    </div>
                )}
                {unlocked && (
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-30 pointer-events-none" />
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
};

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
            import("@/learning/utils/confetti").then(({ launchConfetti }) => launchConfetti(4000));
            import("@/learning/utils/soundEffects").then(({ playCheer }) => playCheer());
        }
    }, [quizResult]);

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
        <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[#B8E4FF] font-sans">
            {/* ── HEADER ── */}
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
                            <span className="text-lg leading-none drop-shadow-sm shrink-0">⭐</span>
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

            {/* ── MAIN BODY ── */}
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
                            {units.map((u, i) => {
                                // Pull DB-driven position; auto-layout if
                                // admin hasn't placed this unit yet.
                                let left = u.map_x, top = u.map_y;
                                if (left === null || left === undefined || top === null || top === undefined) {
                                    const fallback = autoLayoutPos(i, units.length);
                                    left = fallback.left;
                                    top  = fallback.top;
                                }
                                return (
                                    <div
                                        key={u.id}
                                        className="absolute -translate-x-1/2 -translate-y-1/2"
                                        style={{ left: `${left}%`, top: `${top}%` }}
                                    >
                                        <UnitNode
                                            unit={u}
                                            onClick={
                                                u.status === "locked"
                                                    ? () => {}
                                                    : () => router.visit(`/lesson/${u.id}`)
                                            }
                                        />
                                    </div>
                                );
                            })}

                            {/* Games Arena pin — positioned by the
                                server to sit immediately to the LEFT
                                of Unit 2, with the toy.png image. The
                                user can drag it elsewhere from the
                                admin "Map" panel later. */}
                            {arena ? (
                                <div
                                    className="absolute -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `${arena.map_x ?? 38}%`,
                                        top:  `${arena.map_y ?? 50}%`,
                                    }}
                                >
                                    <ArenaNode arena={arena} unlocked={!!arena.unlocked} />
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

                {/* ── SIDEBAR ── */}
                <aside
                    className={`${sidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0 fixed lg:static top-[72px] right-0 bottom-0 lg:top-0 z-40 lg:z-auto w-[300px] lg:w-[320px] bg-white border-l border-gray-100 shadow-2xl lg:shadow-none transition-transform duration-300 flex flex-col`}
                >
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-purple-50 to-pink-50">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Adventure</p>
                        <h2 className="text-lg font-black text-[#1E293B]">Map index</h2>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1">
                            {completedCount} of {unitsTotal} units complete
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {units.map((u) => {
                            const colorClass = COLOR_BY_KEY[u.color_key] || COLOR_BY_KEY.purple;
                            const imgSrc = resolveImage(u.map_image_path || u.image_path);
                            const locked = u.status === "locked";
                            return (
                                <button
                                    key={u.id}
                                    disabled={locked}
                                    onClick={() => !locked && router.visit(`/lesson/${u.id}`)}
                                    className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                                        locked
                                            ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                            : u.status === "active"
                                            ? "bg-amber-50 border-amber-200 shadow-sm"
                                            : "bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm"
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden`}>
                                        {imgSrc ? (
                                            <img src={imgSrc} alt="" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <span className="font-black text-lg">{u.number}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                            Unit {u.number}
                                        </p>
                                        <p className="text-sm font-black text-[#1E293B] truncate">{u.title}</p>
                                    </div>
                                    {u.status === "done" && <span className="text-emerald-500 text-lg">✓</span>}
                                    {u.status === "active" && <span className="text-amber-500 text-lg">▶</span>}
                                    {locked && <span className="text-gray-400 text-lg">🔒</span>}
                                </button>
                            );
                        })}

                        {arena ? (
                            <button
                                disabled={!arena.unlocked}
                                onClick={() => arena.unlocked && router.visit("/arena")}
                                className={`w-full text-left p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                                    arena.unlocked
                                        ? "bg-fuchsia-50 border-fuchsia-200 hover:shadow-sm"
                                        : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                                }`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                        src={resolveImage(arena.image_path || "assets/lessons/toy/toy.png")}
                                        alt=""
                                        className="w-full h-full object-contain p-1"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider">
                                        Bonus
                                    </p>
                                    <p className="text-sm font-black text-[#1E293B] truncate">{arena.title || "Games Arena"}</p>
                                </div>
                                {arena.unlocked
                                    ? <span className="text-fuchsia-500 text-lg">🧸</span>
                                    : <span className="text-gray-400 text-lg">🔒</span>}
                            </button>
                        ) : null}
                    </div>
                </aside>
            </div>

            {/* Click-outside overlay for the mobile sidebar */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                />
            )}
        </div>
    );
};

export default MapScreen;
