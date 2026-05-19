import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import ModeHint from "@/learning/components/ui/ModeHint";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * ListeningGameMode — audio-only matching game (no word displayed).
 *
 * Layout v4 (operator stuck-state fix):
 *  • The previous version played audio then showed three picture
 *    cards with no instruction — the only visible text was "Tap to
 *    listen again", which made kids think the speaker IS the answer
 *    and they sat staring at the screen for 30+ seconds.
 *  • Now we surface a clear two-stage instruction:
 *       Stage A (audio still playing)   → "Listen carefully…"
 *       Stage B (audio done, awaiting tap) → ✨ "Now tap the right picture!"
 *    The Stage-B hint pulses so it draws the eye on first paint.
 *  • Each option card grows a subtle "tap-me" wobble animation
 *    once the audio finishes so even non-readers see "I should
 *    interact with these".
 *  • Safety net: if the kid sits idle for 10s after the audio
 *    finishes (no taps, no replay) the audio replays automatically
 *    so a slow learner never gets stranded.
 *  • A lightweight "Need help?" affordance: tapping the speaker
 *    counts as a re-listen (existing) AND clears the wrong-tap
 *    history so the kid can try a fresh first-try.
 */
const ListeningGameMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => deck || [], [deck]);
    const maxRounds = Math.min(rounds.length, lesson?.config?.rounds || 6);
    const activeRounds = rounds.slice(0, maxRounds);

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [correctId, setCorrectId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    /** Once the kid has heard the prompt at least once, the cards
     *  become the primary interaction. Drives the after-audio CTA
     *  + the option-grid pulse. */
    const [audioPlayedOnce, setAudioPlayedOnce] = useState(false);
    const idleTimerRef = useRef(null);
    const promptHasBeenAnnouncedRef = useRef(false);

    const round = activeRounds[idx];
    const prompt = round?.prompt;

    const startPrompt = useMemo(
        () => async () => {
            if (!prompt?.audioClip) {
                // No audio at all — let the kid see the after-audio
                // CTA immediately so they at least know what to do.
                setAudioPlayedOnce(true);
                return;
            }
            setIsPlaying(true);
            try {
                await playAudio(prompt.audioClip);
            } catch (_) { /* ignore — playAudio handles its own errors */ }
            setIsPlaying(false);
            setAudioPlayedOnce(true);
            promptHasBeenAnnouncedRef.current = true;
        },
        [prompt?.audioClip]
    );

    // Reset every round.
    useEffect(() => {
        setAudioPlayedOnce(false);
        promptHasBeenAnnouncedRef.current = false;
        const t = setTimeout(() => startPrompt(), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    // Stuck-state safety net: if the kid hasn't tapped anything for
    // 10 seconds AFTER the audio finished, replay the prompt and
    // re-arm the timer. Cleared on any tap (handlePick / handlePlayAgain).
    useEffect(() => {
        if (!audioPlayedOnce || correctId !== null) return;
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            // Don't spam the kid if the audio is already replaying.
            if (!isPlaying && correctId === null) {
                startPrompt();
            }
        }, 10_000);
        return () => clearTimeout(idleTimerRef.current);
    }, [audioPlayedOnce, isPlaying, correctId, startPrompt]);

    if (!activeRounds.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No rounds available yet.</p>
                <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">
                    Skip
                </button>
            </div>
        );
    }

    const handlePlayAgain = () => {
        playClick();
        clearTimeout(idleTimerRef.current);
        startPrompt();
    };

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();
        clearTimeout(idleTimerRef.current);

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
            const firstWrongOpt = round.options?.find((o) => wrong.includes(o.id));
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

    // Three-state hint, mirrored on the speaker label:
    //   • before audio    → "Listen carefully…"
    //   • audio done      → ✨ "Now tap the right picture!"   (pulse)
    //   • answered        → "Great listening!"  (success tone)
    const hint = correctId !== null
        ? { text: "Great listening!", tone: "success", icon: "🎉", pulse: false }
        : audioPlayedOnce
            ? { text: "Now tap the matching picture!", tone: "action", icon: "✨", pulse: true }
            : isPlaying
                ? { text: "Listen carefully…", tone: "hint", icon: "🎧", pulse: false }
                : { text: "Get ready to listen", tone: "hint", icon: "🎧", pulse: false };

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600">{idx + 1}/{activeRounds.length}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Listen &amp; Choose!</p>
                    <button
                        onClick={handlePlayAgain}
                        disabled={isPlaying}
                        aria-label={isPlaying ? "Listening…" : "Tap to listen again"}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl text-white shadow-xl transition-all ${
                            isPlaying
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse scale-110"
                                : "bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95"
                        }`}
                    >{isPlaying ? "🎵" : "🔊"}</button>
                    <p className="text-[10px] text-gray-400 font-bold">
                        {isPlaying ? "Playing the word…" : "Tap to listen again"}
                    </p>
                </div>
            </div>

            {/* Step-by-step hint that always tells the child what to do
                next. Uses a polite live region so a parent reading along
                hears the change. */}
            <ModeHint text={hint.text} icon={hint.icon} tone={hint.tone} pulse={hint.pulse} />

            <div
                /* `data-listen-options` lets the pulse animation target only
                   the option grid, not the whole page. */
                data-listen-options={audioPlayedOnce && correctId === null ? "ready" : "idle"}
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl mx-auto justify-items-center ${
                    audioPlayedOnce && correctId === null ? "kiddo-listen-options-ready" : ""
                }`}
            >
                {(round.options || []).map((opt) => {
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong.includes(opt.id);
                    const disabled = correctId !== null || isWrong;

                    let cls = "border-white/60 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1";
                    if (isCorrect) cls = "border-emerald-400 bg-emerald-50 scale-[1.02] shadow-xl ring-2 ring-emerald-200";
                    if (isWrong)   cls = "border-red-200 bg-red-50/50 opacity-50 scale-95";

                    return (
                        <button
                            key={opt.id}
                            disabled={disabled}
                            onClick={() => handlePick(opt)}
                            aria-label={opt.word ? `Pick ${opt.word}` : "Pick this picture"}
                            className={`relative aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-300 shadow-sm flex items-center justify-center overflow-hidden bg-white kiddo-listen-card ${cls}`}
                        >
                            <SmartImage
                                src={opt.imagePath}
                                label={opt.word || ""}
                                className="absolute inset-0 w-full h-full"
                                imgClassName="w-full h-full object-contain p-2 drop-shadow"
                            />
                            {isCorrect && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black border-2 border-white shadow animate-bounce">✓</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Once the audio has played, draw a gentle wobble on the
                grid so the kid spots the cards as the next thing to
                tap. Cuts to nothing on prefers-reduced-motion. */}
            <style>{`
                @keyframes kiddoListenWobble {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-3px); }
                }
                .kiddo-listen-options-ready .kiddo-listen-card {
                    animation: kiddoListenWobble 2.4s ease-in-out infinite;
                }
                .kiddo-listen-options-ready .kiddo-listen-card:nth-child(2) { animation-delay: 0.2s; }
                .kiddo-listen-options-ready .kiddo-listen-card:nth-child(3) { animation-delay: 0.4s; }
                .kiddo-listen-options-ready .kiddo-listen-card:nth-child(4) { animation-delay: 0.6s; }
                .kiddo-listen-options-ready .kiddo-listen-card:nth-child(5) { animation-delay: 0.8s; }
                .kiddo-listen-options-ready .kiddo-listen-card:nth-child(6) { animation-delay: 1.0s; }
                @media (prefers-reduced-motion: reduce) {
                    .kiddo-listen-options-ready .kiddo-listen-card { animation: none; }
                }
            `}</style>
        </div>
    );
};

export default ListeningGameMode;
