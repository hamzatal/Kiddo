import React, { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import { resolveMode, modeMeta, LESSON_STAGES } from "@/learning/core/lessonEngine";
import { playReward, playClick } from "@/learning/utils/soundEffects";

import IntroMode from "@/learning/components/modes/IntroMode";
import VocabGameMode from "@/learning/components/modes/VocabGameMode";
import StoryMode from "@/learning/components/modes/StoryMode";
import ProjectMode from "@/learning/components/modes/ProjectMode";
import PictureDictMode from "@/learning/components/modes/PictureDictMode";

import FoxHelper from "@/learning/components/ai/FoxHelper";
import NavAIBadge from "@/learning/components/ai/NavAIBadge";

/**
 * LessonScreen v2 — generic engine that renders the right mode for a
 * given lesson.type. Props come from LessonController@show:
 *
 *   unit       - { id, number, code, title, colorKey }
 *   lesson     - { id, number, pageNumber, title, type, config }
 *   mode       - string
 *   intro      - used by intro / picture-dict
 *   deck       - used by vocab-game / phonics-game / review / song
 *   audioTrack - primary NCCD track for the lesson (streamed, not downloaded)
 *   progress   - { current, total, starsInUnit }
 */
const LessonScreen = (props) => {
    const { unit, lesson, mode, intro, deck, audioTrack, progress } = props;
    const { ai } = usePage().props;

    const resolvedMode = useMemo(() => mode || resolveMode(lesson), [mode, lesson]);
    const meta = modeMeta(resolvedMode);

    const [stage, setStage] = useState(LESSON_STAGES.PLAY); // most modes jump straight in
    const [result, setResult] = useState(null);

    const safeUnit = unit || { id: 1, title: "Lesson" };

    // Per-mode primary word for AI helper context
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
        // summary: { correct, total, rounds }
        setResult(summary);
        setStage(LESSON_STAGES.REWARD);
        playReward();

        // Persist to backend and let it decide next step.
        router.post(
            `/lesson/${safeUnit.id}/${lesson.id}/result`,
            {
                rounds: summary.rounds || [],
                durationMs: 0,
            },
            {
                preserveScroll: true,
                preserveState: true,
                only: ["flash"],
            }
        );
    };

    const continueAfterReward = () => {
        // The POST above already stored progress server-side; just visit
        // the lesson route which will render the next lesson or the quiz.
        router.visit(`/lesson/${safeUnit.id}`);
    };

    const renderMode = () => {
        const common = { lesson, audioTrack, onComplete: onModeComplete };
        switch (resolvedMode) {
            case "intro":         return <IntroMode       {...common} intro={intro} />;
            case "picture-dict":  return <PictureDictMode {...common} intro={intro} />;
            case "story":         return <StoryMode       {...common} />;
            case "project":       return <ProjectMode     {...common} deck={deck} />;
            case "song":          return <VocabGameMode   {...common} deck={deck} promptText="Listen, match and sing!" />;
            case "review":        return <VocabGameMode   {...common} deck={deck} promptText="Review time — find the word!" />;
            case "phonics-game":  return <VocabGameMode   {...common} deck={deck} promptText="Listen to the sound and choose!" />;
            case "vocab-game":
            default:              return <VocabGameMode   {...common} deck={deck} />;
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
        <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#F4F8FB] via-white to-[#FDF4FF] font-sans flex flex-col relative overflow-hidden">
            {/* Blurry background shapes */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[28rem] h-[28rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[28rem] h-[28rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[28rem] h-[28rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000" />
            </div>

            {/* Header */}
            <header className="relative z-20 flex flex-col gap-3 p-4 sm:p-6">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/90 border border-white shadow-sm text-purple-600">
                            {safeUnit.title}
                        </span>
                        {lesson?.title ? (
                            <span className="hidden sm:inline-flex text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/60 border border-white text-gray-500">
                                {lesson.title}
                            </span>
                        ) : null}
                        <NavAIBadge enabled={ai?.enabled} />
                    </div>
                    <button
                        onClick={goToMap}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-gray-400 hover:text-rose-500 shadow-md transition-colors"
                        aria-label="Back to map"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress bar + mode pill */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white shadow-sm">
                    <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            Progress
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-400 to-[#7C3AED] rounded-full transition-all duration-700"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-[11px] font-black text-[#7C3AED]">
                            {currentLesson} / {totalLessons}
                        </span>
                    </div>
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide shadow-inner"
                        style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                    >
                        <span className="text-base">{meta.icon}</span>
                        <span>{meta.label}</span>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 relative z-10 w-full flex justify-center items-start p-4 sm:p-6 pb-28">
                {stage === LESSON_STAGES.PLAY && renderMode()}

                {stage === LESSON_STAGES.REWARD && (
                    <RewardStage
                        stars={starsEarned}
                        accuracy={result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : 100}
                        onContinue={continueAfterReward}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 sm:p-6 flex justify-between items-center pointer-events-none">
                <button
                    onClick={goToMap}
                    className="pointer-events-auto text-gray-500 font-black hover:text-[#7C3AED] transition-colors text-xs sm:text-sm flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-white shadow-sm"
                >
                    🗺️ <span className="hidden sm:inline">Back to map</span>
                </button>
                <div className="pointer-events-auto text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {lesson?.pageNumber ? `Book page ${lesson.pageNumber}` : null}
                </div>
            </footer>

            {/* AI Fox helper — hidden on reward */}
            {ai?.enabled !== undefined && stage === LESSON_STAGES.PLAY && firstWord?.id ? (
                <FoxHelper
                    unitId={safeUnit.id}
                    wordId={firstWord.id}
                    aiEnabled={ai.enabled}
                />
            ) : null}

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 14s infinite ease-in-out; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

const RewardStage = ({ stars = 1, accuracy = 100, onContinue }) => {
    return (
        <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative animate-fade-in-up border border-white my-6">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-4 relative z-10 -mt-24">
                <span className="text-6xl drop-shadow">🏆</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[#1E293B] tracking-tight mb-2">
                {stars === 3 ? "Superstar!" : stars === 2 ? "Great job!" : "Nice try!"}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-bold mb-6">
                You scored {accuracy}% on this lesson.
            </p>

            <div className="flex items-center gap-2 mb-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <span
                        key={i}
                        className={`text-4xl transition-all ${
                            i < stars ? "opacity-100 scale-110 drop-shadow" : "opacity-30 grayscale"
                        }`}
                    >
                        ⭐
                    </span>
                ))}
            </div>

            <button
                onClick={onContinue}
                className="w-full sm:w-auto bg-[#10B981] text-white px-12 py-4 rounded-[2rem] font-black text-lg shadow-[0_8px_0_#059669] hover:translate-y-[2px] transition-all"
            >
                Continue →
            </button>
        </div>
    );
};

export default LessonScreen;
