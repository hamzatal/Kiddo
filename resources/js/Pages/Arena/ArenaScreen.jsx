import React, { useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import AppHeader from "@/learning/components/ui/AppHeader";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick, playCheer, playStarCollect } from "@/learning/utils/soundEffects";
import { launchConfetti, launchStars } from "@/learning/utils/confetti";

/**
 * ArenaScreen v3 — mixed-review Games Arena.
 *
 * Same content as v2 but every section now fits a 720p tablet
 * viewport without internal scroll. Compact header card, denser
 * 3-column option grid, smaller celebration card.
 */

const STYLE_META = {
    "word-to-image":     { label: "Spot it!",     icon: "🔎", color: "#7C3AED" },
    "audio-to-image":    { label: "Listen!",      icon: "🎧", color: "#0EA5E9" },
    "image-to-word":     { label: "Name it!",     icon: "🏷️", color: "#10B981" },
    "listen-then-spell": { label: "Tap the word", icon: "📝", color: "#F59E0B" },
};

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

    /** Reset session state when a new deck is loaded ("Play again"). */
    const sessionKey = (rounds[0]?.roundId || "") + ":" + rounds.length;
    useEffect(() => {
        setIdx(0);
        setResults([]);
        setWrong([]);
        setCorrectId(null);
        setFinished(false);
        setSubmitting(false);
        startedAtRef.current = Date.now();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    if (!rounds.length) {
        return (
            <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50 px-4">
                <div className="text-center max-w-sm">
                    <span className="text-6xl block mb-4">🎮</span>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">No words yet!</h2>
                    <p className="text-gray-500 mb-6 font-bold">Finish your first lesson to unlock the Games Arena.</p>
                    <button onClick={() => router.visit("/map")}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md">
                        ← Back to Map
                    </button>
                </div>
            </div>
        );
    }

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
        const next = [...results, {
            roundId: round.roundId,
            wordId: round.wordId || null,
            word: round.prompt?.text || null,
            style,
            correct: firstTry,
            timeMs: Date.now() - startedAtRef.current,
            wrongChoice: firstWrongOpt?.word || null,
        }];
        setResults(next);
        return next;
    }

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
                    const rect = el.getBoundingClientRect();
                    launchStars(rect.left + rect.width / 2, rect.top + rect.height / 2.5, 6);
                }
            }, 100);
            setTimeout(handleAdvance, 950);
        } else {
            playFail();
            setWrong((w) => [...w, option.id]);
        }
    }

    function handleFinish() {
        if (submitting) return;
        setSubmitting(true);
        playClick();
        router.post("/arena/submit", {
            rounds: results,
            durationMs: Date.now() - startedAtRef.current,
        });
    }

    const total = rounds.length;
    const correctCount = results.filter((r) => r.correct).length;
    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    const stars = scorePct >= 90 ? 3 : scorePct >= 70 ? 2 : 1;

    return (
        <div ref={containerRef}
            className="h-[100dvh] w-screen font-sans flex flex-col overflow-hidden relative bg-gradient-to-br from-purple-50 via-white to-amber-50">
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-amber-200/40 rounded-full blur-3xl" />
                <div className="absolute top-[40%] left-[60%] w-56 h-56 bg-cyan-200/40 rounded-full blur-2xl" />
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
            />

            {!finished ? (
                <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-3 lg:p-4 relative z-10 overflow-y-auto">
                    <div key={idx} className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-arena-slide">
                        <UnitChip title={round?.unitTitle} colorKey={round?.unitColor} />

                        <Prompt style={style} round={round} disabled={correctId !== null} />

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl">
                            {(round?.options || []).map((opt) => {
                                const isCorrectPick = correctId === opt.id;
                                const isWrong = wrong.includes(opt.id);
                                let cardState = "idle";
                                if (isCorrectPick) cardState = "correct";
                                else if (isWrong) cardState = "wrong";
                                else if (correctId !== null) cardState = "disabled";

                                const useText = style === "image-to-word" || style === "listen-then-spell";
                                const wantLabel = useText || style !== "audio-to-image";

                                return (
                                    <OptionCard
                                        key={opt.id}
                                        imagePath={useText ? null : opt.imagePath}
                                        label={opt.word}
                                        audioClip={opt.audioClip}
                                        wordId={opt.wordId || null}
                                        showLabel={wantLabel}
                                        state={cardState}
                                        onClick={() => handlePick(opt)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 flex items-center justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-8 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-arena-pop">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white -mt-12 sm:-mt-16 mb-3">
                            <span className="text-4xl sm:text-6xl">🏆</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-black text-gray-800 mb-1">
                            {scorePct >= 90 ? "Brilliant!" : scorePct >= 70 ? "Awesome!" : "Good job!"}
                        </h1>
                        <p className="text-xs sm:text-base text-gray-500 font-bold mb-4">
                            You got <span className="text-emerald-500 font-black">{correctCount}</span> / <span className="font-black">{total}</span> right.
                        </p>

                        <div className="flex items-center gap-2 sm:gap-3 mb-4">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`text-3xl sm:text-5xl transition-all duration-500 ${s <= stars ? "opacity-100 scale-110 animate-arena-star" : "opacity-20 grayscale scale-75"}`}
                                    style={{ animationDelay: `${s * 0.18}s` }}>⭐</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 w-full mb-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Correct</p>
                                <p className="text-lg sm:text-2xl font-black text-emerald-600">{correctCount}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-0.5">Bonus XP</p>
                                <p className="text-lg sm:text-2xl font-black text-purple-600">+{Math.min(50, correctCount * 5)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <button onClick={handleFinish} disabled={submitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-2xl font-black text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50">
                                {submitting ? "Saving…" : "Save & back to map →"}
                            </button>
                            <button onClick={() => router.reload({ only: ["arena"] })}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-2xl font-black text-xs sm:text-sm hover:bg-gray-50">
                                Play again
                            </button>
                        </div>
                    </div>
                </main>
            )}

            <style>{`
                @keyframes arena-slide { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-arena-slide { animation: arena-slide .35s cubic-bezier(.16,1,.3,1) forwards; }
                @keyframes arena-pop {
                    0% { opacity: 0; transform: scale(.85) translateY(15px); }
                    60% { transform: scale(1.04) translateY(-4px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-arena-pop { animation: arena-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }
                @keyframes arena-star { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1.1); } }
                .animate-arena-star { animation: arena-star .4s cubic-bezier(.34,1.56,.64,1) forwards; }
            `}</style>
        </div>
    );
};

function UnitChip({ title, colorKey }) {
    if (!title) return null;
    return (
        <div className="bg-white/85 backdrop-blur px-3 py-1 rounded-full shadow border border-white/60 flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500">From</span>
            <span className="text-[11px] font-black text-[#1E293B]">{title}</span>
        </div>
    );
}

function Prompt({ style, round, disabled }) {
    const prompt = round?.prompt;
    if (!prompt) return null;

    if (style === "audio-to-image" || style === "listen-then-spell") {
        return (
            <div className="bg-white/90 backdrop-blur px-5 sm:px-8 py-4 rounded-2xl shadow-lg border border-white/50 flex flex-col items-center gap-2 w-full max-w-xs">
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Listen carefully</p>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => playAudio(prompt.audioClip)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95 transition-transform disabled:opacity-60"
                >🔊</button>
                <p className="text-[10px] text-gray-400 font-bold">Tap to listen again</p>
            </div>
        );
    }

    if (style === "image-to-word") {
        return (
            <div className="bg-white/90 backdrop-blur px-5 py-3 rounded-2xl shadow-lg border border-white/50 flex flex-col items-center gap-2 w-full max-w-xs">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">What is this?</p>
                <SmartImage
                    src={prompt.imagePath}
                    label={prompt.text}
                    className="w-24 h-24 sm:w-32 sm:h-32"
                    imgClassName="w-full h-full object-contain"
                />
            </div>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur px-4 sm:px-6 py-3 rounded-2xl shadow-lg border border-white/60 flex items-center gap-2 sm:gap-3 w-full max-w-md">
            <AudioClipButton clip={prompt.audioClip} wordId={round?.wordId} label={prompt.text} size="md" />
            <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-purple-400 uppercase tracking-wider">Find the picture for</p>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-800 truncate">{prompt.text}</h2>
            </div>
        </div>
    );
}

export default ArenaScreen;
