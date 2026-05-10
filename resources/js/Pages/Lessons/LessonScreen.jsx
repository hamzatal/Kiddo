import React, { useState } from "react";
import { router } from "@inertiajs/react";

/* 1) Learn stage */
const LearnStage = ({ wordData, onComplete }) => {
    const [isListening, setIsListening] = useState(false);

    const playWord = () => {
        if (!wordData?.audioPath) {
            onComplete();
            return;
        }

        setIsListening(true);
        const audio = new Audio(wordData.audioPath);
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
        <div className="w-full max-w-4xl bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white flex flex-col md:flex-row items-center p-8 sm:p-14 gap-10 sm:gap-16 relative animate-fade-in-up">
            <div className="w-56 h-56 sm:w-80 sm:h-80 bg-gradient-to-br from-[#F4F8FB] to-[#E2E8F0] rounded-[2.5rem] border-4 border-white flex items-center justify-center p-6 shadow-inner shrink-0 group overflow-hidden">
                {wordData?.imagePath ? (
                    <img
                        src={wordData.imagePath}
                        alt={wordData.word}
                        className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                            e.currentTarget.outerHTML =
                                '<span class="text-[100px] drop-shadow-lg">🔤</span>';
                        }}
                    />
                ) : (
                    <span className="text-[100px] drop-shadow-lg">🔤</span>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
                <p className="text-gray-400 font-black uppercase tracking-[0.25em] text-[12px] mb-2 flex items-center gap-2">
                    <span className="text-xl">✨</span> New Word
                </p>
                <h1 className="text-5xl sm:text-[80px] font-black text-[#1E293B] tracking-tight mb-8 drop-shadow-sm leading-none uppercase">
                    {wordData?.word || "Error"}
                </h1>

                <button
                    onClick={playWord}
                    disabled={isListening}
                    className={`flex items-center gap-4 px-8 sm:px-12 py-5 sm:py-6 rounded-[2rem] font-black text-xl sm:text-2xl transition-all duration-300 w-full sm:w-auto justify-center
            ${
                isListening
                    ? "bg-purple-300 text-white shadow-none translate-y-[6px] cursor-wait"
                    : "bg-[#7C3AED] text-white shadow-[0_6px_0_#5B21B6] hover:bg-[#6D28D9] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none"
            }`}
                >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
                        {isListening ? "🎧" : "🔊"}
                    </div>
                    {isListening ? "LISTENING..." : "LISTEN"}
                </button>
            </div>
        </div>
    );
};

