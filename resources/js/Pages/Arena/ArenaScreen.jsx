import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PageHead from "@/learning/components/ui/PageHead";
import StreakCelebration from "@/learning/components/ui/StreakCelebration";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import AppHeader from "@/learning/components/ui/AppHeader";
import StageBreadcrumb from "@/learning/components/ui/StageBreadcrumb";
import MemoryFlipRound from "@/learning/components/games/MemoryFlipRound";
import ShadowMatchRound from "@/learning/components/games/ShadowMatchRound";
import RevealGuessRound from "@/learning/components/games/RevealGuessRound";
import BalloonPopRound from "@/learning/components/games/BalloonPopRound";
import TrueOrFalseRound from "@/learning/components/games/TrueOrFalseRound";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import {
    playSuccess,
    playFail,
    playClick,
    playCheer,
    playStarCollect,
} from "@/learning/utils/soundEffects";
import { launchConfetti, launchStars } from "@/learning/utils/confetti";

/**
 * ArenaScreen v4 — 11-style mixed-review arena.
 *
 * Architecture: every style maps to either a specialised game
 * component (ROUND_COMPONENTS) or falls through to the standard
 * prompt+options layout. Adding a new game = one file + one line.
 */

// ── Style metadata ─────────────────────────────────────────────────────────
const STYLE_META = {
    "word-to-image": { label: "Spot it!", icon: "🔎", color: "#7C3AED" },
    "audio-to-image": { label: "Listen!", icon: "🎧", color: "#0EA5E9" },
    "image-to-word": { label: "Name it!", icon: "🏷️", color: "#10B981" },
    "listen-then-spell": { label: "Tap the word", icon: "📝", color: "#F59E0B" },
    "odd-one-out": { label: "Odd one out", icon: "🔍", color: "#F59E0B" },
    "spot-the-decoy": { label: "Read it!", icon: "📖", color: "#EC4899" },
    "memory-flip": { label: "Match it!", icon: "🧠", color: "#8B5CF6" },
    "shadow-match": { label: "Who's this?", icon: "🕶️", color: "#334155" },
    "reveal-guess": { label: "Guess fast!", icon: "✨", color: "#14B8A6" },
    "balloon-pop": { label: "Pop it!", icon: "🎈", color: "#EF4444" },
    "true-or-false": { label: "True or false?", icon: "🤔", color: "#6366F1" },
};

// ── Specialised game registry ──────────────────────────────────────────────
const ROUND_COMPONENTS = {
    "memory-flip": MemoryFlipRound,
    "shadow-match": ShadowMatchRound,
    "reveal-guess": RevealGuessRound,
    "balloon-pop": BalloonPopRound,
    "true-or-false": TrueOrFalseRound,
};

// ── Sub-components ─────────────────────────────────────────────────────────
function UnitChip({ title }) {
    if (!title) return null;
    return (
        <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-3 py-1 shadow backdrop-blur">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500">
                From
            </span>
            <span className="text-[11px] font-black text-[#1E293B]">{title}</span>
        </div>
    );
}

function StandardPrompt({ style, round, disabled }) {
    const prompt = round?.prompt;
    if (!prompt) return null;

    if (style === "audio-to-image" || style === "listen-then-spell") {
        return (
            <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-white/50 bg-white/90 px-5 py-4 shadow-lg backdrop-blur sm:px-8">
                <p className="text-[9px] font-black uppercase tracking-wider text-blue-500">
                    Listen carefully
                </p>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => playAudio(prompt.audioClip)}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-2xl text-white shadow-xl transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 sm:h-20 sm:w-20 sm:text-3xl"
                >
                    🔊
                </button>
                <p className="text-[10px] font-bold text-gray-400">Tap to listen again</p>
            </div>
        );
    }

    if (style === "image-to-word") {
        return (
            <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-white/50 bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    What is this?
                </p>
                <SmartImage
                    src={prompt.imagePath}
                    label={prompt.text}
                    className="overflow-hidden rounded-xl"
                    style={{ width: "clamp(6rem,20vw,8rem)", height: "clamp(6rem,20vw,8rem)" }}
                    imgClassName="w-full h-full object-contain"
                />
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:gap-3 sm:px-6">
            <AudioClipButton
                clip={prompt.audioClip}
                wordId={round?.wordId}
                label={prompt.text}
                size="md"
            />
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-purple-400 sm:text-[10px]">
                    Find the picture for
                </p>
                <h2
                    className="truncate font-black text-gray-800"
                    style={{ fontSize: "clamp(1.125rem, 5vw, 2rem)" }}
                >
                    {prompt.text}
                </h2>
            </div>
        </div>
    );
}

