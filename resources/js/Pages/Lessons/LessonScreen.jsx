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
import OddOneOutMode from "@/learning/components/modes/OddOneOutMode";
import WordRainMode from "@/learning/components/modes/WordRainMode";
import ColorTapMode from "@/learning/components/modes/ColorTapMode";
import SpellingTilesMode from "@/learning/components/modes/SpellingTilesMode";
import HangmanFriendlyMode from "@/learning/components/modes/HangmanFriendlyMode";
import FirstLetterMode from "@/learning/components/modes/FirstLetterMode";
import PixelRevealMode from "@/learning/components/modes/PixelRevealMode";
import CountTheItemsMode from "@/learning/components/modes/CountTheItemsMode";
import EmojiHuntMode from "@/learning/components/modes/EmojiHuntMode";

import FoxHelper from "@/learning/components/ai/FoxHelper";
import AppHeader from "@/learning/components/ui/AppHeader";
import StageBreadcrumb from "@/learning/components/ui/StageBreadcrumb";

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

    /**
     * Mixed-game rotation pool — every "playable" lesson now picks a
     * deterministic game variant from this list based on the lesson
     * + unit ids, so a child sees a DIFFERENT mini-game on every
     * lesson within a unit and a DIFFERENT rotation across units.
     *
     * Operator request v1.2 (May 2026):
     *   "بدي الالعاب هاي تكون مخلوطة داخل الدروس كامل
     *    وداخل كل المراحل كاملة"
     *   = "I want these games mixed inside ALL the lessons and
     *      across all the stages."
     *
     * Before: only `review` / `mixed-practice` lessons rotated. Every
     * other lesson was locked to its `type` column — so a unit with
     * three vocab-game lessons looked like the same game three times.
     *
     * Now: ALL playable lesson types rotate through the 14-variant
     * pool below. Content-only lessons (intro, picture-dict, story,
     * project, draw-circle, song, phonics-game) stay on their
     * authored type because their UX is content-specific. The
     * Lesson `config.fixed_mode = true` flag opts a single lesson
     * out of the rotation if the operator wants to lock it.
     */
    const VARIANT_KEYS = useMemo(() => [
        "vocab-game",
        "memory-game",
        "memory-flip",
        "listening-game",
        "drag-drop",
        "picture-match",
        "word-pic-connect",
        "bubble-pop",
        "speed-tap",
        "match-connect",
        "odd-one-out",
        "word-rain",
        "color-tap",
        "sequence-build",
        // ── May 2026 wave 2 ───────────────────────────────────
        "spelling-tiles",
        "hangman-friendly",
        "first-letter",
        // ── May 2026 wave 5 ───────────────────────────────────
        "pixel-reveal",
        "count-the-items",
        "emoji-hunt",
    ], []);

    /**
     * Lesson types that should NEVER be mixed — they each provide
     * unique non-game UX or rely on a content-specific deck shape
     * (intro cards, picture-dict layout, story prose, project
     * canvas, draw-circle hit-zones, song player, phonics decoy
     * pairing logic). Anything not in this set is considered a
     * "game" and will be rotated through VARIANT_KEYS.
     */
    const FIXED_MODES = useMemo(() => new Set([
        "intro",
        "picture-dict",
        "story",
        "project",
        "draw-circle",
        "song",
        "phonics-game",
    ]), []);

    const effectiveMode = useMemo(() => {
        // Honour the operator's explicit "do not mix" flag — set on
        // a per-lesson basis when the curriculum author wants to
        // lock that lesson to its authored type.
        if (_lesson?.config?.fixed_mode === true) {
            return resolvedMode;
        }

        // Content lessons stay on their authored type.
        if (FIXED_MODES.has(resolvedMode)) {
            return resolvedMode;
        }

        // Everything else rotates. We mix the unit id, the lesson
        // number, AND a per-page-load random nudge into the seed.
        //
        // Why the randomness:
        //   Operator request (May 2026 wave 3) — "حتى لو الطالب
        //   خلص المراحل كلها وانجز الدروس المفروض الالعاب تضل
        //   مخلوطة بكل الدروس حتى لو انجزهم كلهم" — i.e. once a
        //   kid has completed every lesson, replaying any lesson
        //   should STILL show a different mini-game on each visit.
        //
        //   The previous deterministic seed (`unit*31 + lesson*7`)
        //   gave the SAME game every time the kid revisited a
        //   lesson — fine for the first pass, boring on replays.
        //
        //   `randomNudge` is computed inside the memo so it's
        //   stable for the lifetime of the LessonScreen mount
        //   (swapping games mid-round would be jarring) but it
        //   refreshes on every navigation/refresh.
        const lessonNum   = _lesson?.number || _lesson?.lesson_number || 1;
        const unitNum     = _unit?.number   || _unit?.unit_number   || 0;
        const randomNudge = Math.floor(Math.random() * VARIANT_KEYS.length);
        const seed = (Number(unitNum) * 31 + Number(lessonNum) * 7 + randomNudge) % VARIANT_KEYS.length;
        return VARIANT_KEYS[seed];
    }, [resolvedMode, _lesson, _unit, VARIANT_KEYS, FIXED_MODES]);

    const meta = modeMeta(effectiveMode);

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
            {
                preserveScroll: true,
                preserveState:  true,
                only:           ["flash"],
                // Swallow network errors silently — the celebration
                // screen has already advanced the kid forward, so a
                // failed save just means we'll re-grade on the next
                // visit. Logging keeps it visible for debug.
                onError: (errors) => {
                    // eslint-disable-next-line no-console
                    console.warn("Lesson result save failed:", errors);
                },
            }
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
     * v1.2 (May 2026 — operator request): every "playable" lesson now
     * routes through the VARIANT_BY_KEY rotation (driven by
     * `effectiveMode`, which itself was computed from a lesson+unit
     * seed at the top of this component). Content lessons (intro,
     * picture-dict, story, project, draw-circle, song, phonics-game)
     * stay on their authored type because their UX is content-
     * specific. Operators can pin any single lesson to a fixed game
     * with `lesson.config.fixed_mode = true`.
     *
     * Result: a child playing through the whole curriculum sees a
     * different mini-game on every lesson, instead of three Vocab
     * games in a row inside one unit.
     */
    const renderMode = () => {
        const common = { lesson: safeLesson, audioTrack: _audioTrack, onComplete: onModeComplete };

        // Map every game variant key to its React component. Used by
        // the rotation path below AND as the canonical lookup for
        // the AppHeader chip + StageBreadcrumb pill so the displayed
        // game label always matches what's rendered.
        const VARIANT_BY_KEY = {
            "vocab-game":       VocabGameMode,
            "memory-game":      MemoryGameMode,
            "memory-flip":      MemoryFlipMode,
            "listening-game":   ListeningGameMode,
            "drag-drop":        DragDropMode,
            "picture-match":    PictureMatchMode,
            "word-pic-connect": WordPicConnectMode,
            "bubble-pop":       BubblePopMode,
            "speed-tap":        SpeedTapMode,
            "match-connect":    MatchConnectMode,
            "odd-one-out":      OddOneOutMode,
            "word-rain":        WordRainMode,
            "color-tap":        ColorTapMode,
            "sequence-build":   SequenceBuildMode,
            "spelling-tiles":   SpellingTilesMode,
            "hangman-friendly": HangmanFriendlyMode,
            "first-letter":     FirstLetterMode,
            "pixel-reveal":     PixelRevealMode,
            "count-the-items":  CountTheItemsMode,
            "emoji-hunt":       EmojiHuntMode,
        };

        // Content modes — render verbatim, never rotated.
        switch (resolvedMode) {
            case "intro":         return <IntroMode {...common} intro={_intro} />;
            case "picture-dict":  return <PictureDictMode {...common} intro={_intro} />;
            case "story":         return <StoryMode {...common} />;
            case "project":       return <ProjectMode {...common} deck={_deck} />;
            case "song":          return <ListeningGameMode {...common} deck={_deck} />;
            case "phonics-game":  return <ListeningGameMode {...common} deck={_deck} />;
            case "draw-circle":   return <DrawCircleMode {...common} deck={_deck} />;
        }

        // Honour an explicit "fixed_mode" lesson config — render the
        // authored type without rotation.
        if (_lesson?.config?.fixed_mode === true && VARIANT_BY_KEY[resolvedMode]) {
            const Variant = VARIANT_BY_KEY[resolvedMode];
            return <Variant {...common} deck={_deck} />;
        }

        // Default: every playable lesson rotates through the full
        // 14-variant pool. `effectiveMode` was computed at the top
        // of this component from a lesson+unit seed.
        const Variant = VARIANT_BY_KEY[effectiveMode] || VocabGameMode;
        return <Variant {...common} deck={_deck} />;
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
            {/* Decorative background — a layered illustration that
                makes the play surface feel alive while a child is
                learning. Three big soft blobs drift gently, plus a
                handful of tiny floating bubbles rise from the
                bottom edge, plus a few faint sparkle emojis pulse
                in place. None of these sit on the play area's tap
                targets, and `prefers-reduced-motion` strips them
                all to a still image. */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[20%] right-[-5%] w-72 h-72 sm:w-96 sm:h-96 bg-purple-100/40 rounded-full blur-3xl animate-drift-slow" />
                <div className="absolute bottom-[10%] left-[-5%] w-64 h-64 sm:w-80 sm:h-80 bg-cyan-100/40 rounded-full blur-2xl animate-drift-medium" />
                <div className="absolute top-[40%] left-[40%] w-56 h-56 bg-pink-100/30 rounded-full blur-2xl animate-drift-slow" style={{ animationDelay: "3s" }} />

                {/* Floating bubble layer — six tiny circles rise from
                    the bottom of the screen on staggered timings.
                    Stays well away from the centred play area. */}
                <span className="absolute bottom-0 left-[6%]  w-3  h-3  rounded-full bg-purple-300/70 animate-float-up-fade" style={{ animationDelay: "0s"   }} />
                <span className="absolute bottom-0 left-[18%] w-2  h-2  rounded-full bg-pink-300/70   animate-float-up-fade" style={{ animationDelay: "1.4s" }} />
                <span className="absolute bottom-0 left-[78%] w-3  h-3  rounded-full bg-cyan-300/70   animate-float-up-fade" style={{ animationDelay: "0.8s" }} />
                <span className="absolute bottom-0 left-[88%] w-2  h-2  rounded-full bg-amber-300/70  animate-float-up-fade" style={{ animationDelay: "2.5s" }} />
                <span className="absolute bottom-0 left-[42%] w-2  h-2  rounded-full bg-emerald-300/70 animate-float-up-fade" style={{ animationDelay: "3.6s" }} />
                <span className="absolute bottom-0 left-[62%] w-2  h-2  rounded-full bg-rose-300/70   animate-float-up-fade" style={{ animationDelay: "4.8s" }} />

                {/* Static sparkle dust — emoji "stars" pinned in the
                    corners to add personality without animating
                    (kids' eyes don't need MORE motion at the edges).
                    The whole layer is 30% opacity so it doesn't
                    compete with the cards. */}
                <span className="absolute top-[8%]  left-[8%]  text-2xl opacity-25 select-none" aria-hidden="true">✨</span>
                <span className="absolute top-[12%] right-[10%] text-xl opacity-20 select-none" aria-hidden="true">⭐</span>
                <span className="absolute bottom-[18%] right-[6%] text-2xl opacity-20 select-none" aria-hidden="true">✨</span>
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
                onSkip={stage === LESSON_STAGES.PLAY ? skipLesson : undefined}
                skipLabel={currentLesson >= totalLessons ? "Quiz" : "Next"}
                skipIcon={currentLesson >= totalLessons ? "🏆" : "➡"}
                skipTitle={
                    currentLesson >= totalLessons
                        ? "Skip ahead to the unit quiz"
                        : `Skip to lesson ${currentLesson + 1} of ${totalLessons}`
                }
            />

            {/* Persistent "you are here" indicator — v2 (May 2026):
                docked under the AppHeader instead of the bottom edge
                so it never collides with in-game CTAs (Continue,
                Reveal, Check, Next). The bottom edge is now reserved
                for the floating Skip pill (right) and FoxHelper
                (left). */}
            {stage === LESSON_STAGES.PLAY && (
                <StageBreadcrumb
                    unitTitle={safeUnit.title}
                    unitNumber={safeUnit.number}
                    lessonTitle={safeLesson?.title}
                    lessonNumber={currentLesson}
                    totalLessons={totalLessons}
                    modeLabel={meta.label}
                    modeIcon={meta.icon}
                    modeColor={meta.color}
                />
            )}

            {/* Play surface — fills remaining viewport. Uses an inner
                wrapper that fits the content and centers itself
                horizontally; the outer `overflow-y-auto` only kicks
                in when a mode genuinely needs more room (very tall
                phones in landscape, picture-dict on tiny screens).
                Without this the inner flex centering broke when a
                tall mode forced the wrapper to be taller than
                viewport — children stuck to the top-left corner. */}
            <main className="flex-1 min-h-0 relative z-10 overflow-y-auto">
                <div className="min-h-full w-full flex items-center justify-center px-2 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 pb-20 sm:pb-24">
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

            {/* Floating "Skip / Next" pill — secondary nav button
                anchored to the bottom-right of the play surface so
                even a child whose eyes never reach the header sees
                a clear way forward. Sits above the FoxHelper (which
                lives at bottom-24) and always shows its label. */}
            {stage === LESSON_STAGES.PLAY ? (
                <button
                    onClick={skipLesson}
                    className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 group border-2 border-white/40"
                    title={
                        currentLesson >= totalLessons
                            ? "Skip ahead to the unit quiz"
                            : `Continue to lesson ${currentLesson + 1}`
                    }
                    aria-label="Skip this lesson and continue"
                >
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">
                        {currentLesson >= totalLessons ? "🏆" : "➡"}
                    </span>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {currentLesson >= totalLessons ? "Quiz" : "Next"}
                    </span>
                </button>
            ) : null}

            {/* Big "Awesome!" overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none animate-fade-in">
                    <div className="bg-white/95 backdrop-blur rounded-3xl p-6 sm:p-10 shadow-2xl border-4 border-yellow-300 animate-celebPop">
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
            <div className="bg-white/95 backdrop-blur rounded-3xl p-5 sm:p-8 lg:p-10 flex flex-col items-center text-center shadow-2xl border border-white/60 relative overflow-hidden animate-celebPop">
                <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${message.color} opacity-10`} />
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/50 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col items-center w-full">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center shadow-xl border-4 border-white -mt-12 sm:-mt-16 mb-3 animate-bounceIn">
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
                                    s <= stars ? "opacity-100 scale-110 drop-shadow-xl animate-starBurst" : "opacity-20 grayscale scale-75"
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
