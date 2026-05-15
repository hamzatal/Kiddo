import React, { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick, playCheer, playStarCollect, playBounce } from "@/learning/utils/soundEffects";
import { launchConfetti, launchStars } from "@/learning/utils/confetti";

/**
 * QuizScreen - Complete redesign with:
 * - Sound effects for correct/wrong answers
 * - Celebration animations on completion
 * - Fully responsive layout
 * - Kid-friendly modern design
 * - Error tracking
 */
const QuizScreen = ({ quizData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCorrect, setSelectedCorrect] = useState(null);
  const [wrongClicks, setWrongClicks] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [questionStats, setQuestionStats] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [errors, setErrors] = useState([]); // Track errors for parent dashboard
  const containerRef = useRef(null);

  const unitId = quizData?.unitId || 1;
  const unitTitle = quizData?.unitTitle || "Quiz";
  const questions = quizData?.questions || [];

  const currentQ = questions[currentIndex];
  const progressPercentage = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    stopAllAudio();
    return () => stopAllAudio();
  }, [currentIndex]);

  // Auto-play target word on new question
  useEffect(() => {
    if (currentQ?.audioClip) {
      setTimeout(() => playAudio(currentQ.audioClip), 300);
    }
  }, [currentIndex]);

  const playTarget = () => {
    playClick();
    if (currentQ?.audioClip) {
      playAudio(currentQ.audioClip);
    } else if (currentQ?.audioPath) {
      playAudio(currentQ.audioPath);
    }
  };

  const handleChoice = (opt) => {
    if (selectedCorrect !== null) return;

    if (opt.isCorrect) {
      setSelectedCorrect(opt.id);
      playSuccess();
      
      // Star burst animation at click position
      setTimeout(() => {
        const el = containerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          launchStars(rect.width / 2, rect.height / 2, 8);
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
          triggerCelebration(nextStats);
        }
      }, 1200);
    } else {
      playFail();
      setWrongClicks([...wrongClicks, opt.id]);
      
      // Track error for parent dashboard
      setErrors(prev => [...prev, {
        word: currentQ.targetWord,
        wrongChoice: opt.word,
        timestamp: Date.now(),
      }]);
    }
  };

  const triggerCelebration = (finalStats) => {
    setIsFinished(true);
    setShowCelebration(true);
    playCheer();
    launchConfetti(5000);
    
    // Play star collect sounds with delay
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
      errors: errors, // Send errors for tracking
    });
  };

  if (questions.length === 0) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-purple-50 to-pink-100">
        <div className="text-center p-8">
          <span className="text-6xl block mb-4">📝</span>
          <h2 className="text-2xl font-black text-gray-800 mb-2">No Questions Yet</h2>
          <p className="text-gray-500 mb-6">This quiz doesn't have questions available.</p>
          <button onClick={() => router.visit('/map')} className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[100dvh] w-screen font-sans flex flex-col overflow-hidden relative bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      {/* Animated background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[20rem] h-[20rem] sm:w-[28rem] sm:h-[28rem] bg-blue-200/40 rounded-full blur-[60px] animate-float1" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[18rem] h-[18rem] sm:w-[24rem] sm:h-[24rem] bg-purple-200/40 rounded-full blur-[60px] animate-float2" />
        <div className="absolute top-[40%] left-[60%] w-[14rem] h-[14rem] bg-amber-200/30 rounded-full blur-[50px] animate-float3" />
      </div>

      {/* Header */}
      <header className="relative z-20 shrink-0 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { playClick(); router.visit("/map"); }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/80 backdrop-blur rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-white/50 transition-colors"
              >
                ✕
              </button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Quiz Time</p>
                <p className="text-xs font-black text-gray-700">{unitTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-gray-600 bg-white/80 px-3 py-1.5 rounded-full border border-white/50">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          {!isFinished && (
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm p-2 rounded-full border border-white/50 shadow-sm">
              <span className="text-sm sm:text-lg shrink-0">🌟</span>
              <div className="flex-1 h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Quiz Content */}
      {!isFinished ? (
        <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
          <div key={currentIndex} className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4 sm:gap-6 animate-slideIn">
            {/* Question prompt */}
            <div className="bg-white/90 backdrop-blur px-5 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 flex items-center gap-3 sm:gap-4 w-full max-w-lg">
              <button
                type="button"
                onClick={playTarget}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl sm:text-2xl shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shrink-0"
              >
                🔊
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider mb-0.5">Find this word:</p>
                <h2 className="text-xl sm:text-3xl font-black text-gray-800 truncate">
                  {currentQ.targetWord}
                </h2>
              </div>
            </div>

            {/* Options grid - responsive */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-2xl px-1">
              {currentQ.options.map((opt) => {
                const isWrong = wrongClicks.includes(opt.id);
                const isCorrectPick = selectedCorrect === opt.id;

                let cardStyle = "border-white/60 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1";
                if (isCorrectPick) cardStyle = "border-emerald-400 bg-emerald-50 scale-[1.02] shadow-xl ring-2 ring-emerald-200";
                else if (isWrong) cardStyle = "border-red-200 bg-red-50/50 opacity-50 scale-95 cursor-not-allowed";

                return (
                  <button
                    key={opt.id}
                    disabled={selectedCorrect !== null || isWrong}
                    onClick={() => handleChoice(opt)}
                    className={`relative aspect-square sm:aspect-[4/3] p-3 sm:p-4 bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl border-2 transition-all duration-300 shadow-sm flex flex-col items-center justify-center gap-1.5 ${cardStyle}`}
                  >
                    {opt.imagePath ? (
                      <img
                        src={opt.imagePath}
                        alt={opt.word}
                        className="w-full h-[60%] object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-2xl sm:text-4xl font-black text-gray-300 uppercase">{opt.word}</span>
                    )}
                    <span className="text-[10px] sm:text-xs font-black uppercase text-gray-600 tracking-wide truncate w-full text-center">
                      {opt.word}
                    </span>

                    {isCorrectPick && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-lg font-black border-2 border-white shadow-lg animate-bounce">
                        ✓
                      </div>
                    )}
                    {isWrong && (
                      <div className="absolute -top-2 -right-2 bg-red-400 text-white w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-lg font-black border-2 border-white shadow">
                        ✕
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      ) : (
        /* Celebration / Results Screen */
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-celebrationPop">
            {/* Trophy */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white -mt-16 sm:-mt-20 mb-4">
              <span className="text-4xl sm:text-6xl">🏆</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-gray-800 mb-2">
              {scorePercent >= 90 ? "Amazing!" : scorePercent >= 70 ? "Great Job!" : "Good Try!"}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-bold mb-6">
              You scored <span className="text-emerald-500 font-black">{correctCount}</span> out of <span className="font-black">{questions.length}</span> on first try!
            </p>

            {/* Stars */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`text-3xl sm:text-5xl transition-all duration-500 ${
                    s <= starsEarned ? 'opacity-100 scale-110 animate-starPop' : 'opacity-20 grayscale scale-75'
                  }`}
                  style={{ animationDelay: `${s * 0.2}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Correct</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600">{correctCount}</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl text-center">
                <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-1">XP Earned</p>
                <p className="text-xl sm:text-2xl font-black text-purple-600">{scorePercent >= 70 ? 50 : 25}</p>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {scorePercent >= 70 ? "Continue Adventure! →" : "Try Again →"}
            </button>
          </div>
        </main>
      )}

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

        @keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(20px, -30px); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 20px); } }
        @keyframes float3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(10px, -15px); } }
        .animate-float1 { animation: float1 12s ease-in-out infinite; }
        .animate-float2 { animation: float2 10s ease-in-out infinite; }
        .animate-float3 { animation: float3 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default QuizScreen;
