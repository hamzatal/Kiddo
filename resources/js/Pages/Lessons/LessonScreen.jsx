import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PageHead from "@/learning/components/ui/PageHead";
import StreakCelebration from "@/learning/components/ui/StreakCelebration";

import { resolveMode, modeMeta, LESSON_STAGES } from "@/learning/core/lessonEngine";
import { playClick, playCheer, playStarCollect, playMagic } from "@/learning/utils/soundEffects";
import { stopAllAudio } from "@/learning/utils/playAudio";
import { launchConfetti } from "@/learning/utils/confetti";

import IntroMode from "@/learning/components/modes/IntroMode";
import VocabGameMode from "@/learning/components/modes/VocabGameMode";
import StoryMode from "@/learning/components/modes/StoryMode";
import ProjectMode from "@/learning/components/modes/ProjectMode";
import PictureDictMode from "@/learning/components/modes/PictureDictMode";
import DrawCircleMode from "@/learning/components/modes/DrawCircleMode";
import MatchConnectMode from "@/learning/components/modes/MatchConnectMode";
import MemoryGameMode from "@/learning/components/modes/MemoryGameMode";
import MemoryFlipMode from "@/learning/components/modes/MemoryFlipMode";
import ListeningGameMode from "@/learning/components/modes/ListeningGameMode";
import DragDropMode from "@/learning/components/modes/DragDropMode";
import PictureMatchMode from "@/learning/components/modes/PictureMatchMode";
import WordPicConnectMode from "@/learning/components/modes/WordPicConnectMode";
import BubblePopMode from "@/learning/components/modes/BubblePopMode";
import SequenceBuildMode from "@/learning/components/modes/SequenceBuildMode";
import SpeedTapMode from "@/learning/components/modes/SpeedTapMode";

import FoxHelper from "@/learning/components/ai/FoxHelper";
import AppHeader from "@/learning/components/ui/AppHeader";

/**
 * LessonScreen — the play page (Kiddo v3).
 *
 * Layout invariants:
 *  • The page always fits the viewport (h-[100dvh], no overflow).
 *  • Header is fixed-height; main content fills the rest with its
 *    own scroll container (overflow-y-auto). Most modes are designed
 *    to fit a 720p tablet without scrolling.
 *  • All modes get the same horizontal padding, so they look like a
 *    family of pages rather than one-offs.
 *  • Reward stage is sticky — the kid taps Continue to advance.
 *
 * Mode rotation:
 *  • The 'vocab-game'/'review' canonical modes randomise across the
 *    full library of game styles using lesson_number % N so the
 *    same sequence is reproducible per lesson, but kids see variety.
 *  • Newer modes (Bubble Pop, Speed Tap, Memory Flip, Sequence
 *    Build) are now in rotation alongside the earlier styles.
 */
