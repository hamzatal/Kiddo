import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";

/* ══════════════════════════════════════════════════════════
   1. LEARN STAGE (مرحلة التعلم)
══════════════════════════════════════════════════════════ */
const LearnStage = ({ wordData, unitTitle, onComplete }) => {
    const [isListening, setIsListening] = useState(false);

    const playWord = () => {
        if (!wordData?.audio_path) {
            onComplete();
            return;
        }
        setIsListening(true);
        const audio = new Audio(wordData.audio_path);

        audio.play().catch(() => {
            setIsListening(false);
            onComplete();
        });

        audio.onended = () => {
            setIsListening(false);
            onComplete();
        };
    };

    return (
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white animate-fade-in-up relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-black text-[11px] shadow-sm uppercase tracking-widest border-4 border-white whitespace-nowrap z-10">
                Unit: {unitTitle}
            </div>

            {/* الصورة تطفو بدون صندوق أبيض مقصوص */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center shrink-0 relative group">
                <div className="absolute inset-0 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-purple-100/50 transition-colors duration-500"></div>
                <img
                    src={wordData?.image_path}
                    alt={wordData?.word}
                    className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500 relative z-10"
                    onError={(e) => {
                        e.target.outerHTML =
                            '<span class="text-[120px] drop-shadow-xl">🖼️</span>';
                    }}
                />
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left z-10">
                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[12px] mb-2 flex items-center gap-2">
                    <span className="text-xl">✨</span> New Word
                </p>
                <h1 className="text-6xl sm:text-[90px] font-black text-[#1E293B] tracking-tight mb-8 drop-shadow-sm leading-none uppercase">
                    {wordData?.word || "WORD"}
                </h1>

                <button
                    onClick={playWord}
                    disabled={isListening}
                    className={`flex items-center gap-4 px-8 sm:px-12 py-5 sm:py-6 rounded-[2rem] font-black text-xl sm:text-2xl transition-all duration-300 w-full sm:w-auto justify-center
                    ${
                        isListening
                            ? "bg-purple-300 text-white shadow-none translate-y-[6px] cursor-wait"
                            : "bg-[#7C3AED] text-white shadow-[0_6px_0_#5B21B6] hover:bg-[#6D28D9] hover:-translate-y-1 active:translate-y-[6px] active:shadow-none"
                    }`}
                >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
                        {isListening ? "⏳" : "🔊"}
                    </div>
                    {isListening ? "LISTENING..." : "LISTEN"}
                </button>
                <p className="text-[11px] font-bold text-gray-400 mt-6 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100">
                    Tap listen to unlock the next step!
                </p>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   2. GAME STAGE (مرحلة اللعب)
══════════════════════════════════════════════════════════ */
const GameStage = ({ wordData, onWin }) => {
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("playing");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!wordData) return;
        const correct = {
            id: "correct",
            img: wordData.image_path,
            text: wordData.word,
            isCorrect: true,
        };
        const decoys = (wordData.wrong_options || ["Apple", "Car"]).map(
            (w, i) => ({ id: `w${i}`, img: null, text: w, isCorrect: false }),
        );
        setOptions([...decoys, correct].sort(() => 0.5 - Math.random()));
    }, [wordData]);

    const handleChoice = (opt) => {
        setSelected(opt.id);
        if (opt.isCorrect) {
            setStatus("won");
            new Audio("/assets/audio/success.mp3").play().catch(() => {});
            setTimeout(() => onWin(), 1200);
        } else {
            new Audio("/assets/audio/error.mp3").play().catch(() => {});
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center relative z-10 animate-fade-in-up">
            <h2 className="text-4xl sm:text-6xl font-black text-[#1E293B] mb-12 drop-shadow-sm text-center bg-white/60 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-white">
                Find the{" "}
                <span className="text-[#7C3AED] relative inline-block">
                    {wordData?.word}
                    <svg
                        className="absolute w-full h-3 -bottom-2 left-0 text-purple-300"
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                    >
                        <path
                            d="M0 5 Q 50 10 100 5"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
                ?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {options.map((opt) => {
                    const isSelected = selected === opt.id;
                    const isCorrect = opt.isCorrect;

                    return (
                        <button
                            key={opt.id}
                            disabled={status === "won"}
                            onClick={() => handleChoice(opt)}
                            className={`aspect-square sm:aspect-auto sm:h-64 p-6 bg-white rounded-[2.5rem] border-4 transition-all duration-300 shadow-md flex items-center justify-center relative
                            ${
                                isSelected
                                    ? isCorrect
                                        ? "border-green-500 bg-green-50 scale-105 rotate-2"
                                        : "border-red-400 bg-red-50 opacity-60 grayscale scale-95"
                                    : "border-gray-100 hover:border-purple-300 hover:shadow-xl hover:-translate-y-2"
                            }`}
                        >
                            {opt.img ? (
                                <img
                                    src={opt.img}
                                    alt={opt.text}
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            ) : (
                                <span className="text-7xl">❓</span>
                            )}

                            {isSelected && isCorrect && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg animate-bounce">
                                    ✓
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   3. REWARD STAGE (مرحلة التتويج)
══════════════════════════════════════════════════════════ */
const RewardStage = ({ word }) => (
    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 sm:p-14 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative animate-fade-in-up border border-white">
        <div
            className="absolute -top-10 left-10 text-5xl animate-bounce"
            style={{ animationDelay: "0.1s" }}
        >
            ✨
        </div>
        <div className="absolute top-20 -left-12 text-6xl animate-pulse">
            ⭐
        </div>
        <div
            className="absolute top-10 -right-8 text-5xl animate-bounce"
            style={{ animationDelay: "0.3s" }}
        >
            🌟
        </div>

        <div className="w-40 h-40 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-6 relative z-10 -mt-24">
            <img
                src="/assets/ui/rewards/trophy.png"
                alt="Trophy"
                className="w-24 h-24 object-contain drop-shadow-xl animate-pulse"
                onError={(e) => {
                    e.target.outerHTML =
                        '<span class="text-7xl drop-shadow-lg">🏆</span>';
                }}
            />
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-[#1E293B] tracking-tight mb-3 drop-shadow-sm">
            Awesome!
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 font-bold mb-10 max-w-md">
            You successfully learned the word{" "}
            <span className="text-[#7C3AED] font-black underline decoration-dashed">
                "{word}"
            </span>
            .
        </p>

        <div className="flex items-center gap-4 bg-amber-50 px-8 py-4 rounded-2xl border border-amber-100 shadow-sm w-full justify-center">
            <span className="text-3xl">🏅</span>
            <div className="text-left">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">
                    Status
                </p>
                <p className="text-lg font-black text-[#1E293B] leading-none">
                    Ready for Final Quiz!
                </p>
            </div>
        </div>
    </div>
);

/* ══════════════════════════════════════════════════════════
   4. LESSON SCREEN (الشاشة الأم)
══════════════════════════════════════════════════════════ */
const LessonScreen = ({ unit, wordData }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isStepCompleted, setIsStepCompleted] = useState(false);

    // داتا احتياطية عشان الصفحة تفتح حتى لو الباك إند فاضي
    const safeWordData = wordData || {
        word: "HELLO",
        audio_path: null,
        image_path: null,
        wrong_options: ["Apple", "Car"],
    };
    const safeUnit = unit || { id: 1, title: "Welcome Island" };

    const handleNext = () => {
        if (!isStepCompleted) return;
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
            setIsStepCompleted(false);
        } else {
            router.visit(`/quiz/${safeUnit.id}`);
        }
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#F4F8FB] font-sans flex flex-col overflow-hidden relative">
            {/* ── خلفية ديناميكية متحركة (لطيفة للأطفال) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000"></div>
            </div>

            {/* ── الهيدر (زر الخروج وشريط التقدم) ── */}
            <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
                <img
                    src="/assets/ui/hero/title-logo.png"
                    alt="Kiddo"
                    className="h-10 drop-shadow-md pointer-events-auto cursor-pointer"
                    onClick={() => router.visit("/map")}
                />

                <div className="pointer-events-auto flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm">
                    {["📖 Learn", "🎮 Play", "🏆 Win"].map((lbl, i) => (
                        <div
                            key={i}
                            className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300
                            ${currentStep === i ? "bg-[#7C3AED] text-white shadow-md" : currentStep > i ? "bg-green-100 text-green-600" : "text-gray-400"}`}
                        >
                            {currentStep > i ? "✅" : lbl}
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => router.visit("/map")}
                    className="pointer-events-auto w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-md transition-colors"
                >
                    ✕
                </button>
            </header>

            {/* ── المحتوى المتغير ── */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                {currentStep === 0 && (
                    <LearnStage
                        wordData={safeWordData}
                        unitTitle={safeUnit.title}
                        onComplete={() => setIsStepCompleted(true)}
                    />
                )}
                {currentStep === 1 && (
                    <GameStage
                        wordData={safeWordData}
                        onWin={() => setIsStepCompleted(true)}
                    />
                )}
                {currentStep === 2 &&
                    (() => {
                        if (!isStepCompleted) setIsStepCompleted(true);
                        return <RewardStage word={safeWordData.word} />;
                    })()}
            </main>

            {/* ── الفوتر وزر الاستمرار ── */}
            <footer className="absolute bottom-0 left-0 w-full p-6 flex justify-center z-20 pointer-events-none">
                <button
                    onClick={handleNext}
                    disabled={!isStepCompleted}
                    className={`pointer-events-auto px-16 py-5 rounded-[2rem] font-black text-xl transition-all duration-300 shadow-lg flex items-center gap-3
                    ${
                        isStepCompleted
                            ? "bg-[#10B981] text-white shadow-[0_6px_0_#059669] hover:translate-y-[2px] hover:shadow-[0_3px_0_#059669] active:translate-y-[6px] active:shadow-none"
                            : "bg-gray-300 text-gray-400 cursor-not-allowed shadow-[0_6px_0_#9CA3AF]"
                    }`}
                >
                    {currentStep === 2 ? "GO TO FINAL QUIZ ➔" : "NEXT STEP ➔"}
                </button>
            </footer>

            {/* ── ستايلات الانيميشن ── */}
            <style>{`
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(40px) scale(0.95); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                @keyframes blob { 
                    0% { transform: translate(0px, 0px) scale(1); } 
                    33% { transform: translate(30px, -50px) scale(1.1); } 
                    66% { transform: translate(-20px, 20px) scale(0.9); } 
                    100% { transform: translate(0px, 0px) scale(1); } 
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
};

export default LessonScreen;
