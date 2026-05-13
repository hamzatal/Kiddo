import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";

const QuizScreen = ({ quizData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCorrect, setSelectedCorrect] = useState(null);
    const [wrongClicks, setWrongClicks] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    // Per-question stat: true if answered correctly on the first click.
    const [questionStats, setQuestionStats] = useState([]);

    const unitId = quizData?.unitId || 1;
    const questions = quizData?.questions || [
        {
            targetWord: "Word",
            options: [
                { id: "1", word: "Word", imagePath: null, isCorrect: true },
            ],
        },
    ];

    const currentQ = questions[currentIndex];
    const progressPercentage = (currentIndex / questions.length) * 100;

    // Any time a new question appears or the component unmounts, stop
    // whatever was playing so audio from the previous question doesn't
    // bleed into the next.
    useEffect(() => {
        stopAllAudio();
        return () => stopAllAudio();
    }, [currentIndex]);

    const playTarget = () => {
        if (currentQ?.audioClip) {
            playAudio(currentQ.audioClip);
        } else if (currentQ?.audioPath) {
            playAudio(currentQ.audioPath);
        }
    };

    const handleChoice = (opt) => {
        // Play the option's word so the child hears what they picked.
        if (opt.audioClip) {
            playAudio(opt.audioClip);
        }

        if (opt.isCorrect) {
            setSelectedCorrect(opt.id);
            const firstTry = wrongClicks.length === 0;
            const nextStats = [...questionStats, { correct: firstTry }];
            setQuestionStats(nextStats);

            setTimeout(() => {
                if (currentIndex + 1 < questions.length) {
                    setCurrentIndex(currentIndex + 1);
                    setSelectedCorrect(null);
                    setWrongClicks([]);
                } else {
                    setIsFinished(true);
                }
            }, 1200);
        } else {
            setWrongClicks([...wrongClicks, opt.id]);
        }
    };

    const correctCount = questionStats.filter((s) => s.correct).length;
    const wrongCount = questionStats.length - correctCount;

    const handleFinish = () => {
        router.post("/quiz/submit", {
            unitId,
            correctCount,
            wrongCount,
            total: questions.length,
        });
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#F4F8FB] font-sans flex flex-col overflow-hidden relative">
            {/* خلفية */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000" />
            </div>

            {/* Header + progress */}
            <header className="absolute top-0 left-0 w-full p-5 sm:p-6 flex flex-col gap-4 z-20 pointer-events-none">
                <div className="flex justify-between items-center w-full">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-9 sm:h-11 drop-shadow-md pointer-events-auto cursor-pointer"
                        onClick={() => router.visit("/map")}
                    />
                    <button
                        onClick={() => router.visit("/map")}
                        className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center font-black text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-md transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {!isFinished && (
                    <div className="w-full max-w-2xl mx-auto flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-sm border border-white pointer-events-auto">
                        <span className="text-xl">🌟</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <span className="font-black text-[#1E293B] text-sm px-2">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                )}
            </header>

            {!isFinished ? (
                <div
                    key={currentIndex}
                    className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 animate-fade-in-up mt-20"
                >
                    <div className="bg-white/90 backdrop-blur-md px-8 py-5 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-white mb-8 flex items-center gap-4">
                        <h2 className="text-3xl sm:text-5xl font-black text-[#1E293B] drop-shadow-sm text-center">
                            Where is{" "}
                            <span className="text-[#7C3AED] uppercase underline decoration-dashed">
                                {currentQ.targetWord}
                            </span>
                            ?
                        </h2>
                        <button
                            type="button"
                            onClick={playTarget}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#7C3AED] text-white text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                            aria-label={`Hear ${currentQ.targetWord}`}
                            title="Listen again"
                        >
                            🔊
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 lg:px-8">
                        {currentQ.options.map((opt) => {
                            const isWrong = wrongClicks.includes(opt.id);
                            const isCorrectSelected =
                                selectedCorrect === opt.id;

                            return (
                                <button
                                    key={opt.id}
                                    disabled={
                                        selectedCorrect !== null || isWrong
                                    }
                                    onClick={() => handleChoice(opt)}
                                    className={`aspect-square lg:aspect-[4/3] p-6 bg-white/95 backdrop-blur-xl rounded-[2.5rem] border-4 transition-all duration-300 shadow-md flex items-center justify-center relative
                    ${
                        isCorrectSelected
                            ? "border-green-500 bg-green-50 scale-105 rotate-2 z-10 shadow-2xl"
                            : isWrong
                              ? "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed"
                              : "border-white hover:border-purple-300 hover:shadow-xl hover:-translate-y-2"
                    }`}
                                >
                                    {opt.imagePath ? (
                                        <img
                                            src={opt.imagePath}
                                            alt={opt.word}
                                            className="w-full h-full object-contain drop-shadow-md"
                                            onError={(e) =>
                                                (e.currentTarget.outerHTML = `<span class="text-3xl font-black uppercase text-gray-400">${opt.word}</span>`)
                                            }
                                        />
                                    ) : (
                                        <span className="text-3xl sm:text-5xl font-black text-gray-400 uppercase">
                                            {opt.word}
                                        </span>
                                    )}

                                    {isCorrectSelected && (
                                        <div className="absolute top-4 right-4 bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-4 border-white shadow-lg animate-bounce">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-6 relative z-10 inset-0">
                    <div className="absolute inset-0 bg-sky-900/10 backdrop-blur-[2px]" />

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

                        <div className="w-40 h-40 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-6 relative z-10 -mt-28">
                            <img
                                src="/assets/ui/rewards/trophy.png"
                                alt="Trophy"
                                className="w-24 h-24 object-contain drop-shadow-xl animate-pulse"
                                onError={(e) =>
                                    (e.currentTarget.outerHTML =
                                        '<span class="text-7xl drop-shadow-lg">🏆</span>')
                                }
                            />
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-black text-[#1E293B] tracking-tight mb-3 drop-shadow-sm">
                            Quiz Complete!
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-500 font-bold mb-10 max-w-md">
                            Amazing job! You scored{" "}
                            <span className="text-green-500">
                                {correctCount} / {questions.length}
                            </span>{" "}
                            on your first try.
                        </p>

                        <div className="flex gap-4 mb-12 w-full justify-center">
                            <div className="flex-1 max-w-[200px] bg-amber-50 border border-amber-200 p-4 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 border border-amber-100">
                                    ⭐
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">
                                        Earned
                                    </p>
                                    <p className="text-2xl font-black text-[#1E293B] leading-none">
                                        3 Stars
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 max-w-[200px] bg-purple-50 border border-purple-200 p-4 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 border border-purple-100">
                                    ⚡
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none mb-1">
                                        Gained
                                    </p>
                                    <p className="text-2xl font-black text-[#1E293B] leading-none">
                                        50 XP
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full sm:w-auto bg-[#10B981] text-white px-14 py-5 rounded-[2rem] font-black text-xl shadow-[0_8px_0_#059669] hover:translate-y-[2px] hover:shadow-[0_6px_0_#059669] active:translate-y-[8px] active:shadow-none transition-all flex items-center justify-center gap-3 relative z-20"
                        >
                            COLLECT REWARDS ➔
                        </button>
                    </div>
                </div>
            )}

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

export default QuizScreen;
