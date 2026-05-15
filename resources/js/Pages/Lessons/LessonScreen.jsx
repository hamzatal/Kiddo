import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import { resolveMode, modeMeta, LESSON_STAGES } from "@/learning/core/lessonEngine";
import { playClick, playCheer, playStarCollect, playMagic } from "@/learning/utils/soundEffects";
import { launchConfetti } from "@/learning/utils/confetti";

import IntroMode from "@/learning/components/modes/IntroMode";
import VocabGameMode from "@/learning/components/modes/VocabGameMode";
import StoryMode from "@/learning/components/modes/StoryMode";
import ProjectMode from "@/learning/components/modes/ProjectMode";
import PictureDictMode from "@/learning/components/modes/PictureDictMode";
import DrawCircleMode from "@/learning/components/modes/DrawCircleMode";
import MatchConnectMode from "@/learning/components/modes/MatchConnectMode";
import MemoryGameMode from "@/learning/components/modes/MemoryGameMode";
import ListeningGameMode from "@/learning/components/modes/ListeningGameMode";
import DragDropMode from "@/learning/components/modes/DragDropMode";
import PictureMatchMode from "@/learning/components/modes/PictureMatchMode";
import WordPicConnectMode from "@/learning/components/modes/WordPicConnectMode";

import FoxHelper from "@/learning/components/ai/FoxHelper";
import AppHeader from "@/learning/components/ui/AppHeader";

/**
 * LessonScreen - Comprehensive lesson page.
 *
 * Features:
 *  - Unified responsive header (works on phone to 24-inch screens)
 *  - 12+ game modes (rotates by lesson number for variety)
 *  - Always-visible AI Fox helper (when configured)
 *  - Big celebration with confetti & stars on completion
 *  - Reward stage stays visible until user clicks Continue
 */