const LessonScreen = (props) => {
    const { unit, lesson, mode, intro, deck, audioTrack, progress, auth, ai } = usePage().props;
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

    /**
     * Master audio cleanup — fires when the player navigates away
     * from the lesson (Inertia route change, browser back, deep
     * link, etc.). The 16 game modes don't all individually call
     * `stopAllAudio()` because some use multi-step audio chains
     * (auto-play → click for again → on-success cheer) and aborting
     * mid-step would cut the kid off. Owning the cleanup here means
     * one guarantee: leaving a lesson silences everything, no
     * "ghost word" carries over to the next page. Mirrors the
     * pattern already used by ArenaScreen and QuizScreen.
     */
    useEffect(() => {
        return () => stopAllAudio();
    }, []);

    const goToMap = () => {
        playClick();
        router.visit("/map");
    };

    const onModeComplete = (summary) => {
        setResult(summary);
        setShowCelebration(true);
        playCheer();
        launchConfetti(4500);
        setTimeout(() => playStarCollect(), 600);
        setTimeout(() => playStarCollect(), 1100);
        setTimeout(() => playStarCollect(), 1600);
        setTimeout(() => {
            setStage(LESSON_STAGES.REWARD);
            setShowCelebration(false);
        }, 2200);

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

    /**
     * "I'm stuck" / Skip — let the kid bail out of any mode without
     * losing their progress. We synthesise a minimal "1/1 correct"
     * result so ProgressService still records the attempt and
     * advances them to the next lesson. Used by the Skip control we
     * render at the bottom of every play surface.
     */
    const skipLesson = () => {
        playClick();
        onModeComplete({ correct: 1, total: 1, rounds: [] });
    };

    /**
     * Pick the actual mode to render.
     *
     * v3 (2026-05): we used to ROTATE 'vocab-game' across 10 game
     * variants based on lesson number. That made the lesson-card
     * label ("Play", "Vocab Game") wildly inconsistent with what
     * actually rendered — kids would tap "Colours & Numbers"
     * (vocab-game) and land in a listen-only round with no word
     * visible. Authors lost control of the experience too.
     *
     * Now: vocab-game ALWAYS renders VocabGameMode (picture match
     * with the prompt word visible), and we only use the rotation
     * for explicitly-mixed lesson types ('review' or
     * 'mixed-practice') that exist for variety on purpose. Authors
     * who want a memory game / bubble pop / etc. simply set the
     * lesson's mode to that exact value in the seeder/admin.
     */
    const renderMode = () => {
        const common = { lesson: safeLesson, audioTrack: _audioTrack, onComplete: onModeComplete };
        const VARIANTS = [
            VocabGameMode,
            MemoryGameMode,
            ListeningGameMode,
            DragDropMode,
            PictureMatchMode,
            WordPicConnectMode,
            BubblePopMode,
            SpeedTapMode,
            MemoryFlipMode,
            MatchConnectMode,
        ];

        // Only review/mixed-practice rotate — every other mode
        // renders exactly what the author asked for.
        if (resolvedMode === "review" || resolvedMode === "mixed-practice") {
            const lessonNum = safeLesson?.number || safeLesson?.lesson_number || 1;
            const Variant = VARIANTS[lessonNum % VARIANTS.length];
            return <Variant {...common} deck={_deck} />;
        }

        switch (resolvedMode) {
            case "vocab-game":      return <VocabGameMode {...common} deck={_deck} />;
            case "intro":           return <IntroMode {...common} intro={_intro} />;
            case "picture-dict":    return <PictureDictMode {...common} intro={_intro} />;
            case "story":           return <StoryMode {...common} />;
            case "project":         return <ProjectMode {...common} deck={_deck} />;
            case "song":            return <ListeningGameMode {...common} deck={_deck} />;
            case "phonics-game":    return <ListeningGameMode {...common} deck={_deck} />;
            case "draw-circle":     return <DrawCircleMode {...common} deck={_deck} />;
            case "match-connect":   return <MatchConnectMode {...common} deck={_deck} />;
            case "memory-game":     return <MemoryGameMode {...common} deck={_deck} />;
            case "memory-flip":     return <MemoryFlipMode {...common} deck={_deck} />;
            case "listening-game":  return <ListeningGameMode {...common} deck={_deck} />;
            case "drag-drop":       return <DragDropMode {...common} deck={_deck} />;
            case "picture-match":   return <PictureMatchMode {...common} deck={_deck} />;
            case "word-pic-connect":return <WordPicConnectMode {...common} deck={_deck} />;
            case "bubble-pop":      return <BubblePopMode {...common} deck={_deck} />;
            case "sequence-build":  return <SequenceBuildMode {...common} deck={_deck} />;
            case "speed-tap":       return <SpeedTapMode {...common} deck={_deck} />;
            default:                return <VocabGameMode {...common} deck={_deck} />;
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

    const nextStep = useMemo(() => {
        if (currentLesson >= totalLessons) {
            return {
                kind: "quiz",
                label: "Unit Quiz",
                emoji: "🏆",
                hint: `Show what you learned in ${safeUnit.title}!`,
            };
        }
        return {
            kind: "lesson",
            label: `Lesson ${currentLesson + 1} of ${totalLessons}`,
            emoji: "📚",
            hint: "Next adventure is waiting!",
        };
    }, [currentLesson, totalLessons, safeUnit.title]);

    return (
        <div className="h-[100dvh] w-screen font-sans flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-amber-50">
            <PageHead
                title={`${safeUnit?.title ?? "Lesson"} · Lesson ${currentLesson}`}
                description="Learn new English words with Kiddo through fun, audio-rich mini-games."
            />
            {/* Decorative background blobs — fully behind the play area */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[20%] right-[-5%] w-72 h-72 sm:w-96 sm:h-96 bg-purple-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-[10%] left-[-5%] w-64 h-64 sm:w-80 sm:h-80 bg-cyan-100/40 rounded-full blur-2xl" />
                <div className="absolute top-[40%] left-[40%] w-56 h-56 bg-pink-100/30 rounded-full blur-2xl" />
            </div>

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

            {/* Play surface — fills remaining viewport. Uses an inner
                wrapper that fits the content and centers itself
                horizontally; the outer `overflow-y-auto` only kicks
                in when a mode genuinely needs more room (very tall
                phones in landscape, picture-dict on tiny screens).
                Without this the inner flex centering broke when a
                tall mode forced the wrapper to be taller than
                viewport — children stuck to the top-left corner. */}
            <main className="flex-1 min-h-0 relative z-10 overflow-y-auto">
                <div className="min-h-full w-full flex items-center justify-center px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                    <div className="w-full flex items-center justify-center">
                        {stage === LESSON_STAGES.PLAY && renderMode()}
                        {stage === LESSON_STAGES.REWARD && (
                            <CelebrationStage
                                stars={starsEarned}
                                accuracy={accuracy}
                                nextStep={nextStep}
                                unitTitle={safeUnit.title}
                                lessonNumber={currentLesson}
                                totalLessons={totalLessons}
                                onContinue={continueAfterReward}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Floating "Skip / I'm stuck" pill — sits in the bottom-
                right of every PLAY stage. Tapping it counts as a
                completion (1/1) so progression doesn't dead-end on a
                child who can't pass a particular round. We hide it
                during the REWARD stage to keep the celebration clean. */}
            {stage === LESSON_STAGES.PLAY ? (
                <button
                    onClick={skipLesson}
                    className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200 hover:border-amber-300 text-gray-600 hover:text-amber-700 px-3 py-2 rounded-full shadow-lg flex items-center gap-1.5 transition-all hover:-translate-y-0.5 group"
                    title="Skip this lesson — your stars stay safe"
                    aria-label="Skip this lesson"
                >
                    <span className="text-base group-hover:scale-110 transition-transform">⏭️</span>
                    <span className="text-[11px] font-black uppercase tracking-wider hidden sm:inline">
                        Skip
                    </span>
                </button>
            ) : null}

            {/* Big "Awesome!" overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-fade-in">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-yellow-300 animate-celebPop">
                        <div className="text-center">
                            <div className="text-5xl sm:text-7xl mb-2 animate-bounce">🎉</div>
                            <h2 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
                                Awesome!
                            </h2>
                            <p className="text-gray-500 font-bold text-xs sm:text-sm">Lesson complete!</p>
                        </div>
                    </div>
                </div>
            )}

            {ai?.enabled !== undefined && stage === LESSON_STAGES.PLAY && firstWord?.id ? (
                <FoxHelper unitId={safeUnit.id} wordId={firstWord.id} aiEnabled={ai.enabled} />
            ) : null}

            {/* Streak celebration toast — only renders when the just-
                recorded lesson bumped today's streak counter. */}
            <StreakCelebration />

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
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                    75% { transform: translateX(-3px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
                @media (min-width: 400px) {
                    .xs\\:flex { display: flex; }
                    .xs\\:inline { display: inline; }
                    .xs\\:hidden { display: none; }
                    .xs\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   CelebrationStage — fits inside the play surface, no extra scroll
   ───────────────────────────────────────────────────────────── */
const CelebrationStage = ({ stars, accuracy, nextStep, unitTitle, lessonNumber, totalLessons, onContinue }) => {
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setAnimateIn(true), 50);
        return () => clearTimeout(t);
    }, []);

    const message = stars === 3
        ? { title: "Superstar!", emoji: "🌟", subtitle: "Perfect score!", color: "from-amber-400 to-yellow-500" }
        : stars === 2
        ? { title: "Great Job!", emoji: "🎉", subtitle: "You're doing great!", color: "from-emerald-400 to-green-500" }
        : { title: "Well Done!", emoji: "👏", subtitle: "Keep going, you'll get it!", color: "from-blue-400 to-indigo-500" };

    const continueLabel = nextStep?.kind === "quiz" ? "Start the Unit Quiz! 🏆" : "Next Lesson! →";

    return (
        <div className={`w-full max-w-md mx-auto transition-all duration-500 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-8 lg:p-10 flex flex-col items-center text-center shadow-2xl border border-white/60 relative overflow-hidden">
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${message.color} opacity-10`} />
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center shadow-xl border-4 border-white -mt-12 sm:-mt-16 mb-3">
                        <span className="text-4xl sm:text-6xl drop-shadow-lg">{message.emoji}</span>
                    </div>

                    <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r ${message.color} bg-clip-text text-transparent mb-1`}>
                        {message.title}
                    </h1>

                    {unitTitle && (
                        <p className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                            {unitTitle} · Lesson {lessonNumber}/{totalLessons}
                        </p>
                    )}
                    <p className="text-xs sm:text-base text-gray-500 font-bold mb-4">{message.subtitle}</p>

                    <div className="flex items-center gap-2 sm:gap-3 mb-4">
                        {[1, 2, 3].map((s) => (
                            <span
                                key={s}
                                className={`text-3xl sm:text-5xl lg:text-6xl transition-all duration-700 ${
                                    s <= stars ? "opacity-100 scale-110 drop-shadow-xl" : "opacity-20 grayscale scale-75"
                                }`}
                                style={{ animationDelay: `${s * 0.2}s` }}
                            >⭐</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs mb-4">
                        <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Accuracy</p>
                            <p className="text-base sm:text-xl font-black text-emerald-700">{accuracy}%</p>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 px-3 py-2 rounded-2xl text-center">
                            <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-0.5">Stars</p>
                            <p className="text-base sm:text-xl font-black text-purple-700">+{stars}</p>
                        </div>
                    </div>

                    {nextStep && (
                        <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-2xl px-3 py-2 mb-4 flex items-center gap-2 text-left">
                            <span className="text-xl sm:text-2xl shrink-0">{nextStep.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-wider">Coming up next</p>
                                <p className="text-xs sm:text-sm font-black text-blue-900 truncate">{nextStep.label}</p>
                                <p className="text-[9px] sm:text-[10px] text-blue-500 font-semibold truncate">{nextStep.hint}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onContinue}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base lg:text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    >
                        {continueLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonScreen;
