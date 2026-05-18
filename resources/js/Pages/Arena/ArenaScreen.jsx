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
 * ArenaScreen — the mixed-review "Games Arena".
 *
 * Plays a single rotating session that hops between 4 game styles
 * round-by-round so the experience feels varied even though the
 * underlying primitive is "tap the correct option among 3".
 *
 * Styles
 * ──────
 *   • word-to-image     show the word + speaker → tap the picture
 *   • audio-to-image    just a big speaker      → tap the picture
 *   • image-to-word     show the picture        → tap the word
 *   • listen-then-spell big speaker             → tap the word
 *
 * The deck is built server-side (see GamesArenaController::buildDeck);
 * here we just render whatever style comes next.
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

    const [idx, setIdx]                 = useState(0);
    const [results, setResults]         = useState([]);
    const [wrong, setWrong]             = useState([]);  // option ids the kid tried this round
    const [correctId, setCorrectId]     = useState(null);
    const [finished, setFinished]       = useState(false);
    const [submitting, setSubmitting]   = useState(false);

    const round  = rounds[idx];
    const style  = round?.style || "word-to-image";
    const meta   = STYLE_META[style] || STYLE_META["word-to-image"];

    /**
     * Reset every per-session piece of state. We use a session key
     * derived from the deck identity so when the operator clicks
     * "Play again" we re-fetch a fresh deck (Inertia reloads the
     * `arena` prop) and the effect snaps the UI back to round 1.
     */
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

    // Auto-play prompt audio for listening-style rounds. We also
    // pre-warm the speaker for word/image rounds so a tap responds
    // instantly. Always stop any previous audio first to avoid
    // overlap when the kid blasts through rounds.
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
            <div className="h-[100dvh] w-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-amber-50">
                <div className="text-center max-w-sm px-6">
                    <span className="text-6xl block mb-4">🎮</span>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">No words yet!</h2>
                    <p className="text-gray-500 mb-6 font-bold">
                        Finish your first lesson to unlock the Games Arena.
                    </p>
                    <button onClick={() => router.visit("/map")}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md">
                        ← Back to Map
                    </button>
                </div>
            </div>
        );
    }

    function handleAdvance(finalResults) {
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
            wordId:  round.wordId || null,
            word:    round.prompt?.text || null,
            style,
            correct: firstTry,
            timeMs:  Date.now() - startedAtRef.current,
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
            const next = recordResult(option, firstTry, firstWrongOpt);

            // Mini confetti burst on every correct answer
            setTimeout(() => {
                const el = containerRef.current;
                if (el) {
                    const rect = el.getBoundingClientRect();
                    launchStars(rect.left + rect.width / 2, rect.top + rect.height / 2.5, 6);
                }
            }, 100);

            setTimeout(() => handleAdvance(next), 950);
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

    // ── computed ──────────────────────────────────────────────
    const total       = rounds.length;
    const correctCount= results.filter((r) => r.correct).length;
    const scorePct    = total ? Math.round((correctCount / total) * 100) : 0;
    const stars       = scorePct >= 90 ? 3 : scorePct >= 70 ? 2 : 1;

    return (
        <div ref={containerRef}
            className="h-[100dvh] w-screen font-sans flex flex-col overflow-hidden relative bg-gradient-to-br from-purple-50 via-white to-amber-50">

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[20rem] h-[20rem] bg-purple-200/40 rounded-full blur-[60px] animate-arena-float1" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[18rem] h-[18rem] bg-amber-200/40 rounded-full blur-[60px] animate-arena-float2" />
                <div className="absolute top-[40%] left-[60%] w-[14rem] h-[14rem] bg-cyan-200/40 rounded-full blur-[50px] animate-arena-float3" />
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
            />

            {!finished ? (
                <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 lg:p-6 relative z-10 overflow-y-auto">
                    <div key={idx} className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col items-center gap-4 sm:gap-6 animate-arena-slide">
                        <UnitChip title={round?.unitTitle} colorKey={round?.unitColor} />

                        <Prompt
                            style={style}
                            round={round}
                            disabled={correctId !== null}
                        />

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl lg:max-w-3xl px-1">
                            {(round?.options || []).map((opt) => {
                                const isCorrectPick = correctId === opt.id;
                                const isWrong       = wrong.includes(opt.id);
                                let cardState = "idle";
                                if (isCorrectPick) cardState = "correct";
                                else if (isWrong) cardState = "wrong";
                                else if (correctId !== null) cardState = "disabled";

                                // For "image-to-word" / "listen-then-spell" we want
                                // the answer to be the WORD label, no image
                                // (otherwise the kid just matches images).
                                const useText = style === "image-to-word" || style === "listen-then-spell";
                                // Hide labels on "audio-to-image" rounds so the
                                // child has to listen, not read. Every other
                                // style benefits from the visible word.
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
                <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
                    <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-arena-pop">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-100 to-pink-200 rounded-full flex items-center justify-center shadow-inner border-4 border-white -mt-16 sm:-mt-20 mb-4">
                            <span className="text-4xl sm:text-6xl">🏆</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-black text-gray-800 mb-1">
                            {scorePct >= 90 ? "Brilliant!" : scorePct >= 70 ? "Awesome!" : "Good job!"}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 font-bold mb-5">
                            You got <span className="text-emerald-500 font-black">{correctCount}</span> / <span className="font-black">{total}</span> right.
                        </p>

                        <div className="flex items-center gap-2 sm:gap-3 mb-6">
                            {[1, 2, 3].map((s) => (
                                <span key={s} className={`text-3xl sm:text-5xl transition-all duration-500 ${
                                    s <= stars ? "opacity-100 scale-110 animate-arena-star" : "opacity-20 grayscale scale-75"
                                }`} style={{ animationDelay: `${s * 0.18}s` }}>⭐</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full mb-6">
                            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Correct</p>
                                <p className="text-xl sm:text-2xl font-black text-emerald-600">{correctCount}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-1">Bonus XP</p>
                                <p className="text-xl sm:text-2xl font-black text-purple-600">+{Math.min(50, correctCount * 5)}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <button onClick={handleFinish} disabled={submitting}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-2xl font-black text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50">
                                {submitting ? "Saving…" : "Save & back to map →"}
                            </button>
                            <button onClick={() => router.reload({ only: ["arena"] })}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-black text-sm hover:bg-gray-50">
                                Play again
                            </button>
                        </div>
                    </div>
                </main>
            )}

            <style>{`
                @keyframes arena-slide {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-arena-slide { animation: arena-slide .35s cubic-bezier(.16,1,.3,1) forwards; }
                @keyframes arena-pop {
                    0%   { opacity: 0; transform: scale(.85) translateY(15px); }
                    60%  { transform: scale(1.04) translateY(-4px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-arena-pop { animation: arena-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }
                @keyframes arena-star { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1.1); } }
                .animate-arena-star { animation: arena-star .4s cubic-bezier(.34,1.56,.64,1) forwards; }
                @keyframes arena-float1 { 0%,100%{ transform: translate(0,0); } 50%{ transform: translate(20px,-30px); } }
                @keyframes arena-float2 { 0%,100%{ transform: translate(0,0); } 50%{ transform: translate(-20px,20px); } }
                @keyframes arena-float3 { 0%,100%{ transform: translate(0,0); } 50%{ transform: translate(10px,-15px); } }
                .animate-arena-float1 { animation: arena-float1 12s ease-in-out infinite; }
                .animate-arena-float2 { animation: arena-float2 10s ease-in-out infinite; }
                .animate-arena-float3 { animation: arena-float3 8s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

function UnitChip({ title, colorKey }) {
    if (!title) return null;
    return (
        <div className="bg-white/85 backdrop-blur px-4 py-1.5 rounded-full shadow border border-white/60 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-500">From</span>
            <span className="text-xs font-black text-[#1E293B]">{title}</span>
        </div>
    );
}

function Prompt({ style, round, disabled }) {
    const prompt = round?.prompt;
    if (!prompt) return null;

    if (style === "audio-to-image" || style === "listen-then-spell") {
        return (
            <div className="bg-white/90 backdrop-blur px-6 sm:px-10 py-5 sm:py-6 rounded-2xl sm:rounded-3xl shadow-lg border border-white/50 flex flex-col items-center gap-3 w-full max-w-sm">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Listen carefully</p>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => playAudio(prompt.audioClip)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95 transition-transform disabled:opacity-60"
                >
                    🔊
                </button>
                <p className="text-xs text-gray-400 font-bold">Tap to listen again</p>
            </div>
        );
    }

    if (style === "image-to-word") {
        return (
            <div className="bg-white/90 backdrop-blur px-6 sm:px-10 py-5 rounded-2xl sm:rounded-3xl shadow-lg border border-white/50 flex flex-col items-center gap-3 w-full max-w-sm">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">What is this?</p>
                <SmartImage
                    src={prompt.imagePath}
                    label={prompt.text}
                    className="w-32 h-32 sm:w-40 sm:h-40"
                    imgClassName="w-full h-full object-contain"
                />
            </div>
        );
    }

    // word-to-image (default)
    return (
        <div className="bg-white/90 backdrop-blur px-5 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 flex items-center gap-3 sm:gap-4 w-full max-w-md">
            <AudioClipButton
                clip={prompt.audioClip}
                wordId={round?.wordId}
                label={prompt.text}
                size="lg"
            />
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-purple-400 uppercase tracking-wider mb-0.5">Find the picture for</p>
                <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-800 truncate">
                    {prompt.text}
                </h2>
            </div>
        </div>
    );
}

export default ArenaScreen;
