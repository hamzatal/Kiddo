import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";

import { resolveMode, modeMeta, LESSON_STAGES } from "@/learning/core/lessonEngine";
import {
    playReward,
    playClick,
    playCheer,
    playMagic,
} from "@/learning/utils/soundEffects";

import IntroMode from "@/learning/components/modes/IntroMode";
import VocabGameMode from "@/learning/components/modes/VocabGameMode";
import StoryMode from "@/learning/components/modes/StoryMode";
import ProjectMode from "@/learning/components/modes/ProjectMode";
import PictureDictMode from "@/learning/components/modes/PictureDictMode";
import DrawCircleMode from "@/learning/components/modes/DrawCircleMode";
import MatchConnectMode from "@/learning/components/modes/MatchConnectMode";
import MemoryFlipMode from "@/learning/components/modes/MemoryFlipMode";
import BubblePopMode from "@/learning/components/modes/BubblePopMode";
import SequenceBuildMode from "@/learning/components/modes/SequenceBuildMode";

import FoxHelper from "@/learning/components/ai/FoxHelper";
import PlaySurface from "@/learning/components/ui/PlaySurface";
import ConfettiBurst from "@/learning/components/ui/ConfettiBurst";

/**
 * LessonScreen v3 — wraps every activity in PlaySurface (FIX 4),
 * celebrates with ConfettiBurst on the reward stage (FIX 7), plays
 * cheer + magic combo when the welcome unit ends (FIX 2), and routes
 * round results (with wordId) to the backend (FIX 8).
 */
