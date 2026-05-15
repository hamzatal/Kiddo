import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import { resolveMode, modeMeta, LESSON_STAGES } from "@/learning/core/lessonEngine";
import { playReward, playClick, playCheer, playStarCollect, playMagic, playBounce } from "@/learning/utils/soundEffects";
import { launchConfetti, launchStars } from "@/learning/utils/confetti";

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

import FoxHelper from "@/learning/components/ai/FoxHelper";
import NavAIBadge from "@/learning/components/ai/NavAIBadge";

/**
 * LessonScreen - Complete redesign with:
 * - Fresh modern UI that's totally different from the old design
 * - Fully responsive (mobile-first)
 * - Multiple game modes including new ones
 * - Proper celebration with confetti
 * - Better sounds throughout
 */
const LessonScreen = (props) => {
  const { unit, lesson, mode, intro, deck, audioTrack, progress } = props;
  const { ai } = usePage().props;

  const resolvedMode = useMemo(() => mode || resolveMode(lesson), [mode, lesson]);
  const meta = modeMeta(resolvedMode);

  const [stage, setStage] = useState(LESSON_STAGES.PLAY);
  const [result, setResult] = useState(null);

  const safeUnit = unit || { id: 1, title: "Lesson" };

  const firstWord = useMemo(() => {
    if (intro?.cards?.length) return intro.cards[0];
    if (deck?.length) {
      const o = deck[0]?.options?.find((x) => x.isCorrect) || deck[0]?.options?.[0];
      return o ? { id: o.id, word: o.word } : null;
    }
    return null;
  }, [intro, deck]);

  const goToMap = () => {
    playClick();
    router.visit("/map");
  };

  const onModeComplete = (summary) => {
    setResult(summary);
    setStage(LESSON_STAGES.REWARD);
    
    // Play celebration sounds
    playCheer();
    launchConfetti(3500);
    setTimeout(() => playStarCollect(), 600);
    setTimeout(() => playStarCollect(), 1000);

    // Persist to backend
    router.post(
      `/lesson/${safeUnit.id}/${lesson.id}/result`,
      { rounds: summary.rounds || [], durationMs: 0 },
      { preserveScroll: true, preserveState: true, only: ["flash"] }
    );
  };

  const continueAfterReward = () => {
    playClick();
    playMagic();
    router.visit(`/lesson/${safeUnit.id}`);
  };

  // Assign game modes - add variety by using lesson number to pick different game types
  const renderMode = () => {
    const common = { lesson, audioTrack, onComplete: onModeComplete };
    
    // For vocab-game type, rotate between different game modes based on lesson number
    if (resolvedMode === 'vocab-game' || resolvedMode === 'review') {
      const lessonNum = lesson?.number || 1;
      const gameVariant = lessonNum % 4;
      
      switch (gameVariant) {
        case 0: return <VocabGameMode {...common} deck={deck} />;
        case 1: return <MemoryGameMode {...common} deck={deck} />;
        case 2: return <ListeningGameMode {...common} deck={deck} />;
        case 3: return <DragDropMode {...common} deck={deck} />;
      }
    }

    switch (resolvedMode) {
      case "intro":         return <IntroMode {...common} intro={intro} />;
      case "picture-dict":  return <PictureDictMode {...common} intro={intro} />;
      case "story":         return <StoryMode {...common} />;
      case "project":       return <ProjectMode {...common} deck={deck} />;
      case "song":          return <ListeningGameMode {...common} deck={deck} />;
      case "phonics-game":  return <DragDropMode {...common} deck={deck} />;
      case "draw-circle":   return <DrawCircleMode {...common} deck={deck} />;
      case "match-connect": return <MatchConnectMode {...common} deck={deck} />;
      default:              return <VocabGameMode {...common} deck={deck} />;
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

  const currentLesson = progress?.current || 1;
  const totalLessons = progress?.total || 1;
  const progressPct = totalLessons > 0 ? ((currentLesson - 1) / totalLessons) * 100 : 0;

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-screen font-sans flex flex-col relative overflow-hidden bg-[#FAFBFF]">
      {/* Background - subtle, modern gradient */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-indigo-50/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-amber-50/50 to-transparent" />
        <div className="absolute top-[20%] right-[-5%] w-[15rem] sm:w-[20rem] h-[15rem] sm:h-[20rem] bg-purple-100/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[12rem] sm:w-[16rem] h-[12rem] sm:h-[16rem] bg-blue-100/30 rounded-full blur-[60px]" />
      </div>

      {/* Compact Header */}
      <header className="relative z-20 shrink-0 px-3 sm:px-4 pt-3 pb-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
          {/* Back button */}
          <button
            onClick={goToMap}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-white/80 backdrop-blur rounded-lg sm:rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {/* Progress area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider truncate">{safeUnit.title}</span>
              <span className="text-[9px] font-bold text-gray-300 hidden sm:inline">•</span>
              <span className="text-[9px] font-bold text-gray-400 hidden sm:inline truncate">{lesson?.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}CC)` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black shrink-0" style={{ color: meta.color }}>
                {currentLesson}/{totalLessons}
              </span>
            </div>
          </div>

          {/* Mode badge */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-black" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
            <span>{meta.icon}</span>
            <span className="hidden sm:inline">{meta.label}</span>
          </div>

          {ai?.enabled !== undefined && <NavAIBadge enabled={ai.enabled} />}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 py-3 overflow-y-auto">
        {stage === LESSON_STAGES.PLAY && renderMode()}

        {stage === LESSON_STAGES.REWARD && (
          <CelebrationStage
            stars={starsEarned}
            accuracy={result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : 100}
            onContinue={continueAfterReward}
          />
        )}
      </main>

      {/* AI Fox helper */}
      {ai?.enabled !== undefined && stage === LESSON_STAGES.PLAY && firstWord?.id ? (
        <FoxHelper unitId={safeUnit.id} wordId={firstWord.id} aiEnabled={ai.enabled} />
      ) : null}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

/**
 * CelebrationStage - Shown after completing a lesson.
 * Includes confetti-like animations and star rewards.
 */
const CelebrationStage = ({ stars = 1, accuracy = 100, onContinue }) => {
  const getMessage = () => {
    if (stars === 3) return { title: "Superstar!", emoji: "🌟", subtitle: "Perfect score!" };
    if (stars === 2) return { title: "Great Job!", emoji: "🎉", subtitle: "Almost perfect!" };
    return { title: "Well Done!", emoji: "👏", subtitle: "Keep practicing!" };
  };
  const msg = getMessage();

  return (
    <div className="w-full max-w-sm animate-celebPop">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-xl border border-white/60 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Big emoji */}
          <span className="text-5xl sm:text-6xl mb-3 animate-bounceIn">{msg.emoji}</span>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-1">{msg.title}</h1>
          <p className="text-sm text-gray-500 font-bold mb-4">{msg.subtitle}</p>

          {/* Stars */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`text-3xl sm:text-4xl transition-all duration-500 ${
                  s <= stars ? 'opacity-100 scale-110' : 'opacity-20 grayscale scale-75'
                }`}
                style={{ animationDelay: `${s * 0.15}s` }}
              >
                ⭐
              </span>
            ))}
          </div>

          {/* Score */}
          <div className="bg-gray-50 rounded-2xl px-5 py-3 mb-5 border border-gray-100">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-2xl font-black text-gray-800">{accuracy}%</p>
          </div>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Next Lesson →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonScreen;