/* 2) Game stage */
const GameStage = ({ wordData, onWin }) => {
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("playing");
    const [wrongClicks, setWrongClicks] = useState([]);
    const [gameMode, setGameMode] = useState("text-match");

    React.useEffect(() => {
        if (!wordData) return;

        const modes = ["text-match", "audio-match", "shadow-match"];
        setGameMode(modes[Math.floor(Math.random() * modes.length)]);

        const correct = {
            id: "correct",
            img: wordData.imagePath,
            text: wordData.word,
            isCorrect: true,
        };

        const decoys =
            wordData.wrongOptions?.map((opt, i) => ({
                id: `w${i}`,
                img: opt.image_path || null,
                text: opt.word || "",
                isCorrect: false,
            })) || [];

        setOptions([...decoys, correct].sort(() => 0.5 - Math.random()));
    }, [wordData]);

    const handleChoice = (opt) => {
        if (status === "won") return;

        if (opt.isCorrect) {
            setStatus("won");
            new Audio("/assets/audio/success.mp3").play().catch(() => {});
            setTimeout(onWin, 1200);
        } else {
            setWrongClicks([...wrongClicks, opt.id]);
            new Audio("/assets/audio/error.mp3").play().catch(() => {});
        }
    };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center text-center animate-fade-in-up relative z-10">
            <div className="bg-white/90 backdrop-blur-md px-10 py-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white mb-10 flex flex-col items-center gap-4">
                {gameMode === "text-match" && (
                    <h2 className="text-4xl sm:text-5xl font-black text-[#1E293B] drop-shadow-sm">
                        Find{" "}
                        <span className="text-[#7C3AED] uppercase underline decoration-dashed">
                            {wordData?.word}
                        </span>
                    </h2>
                )}
                {gameMode === "shadow-match" && (
                    <>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] drop-shadow-sm mb-2">
                            Who is hiding?
                        </h2>
                        <div className="w-32 h-32 bg-gray-100 rounded-[1.5rem] flex items-center justify-center p-4 border-4 border-dashed border-gray-300">
                            {wordData?.imagePath && (
                                <img
                                    src={wordData.imagePath}
                                    className="w-full h-full object-contain brightness-0 opacity-60 drop-shadow-md"
                                    alt="Shadow"
                                    onError={(e) =>
                                        (e.currentTarget.style.display = "none")
                                    }
                                />
                            )}
                        </div>
                    </>
                )}
                {gameMode === "audio-match" && (
                    <div className="flex flex-col items-center gap-3">
                        <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B] drop-shadow-sm">
                            Listen &amp; Find!
                        </h2>
                        <button
                            onClick={() =>
                                new Audio(wordData?.audioPath)
                                    .play()
                                    .catch(() => {})
                            }
                            className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center text-white text-4xl shadow-[0_6px_0_#059669] hover:translate-y-[2px] active:translate-y-[6px] transition-all"
                        >
                            🔊
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl">
                {options.map((opt) => {
                    const isWrong = wrongClicks.includes(opt.id);
                    const isWon = status === "won" && opt.isCorrect;

                    return (
                        <button
                            key={opt.id}
                            disabled={status === "won" || isWrong}
                            onClick={() => handleChoice(opt)}
                            className={`aspect-square sm:aspect-auto sm:h-64 p-6 bg-white/95 backdrop-blur-xl rounded-[2.5rem] border-4 transition-all duration-300 shadow-lg flex flex-col items-center justify-center relative
                ${
                    isWrong
                        ? "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed"
                        : isWon
                          ? "border-green-500 bg-green-50 scale-105 rotate-2 z-10"
                          : "border-white hover:border-purple-300 hover:shadow-2xl hover:-translate-y-2"
                }`}
                        >
                            {opt.img ? (
                                <img
                                    src={opt.img}
                                    alt={opt.text}
                                    className="w-full h-full object-contain drop-shadow-md"
                                    onError={(e) => {
                                        e.currentTarget.outerHTML = `<span class="text-3xl font-black uppercase text-gray-400">${opt.text}</span>`;
                                    }}
                                />
                            ) : (
                                <span className="text-3xl sm:text-4xl font-black text-gray-400 uppercase">
                                    {opt.text}
                                </span>
                            )}

                            {isWon && (
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

/* 3) Reward stage */
const RewardStage = ({ word }) => (
    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 sm:p-14 flex flex-col items-center textcenter shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative animate-fade-in-up border border-white">
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
                src="/assets/ui/rewards/fox-certificate.png"
                alt="Trophy"
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-xl animate-pulse"
                onError={(e) =>
                    (e.currentTarget.outerHTML =
                        '<span class="text-7xl drop-shadow-lg">🏆</span>')
                }
            />
        </div>

        <h1 className="text-5xl sm:text-6xl font-black text-[#1E293B] tracking-tight mb-3 drop-shadow-sm">
            Great Job!
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 font-bold mb-10 max-w-md">
            You learned{" "}
            <span className="text-[#7C3AED] font-black underline decoration-dashed">
                {word}
            </span>
            .
        </p>
    </div>
);

/* 4) LessonScreen main */
const LessonScreen = ({ unit, wordData, progress }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0 Learn, 1 Play, 2 Reward
    const [isStepCompleted, setIsStepCompleted] = useState(false);

    const safeWordData = wordData || {
        word: "Error",
        audioPath: null,
        imagePath: null,
        wrongOptions: [],
    };
    const safeUnit = unit || { id: 1, title: "Lesson" };

    const currentLesson = progress?.current || 1;
    const totalLessons = progress?.total || 1;
    const progressPercent =
        totalLessons > 0 ? ((currentLesson - 1) / totalLessons) * 100 : 0;

    const steps = [
        {
            label: "Learn",
            icon: "📖",
            color: "text-blue-500",
            bg: "bg-blue-100",
        },
        {
            label: "Play",
            icon: "🎮",
            color: "text-green-500",
            bg: "bg-green-100",
        },
        {
            label: "Reward",
            icon: "🏆",
            color: "text-amber-500",
            bg: "bg-amber-100",
        },
    ];

    const handleNext = () => {
        if (!isStepCompleted) return;

        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
            setIsStepCompleted(false);
        } else {
            router.post(`/lesson/${safeUnit.id}/complete`);
        }
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#F4F8FB] font-sans flex flex-col overflow-hidden relative">
            {/* خلفيات */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000" />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 w-full p-5 sm:p-6 flex flex-col gap-4 z-50 pointer-events-none">
                <div className="flex justify-between items-center w-full">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm flex items-center gap-2 pointer-events-auto">
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
                            {safeUnit.title}
                        </span>
                    </div>
                    <button
                        onClick={() => router.visit("/map")}
                        className="pointer-events-auto w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center font-black text-gray-400 hover:text-red-500 shadow-md transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="w-full max-w-xl mx-auto flex flex-col gap-1 pointer-events-auto bg-white/60 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-white">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                            Progress
                        </span>
                        <span className="text-[11px] font-black text-[#7C3AED]">
                            {currentLesson} / {totalLessons}
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden border border-white">
                        <div
                            className="h-full bg-gradient-to-r from-purple-400 to-[#7C3AED] rounded-full transition-all duration-700"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <div className="mx-auto flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 sm:px-4 py-2 rounded-full shadow-lg border border-white pointer-events-auto">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${
                                currentStep === i
                                    ? `${s.bg} ${s.color} shadow-inner scale-105`
                                    : "bg-transparent text-gray-400"
                            }`}
                        >
                            <span className="text-sm sm:text-base">
                                {currentStep === i ? s.icon : "•"}
                            </span>
                            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest">
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 w-full h-full pt-44 pb-28 overflow-y-auto">
                {currentStep === 0 && (
                    <LearnStage
                        wordData={safeWordData}
                        onComplete={() => setIsStepCompleted(true)}
                    />
                )}
                {currentStep === 1 && (
                    <GameStage
                        wordData={safeWordData}
                        onWin={() => setIsStepCompleted(true)}
                    />
                )}
                {currentStep === 2 && <RewardStage word={safeWordData.word} />}
            </main>

            {/* Footer buttons */}
            <footer className="absolute bottom-0 left-0 w-full p-5 sm:p-8 flex justify-between items-center z-50 pointer-events-none">
                <button
                    onClick={() => router.visit("/map")}
                    className="pointer-events-auto text-gray-500 font-black hover:text-[#7C3AED] transition-colors text-sm sm:text-base flex items-center gap-2 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white shadow-sm"
                >
                    <span className="text-lg leading-none">🗺️</span>
                    Back to Map
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isStepCompleted}
                    className={`pointer-events-auto px-10 sm:px-14 py-4 sm:py-5 rounded-[2rem] font-black text-sm sm:text-lg transition-all duration-300 shadow-lg flex items-center gap-3
            ${
                isStepCompleted
                    ? "bg-[#10B981] text-white shadow-[0_8px_0_#059669] hover:translate-y-[2px] active:translate-y-[8px] active:shadow-none"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-[0_8px_0_#D1D5DB]"
            }`}
                >
                    CONTINUE
                </button>
            </footer>

            <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

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