const LessonScreen = (props) => {
    const { unit, lesson, mode, intro, deck, audioTrack, progress } = props;
    const { ai } = usePage().props;

    const resolvedMode = useMemo(() => mode || resolveMode(lesson), [mode, lesson]);
    const meta = modeMeta(resolvedMode);

    const [stage, setStage] = useState(LESSON_STAGES.PLAY);
    const [result, setResult] = useState(null);
    const [roundResults, setRoundResults] = useState([]);
    const [progressIdx, setProgressIdx] = useState(0);
    const [soundOn, setSoundOn] = useState(true);
    const [mascotMessage, setMascotMessage] = useState("Let's play!");
    const [festive, setFestive] = useState(false);

    const safeUnit = unit || { id: 1, title: "Lesson", number: 0 };

    const firstWord = useMemo(() => {
        if (intro?.cards?.length) return intro.cards[0];
        if (deck?.length) {
            const o = deck[0]?.options?.find((x) => x.isCorrect) || deck[0]?.options?.[0];
            return o ? { id: o.id, word: o.word } : null;
        }
        return null;
    }, [intro, deck]);

    // Friendly mascot opener — varies by mode so it doesn't feel canned.
    useEffect(() => {
        const greetings = {
            "intro":         "Listen carefully and tap the words.",
            "vocab-game":    "Find the right picture!",
            "phonics-game":  "Listen to the sound and pick the word.",
            "review":        "Let's review what you've learned!",
            "story":         "Read along with me.",
            "song":          "Time to sing! Listen and match.",
            "project":       "Make and show — let's create!",
            "picture-dict":  "Trace the words while you listen.",
            "draw-circle":   "Circle the correct picture.",
            "match-connect": "Match each word to its picture.",
            "memory-flip":   "Find the matching pairs.",
            "bubble-pop":    "Pop the right bubble!",
            "sequence-build":"Build the sentence in the right order.",
        };
        setMascotMessage(greetings[resolvedMode] || "Let's play!");
    }, [resolvedMode]);

    const goToMap = () => {
        playClick();
        router.visit("/map");
    };

    const isLastLesson =
        progress && progress.current && progress.total
            ? progress.current >= progress.total
            : false;

    const onModeComplete = (summary) => {
        setResult(summary);
        setStage(LESSON_STAGES.REWARD);
        setRoundResults(summary?.rounds || []);
        setMascotMessage("Amazing work!");

        if (soundOn) {
            // FIX 2 — festive combo when the welcome unit's last lesson lands.
            // unit.number === 0 is U0 (Welcome) — same gate the seeder uses.
            const isWelcomeFinish =
                Number(safeUnit.number) === 0 && isLastLesson;

            if (isWelcomeFinish) {
                setFestive(true);
                playCheer();
                setTimeout(() => playMagic(), 220);
            } else {
                playReward();
            }
        }

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
        // FIX 2 — when leaving the festive reward (welcome unit's last
        // lesson), navigate explicitly to the map so the parent can
        // see the next unit unlocked.
        if (festive) {
            router.visit("/map");
            return;
        }
        router.visit(`/lesson/${safeUnit.id}`);
    };

    const renderMode = () => {
        const common = {
            lesson,
            audioTrack,
            onComplete: (summary) => {
                // Capture per-round progress so the dots in the app-bar
                // light up live as the child plays.
                if (summary?.rounds?.length) setRoundResults(summary.rounds);
                onModeComplete(summary);
            },
            onProgress: (i, results) => {
                setProgressIdx(i);
                if (Array.isArray(results)) setRoundResults(results);
            },
        };
        switch (resolvedMode) {
            case "intro":          return <IntroMode        {...common} intro={intro} />;
            case "picture-dict":   return <PictureDictMode  {...common} intro={intro} />;
            case "story":          return <StoryMode        {...common} />;
            case "project":        return <ProjectMode      {...common} deck={deck} />;
            case "song":           return <VocabGameMode    {...common} deck={deck} promptText="Listen, match and sing!" />;
            case "review":         return <VocabGameMode    {...common} deck={deck} promptText="Review time — find the word!" />;
            case "phonics-game":   return <VocabGameMode    {...common} deck={deck} promptText="Listen to the sound and choose!" />;
            case "draw-circle":    return <DrawCircleMode   {...common} deck={deck} />;
            case "match-connect":  return <MatchConnectMode {...common} deck={deck} />;
            case "memory-flip":    return <MemoryFlipMode   {...common} deck={deck} />;
            case "bubble-pop":     return <BubblePopMode    {...common} deck={deck} />;
            case "sequence-build": return <SequenceBuildMode {...common} deck={deck} />;
            case "vocab-game":
            default:               return <VocabGameMode    {...common} deck={deck} />;
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

    // Progress dots — derive total/current from deck or intro count
    // so the bar reflects the real stage even before any round is played.
    const totalRounds = useMemo(() => {
        if (resolvedMode === "intro" || resolvedMode === "picture-dict") {
            return intro?.cards?.length || 0;
        }
        return deck?.length || 0;
    }, [deck, intro, resolvedMode]);

    const titleText = `${safeUnit.title || "Lesson"}${
        lesson?.title ? " · " + lesson.title : ""
    }`;

    return (
        <PlaySurface
            unitTitle={titleText}
            modeIcon={meta.icon}
            modeLabel={meta.label}
            modeColor={meta.color}
            progressCurrent={progressIdx}
            progressTotal={totalRounds}
            roundResults={roundResults}
            mascotMessage={mascotMessage}
            soundOn={soundOn}
            onToggleSound={(v) => setSoundOn(v)}
            onBack={goToMap}
            bookPage={lesson?.pageNumber || null}
        >
            {stage === LESSON_STAGES.PLAY ? renderMode() : null}

            {stage === LESSON_STAGES.REWARD && (
                <RewardStage
                    festive={festive}
                    stars={starsEarned}
                    accuracy={
                        result
                            ? Math.round((result.correct / Math.max(1, result.total)) * 100)
                            : 100
                    }
                    onContinue={continueAfterReward}
                />
            )}

            {ai?.enabled !== undefined && stage === LESSON_STAGES.PLAY && firstWord?.id ? (
                <FoxHelper
                    unitId={safeUnit.id}
                    wordId={firstWord.id}
                    aiEnabled={ai.enabled}
                />
            ) : null}

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
            `}</style>
        </PlaySurface>
    );
};

/**
 * RewardStage — celebratory finale (FIX 7). Confetti rains, a trophy
 * bounces in, stars animate, and the child must click Continue (no
 * auto-advance). Festive flag adds a "Unit complete!" headline and a
 * second confetti burst.
 */
const RewardStage = ({ stars = 1, accuracy = 100, onContinue, festive = false }) => {
    const [unlocked, setUnlocked] = useState(false);

    // Require the reward to stay on screen at least 3s before the
    // Continue button accepts clicks (FIX 7).
    useEffect(() => {
        const t = setTimeout(() => setUnlocked(true), 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative w-full flex justify-center">
            <ConfettiBurst pieces={festive ? 100 : 60} />

            <div className="relative z-30 w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-fade-in-up border border-white my-6">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-4 relative z-10 -mt-24">
                    <span className="text-6xl drop-shadow">🏆</span>
                </div>

                {festive ? (
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-purple-600 mb-2">
                        ✨ Unit complete — new island unlocked!
                    </p>
                ) : null}

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
                            style={{
                                animation:
                                    i < stars
                                        ? `star-pop 0.5s ${0.2 + i * 0.15}s ease-out backwards`
                                        : "none",
                            }}
                        >
                            ⭐
                        </span>
                    ))}
                </div>

                <button
                    onClick={() => unlocked && onContinue?.()}
                    disabled={!unlocked}
                    className={`w-full sm:w-auto px-12 py-4 rounded-[2rem] font-black text-lg transition-all ${
                        unlocked
                            ? "bg-[#10B981] text-white shadow-[0_8px_0_#059669] hover:translate-y-[2px]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    {unlocked ? "Continue →" : "Keep celebrating…"}
                </button>

                <style>{`
                    @keyframes star-pop {
                        0% { transform: scale(0.4) rotate(-25deg); opacity: 0; }
                        60% { transform: scale(1.25) rotate(8deg); opacity: 1; }
                        100% { transform: scale(1.1) rotate(0deg); opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default LessonScreen;
