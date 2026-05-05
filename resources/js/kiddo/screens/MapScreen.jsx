import React, { useState } from "react";
import { router } from "@inertiajs/react";

/* ─────────────────────────────────────────────────────────
   UnitNode
───────────────────────────────────────────────────────── */
const UnitNode = ({
    number,
    title,
    imagePath,
    color,
    stars,
    status,
    label,
    badge,
    subLessons,
    onClick,
}) => {
    const isDone = status === "done";
    const isActive = status === "active";
    const isLocked = status === "locked";

    return (
        <div
            className={`flex flex-col items-center gap-1 select-none ${isLocked ? "cursor-default" : "cursor-pointer"}`}
            style={{
                filter: isLocked ? "grayscale(55%) opacity(0.7)" : "none",
            }}
            onClick={!isLocked ? onClick : undefined}
        >
            {badge && (
                <div className="bg-orange-400 text-white text-[10px] font-black px-2.5 py-0.5 rounded-xl shadow-lg rotate-2 animate-pulse mb-0.5 z-10 whitespace-nowrap border border-orange-300">
                    {badge}
                </div>
            )}

            <div
                className={`${color} text-white px-3.5 py-1 rounded-full font-black text-[11px] shadow-lg flex items-center gap-1.5 z-10 whitespace-nowrap`}
            >
                <span className="bg-white/30 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0">
                    {number}
                </span>
                {title}
            </div>

            <div
                className={`relative z-10 ${isActive ? "drop-shadow-2xl hover:scale-105 transition-transform duration-300" : "drop-shadow-lg"}`}
            >
                {isLocked ? (
                    <div className="relative">
                        <img
                            src={imagePath}
                            alt={title}
                            className="w-28 object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/40 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                                <span className="text-xl">🔒</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <img
                        src={imagePath}
                        alt={title}
                        className={`object-contain ${isActive ? "w-40" : "w-28"}`}
                    />
                )}
            </div>

            {isDone && (
                <div className="bg-white/90 backdrop-blur-sm px-3 py-0.5 rounded-full text-sm shadow-md z-10">
                    {"⭐".repeat(stars)}
                </div>
            )}

            {isActive && subLessons && (
                <>
                    <div className="flex gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-lg z-10 border border-gray-100">
                        {subLessons.map((done, i) => (
                            <div
                                key={i}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border-2
                                    ${done ? "bg-[#16A34A] text-white border-green-300 shadow-sm" : "bg-gray-100 text-gray-400 border-gray-200"}`}
                            >
                                {number}.{i + 1}
                            </div>
                        ))}
                    </div>
                    {label && (
                        <div className="bg-white/95 text-[10px] font-black text-[#1E293B] px-3 py-1 rounded-full shadow-lg z-10 text-center max-w-[160px] leading-snug border border-gray-100">
                            {label}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   MapScreen
───────────────────────────────────────────────────────── */
// لاحظ كيف استقبلنا الـ user و الـ units كـ props من Laravel
const MapScreen = ({ user, units }) => {
    const [soundOn, setSoundOn] = useState(true);

    // دالة توجيه تستخدم Inertia Router بدلاً من State
    const handleNavigate = (route) => {
        if (route === "home") router.visit("/");
        else if (route === "lesson") router.visit("/lesson");
        else if (route === "progress") router.visit("/progress");
    };

    // حساب الدروس المكتملة للشريط الجانبي بناءً على البيانات القادمة من الباك إند
    const completedUnitsCount = units
        ? units.filter((u) => u.status === "done").length
        : 0;
    const activeUnit = units ? units.find((u) => u.status === "active") : null;

    return (
        <div className="h-screen w-screen bg-[#C9E8FF] font-sans flex flex-col overflow-hidden">
            <header className="bg-white/95 backdrop-blur-md px-5 py-2 flex justify-between items-center z-30 shadow-sm border-b border-gray-100 shrink-0 h-14">
                <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleNavigate("home")}
                >
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8 object-contain"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                        <span className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-base">
                            👦🏻
                        </span>
                        <div>
                            <p className="font-black text-[#1E293B] text-xs leading-none">
                                {user?.name || "Alex"}
                            </p>
                            <p className="text-[10px] text-amber-500 font-bold mt-0.5">
                                ⭐ {user?.total_stars || 0}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 px-3.5 py-1.5 rounded-full shadow-sm">
                        <span className="font-black text-[#7C3AED] text-xs">
                            Level {user?.level || 1}
                        </span>
                        <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[#16A34A]"
                                style={{ width: `${(user?.xp / 600) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">
                            {user?.xp || 0} / 600 XP
                        </span>
                        <span className="text-sm">🎁</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setSoundOn(!soundOn)}
                        className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-purple-50 transition-colors text-base"
                    >
                        {soundOn ? "🔊" : "🔇"}
                    </button>
                    <button
                        onClick={() => handleNavigate("home")}
                        className="w-9 h-9 bg-[#7C3AED] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#6D28D9] hover:scale-105 transition-all"
                    >
                        🏠
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 relative overflow-hidden">
                    <img
                        src="/assets/ui/map/map-bg.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/20 pointer-events-none z-[1]" />

                    <div className="absolute top-4 left-5 z-20">
                        <h1 className="font-black text-[#1E293B] text-xl flex items-center gap-2">
                            <span className="text-2xl">☀️</span>
                            <span className="bg-white/85 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-md">
                                Learning Map
                            </span>
                        </h1>
                        <p className="text-[11px] font-bold text-[#334155] ml-9 mt-1.5 bg-white/75 backdrop-blur-sm px-3 py-0.5 rounded-full w-fit shadow-sm">
                            Explore, learn and earn stars!
                        </p>
                    </div>
                    <div className="absolute inset-0 z-10">
                        {units &&
                            units.map((u) => (
                                <div
                                    key={u.id}
                                    className="absolute -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: u.pos.left, top: u.pos.top }}
                                >
                                    {/* لاحظ هون كيف صرنا نبعث رقم الـ ID تبع الدرس للباك إند */}
                                    <UnitNode
                                        {...u}
                                        onClick={
                                            u.status !== "locked"
                                                ? () =>
                                                      router.visit(
                                                          `/lesson/${u.id}`,
                                                      )
                                                : undefined
                                        }
                                    />
                                </div>
                            ))}
                    </div>

                    <button className="absolute bottom-4 right-4 z-20 bg-white text-[#7C3AED] font-black text-xs px-4 py-2 rounded-full shadow-lg border border-purple-100 hover:bg-purple-50 transition-colors flex items-center gap-1.5">
                        ❓ Need Help?
                    </button>
                </main>

                <aside className="w-[280px] shrink-0 bg-white/96 backdrop-blur-xl border-l border-gray-100 p-4 z-20 shadow-[-8px_0_24px_rgba(0,0,0,0.05)] overflow-y-auto flex flex-col gap-3.5">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 w-14 h-14 bg-yellow-50 rounded-full pointer-events-none" />
                        <h3 className="font-black text-[#1E293B] text-xs flex items-center gap-1.5 mb-3">
                            <span className="text-yellow-400 text-sm">⭐</span>{" "}
                            Today's Mission
                        </h3>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-lg shrink-0">
                                📖
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-[#1E293B] truncate">
                                    Learn 1 new lesson
                                </p>
                                <p className="text-[10px] text-gray-400 font-semibold">
                                    Let's keep going!
                                </p>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400 rounded-full"
                                        style={{ width: "0%" }}
                                    />
                                </div>
                            </div>
                            <div className="shrink-0 w-8 h-8 bg-yellow-400 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                <span className="font-black text-white text-[11px] leading-none">
                                    25
                                </span>
                                <span className="font-bold text-white text-[8px]">
                                    XP
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                // إذا في درس فعال، ادخل عليه، غير هيك ادخل على الدرس الأول
                                if (activeUnit) {
                                    router.visit(`/lesson/${activeUnit.id}`);
                                } else {
                                    router.visit("/lesson/1");
                                }
                            }}
                            className="w-full bg-[#7C3AED] text-white py-2.5 rounded-xl font-black text-xs shadow-[0_3px_0_#5B21B6] hover:shadow-[0_1px_0_#5B21B6] hover:translate-y-[2px] transition-all duration-150 flex items-center justify-center gap-2"
                        >
                            ▶ Continue Lesson
                        </button>
                        <p className="text-center text-[10px] text-gray-400 font-semibold mt-1.5">
                            {activeUnit ? activeUnit.label : "Let's learn!"}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-3">
                            My Progress
                        </h3>
                        <div className="flex items-center justify-around">
                            <div className="text-center">
                                <div className="relative w-12 h-12 mx-auto">
                                    <svg
                                        viewBox="0 0 48 48"
                                        className="w-12 h-12 -rotate-90"
                                    >
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="18"
                                            fill="none"
                                            stroke="#F1F5F9"
                                            strokeWidth="5"
                                        />
                                        <circle
                                            cx="24"
                                            cy="24"
                                            r="18"
                                            fill="none"
                                            stroke="#16A34A"
                                            strokeWidth="5"
                                            strokeDasharray={`${2 * Math.PI * 18 * (completedUnitsCount / 5)} ${2 * Math.PI * 18}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center font-black text-[#1E293B] text-[10px]">
                                        {completedUnitsCount}/5
                                    </span>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold mt-1 leading-tight">
                                    Units
                                    <br />
                                    Completed
                                </p>
                            </div>
                            <div className="w-px h-10 bg-gray-100" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-[#1E293B]">
                                    {user?.total_stars || 0}
                                </p>
                                <p className="text-yellow-400 text-xs mt-0.5">
                                    ⭐
                                </p>
                                <p className="text-[9px] text-gray-400 font-bold">
                                    Stars
                                    <br />
                                    Earned
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h3 className="font-black text-[#1E293B] text-xs mb-3">
                            Recent Badge
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl items-center justify-center text-2xl flex shrink-0 border border-purple-100">
                                🏅
                            </div>
                            <div>
                                <p className="font-black text-[#1E293B] text-[11px]">
                                    Great Start! 🎉
                                </p>
                                <p className="text-[10px] text-gray-400 leading-snug mt-0.5">
                                    Completed your first lesson!
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleNavigate("progress")}
                            className="text-[#7C3AED] text-[10px] font-black w-full text-left mt-2.5 hover:underline flex items-center gap-1"
                        >
                            View Parent Dashboard <span>›</span>
                        </button>
                    </div>

                    <div className="mt-auto bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-3.5 relative overflow-hidden border border-purple-100 min-h-[80px]">
                        <p className="font-black text-[#1E293B] text-[11px]">
                            💡 Keep it up!
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 pr-14 leading-snug">
                            Every lesson brings you closer to new adventures!
                        </p>
                        <img
                            src="/assets/ui/mascot/fox-hint.png"
                            alt="Fox"
                            className="absolute bottom-0 right-1 w-14 object-contain"
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MapScreen;
