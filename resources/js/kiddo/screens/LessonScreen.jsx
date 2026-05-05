import React, { useState } from "react";
import { router } from "@inertiajs/react";
import GameStage from "../stages/GameStage";
import QuizStage from "../stages/QuizStage";

const StepTab = ({
    number,
    icon,
    label,
    sublabel,
    color,
    active,
    done,
    onClick,
}) => (
    <div
        onClick={onClick}
        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all cursor-pointer min-w-[80px]
        ${active ? `${color} text-white shadow-lg scale-105` : done ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-50 text-gray-400 border border-gray-200"}`}
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
   LessonScreen — شاشة الدرس الرئيسية
───────────────────────────────────────────────────────── */
const LessonScreen = ({ lessonData }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0=Learn, 1=Play, 2=Quiz, 3=Reward
    const [isPlaying, setIsPlaying] = useState(false);
    const [liked, setLiked] = useState(false);

    // قيم افتراضية في حال تأخر وصول البيانات من الباك إند
    const data = lessonData || {
        unit_title: "Loading...",
        lesson_title: "",
        word: "WAIT",
        image: "",
        emoji: "⏳",
        fact1: "",
        fact2: "",
        next_route: "/map",
    };

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
        // هنا يمكنك إضافة استدعاء لملف الصوت الحقيقي
        setTimeout(() => setIsPlaying(false), 1500);
    };

    const letters = data.word.toUpperCase().split("");
    const colors = [
        "#EF4444",
        "#F97316",
        "#EAB308",
        "#16A34A",
        "#2563EB",
        "#7C3AED",
        "#DB2777",
    ];

    return (
        <div className="h-screen w-screen font-sans flex flex-col overflow-hidden bg-white">
            {/* ── HEADER ── */}
            <header className="bg-white border-b border-gray-100 px-5 py-2 flex justify-between items-center z-30 shrink-0 h-14">
                <div className="flex items-center gap-8">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8 object-contain cursor-pointer"
                        onClick={() => router.visit("/")}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit("/map")}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black hover:bg-gray-200 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </header>

            {/* ── BREADCRUMB ── */}
            <div className="bg-white px-5 py-2 flex items-center gap-2 text-xs font-semibold text-gray-400 border-b border-gray-50 shrink-0">
                <button
                    onClick={() => router.visit("/map")}
                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 font-black"
                >
                    ‹
                </button>
                <span
                    className="hover:text-[#7C3AED] cursor-pointer"
                    onClick={() => router.visit("/map")}
                >
                    Lessons
                </span>
                <span>›</span>
                <span className="hover:text-[#7C3AED] cursor-pointer">
                    {data.unit_title}
                </span>
                <span>›</span>
                <span className="text-[#7C3AED] font-black">{data.word}</span>
            </div>

            {/* ── MAIN CONTENT (متغير حسب الـ Step) ── */}
            <div className="flex-1 flex gap-4 px-5 py-4 overflow-hidden bg-[#F0F4FF]">
                {/* الخطوة 0: بطاقة التعلم (Flashcard) */}
                {currentStep === 0 && (
                    <>
                        <div className="flex-1 flex flex-col gap-3 min-w-0 animate-fade-in-up">
                            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col">
                                <div className="absolute top-4 left-4 z-10">
                                    <div className="bg-purple-50 text-[#7C3AED] px-3 py-1.5 rounded-full font-black text-xs flex items-center gap-1.5 border border-purple-100">
                                        <span>{data.emoji}</span>{" "}
                                        {data.unit_title}
                                    </div>
                                </div>
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

                                <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 p-6 pt-14">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-36 h-36 lg:w-44 lg:h-44 bg-[#F8F5FF] rounded-3xl flex items-center justify-center relative">
                                            <img
                                                src={data.image}
                                                alt={data.word}
                                                className="w-28 lg:w-36 object-contain drop-shadow-xl"
                                                onError={(e) => {
                                                    e.target.replaceWith(
                                                        Object.assign(
                                                            document.createElement(
                                                                "span",
                                                            ),
                                                            {
                                                                textContent:
                                                                    data.emoji,
                                                                className:
                                                                    "text-7xl",
                                                            },
                                                        ),
                                                    );
                                                }}
                                            />
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
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-0">
                                            {letters.map((letter, i) => (
                                                <span
                                                    key={i}
                                                    className="font-black text-4xl lg:text-5xl"
                                                    style={{
                                                        color: colors[
                                                            i % colors.length
                                                        ],
                                                    }}
                                                >
                                                    {letter}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="w-full border-b-2 border-dashed border-purple-200" />
                                        <button
                                            onClick={handlePlay}
                                            className={`flex items-center gap-3 px-8 py-3 rounded-2xl border-2 font-black text-base transition-all ${isPlaying ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-[0_4px_0_#5B21B6] scale-95" : "bg-white border-[#7C3AED] text-[#1E293B] hover:bg-purple-50 shadow-[0_3px_0_#DDD8FF]"}`}
                                        >
                                            <span
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isPlaying ? "bg-white/20" : "bg-[#7C3AED]"}`}
                                            >
                                                <span className="text-white">
                                                    🔊
                                                </span>
                                            </span>
                                            <span>
                                                {isPlaying
                                                    ? "Playing..."
                                                    : "Listen"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-50 bg-gray-50/50">
                                    <div className="bg-white rounded-2xl p-3 flex items-center gap-2 shadow-sm border border-gray-100">
                                        <span className="text-yellow-400 text-lg shrink-0">
                                            ⭐
                                        </span>
                                        <p className="text-xs font-semibold text-gray-600 leading-tight">
                                            {data.fact1}
                                        </p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-3 flex items-center gap-2 shadow-sm border border-gray-100">
                                        <span className="text-yellow-500 text-lg shrink-0">
                                            💡
                                        </span>
                                        <p className="text-xs font-semibold text-gray-600 leading-tight">
                                            {data.fact2}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fox Sidebar */}
                        <div className="w-[300px] shrink-0 flex flex-col gap-3 animate-fade-in-up delay-100">
                            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                                <div className="bg-green-50 px-4 py-3 flex items-center justify-between border-b border-green-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-sm">
                                            📖
                                        </div>
                                        <span className="font-black text-[#16A34A] text-sm">
                                            Learn & Repeat
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 relative">
                                    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-md text-center relative max-w-[200px]">
                                        <p className="text-xs font-semibold text-gray-600">
                                            Listen and say:
                                        </p>
                                        <p className="font-black text-[#7C3AED] text-base mt-0.5">
                                            {data.word}!
                                        </p>
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
                                    </div>
                                    <img
                                        src="/assets/ui/mascot/fox-pointing.png"
                                        alt="Kiddo Fox"
                                        className="w-32 object-contain drop-shadow-lg"
                                        onError={(e) => {
                                            e.target.src =
                                                "/assets/ui/mascot/fox-main.png";
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {currentStep === 1 && (
                    <GameStage
                        word={data.word}
                        image={data.image}
                        emoji={data.emoji}
                    />
                )}

                {currentStep === 2 && <QuizStage word={data.word} />}
                {/* الخطوة 3: التقييم والمكافآت */}
                {currentStep === 3 && (
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 animate-fade-in-up">
                        <div className="text-8xl">🎁</div>
                        <h2 className="text-4xl font-black text-[#D97706]">
                            Awesome Job!
                        </h2>
                        <p className="text-gray-500 font-bold text-lg">
                            You are ready for the final quiz.
                        </p>
                    </div>
                )}
            </div>

            {/* ── BOTTOM NAVBAR ── */}
            <div className="bg-white border-t border-gray-100 px-5 py-3 shrink-0 flex flex-col gap-3">
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
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.visit("/map")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                    >
                        ← Back to Map
                    </button>

                    <button
                        onClick={() => {
                            if (currentStep === steps.length - 1) {
                                router.visit(data.next_route); // توجيه للاختبار النهائي
                            } else {
                                setCurrentStep((s) => s + 1); // تقدم للمرحلة الداخلية التالية
                            }
                        }}
                        className="flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-[#7C3AED] text-white font-black text-sm shadow-[0_4px_0_#5B21B6] hover:shadow-[0_2px_0_#5B21B6] hover:translate-y-[2px] transition-all"
                    >
                        {currentStep === steps.length - 1
                            ? "Go to Final Quiz ➔"
                            : "Next Step ➔"}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .animate-bounce-slow { animation: bounce-slow 2.5s ease-in-out infinite; }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default LessonScreen;