const LessonScreen = (props) => {
  const { unit, lesson, mode, intro, deck, audioTrack, progress, auth, ai } = usePage().props;
  // Also pull from props in case they came as direct props
  const _unit = props.unit || unit;
  const _lesson = props.lesson || lesson;
  const _mode = props.mode || mode;
  const _intro = props.intro || intro;
  const _deck = props.deck || deck;
  const _audioTrack = props.audioTrack || audioTrack;
  const _progress = props.progress || progress;

  const resolvedMode = useMemo(() => _mode || resolveMode(_lesson), [_mode, _lesson]);
  const meta = modeMeta(resolvedMode);

  const [stage, setStage] = useState(LESSON_STAGES.PLAY);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const safeUnit = _unit || { id: 1, title: "Lesson" };
  const safeLesson = _lesson || { id: 1, title: "" };

  const firstWord = useMemo(() => {
    if (_intro?.cards?.length) return _intro.cards[0];
    if (_deck?.length) {
      const o = _deck[0]?.options?.find((x) => x.isCorrect) || _deck[0]?.options?.[0];
      return o ? { id: o.id, word: o.word } : null;
    }
    return null;
  }, [_intro, _deck]);

  const goToMap = () => {
    playClick();
    router.visit("/map");
  };

  const onModeComplete = (summary) => {
    setResult(summary);
    setShowCelebration(true);

    // Big celebration sounds
    playCheer();
    launchConfetti(4500);
    setTimeout(() => playStarCollect(), 600);
    setTimeout(() => playStarCollect(), 1100);
    setTimeout(() => playStarCollect(), 1600);

    // Move to reward stage after a delay (so confetti is visible)
    setTimeout(() => {
      setStage(LESSON_STAGES.REWARD);
      setShowCelebration(false);
    }, 2500);

    // Persist to backend
    router.post(
      `/lesson/${safeUnit.id}/${safeLesson.id}/result`,
      { rounds: summary.rounds || [], durationMs: 0 },
      { preserveScroll: true, preserveState: true, only: ["flash"] }
    );
  };

  const continueAfterReward = () => {
    playClick();
    playMagic();
    router.visit(`/lesson/${safeUnit.id}`);
  };

  // Pick game mode based on lesson number for variety
  const renderMode = () => {
    const common = { lesson: safeLesson, audioTrack: _audioTrack, onComplete: onModeComplete };

    if (resolvedMode === "vocab-game" || resolvedMode === "review") {
      const lessonNum = safeLesson?.number || 1;
      const variant = lessonNum % 6;
      switch (variant) {
        case 0: return <VocabGameMode {...common} deck={_deck} />;
        case 1: return <MemoryGameMode {...common} deck={_deck} />;
        case 2: return <ListeningGameMode {...common} deck={_deck} />;
        case 3: return <DragDropMode {...common} deck={_deck} />;
        case 4: return <PictureMatchMode {...common} deck={_deck} />;
        case 5: return <WordPicConnectMode {...common} deck={_deck} />;
      }
    }

    switch (resolvedMode) {
      case "intro":         return <IntroMode {...common} intro={_intro} />;
      case "picture-dict":  return <PictureDictMode {...common} intro={_intro} />;
      case "story":         return <StoryMode {...common} />;
      case "project":       return <ProjectMode {...common} deck={_deck} />;
      case "song":          return <ListeningGameMode {...common} deck={_deck} />;
      case "phonics-game":  return <DragDropMode {...common} deck={_deck} />;
      case "draw-circle":   return <DrawCircleMode {...common} deck={_deck} />;
      case "match-connect": return <MatchConnectMode {...common} deck={_deck} />;
      case "memory-game":   return <MemoryGameMode {...common} deck={_deck} />;
      case "listening-game": return <ListeningGameMode {...common} deck={_deck} />;
      case "drag-drop":     return <DragDropMode {...common} deck={_deck} />;
      case "picture-match": return <PictureMatchMode {...common} deck={_deck} />;
      case "word-pic-connect": return <WordPicConnectMode {...common} deck={_deck} />;
      default:              return <VocabGameMode {...common} deck={_deck} />;
    }
  };

  const starsEarned = useMemo(() => {
    if (!result) return 1;
    const pct = (result.correct / Math.max(1, result.total)) * 100;
    if (["intro", "picture-dict", "project", "story"].includes(resolvedMode)) return 1;
    if (pct >= 90) return 3;
    if (pct >= 70) return 2;
    return 1;
  }, [result, resolvedMode]);

  const accuracy = result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : 100;
  const currentLesson = _progress?.current || 1;
  const totalLessons = _progress?.total || 1;
  const totalStars = auth?.user?.total_stars;
  const xp = auth?.user?.xp;

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-screen font-sans flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-5%] w-[20rem] h-[20rem] lg:w-[28rem] lg:h-[28rem] bg-purple-100/40 rounded-full blur-[80px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[16rem] h-[16rem] lg:w-[22rem] lg:h-[22rem] bg-cyan-100/40 rounded-full blur-[60px]" />
        <div className="absolute top-[40%] left-[40%] w-[14rem] h-[14rem] bg-pink-100/30 rounded-full blur-[50px]" />
      </div>

      {/* Unified Header */}
      <AppHeader
        unitTitle={safeUnit.title}
        lessonTitle={safeLesson?.title}
        modeLabel={meta.label}
        modeIcon={meta.icon}
        modeColor={meta.color}
        current={currentLesson}
        total={totalLessons}
        totalStars={totalStars}
        xp={xp}
        onBack={goToMap}
      />

      {/* Main content area */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 lg:px-6 py-3 lg:py-5 overflow-y-auto">
        {stage === LESSON_STAGES.PLAY && renderMode()}

        {stage === LESSON_STAGES.REWARD && (
          <CelebrationStage
            stars={starsEarned}
            accuracy={accuracy}
            onContinue={continueAfterReward}
          />
        )}
      </main>

      {/* Big celebration overlay (shown for 2.5s before reward stage) */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-yellow-300 animate-celebPop">
            <div className="text-center">
              <div className="text-6xl sm:text-8xl mb-3 animate-bounce">🎉</div>
              <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Awesome!
              </h2>
              <p className="text-gray-500 font-bold text-sm sm:text-base">Lesson complete!</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Fox helper */}
      {ai?.enabled !== undefined && stage === LESSON_STAGES.PLAY && firstWord?.id ? (
        <FoxHelper unitId={safeUnit.id} wordId={firstWord.id} aiEnabled={ai.enabled} />
      ) : null}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes celebPop {
          0% { opacity: 0; transform: scale(0.5) translateY(40px); }
          50% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-celebPop { animation: celebPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @media (min-width: 480px) {
          .xs\\:flex { display: flex; }
        }
      `}</style>
    </div>
  );
};

/**
 * CelebrationStage - Big reward screen after lesson.
 * Shows stars, accuracy, and Continue button. Stays until user clicks.
 */
const CelebrationStage = ({ stars = 1, accuracy = 100, onContinue }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  const getMessage = () => {
    if (stars === 3) return { title: "Superstar!", emoji: "🌟", subtitle: "Perfect score!", color: "from-amber-400 to-yellow-500" };
    if (stars === 2) return { title: "Great Job!", emoji: "🎉", subtitle: "You're doing great!", color: "from-emerald-400 to-green-500" };
    return { title: "Well Done!", emoji: "👏", subtitle: "Keep going, you'll get it!", color: "from-blue-400 to-indigo-500" };
  };
  const msg = getMessage();

  return (
    <div className={`w-full max-w-lg mx-auto transition-all duration-500 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 lg:p-12 flex flex-col items-center text-center shadow-2xl border border-white/60 relative overflow-hidden">
        {/* Decorative bg */}
        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${msg.color} opacity-10`} />
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Big emoji icon */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center shadow-xl border-4 border-white -mt-16 sm:-mt-20 mb-4">
            <span className="text-5xl sm:text-7xl drop-shadow-lg">{msg.emoji}</span>
          </div>

          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r ${msg.color} bg-clip-text text-transparent mb-2`}>
            {msg.title}
          </h1>
          <p className="text-sm sm:text-lg text-gray-500 font-bold mb-5 sm:mb-6">{msg.subtitle}</p>

          {/* Stars row */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-5 sm:mb-7">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-4xl sm:text-6xl lg:text-7xl transition-all duration-700 ${
                  s <= stars ? 'opacity-100 scale-110 drop-shadow-xl' : 'opacity-20 grayscale scale-75'
                }`}
                style={{ animationDelay: `${s * 0.2}s` }}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6 sm:mb-8">
            <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl text-center">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Accuracy</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-700">{accuracy}%</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 px-4 py-3 rounded-2xl text-center">
              <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider mb-0.5">Stars</p>
              <p className="text-xl sm:text-2xl font-black text-purple-700">+{stars}</p>
            </div>
          </div>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg lg:text-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Continue Adventure! →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonScreen;
