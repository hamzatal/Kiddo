import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import PageHead from "@/learning/components/ui/PageHead";
import DailyQuestCard from "@/learning/components/ui/DailyQuestCard";
import StreakBadge from "@/learning/components/ui/StreakBadge";
import StreakCelebration from "@/learning/components/ui/StreakCelebration";
import AudioControl from "@/learning/components/ui/AudioControl";

const UNIT_VISUAL = {
    1: {
        image: "/assets/lessons/welcome/hut.png",
        color: "#7C3AED",
        pos: { left: "30%", top: "30%" },
        size: "w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 xl:w-44 xl:h-44",
    },
    2: {
        image: "/assets/lessons/family/treehouse.png",
        color: "#2563EB",
        pos: { left: "65%", top: "30%" },
        size: "w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 xl:w-44 xl:h-44",
    },
    3: {
        image: "/assets/lessons/schoolbag/bag.png",
        color: "#DB2777",
        pos: { left: "30%", top: "70%" },
        size: "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32",
    },
    4: {
        image: "/assets/lessons/classroom/desk.png",
        color: "#D97706",
        pos: { left: "65%", top: "65%" },
        size: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36",
    },
    5: {
        image: "/assets/lessons/toy/toy.png",
        color: "#16A34A",
        pos: { left: "50%", top: "50%" },
        size: "w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32",
    },
};

const ARENA_VISUAL = {
    image: "/assets/lessons/toy/toy.png",
    color: "#9333EA",
    pos: { left: "67%", top: "70%" },
    size: "w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36",
};

const resolveImageUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return "/" + String(path).replace(/^\//, "");
};
const COLOR_BY_KEY = {
    purple: "#7C3AED",
    blue: "#2563EB",
    pink: "#DB2777",
    amber: "#D97706",
    green: "#16A34A",
    cyan: "#0EA5E9",
    rose: "#E11D48",
    indigo: "#4F46E5",
    teal: "#0D9488",
    orange: "#EA580C",
};
const visualFor = (unit) => {
    const fallback = UNIT_VISUAL[unit?.id] || UNIT_VISUAL[unit?.number] || UNIT_VISUAL[1];
    if (!unit) return fallback;

    const dbImage = resolveImageUrl(unit.map_image_path || unit.image_path);
    const dbColor = COLOR_BY_KEY[unit.color_key] || null;
    const dbPos =
        unit.map_x !== null &&
        unit.map_x !== undefined &&
        unit.map_y !== null &&
        unit.map_y !== undefined
            ? { left: `${Number(unit.map_x)}%`, top: `${Number(unit.map_y)}%` }
            : null;

    return {
        image: dbImage || fallback.image,
        color: dbColor || fallback.color,
        pos: dbPos || fallback.pos,
        size: unit.map_size || fallback.size,
    };
};

const UnitNode = ({ unit, onClick }) => {
    const v = visualFor(unit);
    const isDone = unit.status === "done";
    const isActive = unit.status === "active";
    const isLocked = unit.status === "locked";

    const stars = Math.max(0, Number(unit.stars_earned ?? unit.stars) || 0);

    return (
        <div
            className={`group flex select-none flex-col items-center ${isLocked ? "cursor-default" : "cursor-pointer"}`}
            onClick={!isLocked ? onClick : undefined}
            style={{ filter: isLocked ? "grayscale(70%) brightness(0.85)" : "none" }}
        >
            <div className="pointer-events-none relative z-30 -mb-1 flex flex-col items-center gap-1 transition-transform duration-300 group-hover:-translate-y-1">
                {isActive && (
                    <span className="animate-bounce rounded-full border-2 border-white bg-gradient-to-r from-orange-400 to-amber-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                        Now playing!
                    </span>
                )}
                <span
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-white/60 px-4 py-1.5 text-[11px] font-black text-white shadow-xl backdrop-blur-md sm:text-xs"
                    style={{ backgroundColor: v.color }}
                >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[9px] font-black shadow-inner">
                        {unit.number}
                    </span>
                    {unit.title}
                </span>
            </div>

            <div
                className={`${v.size} relative flex items-center justify-center transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"} drop-shadow-2xl`}
            >
                <img
                    src={v.image}
                    alt={unit.title}
                    className="pointer-events-none h-full w-full object-contain"
                    onError={(e) => (e.currentTarget.style.opacity = "0.2")}
                />

                {isLocked && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-black/60 shadow-xl backdrop-blur">
                            <span className="text-2xl">🔒</span>
                        </div>
                    </div>
                )}

                {isActive && (
                    <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-white/25 opacity-30" />
                )}
            </div>

            <div className="pointer-events-none relative z-20 -mt-1 flex flex-col items-center gap-1">
                {isDone && stars > 0 && (
                    <span className="flex items-center gap-0.5 rounded-full border border-amber-100 bg-white/95 px-2.5 py-0.5 shadow">
                        {stars <= 3 ? (
                            Array.from({ length: stars }).map((_, i) => (
                                <span key={i} className="text-xs">
                                    ⭐
                                </span>
                            ))
                        ) : (
                            <>
                                <span className="text-xs">⭐</span>
                                <span className="ml-0.5 text-[10px] font-black text-amber-600">
                                    ×{stars}
                                </span>
                            </>
                        )}
                    </span>
                )}
                {isActive && (
                    <span className="rounded-full border border-blue-100 bg-white/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-700 shadow">
                        Lesson {unit.current_lesson || 1}
                    </span>
                )}
            </div>
        </div>
    );
};

