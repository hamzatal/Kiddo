import React, { useState } from "react";

/* ─────────────────────────────────────────────────────────

   Step Tab — bottom progress bar (نفس المستخدم في LessonScreen)

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

   QuizScreen

───────────────────────────────────────────────────────── */

const QuizScreen = ({ onNavigate = () => {} }) => {
    // نحن الآن في الخطوة 3 (Quiz)

    const [currentStep, setCurrentStep] = useState(2);

    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const [isCorrect, setIsCorrect] = useState(null);

    const [isPlaying, setIsPlaying] = useState(false);

    // خطوات الدرس (نفس LessonScreen للحفاظ على التناسق)

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

    // بيانات السؤال الديمو

    const quizData = {
        questionAudio: "Where is the Pencil?",

        correctId: 2,

        options: [
            {
                id: 1,
                imagePath: "/assets/lessons/schoolbag/book.png",
                name: "Book",
            },

            {
                id: 2,
                imagePath: "/assets/lessons/schoolbag/pencil.png",
                name: "Pencil",
            },

            {
                id: 3,
                imagePath: "/assets/lessons/schoolbag/eraser.png",
                name: "Eraser",
            },
        ],
    };

    const handlePlayAudio = () => {
        setIsPlaying(true);

        setTimeout(() => setIsPlaying(false), 1500);
    };

    const handleSelectOption = (id) => {
        if (isCorrect) return; // منع التعديل إذا جاوب صح

        setSelectedAnswer(id);

        if (id === quizData.correctId) {
            setIsCorrect(true);

            // هنا تشغيل صوت النجاح
        } else {
            setIsCorrect(false);

            // هنا تشغيل صوت الخطأ

            setTimeout(() => {
                setSelectedAnswer(null);

                setIsCorrect(null);
            }, 1000); // إخفاء الخطأ بعد ثانية والمحاولة مجدداً
        }
    };

    return (
        <div className="h-screen w-screen font-sans flex flex-col overflow-hidden bg-white">
            {/* ══════════════════════════════════════════

                TOP NAVBAR (نفس الهيدر المعتمد)

            ══════════════════════════════════════════ */}

            <header className="bg-white border-b border-gray-100 px-5 py-2 flex justify-between items-center z-30 shrink-0 h-14">
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

                                    ${active ? "text-[#7C3AED] border-b-2 border-[#7C3AED]" : "text-[#334155] hover:text-[#7C3AED] border-b-2 border-transparent"}`}
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

                <div className="flex items-center gap-3">
                    <div className="bg-yellow-50 border border-yellow-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="text-yellow-400 text-base">⭐</span>

                        <span className="font-black text-[#1E293B] text-base">
                            128
                        </span>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════

                MAIN CONTENT AREA (لعبة الاختبار)

            ══════════════════════════════════════════ */}

            <div className="flex-1 flex flex-col px-5 py-4 overflow-hidden bg-[#F8FBFF] relative">
                {/* خلفية جمالية */}

                <div className="absolute top-0 right-0 w-full h-full bg-[url('/assets/ui/hero/clouds.png')] bg-cover opacity-10 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
                    {/* السؤال والصوت */}

                    <div className="text-center mb-8 relative z-10 pt-4">
                        <div className="inline-flex items-center justify-center gap-4 bg-white px-8 py-4 rounded-3xl shadow-sm border border-purple-100">
                            <button
                                onClick={handlePlayAudio}
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md

                                    ${isPlaying ? "bg-[#DB2777] text-white scale-110 animate-pulse" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"}`}
                            >
                                🔊
                            </button>

                            <h2 className="text-3xl md:text-4xl font-black text-[#2D3748]">
                                Where is the{" "}
                                <span className="text-[#DB2777]">Pencil</span>?
                            </h2>
                        </div>
                    </div>

                    {/* خيارات الصور (البطاقات) */}

                    <div className="flex-1 flex items-center justify-center gap-6 md:gap-10 relative z-10">
                        {quizData.options.map((option) => {
                            const isSelected = selectedAnswer === option.id;

                            let cardStyle =
                                "bg-white border-4 border-gray-100 hover:border-[#7C3AED] hover:-translate-y-2";

                            if (isSelected) {
                                if (isCorrect) {
                                    cardStyle =
                                        "bg-green-50 border-4 border-[#16A34A] scale-105 shadow-xl animate-bounce-slow ring-4 ring-green-200";
                                } else if (isCorrect === false) {
                                    cardStyle =
                                        "bg-red-50 border-4 border-[#EF4444] animate-shake opacity-70";
                                }
                            } else if (isCorrect) {
                                cardStyle =
                                    "bg-white border-4 border-gray-100 opacity-50 grayscale"; // تبهيت الخيارات الثانية لما يجاوب صح
                            }

                            return (
                                <div
                                    key={option.id}
                                    onClick={() =>
                                        handleSelectOption(option.id)
                                    }
                                    className={`relative w-40 h-48 md:w-56 md:h-64 rounded-3xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-300 p-4 ${cardStyle}`}
                                >
                                    <img
                                        src={option.imagePath}
                                        alt={option.name}
                                        className="w-full h-full object-contain drop-shadow-md"
                                        onError={(e) => {
                                            e.target.replaceWith(
                                                Object.assign(
                                                    document.createElement(
                                                        "span",
                                                    ),
                                                    {
                                                        textContent: "❓",
                                                        className: "text-6xl",
                                                    },
                                                ),
                                            );
                                        }}
                                    />

                                    {/* علامة الصح أو الخطأ */}

                                    {isSelected && isCorrect && (
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#16A34A] rounded-full flex items-center justify-center text-white text-2xl font-black border-4 border-white shadow-md">
                                            ✓
                                        </div>
                                    )}

                                    {isSelected && isCorrect === false && (
                                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-2xl font-black border-4 border-white shadow-md">
                                            ✕
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* رسالة التشجيع (تظهر فقط عند الإجابة الصحيحة) */}

                    <div className="h-20 flex justify-center items-center mt-4">
                        {isCorrect && (
                            <div className="bg-[#16A34A] text-white px-8 py-3 rounded-full font-black text-xl shadow-lg border-4 border-green-200 flex items-center gap-3 animate-slide-up">
                                <span>🎉</span> Excellent Job! You found the
                                Pencil! <span>⭐</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════

                BOTTOM: Step Bar + Navigation

            ══════════════════════════════════════════ */}

            <div className="bg-white border-t border-gray-100 px-5 py-3 shrink-0 flex flex-col gap-3 relative z-30">
                <div className="flex items-center justify-center gap-2">
                    {steps.map((step, i) => (
                        <React.Fragment key={step.label}>
                            <StepTab
                                {...step}
                                active={i === currentStep}
                                done={i < currentStep}
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

                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-sm ml-1">
                        ›
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={() => onNavigate("lesson")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors"
                    >
                        ← Back to Lesson
                    </button>

                    <button
                        disabled={!isCorrect}
                        onClick={() => onNavigate("progress")}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-2xl font-black text-sm transition-all

                            ${
                                isCorrect
                                    ? "bg-[#7C3AED] text-white shadow-[0_4px_0_#5B21B6] hover:shadow-[0_2px_0_#5B21B6] hover:translate-y-[2px]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Finish & Claim Stars ⭐
                    </button>
                </div>
            </div>

            <style>{`

                @keyframes bounce-slow {

                    0%, 100% { transform: translateY(0); }

                    50% { transform: translateY(-8px); }

                }

                @keyframes shake {

                    0%, 100% { transform: translateX(0); }

                    25% { transform: translateX(-5px); }

                    75% { transform: translateX(5px); }

                }

                @keyframes slide-up {

                    from { transform: translateY(20px); opacity: 0; }

                    to { transform: translateY(0); opacity: 1; }

                }

                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }

                .animate-shake { animation: shake 0.4s ease-in-out; }

                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }

            `}</style>
        </div>
    );
};

export default QuizScreen;
