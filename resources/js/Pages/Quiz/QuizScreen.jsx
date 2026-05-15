import React, { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import {
    playSuccess,
    playFail,
    playClick,
    playReward,
} from "@/learning/utils/soundEffects";

import PlaySurface from "@/learning/components/ui/PlaySurface";
import ConfettiBurst from "@/learning/components/ui/ConfettiBurst";

/**
 * Quiz screen for the unit boss. Wraps in PlaySurface (FIX 4) and
 * adds proper sound effects (FIX 3): playSuccess on correct,
 * playFail on wrong, playClick on every tap.
 */
const QuizScreen = ({ quizData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedCorrect, setSelectedCorrect] = useState(null);
    const [wrongClicks, setWrongClicks] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [questionStats, setQuestionStats] = useState([]);
    const [soundOn, setSoundOn] = useState(true);

    const unitId = quizData?.unitId || 1;
    const unitTitle = quizData?.unitTitle || "Unit Quiz";
    const questions = quizData?.questions || [
        {
            targetWord: "Word",
            options: [
                { id: "1", word: "Word", imagePath: null, isCorrect: true },
            ],
        },
    ];

    const currentQ = questions[currentIndex];

    useEffect(() => {
        stopAllAudio();
        return () => stopAllAudio();
    }, [currentIndex]);

    const playTarget = () => {
        if (!soundOn) return;
        if (currentQ?.audioClip) {
            playAudio(currentQ.audioClip);
        } else if (currentQ?.audioPath) {
            playAudio(currentQ.audioPath);
        }
    };

    const handleChoice = (opt) => {
        // FIX 3 — sound on every click + sound on right/wrong.
        if (soundOn) playClick();
        if (soundOn && opt.audioClip) {
            playAudio(opt.audioClip);
        }

        if (opt.isCorrect) {
            if (soundOn) playSuccess();
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
                    if (soundOn) playReward();
                    setIsFinished(true);
                }
            }, 1200);
        } else {
            if (soundOn) playFail();
            setWrongClicks([...wrongClicks, opt.id]);
        }
    };

    const correctCount = questionStats.filter((s) => s.correct).length;
    const wrongCount = questionStats.length - correctCount;

    const handleFinish = () => {
        if (soundOn) playClick();
        router.post("/quiz/submit", {
            unitId,
            correctCount,
            wrongCount,
            total: questions.length,
        });
    };

    const roundResults = questionStats.map((s) => ({ correct: s.correct }));
    const mascotMessage = isFinished
        ? `${correctCount}/${questions.length} on the first try!`
        : currentQ
            ? `Find “${currentQ.targetWord}”!`
            : "Quiz time!";

    return (
        <PlaySurface
            unitTitle={`${unitTitle} · Quiz`}
            modeIcon="🎯"
            modeLabel="Quiz"
            modeColor="#7C3AED"
            progressCurrent={currentIndex}
            progressTotal={questions.length}
            roundResults={roundResults}
            mascotMessage={mascotMessage}
            soundOn={soundOn}
            onToggleSound={(v) => setSoundOn(v)}
            onBack={() => router.visit("/map")}
        >
            {!isFinished ? (
                <div
                    key={currentIndex}
                    className="w-full flex flex-col items-center gap-6 animate-fade-in-up"
                >
                    <div className="bg-white/95 backdrop-blur-md px-6 sm:px-10 py-4 rounded-[2rem] shadow-md border border-white flex items-center gap-3">
                        <h2 className="text-2xl sm:text-4xl font-black text-[#1E293B] text-center">
                            Where is{" "}
                            <span className="text-[#7C3AED] uppercase underline decoration-dashed">
                                {currentQ.targetWord}
                            </span>
                            ?
                        </h2>
                        <button
                            type="button"
                            onClick={playTarget}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#7C3AED] text-white text-xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                            aria-label={`Hear ${currentQ.targetWord}`}
                            title="Listen again"
                        >
                            🔊
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-5 w-full">
                        {currentQ.options.map((opt) => {
                            const isWrong = wrongClicks.includes(opt.id);
                            const isCorrectSelected = selectedCorrect === opt.id;

                            return (
                                <button
                                    key={opt.id}
                                    disabled={selectedCorrect !== null || isWrong}
                                    onClick={() => handleChoice(opt)}
                                    className={`aspect-[5/4] p-5 lg:p-6 bg-white/95 backdrop-blur-xl rounded-[2rem] border-4 transition-all duration-300 shadow-md flex items-center justify-center relative
                                        ${
                                            isCorrectSelected
                                                ? "border-green-500 bg-green-50 scale-105 z-10 shadow-2xl"
                                                : isWrong
                                                  ? "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed"
                                                  : "border-white hover:border-purple-300 hover:shadow-xl hover:-translate-y-1"
                                        }`}
                                >
                                    {opt.imagePath ? (
                                        <img
                                            src={opt.imagePath}
                                            alt={opt.word}
                                            className="max-h-32 lg:max-h-40 xl:max-h-48 object-contain drop-shadow-md"
                                            onError={(e) =>
                                                (e.currentTarget.outerHTML = `<span class="text-3xl font-black uppercase text-gray-400">${opt.word}</span>`)
                                            }
                                        />
                                    ) : (
                                        <span className="text-2xl sm:text-4xl font-black text-gray-400 uppercase">
                                            {opt.word}
                                        </span>
                                    )}

                                    {isCorrectSelected && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-black border-4 border-white shadow-lg animate-bounce">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="relative w-full flex justify-center">
                    <ConfettiBurst pieces={90} />
                    <div className="relative z-30 w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 sm:p-14 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-fade-in-up border border-white">
                        <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-4 -mt-24">
                            <span className="text-6xl drop-shadow">🏆</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black text-[#1E293B] tracking-tight mb-3">
                            Quiz Complete!
                        </h1>
                        <p className="text-base sm:text-lg text-gray-500 font-bold mb-8 max-w-md">
                            You got{" "}
                            <span className="text-emerald-600">
                                {correctCount} / {questions.length}
                            </span>{" "}
                            on your first try.
                        </p>

                        <button
                            onClick={handleFinish}
                            className="w-full sm:w-auto bg-[#10B981] text-white px-12 py-4 rounded-[2rem] font-black text-lg shadow-[0_8px_0_#059669] hover:translate-y-[2px] transition-all"
                        >
                            COLLECT REWARDS →
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
            `}</style>
        </PlaySurface>
    );
};

export default QuizScreen;