const ArenaNode = ({ unlocked, arena }) => {
    const v = {
        image: arena?.image_path
            ? /^https?:\/\//i.test(arena.image_path)
                ? arena.image_path
                : "/" + String(arena.image_path).replace(/^\//, "")
            : ARENA_VISUAL.image,
        color: ARENA_VISUAL.color,
        size: arena?.size || ARENA_VISUAL.size,
    };
    return (
        <div
            className={`group flex select-none flex-col items-center ${unlocked ? "cursor-pointer" : "cursor-default"}`}
            onClick={unlocked ? () => router.visit("/arena") : undefined}
            style={{ filter: unlocked ? "none" : "grayscale(60%) brightness(0.85)" }}
        >
            <div className="pointer-events-none relative z-30 -mb-1 flex flex-col items-center gap-1 transition-transform duration-300 group-hover:-translate-y-1">
                {unlocked && (
                    <span className="-rotate-2 animate-bounce rounded-full border-2 border-white bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                        Mixed practice!
                    </span>
                )}
                <span
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-white/60 px-4 py-1.5 text-[11px] font-black text-white shadow-xl backdrop-blur-md sm:text-xs"
                    style={{ backgroundColor: v.color }}
                >
                    <span className="text-sm leading-none">🏆</span>
                    Games Arena
                </span>
            </div>

            <div
                className={`${v.size} relative flex items-center justify-center transition-transform duration-300 ${unlocked ? "group-hover:scale-105" : ""} drop-shadow-2xl`}
            >
                <img
                    src={v.image}
                    alt="Games Arena"
                    className="pointer-events-none h-full w-full object-contain"
                    onError={(e) => (e.currentTarget.style.opacity = "0.2")}
                />
                {!unlocked && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-black/60 shadow-xl backdrop-blur">
                            <span className="text-2xl">🔒</span>
                        </div>
                    </div>
                )}
                {unlocked && (
                    <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-white/25 opacity-30" />
                )}
            </div>

            <div className="pointer-events-none relative z-20 -mt-1 flex flex-col items-center gap-1">
                <span className="rounded-full border border-fuchsia-100 bg-white/95 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-fuchsia-700 shadow">
                    {unlocked ? "All units · all words" : "Finish a lesson"}
                </span>
            </div>
        </div>
    );
};

