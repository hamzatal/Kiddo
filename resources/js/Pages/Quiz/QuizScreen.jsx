import React, { useState, useEffect, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import PageHead from "@/learning/components/ui/PageHead";
import StreakCelebration from "@/learning/components/ui/StreakCelebration";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick, playCheer, playStarCollect } from "@/learning/utils/soundEffects";
import { launchConfetti, launchStars } from "@/learning/utils/confetti";
import OptionCard from "@/learning/components/ui/OptionCard";
import AppHeader from "@/learning/components/ui/AppHeader";
import FoxHelper from "@/learning/components/ai/FoxHelper";

/**
 * QuizScreen v3 — Unit quiz with full viewport fit on every screen.
 *
 * Same content as before but compact prompt header + tighter grid
 * so a 720p tablet fits the whole quiz without scroll.
 */
const QuizScreen = ({ quizData }) => {
    const { auth, ai } = usePage().props;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCorrect, setSelectedCorrect] = useState(null);
    const [wrongClicks, setWrongClicks] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [questionStats, setQuestionStats] = useState([]);
    const [errors, setErrors] = useState([]);
    const containerRef = useRef(null);

    const unitId = quizData?.unitId || 1;
    const unitTitle = quizData?.unitTitle || "Quiz";
    const questions = quizData?.questions || [];
    const currentQ = questions[currentIndex];

    useEffect(() => () => stopAllAudio(), []);

    useEffect(() => {
        stopAllAudio();
        if (currentQ?.audioClip) {
            const t = setTimeout(() => playAudio(currentQ.audioClip), 300);
            return () => clearTimeout(t);
        }
    }, [currentIndex]);

    const playTarget = () => {
        playClick();
        if (currentQ?.audioClip) playAudio(currentQ.audioClip);
        else if (currentQ?.audioPath) playAudio(currentQ.audioPath);
    };

    const handleChoice = (opt) => {
        if (selectedCorrect !== null) return;

        if (opt.isCorrect) {
            setSelectedCorrect(opt.id);
            playSuccess();
            setTimeout(() => {
                const el = containerRef.current;
                if (el) {
                    const rect = el.getBoundingClientRect();
                    launchStars(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
                }
            }, 100);

            const firstTry = wrongClicks.length === 0;
            const nextStats = [...questionStats, { correct: firstTry, word: currentQ.targetWord }];
            setQuestionStats(nextStats);

            setTimeout(() => {
                if (currentIndex + 1 < questions.length) {
                    setCurrentIndex(currentIndex + 1);
                    setSelectedCorrect(null);
                    setWrongClicks([]);
                } else {
                    triggerCelebration();
                }
            }, 1200);
        } else {
            playFail();
            setWrongClicks([...wrongClicks, opt.id]);
            setErrors((prev) => [...prev, { word: currentQ.targetWord, wrongChoice: opt.word, timestamp: Date.now() }]);
        }
    };

    const triggerCelebration = () => {
        setIsFinished(true);
        playCheer();
        launchConfetti(5000);
        setTimeout(() => playStarCollect(), 800);
        setTimeout(() => playStarCollect(), 1200);
        setTimeout(() => playStarCollect(), 1600);
    };

    const correctCount = questionStats.filter((s) => s.correct).length;
    const wrongCount = questionStats.length - correctCount;
    const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const starsEarned = scorePercent >= 90 ? 3 : scorePercent >= 70 ? 2 : 1;

    const handleFinish = () => {
        playClick();
        router.post("/quiz/submit", {
            unitId,
            correctCount,
            wrongCount,
            total: questions.length,
            errors,
        });
    };

    if (questions.length === 0) {
        return (
            <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100">
                <div className="text-center p-8">
                    <span className="text-6xl block mb-4">📝</span>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">No Questions Yet</h2>
                    <p className="text-gray-500 mb-6">This quiz doesn't have questions available.</p>
                    <button onClick={() => router.visit("/map")} className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">
                        Back to Map
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-[100dvh] w-screen font-sans flex flex-col overflow-hidden relative bg-gradient-to-br from-indigo-50 via-white to-amber-50">
            <PageHead
                title={`${unitTitle} Quiz`}
                description="Show what you've learned in this Kiddo unit and earn stars!"
            />
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
                <div className="absolute top-[40%] left-[60%] w-56 h-56 bg-amber-200/30 rounded-full blur-2xl" />
            </div>

            <AppHeader
                unitTitle={unitTitle}
                lessonTitle="Quiz Time!"
                modeLabel="Quiz"
                modeIcon="🏆"
                modeColor="#F59E0B"
                current={currentIndex + 1}
                total={questions.length}
                totalStars={auth?.user?.total_stars}
                xp={auth?.user?.xp}
            />

            {!isFinished ? (
                <main className="flex-1 min-h-0 relative z-10 overflow-y-auto">
                    <div className="min-h-full w-full flex items-center justify-center px-2 sm:px-4 lg:px-6 py-2 sm:py-3">
                        <div key={currentIndex} className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-slideIn">
                        {/* Compact prompt */}
                        <div className="bg-white/90 backdrop-blur px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl shadow-lg border border-white/60 flex items-center gap-2 sm:gap-3 w-full max-w-md">
                            <button
                                type="button"
                                onClick={playTarget}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-lg sm:text-xl shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shrink-0"
                            >🔊</button>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Find this word:</p>
                                <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-800 truncate">{currentQ.targetWord}</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl mx-auto justify-items-center">
                            {currentQ.options.map((opt) => {
                                const isWrong = wrongClicks.includes(opt.id);
                                const isCorrectPick = selectedCorrect === opt.id;
                                let cardState = "idle";
                                if (isCorrectPick) cardState = "correct";
                                else if (isWrong) cardState = "wrong";
                                else if (selectedCorrect !== null) cardState = "disabled";

                                return (
                                    <OptionCard
                                        key={opt.id}
                                        imagePath={opt.imagePath}
                                        label={opt.word}
                                        audioClip={opt.audioClip}
                                        wordId={opt.wordId || null}
                                        state={cardState}
                                        onClick={() => handleChoice(opt)}
                                        showLabel
                                    />
                                );
                            })}
                        </div>
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-8 lg:p-10 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-celebrationPop">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white -mt-12 sm:-mt-16 mb-3">
                            <span className="text-4xl sm:text-6xl">🏆</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-black text-gray-800 mb-1">
                            {scorePercent >= 90 ? "Amazing!" : scorePercent >= 70 ? "Great Job!" : "Good Try!"}
                        </h1>
                        <p className="text-xs sm:text-base text-gray-500 font-bold mb-4">
                            You scored <span className="text-emerald-500 font-black">{correctCount}</span> out of <span className="font-black">{questions.length}</span>!
                        </p>

                        <div className="flex items-center gap-2 sm:gap-3 mb-4">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`text-3xl sm:text-5xl transition-all duration-500 ${s <= starsEarned ? "opacity-100 scale-110 animate-starPop" : "opacity-20 grayscale scale-75"}`}
                                    style={{ animationDelay: `${s * 0.2}s` }}>⭐</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full mb-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Correct</p>
                                <p className="text-lg sm:text-2xl font-black text-emerald-600">{correctCount}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-0.5">XP Earned</p>
                                <p className="text-lg sm:text-2xl font-black text-purple-600">{scorePercent >= 70 ? 50 : 25}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            {scorePercent >= 70 ? "Continue Adventure! →" : "Try Again →"}
                        </button>
                    </div>
                </main>
            )}

            {!isFinished && ai?.enabled !== undefined && currentQ?.targetWordId ? (
                <FoxHelper unitId={unitId} wordId={currentQ.targetWordId} aiEnabled={ai.enabled} />
            ) : null}

            {/* Streak celebration toast — fires once per session when the
                quiz submission ticks the streak counter up. */}
            <StreakCelebration />

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slideIn { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes celebrationPop {
                    0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                    60% { transform: scale(1.03) translateY(-5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-celebrationPop { animation: celebrationPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                @keyframes starPop {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.3); }
                    100% { transform: scale(1.1); }
                }
                .animate-starPop { animation: starPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </div>
    );
};

export default QuizScreen;
