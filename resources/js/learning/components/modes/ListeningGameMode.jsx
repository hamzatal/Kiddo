import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * ListeningGameMode — audio-first matching game.
 *
 * Layout v4 (2026-05) — fixes the "page only shows the audio button"
 * complaint on phones:
 *  • Compact prompt header (≈40% smaller) so the option grid is
 *    visible without scrolling on a 360×640 phone.
 *  • Grid is 3 columns on every breakpoint (was 2 on phones), which
 *    keeps three same-category cards visible above the fold.
 *  • Cards have an explicit "Tap me!" affordance — a thick dashed
 *    purple ring on idle so the kid recognises them as buttons even
 *    when they fall back to the SVG image.
 *  • New "Show word" hint button reveals the prompt text after the
 *    first wrong answer (or any time the kid taps the hint pill).
 *    Stuck kids can still progress; the round is still scored from
 *    their first attempt so cheating doesn't pay off.
 *  • Empty-deck state actually says what to do next.
 */
const ListeningGameMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => deck || [], [deck]);
    const maxRounds = Math.min(rounds.length, lesson?.config?.rounds || 6);
    const activeRounds = useMemo(() => rounds.slice(0, maxRounds), [rounds, maxRounds]);

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [correctId, setCorrectId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const playToken = useRef(0);

    const round = activeRounds[idx];
    const prompt = round?.prompt;

    // Auto-play the audio once when the round changes. We track a
    // per-mount token so a fast next-question advance never lets a
    // stale playback resolve into the new round's state.
    useEffect(() => {
        if (!prompt?.audioClip) return;
        const token = ++playToken.current;
        const t = setTimeout(async () => {
            if (token !== playToken.current) return;
            setIsPlaying(true);
            try {
                await playAudio(prompt.audioClip);
            } catch (_) { /* ignore */ }
            if (token === playToken.current) setIsPlaying(false);
        }, 350);
        return () => {
            clearTimeout(t);
            stopAllAudio();
        };
    }, [idx, prompt?.audioClip]);

    // Reveal the hint automatically after the first wrong attempt so
    // a stuck child sees the spelling on the second try.
    useEffect(() => {
        if (wrong.length >= 1) setShowHint(true);
    }, [wrong.length]);

    // Reset the hint when we move to the next round so each round
    // starts as a pure listening challenge again.
    useEffect(() => {
        setShowHint(false);
    }, [idx]);

    if (!activeRounds.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">🎧</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No listening rounds yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Your teacher hasn't recorded these clips yet — let's keep going.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-black shadow-md hover:-translate-y-0.5 transition-all"
                >
                    Continue →
                </button>
            </div>
        );
    }

    const handlePlayAgain = () => {
        playClick();
        if (!prompt?.audioClip) return;
        const token = ++playToken.current;
        setIsPlaying(true);
        playAudio(prompt.audioClip).finally(() => {
            if (token === playToken.current) setIsPlaying(false);
        });
    };

    const toggleHint = () => {
        playClick();
        setShowHint((h) => !h);
    };

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
            // Telemetry: kid's FIRST chronological wrong tap (wrong[0]).
            const firstWrongOpt = round.options?.find((o) => o.id === wrong[0]);
            const next = [...results, {
                roundId: round.roundId,
                wordId: round.wordId,
                word: prompt?.text,
                correct: firstTry,
                timeMs: 0,
                wrongChoice: firstWrongOpt?.word,
                wrongChoiceId: firstWrongOpt?.wordId,
            }];
            setResults(next);
            setTimeout(() => advance(next), 1000);
        } else {
            playFail();
            setWrong((w) => [...w, option.id]);
        }
    };

    const advance = (finalResults) => {
        if (idx + 1 >= activeRounds.length) {
            onComplete({
                correct: finalResults.filter((r) => r.correct).length,
                total: activeRounds.length,
                rounds: finalResults,
            });
            return;
        }
        setIdx(idx + 1);
        setWrong([]);
        setCorrectId(null);
    };

    const progressPct = Math.round((idx / activeRounds.length) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Compact prompt card — progress + listen button + hint */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600">{idx + 1}/{activeRounds.length}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Listen &amp; tap the picture</p>
                    <button
                        onClick={handlePlayAgain}
                        disabled={isPlaying}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl text-white shadow-xl transition-all ${
                            isPlaying
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse scale-110"
                                : "bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95"
                        }`}
                        aria-label="Play again"
                    >{isPlaying ? "🎵" : "🔊"}</button>

                    {/* Hint pill — shows the prompt text on demand. Becomes
                        much more prominent (filled background) once
                        revealed so the child knows the word is shown. */}
                    {prompt?.text ? (
                        <button
                            onClick={toggleHint}
                            className={`mt-0.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                showHint
                                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                                    : "bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50 border border-gray-200"
                            }`}
                            aria-label={showHint ? "Hide hint" : "Show hint"}
                        >
                            {showHint ? `🔠 ${prompt.text.toUpperCase()}` : "💡 Hint"}
                        </button>
                    ) : (
                        <p className="text-[10px] text-gray-400 font-bold">Tap to listen again</p>
                    )}
                </div>
            </div>

            {/* Option grid — 3 columns on every breakpoint so the kid
                sees all three same-category siblings without scrolling. */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 w-full max-w-2xl mx-auto justify-items-center">
                {(round.options || []).map((opt) => {
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong.includes(opt.id);
                    const disabled = correctId !== null || isWrong;

                    let cls = "border-purple-200 hover:border-purple-400 hover:shadow-lg hover:-translate-y-1";
                    if (isCorrect) cls = "border-emerald-400 bg-emerald-50 scale-[1.04] shadow-xl ring-4 ring-emerald-200 z-10";
                    if (isWrong)   cls = "border-red-300 bg-red-50/60 opacity-50 scale-95";

                    return (
                        <button
                            key={opt.id}
                            disabled={disabled}
                            onClick={() => handlePick(opt)}
                            className={`relative aspect-square w-full rounded-2xl border-2 border-dashed transition-all duration-300 shadow-sm flex items-center justify-center overflow-hidden bg-white ${cls}`}
                            aria-label={`Option: ${opt.word}`}
                        >
                            <SmartImage
                                src={opt.imagePath}
                                label={opt.word || ""}
                                className="absolute inset-0 w-full h-full"
                                imgClassName="w-full h-full object-contain p-1.5 sm:p-2 drop-shadow"
                            />
                            {isCorrect && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow animate-bounce">✓</div>
                            )}
                            {isWrong && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow">✕</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {wrong.length > 0 ? (
                <p className="text-[11px] font-bold text-red-500 text-center">
                    Not quite — listen again 🎧
                </p>
            ) : (
                <p className="text-[11px] font-semibold text-gray-400 text-center">
                    Tap the picture that matches the word you heard
                </p>
            )}
        </div>
    );
};

export default ListeningGameMode;