function StandardOptions({ round, style, correctId, wrong, onPick }) {
    const options = round?.options || [];
    const useText = style === "image-to-word" || style === "listen-then-spell";
    const wantLabel = useText || style === "spot-the-decoy" || style === "odd-one-out";

    return (
        <div className="mx-auto grid w-full max-w-2xl grid-cols-3 justify-items-center gap-2 sm:gap-3 lg:gap-4">
            {options.map((opt) => {
                let cardState = "idle";
                if (correctId === opt.id) cardState = "correct";
                else if (wrong.includes(opt.id)) cardState = "wrong";
                else if (correctId !== null) cardState = "disabled";

                return (
                    <OptionCard
                        key={opt.id}
                        imagePath={useText ? null : opt.imagePath}
                        label={opt.word}
                        audioClip={opt.audioClip}
                        wordId={opt.wordId || null}
                        showLabel={wantLabel}
                        state={cardState}
                        onClick={() => onPick(opt)}
                    />
                );
            })}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────
const ArenaScreen = ({ arena }) => {
    const { auth } = usePage().props || {};
    const rounds = arena?.rounds || [];

    const containerRef = useRef(null);
    const startedAtRef = useRef(Date.now());

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [correctId, setCorrectId] = useState(null);
    const [finished, setFinished] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const round = rounds[idx];
    const style = round?.style || "word-to-image";
    const meta = STYLE_META[style] || STYLE_META["word-to-image"];
    const SpecialRound = ROUND_COMPONENTS[style] || null;

    const sessionKey = (rounds[0]?.roundId || "") + ":" + rounds.length;
    useEffect(() => {
        setIdx(0);
        setResults([]);
        setWrong([]);
        setCorrectId(null);
        setFinished(false);
        setSubmitting(false);
        startedAtRef.current = Date.now();
    }, [sessionKey]);

    useEffect(() => {
        stopAllAudio();
        if (!round) return;
        if (style === "audio-to-image" || style === "listen-then-spell") {
            const t = setTimeout(() => playAudio(round.prompt?.audioClip), 350);
            return () => clearTimeout(t);
        }
    }, [idx, style, round]);

    useEffect(() => () => stopAllAudio(), []);

    // ── Empty state ──────────────────────────────────────────────────────────
    if (!rounds.length) {
        return (
            <div className="flex h-[100dvh] w-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 px-4">
                <div className="max-w-sm text-center">
                    <span className="mb-4 block text-6xl">🎮</span>
                    <h2 className="mb-2 text-2xl font-black text-gray-800">No words yet!</h2>
                    <p className="mb-6 font-bold text-gray-500">
                        Finish your first lesson to unlock the Games Arena.
                    </p>
                    <button
                        onClick={() => router.visit("/map")}
                        className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-black text-white shadow-md"
                    >
                        ← Back to Map
                    </button>
                </div>
            </div>
        );
    }

    // ── Advance ──────────────────────────────────────────────────────────────
    function handleAdvance() {
        if (idx + 1 >= rounds.length) {
            setFinished(true);
            playCheer();
            launchConfetti(4500);
            setTimeout(() => playStarCollect(), 700);
            setTimeout(() => playStarCollect(), 1100);
            setTimeout(() => playStarCollect(), 1500);
            return;
        }
        setIdx(idx + 1);
        setWrong([]);
        setCorrectId(null);
    }

    function recordResult(option, firstTry, firstWrongOpt) {
        const next = [
            ...results,
            {
                roundId: round.roundId,
                wordId: round.wordId || null,
                word: round.prompt?.text || null,
                style,
                correct: firstTry,
                timeMs: Date.now() - startedAtRef.current,
                wrongChoice: firstWrongOpt?.word || null,
            },
        ];
        setResults(next);
        return next;
    }

    // ── Pick handler (standard choice rounds) ────────────────────────────────
    function handlePick(option) {
        if (correctId !== null) return;
        playClick();
        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
            const firstWrongOpt = round.options?.find((o) => wrong.includes(o.id));
            recordResult(option, firstTry, firstWrongOpt);
            setTimeout(() => {
                const el = containerRef.current;
                if (el) {
                    const r = el.getBoundingClientRect();
                    launchStars(r.left + r.width / 2, r.top + r.height / 2.5, 6);
                }
            }, 100);
            setTimeout(handleAdvance, 950);
        } else {
            playFail();
            setWrong((w) => [...w, option.id]);
        }
    }

    // ── Specialised round complete ────────────────────────────────────────────
    function handleSpecialComplete({ correct = true } = {}) {
        recordResult({ id: "special" }, correct, null);
        setTimeout(handleAdvance, 600);
    }

    // ── Submit ───────────────────────────────────────────────────────────────
function handleFinish() {
    if (submitting) return;

    // إذا ما في نتائج أبداً، ارجع للخريطة مباشرة بدون submit
    if (!results || results.length === 0) {
        playClick();
        router.visit("/map");
        return;
    }

    setSubmitting(true);
    playClick();

    const stuckTimer = setTimeout(() => {
        setSubmitting(false);
    }, 8000);

    router.post(
        "/arena/submit",
        {
            rounds: results,
            durationMs: Date.now() - startedAtRef.current,
        },
        {
            preserveScroll: true,
            onError: (errors) => {
                console.warn("Arena submit errors:", errors);
                clearTimeout(stuckTimer);
                setSubmitting(false);
                // ارجع للخريطة حتى لو فشل الحفظ
                router.visit("/map");
            },
            onFinish: () => {
                clearTimeout(stuckTimer);
                setSubmitting(false);
            },
            onSuccess: () => {
                clearTimeout(stuckTimer);
                router.visit("/map");
            },
        },
    );
}

function skipArena() {
    playClick();
    setFinished(true);
}

// زر "Play again" — أعد تحميل الصفحة بشكل صحيح
function handlePlayAgain() {
    playClick();
    setIdx(0);
    setResults([]);
    setWrong([]);
    setCorrectId(null);
    setFinished(false);
    setSubmitting(false);
    startedAtRef.current = Date.now();
    router.reload({ only: ["arena"] });
}
    function skipArena() {
        playClick();
        setFinished(true);
    }

    const total = rounds.length;
    const correctCount = results.filter((r) => r.correct).length;
    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    const stars = scorePct >= 90 ? 3 : scorePct >= 70 ? 2 : 1;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="relative flex h-[100dvh] w-screen flex-col overflow-hidden bg-gradient-to-br from-purple-50 via-white to-amber-50 font-sans"
        >
            <PageHead
                title="Games Arena"
                description="Mixed-review games drawn from every Kiddo unit you've unlocked."
            />

            {/* Background blobs */}
            <div
                className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                aria-hidden="true"
            >
                <div className="absolute left-[-5%] top-[-5%] h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
                <div className="absolute left-[60%] top-[40%] h-56 w-56 rounded-full bg-cyan-200/40 blur-2xl" />
            </div>

            <AppHeader
                unitTitle="Games Arena"
                lessonTitle="Mixed practice"
                modeLabel={meta.label}
                modeIcon={meta.icon}
                modeColor={meta.color}
                current={Math.min(idx + 1, total)}
                total={total}
                totalStars={auth?.user?.total_stars}
                xp={auth?.user?.xp}
                onBack={() => router.visit("/map")}
                onSkip={!finished ? skipArena : undefined}
                skipLabel="Finish"
                skipIcon="🏁"
                skipTitle="End run early and see results"
            />

            {/* "You are here" pill — docked under the AppHeader (v2,
                May 2026). Bottom edge is reserved for the floating
                Finish button so the two never collide. */}
            {!finished && (
                <StageBreadcrumb
                    unitTitle={round?.unitTitle || "Games Arena"}
                    unitNumber={null}
                    lessonTitle="Mixed practice"
                    lessonNumber={Math.min(idx + 1, total)}
                    totalLessons={total}
                    modeLabel={meta.label}
                    modeIcon={meta.icon}
                    modeColor={meta.color}
                />
            )}

            {/* ── Active round ─────────────────────────────────────────────── */}
            {!finished ? (
                <main className="relative z-10 min-h-0 flex-1 overflow-y-auto">
                    <div className="flex min-h-full w-full items-center justify-center p-2 pb-20 sm:p-3 sm:pb-24 lg:p-4">
                        <div
                            key={idx}
                            className="animate-arena-slide mx-auto flex w-full max-w-3xl flex-col items-center gap-3 sm:gap-4 lg:gap-5"
                        >
                            <UnitChip title={round?.unitTitle} />

                            {SpecialRound ? (
                                <SpecialRound
                                    round={round}
                                    onPick={handlePick}
                                    onComplete={handleSpecialComplete}
                                    correctId={correctId}
                                    wrong={wrong}
                                    disabled={correctId !== null}
                                />
                            ) : (
                                <>
                                    <StandardPrompt
                                        style={style}
                                        round={round}
                                        disabled={correctId !== null}
                                    />
                                    <StandardOptions
                                        round={round}
                                        style={style}
                                        correctId={correctId}
                                        wrong={wrong}
                                        onPick={handlePick}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </main>
            ) : (
                /* ── Results card ───────────────────────────────────────────── */
                <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-3 sm:p-4">
                    <div className="animate-arena-pop flex w-full max-w-md flex-col items-center rounded-3xl border border-white/60 bg-white/95 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-8">
                        <div className="-mt-12 mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-100 to-pink-200 shadow-inner sm:-mt-16 sm:h-28 sm:w-28">
                            <span className="text-4xl sm:text-6xl">🏆</span>
                        </div>

                        <h1 className="mb-1 text-2xl font-black text-gray-800 sm:text-4xl">
                            {scorePct >= 90
                                ? "Brilliant!"
                                : scorePct >= 70
                                  ? "Awesome!"
                                  : "Good job!"}
                        </h1>
                        <p className="mb-4 text-xs font-bold text-gray-500 sm:text-base">
                            You got{" "}
                            <span className="font-black text-emerald-500">{correctCount}</span>
                            {" / "}
                            <span className="font-black">{total}</span> right.
                        </p>

                        <div className="mb-4 flex items-center gap-2 sm:gap-3">
                            {[1, 2, 3].map((s) => (
                                <span
                                    key={s}
                                    className={`text-3xl transition-all duration-500 sm:text-5xl ${s <= stars ? "animate-arena-star scale-110 opacity-100" : "scale-75 opacity-20 grayscale"}`}
                                    style={{ animationDelay: `${s * 0.18}s` }}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>

                        <div className="mb-4 grid w-full grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5 text-center">
                                <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                    Correct
                                </p>
                                <p className="text-lg font-black text-emerald-600 sm:text-2xl">
                                    {correctCount}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-2.5 text-center">
                                <p className="mb-0.5 text-[9px] font-black uppercase tracking-wider text-purple-600">
                                    Bonus XP
                                </p>
                                <p className="text-lg font-black text-purple-600 sm:text-2xl">
                                    +{Math.min(50, correctCount * 5)}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2">
                            <button
                                onClick={handleFinish}
                                disabled={submitting}
                                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-50 sm:text-base"
                            >
                                {submitting ? "Saving…" : "Save & back to map →"}
                            </button>
                            <button
                                onClick={() => router.reload({ only: ["arena"] })}
                                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 text-xs font-black text-gray-700 transition-colors hover:bg-gray-50 sm:text-sm"
                            >
                                Play again
                            </button>
                        </div>
                    </div>
                </main>
            )}

            {/* ── Keyframes ────────────────────────────────────────────────── */}
            <style>{`
                @keyframes arena-slide {
                    from { opacity:0; transform:translateY(20px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .animate-arena-slide { animation: arena-slide .35s cubic-bezier(.16,1,.3,1) forwards; }

                @keyframes arena-pop {
                    0%   { opacity:0; transform:scale(.85) translateY(15px); }
                    60%  { transform:scale(1.04) translateY(-4px); }
                    100% { opacity:1; transform:scale(1) translateY(0); }
                }
                .animate-arena-pop { animation: arena-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }

                @keyframes arena-star {
                    0%   { transform:scale(0); }
                    60%  { transform:scale(1.3); }
                    100% { transform:scale(1.1); }
                }
                .animate-arena-star { animation: arena-star .4s cubic-bezier(.34,1.56,.64,1) forwards; }
            `}</style>

            <StreakCelebration />

            {/* StageBreadcrumb — moved to top dock in v2 (May 2026);
                kept here only as a no-op fallback for older render
                paths. The actual pill is rendered right after the
                AppHeader above. */}

            {!finished && (
                <button
                    onClick={skipArena}
                    className="group fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full border-2 border-white/40 bg-gradient-to-r from-purple-500 to-fuchsia-600 px-4 py-2.5 text-white shadow-xl transition-all hover:-translate-y-0.5 hover:from-purple-600 hover:to-fuchsia-700 active:translate-y-0"
                    aria-label="End run early"
                    title="End run early and see results"
                >
                    <span className="text-base transition-transform group-hover:scale-110 sm:text-lg">
                        🏁
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider sm:text-sm">
                        Finish
                    </span>
                </button>
            )}
        </div>
    );
};

export default ArenaScreen;
