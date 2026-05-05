import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";

/* ─────────────────────────────────────────────────────────
   OptionCard — بطاقة الاختيارات
───────────────────────────────────────────────────────── */
const OptionCard = ({
    imagePath,
    title,
    isSelected,
    isCorrect,
    status,
    onClick,
}) => {
    let cardStyle =
        "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50 shadow-sm";
    let icon = null;

    if (status === "answered") {
        if (isSelected && isCorrect) {
            // الإجابة صحيحة
            cardStyle =
                "bg-green-50 border-green-400 shadow-[0_4px_0_#4ADE80] -translate-y-1";
            icon = (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-black border-2 border-white shadow-sm z-10">
                    ✓
                </div>
            );
        } else if (isSelected && !isCorrect) {
            // الإجابة خاطئة
            cardStyle = "bg-red-50 border-red-300 opacity-60";
            icon = (
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center text-white font-black border-2 border-white shadow-sm z-10">
                    ✕
                </div>
            );
        } else {
            // باقي الخيارات
            cardStyle = "bg-white border-gray-100 opacity-50 grayscale-[30%]";
        }
    } else if (isSelected) {
        cardStyle =
            "bg-purple-50 border-[#7C3AED] shadow-[0_4px_0_#5B21B6] -translate-y-1";
    }

    return (
        <button
            onClick={status === "waiting" ? onClick : undefined}
            className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 aspect-square w-full max-w-[220px] mx-auto ${cardStyle} ${status === "waiting" ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"}`}
        >
            {icon}
            <div className="flex-1 w-full flex items-center justify-center mb-4">
                <img
                    src={imagePath}
                    alt={title}
                    className="max-h-24 sm:max-h-32 object-contain drop-shadow-md transition-transform duration-300"
                    onError={(e) => {
                        e.target.replaceWith(
                            Object.assign(document.createElement("span"), {
                                textContent: "❓",
                                className:
                                    "text-6xl sm:text-7xl drop-shadow-lg",
                            }),
                        );
                    }}
                />
            </div>
            <p
                className={`font-black text-sm sm:text-base capitalize ${status === "answered" && isSelected && isCorrect ? "text-green-700" : "text-[#1E293B]"}`}
            >
                {title}
            </p>
        </button>
    );
};

/* ─────────────────────────────────────────────────────────
   QuizScreen — الشاشة الرئيسية للاختبار
───────────────────────────────────────────────────────── */
const QuizScreen = ({ quizData }) => {
    const [status, setStatus] = useState("waiting"); // waiting, answered, completed
    const [selectedOption, setSelectedOption] = useState(null);
    const [earnedStars, setEarnedStars] = useState(0);

    const data = quizData || {
        unit_id: 1,
        questionText: "Where is",
        targetWord: "it",
        audioPrompt: "Listen",
        options: [{ id: 1, word: "Error", imagePath: "", isCorrect: true }],
    };

    useEffect(() => {
        playAudio();
    }, []);

    const playAudio = () => console.log(`Playing audio: ${data.audioPrompt}`);

    const handleOptionSelect = (option) => {
        if (status !== "waiting") return;
        setSelectedOption(option.id);
        setStatus("answered");
        // نحفظ النجوم مؤقتاً، لكن لن يتم اعتمادها إلا إذا كانت صحيحة في handleNext
        setEarnedStars(option.isCorrect ? 3 : 1);
    };

    const handleNext = () => {
        if (status === "answered") {
            const isCorrectOption = data.options.find(
                (o) => o.id === selectedOption,
            )?.isCorrect;

            if (isCorrectOption) {
                // انتقال لشاشة الاحتفال إذا الجواب صحيح
                setStatus("completed");
            } else {
                // تصفير المحاولة لإعطاء الطفل فرصة ثانية إذا الجواب خاطئ
                setStatus("waiting");
                setSelectedOption(null);
            }
        } else if (status === "completed") {
            // الإرسال الفعلي للقاعدة
            router.post("/quiz/submit", {
                unit_id: data.unit_id,
                stars_earned: earnedStars,
                xp_earned: 25,
            });
        }
    };

    return (
        <div className="h-screen w-screen bg-[#F8FBFF] font-sans flex flex-col overflow-hidden">
            <header className="bg-white border-b border-gray-100 px-5 py-2 flex justify-between items-center z-30 shrink-0 h-14">
                <div className="flex items-center gap-8">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8 object-contain cursor-pointer"
                        onClick={() => router.visit("/")}
                    />
                    <nav className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => router.visit("/")}
                            className="flex items-center gap-1.5 font-black text-sm pb-0.5 text-[#334155] hover:text-[#7C3AED] border-b-2 border-transparent transition-colors"
                        >
                            <span>🏠</span> Home
                        </button>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit("/map")}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-black hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </header>

            <main className="flex-1 relative flex flex-col items-center justify-center px-4 sm:px-8 overflow-y-auto">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-[120vw] h-[120vw] bg-gradient-to-b from-blue-50/50 to-purple-50/50 rounded-full blur-3xl -translate-y-1/4" />
                </div>

                {status !== "completed" ? (
                    <div className="w-full max-w-4xl relative z-10 flex flex-col items-center gap-8 py-8 animate-fade-in-up">
                        <div className="text-center flex flex-col items-center gap-4">
                            <button
                                onClick={playAudio}
                                className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-purple-100 hover:bg-purple-50 hover:scale-110 active:scale-95 transition-all text-[#7C3AED]"
                            >
                                🔊
                            </button>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1E293B]">
                                {data.questionText}{" "}
                                <span className="text-[#7C3AED] border-b-4 border-dashed border-[#7C3AED] pb-1">
                                    {data.targetWord}
                                </span>
                                ?
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full mt-4">
                            {data.options.map((option) => (
                                <OptionCard
                                    key={option.id}
                                    imagePath={option.imagePath}
                                    title={option.word}
                                    isSelected={selectedOption === option.id}
                                    isCorrect={option.isCorrect}
                                    status={status}
                                    onClick={() => handleOptionSelect(option)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-md relative z-10 flex flex-col items-center text-center animate-fade-in-up">
                        <div className="relative">
                            <div className="absolute -top-10 -left-10 text-4xl animate-bounce-slow delay-100">
                                ⭐
                            </div>
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-6xl animate-bounce-slow">
                                ⭐
                            </div>
                            <div className="absolute -top-10 -right-10 text-4xl animate-bounce-slow delay-200">
                                ⭐
                            </div>
                            <div className="w-40 h-40 bg-yellow-100 rounded-full border-8 border-white shadow-xl flex items-center justify-center text-7xl mb-6 relative z-10 mx-auto">
                                🏆
                            </div>
                        </div>
                        <h2 className="text-4xl font-black text-[#1E293B] mb-2">
                            Lesson Complete!
                        </h2>
                        <p className="text-gray-500 font-bold mb-6">
                            You did an amazing job!
                        </p>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 w-full flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-2xl border border-yellow-100">
                                    ⭐
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                        Stars Earned
                                    </p>
                                    <p className="text-2xl font-black text-yellow-500">
                                        +{earnedStars}
                                    </p>
                                </div>
                            </div>
                            <div className="w-px h-12 bg-gray-100" />
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-2xl border border-purple-100">
                                    ⚡
                                </div>
                                <div className="text-left">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                                        XP Gained
                                    </p>
                                    <p className="text-2xl font-black text-[#7C3AED]">
                                        +25
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <div
                className={`w-full bg-white border-t border-gray-100 px-5 py-4 transition-transform duration-500 flex justify-center shrink-0 ${status === "waiting" ? "translate-y-full absolute bottom-0" : "translate-y-0"}`}
            >
                <div className="w-full max-w-4xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* تعديل الأيقونة واللون بناءً على صحة الإجابة */}
                        <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-sm ${status === "completed" || (selectedOption && data.options.find((o) => o.id === selectedOption)?.isCorrect) ? "bg-[#16A34A]" : "bg-red-400"}`}
                        >
                            {status === "completed"
                                ? "🎉"
                                : selectedOption &&
                                    data.options.find(
                                        (o) => o.id === selectedOption,
                                    )?.isCorrect
                                  ? "✓"
                                  : "!"}
                        </div>
                        <div className="hidden sm:block">
                            <h3
                                className={`font-black text-lg ${status === "completed" || (selectedOption && data.options.find((o) => o.id === selectedOption)?.isCorrect) ? "text-[#16A34A]" : "text-red-500"}`}
                            >
                                {status === "completed"
                                    ? "Awesome!"
                                    : selectedOption &&
                                        data.options.find(
                                            (o) => o.id === selectedOption,
                                        )?.isCorrect
                                      ? "Great Job!"
                                      : "Good Try!"}
                            </h3>
                        </div>
                    </div>
                    {/* تعديل زر Next بناءً على حالة الإجابة */}
                    <button
                        onClick={handleNext}
                        className={`px-8 py-3.5 rounded-2xl font-black text-white text-base shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-all ${status === "completed" || (selectedOption && data.options.find((o) => o.id === selectedOption)?.isCorrect) ? "bg-[#16A34A]" : "bg-red-500"}`}
                    >
                        {status === "completed"
                            ? "Continue to Map ➔"
                            : status === "answered" &&
                                !(
                                    selectedOption &&
                                    data.options.find(
                                        (o) => o.id === selectedOption,
                                    )?.isCorrect
                                )
                              ? "Try Again ↺"
                              : "Next ➔"}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default QuizScreen;
