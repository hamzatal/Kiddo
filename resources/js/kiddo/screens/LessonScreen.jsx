import React, { useState } from "react";

/* ─────────────────────────────────────────────────────────
   Step Tab — bottom progress bar
───────────────────────────────────────────────────────── */
const StepTab = ({ number, icon, label, sublabel, color, active, done }) => (
    <div
        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all cursor-pointer min-w-[80px]
        ${
            active
                ? `${color} text-white shadow-lg scale-105`
                : done
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-gray-50 text-gray-400 border border-gray-200"
        }`}
    >
        <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2
            ${active ? "bg-white/30 border-white/50 text-white" : done ? "bg-green-100 border-green-300 text-green-600" : "bg-white border-gray-200 text-gray-400"}`}
        >
            {done ? "✓" : number}
        </div>
        <span className="text-base">{icon}</span>
        <div className="text-center">
            <p className="font-black text-[10px] leading-none">{label}</p>
            <p
                className={`text-[9px] mt-0.5 ${active ? "text-white/80" : "text-gray-400"}`}
            >
                {sublabel}
            </p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   LessonScreen
───────────────────────────────────────────────────────── */
const LessonScreen = ({ onNavigate = () => {} }) => {
    const [currentStep, setCurrentStep] = useState(1); // 0=Learn,1=Play,2=Quiz,3=Reward
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);

    const steps = [
        {
            number: "1",
            icon: "📖",
            label: "Learn",
            sublabel: "New word",
            color: "bg-[#06B6D4]",
        },
        {
            number: "2",
            icon: "🎮",
            label: "Play",
            sublabel: "Fun game",
            color: "bg-[#16A34A]",
        },
        {
            number: "3",
            icon: "📋",
            label: "Quiz",
            sublabel: "Check it",
            color: "bg-[#DB2777]",
        },
        {
            number: "4",
            icon: "⭐",
            label: "Reward",
            sublabel: "Earn stars",
            color: "bg-[#D97706]",
        },
    ];

    const handlePlay = () => {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 1500);
    };

    return (
        <div className="h-screen w-screen font-sans flex flex-col overflow-hidden bg-white">
            {/* ══════════════════════════════════════════
                TOP NAVBAR
            ══════════════════════════════════════════ */}
            <header className="bg-white border-b border-gray-100 px-5 py-2 flex justify-between items-center z-30 shrink-0 h-14">
                {/* Logo + Nav */}
                <div className="flex items-center gap-8">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8 object-contain"
                    />
                    <nav className="hidden md:flex items-center gap-6">
                        {[
                            { label: "Home", icon: "🏠", active: false },
                            { label: "Lessons", icon: "📖", active: true },
                            { label: "Progress", icon: "🏆", active: false },
                        ].map(({ label, icon, active }) => (
                            <button
                                key={label}
                                className={`flex items-center gap-1.5 font-black text-sm pb-0.5 transition-colors
                                    ${
                                        active
                                            ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                                            : "text-[#334155] hover:text-[#7C3AED] border-b-2 border-transparent"
                                    }`}
                                onClick={() =>
                                    label === "Home"
                                        ? onNavigate("home")
                                        : label === "Progress"
                                          ? onNavigate("map")
                                          : null
                                }
                            >
                                <span>{icon}</span> {label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right: Avatar + Stars */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                        <img
                            src="/assets/ui/characters/boy-avatar.png"
                            alt="Alex"
                            className="w-7 h-7 rounded-full object-cover"
                            onError={(e) => {
                                e.target.style.display = "none";
                            }}
                        />
                        <div>
                            <p className="text-[11px] font-black text-gray-400">
                                Hi, Alex!
                            </p>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#7C3AED] rounded-full"
                                    style={{ width: "65%" }}
                                />
                            </div>
                            <p className="text-[9px] text-[#7C3AED] font-black">
                                Level 2
                            </p>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="text-yellow-400 text-base">⭐</span>
                        <span className="font-black text-[#1E293B] text-base">
                            128
                        </span>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════
                BREADCRUMB
            ══════════════════════════════════════════ */}
            <div className="bg-white px-5 py-2 flex items-center gap-2 text-xs font-semibold text-gray-400 border-b border-gray-50 shrink-0">
                <button
                    onClick={() => onNavigate("map")}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 font-black"
                >
                    ‹
                </button>
                <span
                    className="hover:text-[#7C3AED] cursor-pointer"
                    onClick={() => onNavigate("home")}
                >
                    Lessons
                </span>
                <span>›</span>
                <span className="hover:text-[#7C3AED] cursor-pointer">
                    My School Bag
                </span>
                <span>›</span>
                <span className="text-[#7C3AED] font-black">Pencil</span>
            </div>

            {/* ══════════════════════════════════════════
                MAIN CONTENT AREA
            ══════════════════════════════════════════ */}
            <div className="flex-1 flex gap-4 px-5 py-4 overflow-hidden bg-[#F0F4FF]">
                {/* ── LEFT: Flashcard ── */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
                        {/* Card header badge */}
                        <div className="absolute top-4 left-4 z-10">
                            <div className="bg-purple-50 text-[#7C3AED] px-3 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 border border-purple-100">
                                <span>🎒</span> My School Bag
                            </div>
                        </div>

                        {/* Like button */}
                        <button
                            onClick={() => setLiked((l) => !l)}
                            className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:scale-110 transition-transform"
                        >
                            <span
                                className={`text-sm ${liked ? "text-red-500" : "text-gray-300"}`}
                            >
                                ❤️
                            </span>
                        </button>

                        {/* Card body */}
                        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 p-6 pt-14">
                            {/* Image */}
                            <div className="relative flex-shrink-0">
                                <div className="w-36 h-36 lg:w-44 lg:h-44 bg-[#F8F5FF] rounded-3xl flex items-center justify-center relative">
                                    <img
                                        src="/assets/lessons/schoolbag/pencil.png"
                                        alt="Pencil"
                                        className="w-28 lg:w-36 object-contain drop-shadow-xl"
                                        onError={(e) => {
                                            e.target.replaceWith(
                                                Object.assign(
                                                    document.createElement(
                                                        "span",
                                                    ),
                                                    {
                                                        textContent: "✏️",
                                                        className: "text-7xl",
                                                    },
                                                ),
                                            );
                                        }}
                                    />
                                    {/* Stars around */}
                                    {[
                                        "top-1 left-4",
                                        "top-4 right-2",
                                        "bottom-2 left-2",
                                    ].map((pos, i) => (
                                        <span
                                            key={i}
                                            className={`absolute ${pos} text-yellow-400 text-xs`}
                                        >
                                            ⭐
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Word + Listen */}
                            <div className="flex flex-col items-center gap-4">
                                {/* Colorful PENCIL text */}
                                <div className="flex items-center gap-0">
                                    {["P", "E", "N", "C", "I", "L"].map(
                                        (letter, i) => {
                                            const colors = [
                                                "#EF4444",
                                                "#F97316",
                                                "#EAB308",
                                                "#16A34A",
                                                "#2563EB",
                                                "#7C3AED",
                                            ];
                                            return (
                                                <span
                                                    key={i}
                                                    className="font-black text-4xl lg:text-5xl"
                                                    style={{ color: colors[i] }}
                                                >
                                                    {letter}
                                                </span>
                                            );
                                        },
                                    )}
                                </div>

                                {/* Dotted underline */}
                                <div className="w-full border-b-2 border-dashed border-purple-200" />

                                {/* Listen button */}
                                <button
                                    onClick={handlePlay}
                                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl border-2 font-black text-base transition-all
                                        ${
                                            isPlaying
                                                ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-[0_4px_0_#5B21B6] scale-95"
                                                : "bg-white border-[#7C3AED] text-[#1E293B] hover:bg-purple-50 shadow-[0_3px_0_#DDD8FF]"
                                        }`}
                                >
                                    <span
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                                        ${isPlaying ? "bg-white/20" : "bg-[#7C3AED]"}`}
                                    >
                                        <span
                                            className={
                                                isPlaying
                                                    ? "text-white"
                                                    : "text-white"
                                            }
                                        >
                                            🔊
                                        </span>
                                    </span>
                                    <span>
                                        {isPlaying ? "Playing..." : "Listen"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Bottom info cards */}
                        <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-50 bg-gray-50/50">
                            <div className="bg-white rounded-2xl p-3 flex items-center gap-2 shadow-sm border border-gray-100">
                                <span className="text-yellow-400 text-lg shrink-0">
                                    ⭐
                                </span>
                                <p className="text-xs font-semibold text-gray-600 leading-tight">
                                    It's used to write and draw.
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl p-3 flex items-center gap-2 shadow-sm border border-gray-100">
                                <span className="text-yellow-500 text-lg shrink-0">
                                    💡
                                </span>
                                <p className="text-xs font-semibold text-gray-600 leading-tight">
                                    The pencil has a soft eraser on the top!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Fox Panel ── */}
                <div className="w-[300px] shrink-0 flex flex-col gap-3">
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                        {/* Panel header */}
                        <div className="bg-green-50 px-4 py-3 flex items-center justify-between border-b border-green-100">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-sm">
                                    📖
                                </div>
                                <span className="font-black text-[#16A34A] text-sm">
                                    Learn & Repeat
                                </span>
                            </div>
                            <button className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-400 text-xs border border-gray-200 shadow-sm hover:bg-gray-50 font-black">
                                ℹ
                            </button>
                        </div>

                        {/* Fox + speech bubble */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 relative">
                            {/* Speech bubble */}
                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-md text-center relative max-w-[200px]">
                                <p className="text-xs font-semibold text-gray-600">
                                    Listen and say:
                                </p>
                                <p className="font-black text-[#7C3AED] text-base mt-0.5">
                                    Pencil!
                                </p>
                                {/* Bubble tail */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
                            </div>

                            {/* Fox mascot */}
                            <img
                                src="/assets/ui/mascot/fox-pointing.png"
                                alt="Kiddo Fox"
                                className="w-32 object-contain drop-shadow-lg"
                                onError={(e) => {
                                    e.target.src =
                                        "/assets/ui/mascot/fox-main.png";
                                }}
                            />

                            {/* Stars decoration */}
                            <span className="absolute top-6 right-6 text-yellow-400 text-sm animate-bounce-slow">
                                ⭐
                            </span>
                        </div>

                        {/* Great job feedback */}
                        <div className="mx-4 mb-4 bg-green-50 rounded-2xl p-3 flex items-center gap-3 border border-green-100">
                            <div className="w-9 h-9 bg-[#16A34A] rounded-full flex items-center justify-center text-lg shrink-0">
                                😊
                            </div>
                            <div>
                                <p className="font-black text-[#16A34A] text-sm">
                                    Great job!
                                </p>
                                <p className="text-xs text-gray-500 font-semibold">
                                    You said it perfectly!
                                </p>
                            </div>
                            <div className="ml-auto flex gap-0.5">
                                <span className="text-yellow-400 text-xs">
                                    ⭐
                                </span>
                                <span className="text-yellow-400 text-xs">
                                    ⭐
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                BOTTOM: Step Bar + Navigation
            ══════════════════════════════════════════ */}
            <div className="bg-white border-t border-gray-100 px-5 py-3 shrink-0 flex flex-col gap-3">
                {/* Steps */}
                <div className="flex items-center justify-center gap-2">
                    {steps.map((step, i) => (
                        <React.Fragment key={step.label}>
                            <StepTab
                                {...step}
                                active={i === currentStep}
                                done={i < currentStep}
                                onClick={() => setCurrentStep(i)}
                            />
                            {i < steps.length - 1 && (
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((d) => (
                                        <div
                                            key={d}
                                            className={`w-1.5 h-1.5 rounded-full ${i < currentStep ? "bg-green-300" : "bg-gray-200"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    {/* Arrow to more */}
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm ml-1">
                        ›
                    </div>
                </div>

                {/* Bottom nav */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => onNavigate("map")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                    >
                        ← Back to Map
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400 text-lg">⭐</span>
                        <span className="font-black text-[#1E293B] text-sm">
                            +5 XP
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            // إذا وصلنا لآخر خطوة في الدرس، انتقل لشاشة الكويز
                            if (currentStep === steps.length - 1) {
                                onNavigate("quiz");
                            } else {
                                // غير هيك، انتقل للخطوة التالية في نفس الشاشة
                                setCurrentStep((s) => s + 1);
                            }
                        }}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-[#7C3AED] text-white font-black text-sm
                            shadow-[0_4px_0_#5B21B6] hover:shadow-[0_2px_0_#5B21B6] hover:translate-y-[2px] transition-all"
                    >
                        {currentStep === steps.length - 1
                            ? "Go to Quiz ➔"
                            : "Next ➔"}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default LessonScreen;