const MapScreen = ({ user, units: propUnits, arena }) => {
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

    const totalStars =
        typeof user?.total_stars === "number"
            ? user.total_stars
            : units.reduce((sum, u) => sum + (u.stars_earned || u.stars || 0), 0);
    const unitsTotal = units.length || 5;

    const xp = user?.xp || 0;
    const maxXp = 600;
    const xpPct = Math.min((xp / maxXp) * 100, 100);

    return (
        <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-50 font-sans">
            <PageHead
                title="Adventure Map"
                description="Travel the Kiddo learning map and unlock new English units lesson by lesson."
            />
            <header className="z-50 flex h-14 shrink-0 items-center border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-2xl sm:h-16 lg:h-[68px]">
                <div className="flex w-full items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5 lg:px-6">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => router.visit("/")}
                            className="shrink-0 transition-transform hover:scale-105"
                            aria-label="Home"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-7 object-contain sm:h-8 lg:h-9"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        </button>
                        <div className="hidden items-center gap-2 rounded-full border border-[#E0E7FF] bg-[#F0F4FF] px-3 py-1.5 lg:flex">
                            <span className="text-base leading-none">🗺️</span>
                            <span className="text-[11px] font-black tracking-wide text-[#4338CA]">
                                Adventure Map
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 xl:flex">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">
                                Lv.{user?.level || 1}
                            </span>
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
                                    style={{ width: `${xpPct}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-gray-500">{xp}</span>
                        </div>

                        <div className="flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 shadow-sm sm:px-3">
                            <span className="text-sm leading-none">⭐</span>
                            <span className="text-[11px] font-black text-amber-600 sm:text-xs">
                                {totalStars}
                            </span>
                        </div>

                        <div className="hidden md:flex">
                            <StreakBadge size="sm" />
                        </div>

                        <button
                            onClick={() => router.visit("/progress")}
                            className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white p-1 pr-3 shadow-sm transition hover:bg-gray-50 sm:flex"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-xs shadow-inner">
                                👦🏻
                            </span>
                            <span className="hidden max-w-[80px] truncate text-[10px] font-black text-[#1E293B] md:block">
                                {user?.name || "Student"}
                            </span>
                        </button>

                        <AudioControl size="sm" placement="bottom" />

                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E293B] text-white shadow-sm lg:hidden"
                            aria-label="Open menu"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </header>

            <div className="relative flex min-h-0 flex-1">
                <main className="relative flex-1 overflow-hidden bg-[#A6DBF6]">
                    <div className="absolute inset-0">
                        <img
                            src="/assets/ui/map/map-1.png"
                            alt=""
                            className="h-full w-full object-cover"
                            draggable={false}
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-400/5 via-transparent to-blue-900/10" />
                    </div>

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
                                        onClick={
                                            u.status === "locked"
                                                ? undefined
                                                : () => router.visit(`/lesson/${u.id}`)
                                        }
                                    />
                                </div>
                            );
                        })}

                        {arena ? (
                            <div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: ARENA_VISUAL.pos.left,
                                    top: ARENA_VISUAL.pos.top,
                                }}
                            >
                                <ArenaNode unlocked={!!arena.unlocked} arena={arena} />
                            </div>
                        ) : null}
                    </div>

                    <button
                        onClick={() => router.visit("/help")}
                        className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white bg-white/95 px-4 py-2 text-[11px] font-black text-[#7C3AED] shadow-xl backdrop-blur transition-transform hover:scale-105 sm:bottom-4 sm:px-5 sm:py-2.5 sm:text-xs"
                    >
                        <span className="text-sm">❓</span> Need Help?
                    </button>
                </main>

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

            {showQuizResult && quizResult ? (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onClick={() => setShowQuizResult(false)}
                >
                    <div
                        className="animate-fade-in w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="mb-3 block text-5xl">
                            {quizResult.passed ? "🎉" : "💪"}
                        </span>
                        <h2 className="mb-2 text-2xl font-black text-gray-800">
                            {quizResult.passed ? "Unit Complete!" : "Almost There!"}
                        </h2>
                        <p className="mb-4 text-sm text-gray-500">
                            {quizResult.passed
                                ? `You scored ${quizResult.percent}% and earned ${quizResult.stars} stars!`
                                : `You scored ${quizResult.percent}%. Need 70% to pass. Try again!`}
                        </p>
                        <div className="mb-5 flex items-center justify-center gap-2">
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
                            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-black text-white shadow-lg"
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

            <StreakCelebration />
        </div>
    );
};

const Sidebar = ({
    units,
    activeUnit,
    completedCount,
    unitsTotal,
    totalStars,
    arena,
    drawerOpen,
    onCloseDrawer,
}) => {
    return (
        <>
            <aside className="hidden w-[280px] shrink-0 flex-col border-l border-gray-100 bg-white shadow-lg xl:flex">
                <ExpandedSidebarContent
                    activeUnit={activeUnit}
                    completedCount={completedCount}
                    unitsTotal={unitsTotal}
                    totalStars={totalStars}
                    units={units}
                    arena={arena}
                />
            </aside>

            <aside className="hidden w-[64px] shrink-0 flex-col items-center gap-2 border-l border-gray-100 bg-white py-3 shadow-lg lg:flex xl:hidden">
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
                <div className="my-2 h-px w-8 bg-gray-200" />
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

            <aside
                className={`fixed right-0 top-0 z-[60] h-[100dvh] w-[280px] max-w-[80vw] transform border-l border-gray-100 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
                    drawerOpen ? "translate-x-0" : "translate-x-full"
                } flex flex-col`}
            >
                <div className="flex shrink-0 justify-end p-3">
                    <button
                        onClick={onCloseDrawer}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-black text-gray-700"
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
                    className="fixed inset-0 z-[55] bg-black/40 lg:hidden"
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
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-xl shadow-sm transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: disabled ? undefined : `${accent}33` }}
    >
        {icon}
    </button>
);

const ExpandedSidebarContent = ({
    activeUnit,
    completedCount,
    unitsTotal,
    totalStars,
    units,
    arena,
    onNavigate,
}) => {
    const go = (path) => {
        onNavigate?.();
        router.visit(path);
    };
    return (
        <div className="custom-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 sm:p-3">
            <DailyQuestCard />

            <div className="shrink-0 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-2.5 shadow-sm">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
                    <span className="text-base">🎯</span> Today's Mission
                </h3>
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-white p-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg">
                        🚀
                    </div>
                    <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-[11px] font-black text-[#1E293B]">
                            {activeUnit ? activeUnit.title : "All Units Done!"}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">
                            {activeUnit ? "Ready to play" : "Amazing job!"}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => go(activeUnit ? `/lesson/${activeUnit.id}` : "/progress")}
                    className="w-full rounded-xl bg-[#10B981] py-2 text-[11px] font-black text-white shadow-[0_3px_0_#059669] transition-all hover:translate-y-[1px]"
                >
                    {activeUnit ? "START ADVENTURE →" : "VIEW REWARDS →"}
                </button>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
                    <p className="mb-1 text-base font-black leading-none text-[#1E293B]">
                        {completedCount}/{unitsTotal}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">
                        Units done
                    </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-center shadow-sm">
                    <p className="mb-1 text-base font-black leading-none text-amber-600">
                        ⭐ {totalStars}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-700">
                        Stars
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-[#1E293B]">
                    <span>🗺️</span> Map Index
                </h3>
                <div className="flex flex-col gap-1">
                    {units.map((u) => {
                        const color = visualFor(u).color;
                        return (
                            <div
                                key={u.id}
                                onClick={
                                    u.status !== "locked" ? () => go(`/lesson/${u.id}`) : undefined
                                }
                                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${
                                    u.status === "active"
                                        ? "cursor-pointer border-blue-200 bg-blue-50 hover:bg-blue-100"
                                        : u.status === "done"
                                          ? "cursor-pointer border-green-200 bg-green-50 hover:bg-green-100"
                                          : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                                }`}
                            >
                                <span
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                                    style={{ backgroundColor: color }}
                                >
                                    {u.number}
                                </span>
                                <span className="flex-1 truncate text-[10px] font-black text-[#1E293B]">
                                    {u.title}
                                </span>
                                <span className="text-xs">
                                    {u.status === "done"
                                        ? "✅"
                                        : u.status === "active"
                                          ? "📍"
                                          : "🔒"}
                                </span>
                            </div>
                        );
                    })}

                    {arena ? (
                        <div
                            onClick={arena.unlocked ? () => go("/arena") : undefined}
                            className={`mt-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${
                                arena.unlocked
                                    ? "cursor-pointer border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-pink-50 hover:from-fuchsia-100"
                                    : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                            }`}
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[9px]">
                                🏆
                            </span>
                            <span className="flex-1 truncate text-[10px] font-black text-[#1E293B]">
                                Games Arena
                            </span>
                            <span className="text-xs">{arena.unlocked ? "🎮" : "🔒"}</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="relative shrink-0 overflow-hidden rounded-2xl border border-[#6D28D9] bg-[#7C3AED] p-2.5 shadow-md">
                <div className="relative z-10 flex items-center gap-2">
                    <img
                        src="/assets/ui/mascot/fox-hint.png"
                        alt="Fox tip"
                        className="h-9 w-9 shrink-0 object-contain drop-shadow-md"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="min-w-0">
                        <p className="text-[10px] font-black leading-tight text-white">
                            Parent's Tip:
                        </p>
                        <p className="text-[9px] font-bold leading-snug text-purple-100">
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
