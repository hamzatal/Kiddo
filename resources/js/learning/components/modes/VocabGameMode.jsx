import React, { useEffect, useMemo, useRef, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import ModeHint from "@/learning/components/ui/ModeHint";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * VocabGameMode — multi-round picture/word matching game.
 *
 * Layout v3:
 *  • Compact prompt header (no big white slab eating the screen).
 *  • Option grid uses dynamic columns: 2 on phones, 3 on tablets,
 *    up to 4 on big desktops. Each option is `aspect-square` so
 *    they line up cleanly.
 *  • The whole game fits a 720p tablet without scroll.
 */
const VocabGameMode = ({ lesson, deck = [], onComplete, promptText }) => {
    const rounds = useMemo(() => deck || [], [deck]);
    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [correctId, setCorrectId] = useState(null);
    /** Track whether the kid has heard / seen the prompt at least once
     *  so the after-prompt CTA ('now tap a card') can switch on. Same
     *  stuck-state guard the ListeningGameMode rewrite added — when
     *  the round is `audio-to-image` the kid has nothing on screen
     *  except a speaker button, and without a follow-up nudge they
     *  often sat staring at the cards waiting for "something" to
     *  happen. */
    const [promptDone, setPromptDone] = useState(false);
    const idleTimerRef = useRef(null);

    const round = rounds[idx];
    const prompt = round?.prompt;
    const style = round?.style || "word-to-image";

    /** Auto-play the audio target on `audio-to-image` rounds so a
     *  non-reader can play hands-free, AND set `promptDone` once the
     *  audio finishes (or immediately for non-audio rounds where the
     *  prompt is just a word/picture the kid can already see). */
    useEffect(() => {
        setPromptDone(false);
        if (style !== "audio-to-image") {
            // For word-to-image / image-to-word the prompt is visible
            // the moment the round paints. Mark "ready to tap" right
            // away so the after-prompt CTA shows.
            const t = setTimeout(() => setPromptDone(true), 250);
            return () => clearTimeout(t);
        }
        // audio-to-image: play, then mark prompt done.
        const t = setTimeout(async () => {
            try { await playAudio(prompt?.audioClip); } catch (_) {}
            setPromptDone(true);
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx, style]);

    /** Stuck-state safety net: after the prompt is done, if the kid
     *  hasn't tapped within 10s we replay the audio and re-arm. This
     *  keeps them from staring at the screen forever. */
    useEffect(() => {
        if (!promptDone || correctId !== null) return;
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (style === "audio-to-image" && prompt?.audioClip) {
                playAudio(prompt.audioClip);
            }
        }, 10_000);
        return () => clearTimeout(idleTimerRef.current);
    }, [promptDone, correctId, style, prompt?.audioClip, idx]);

    if (!rounds.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No rounds available for this lesson yet.</p>
                <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full">
                    Skip
                </button>
            </div>
        );
    }

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
        if (idx + 1 >= rounds.length) {
            onComplete({
                correct: finalResults.filter((r) => r.correct).length,
                total: rounds.length,
                rounds: finalResults,
            });
            return;
        }
        setIdx(idx + 1);
        setWrong([]);
        setCorrectId(null);
    };

    const label = promptText || lesson?.config?.prompt || "Find the correct picture!";
    const progressPct = Math.round((idx / rounds.length) * 100);

    /** Two-state next-step hint, mirrors the ListeningGameMode fix.
     *  For `image-to-word` rounds the kid is reading the answer, so
     *  the hint reads "tap the right WORD" instead of "picture". */
    const optionLabel = style === "image-to-word" ? "word" : "picture";
    const hint = correctId !== null
        ? { text: "Nice pick!", tone: "success", icon: "🎉", pulse: false }
        : !promptDone && style === "audio-to-image"
            ? { text: "Listen carefully…", tone: "hint", icon: "🎧", pulse: false }
            : { text: `Now tap the right ${optionLabel}!`, tone: "action", icon: "✨", pulse: true };

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            {/* Compact progress + prompt header */}
            <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-purple-600">{idx + 1}/{rounds.length}</span>
                </div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest text-center">{label}</p>
                <div className="flex items-center justify-center gap-2">
                    {style === "audio-to-image" ? (
                        <button
                            onClick={() => playAudio(prompt?.audioClip)}
                            className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
                            aria-label="Play target audio"
                        >🔊</button>
                    ) : style === "image-to-word" ? (
                        prompt?.imagePath ? (
                            <img src={prompt.imagePath} alt={prompt.text} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                        ) : <span className="text-4xl">🔤</span>
                    ) : (
                        <>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-gray-800 tracking-tight">{prompt?.text}</h2>
                            <AudioClipButton clip={prompt?.audioClip} wordId={round?.wordId} label={prompt?.text} size="sm" />
                        </>
                    )}
                </div>
            </div>

            {/* Step-by-step CTA so the kid is never stuck staring
                at the screen. Uses the shared ModeHint primitive
                with a pulse animation when it's time to tap. */}
            <ModeHint text={hint.text} icon={hint.icon} tone={hint.tone} pulse={hint.pulse} />

            {/* Options grid — `mx-auto justify-items-center` keeps
                 the grid horizontally centred on wide screens even
                 when the round has fewer options than columns. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl lg:max-w-3xl mx-auto justify-items-center">
                {(round.options || []).map((opt) => {
                    let state = "idle";
                    if (correctId === opt.id) state = "correct";
                    else if (wrong.includes(opt.id)) state = "wrong";
                    else if (correctId !== null) state = "disabled";

                                const useText = style === "image-to-word";
                                // Show the word label only for the image-to-word
                                // round (where the option IS a word). Every other
                                // style hides the label so the child can't read
                                // their way to the answer — they have to look at
                                // the picture or listen to the audio. This matters
                                // because rounds are picture-based and the goal is
                                // visual / aural recognition, not reading.
                                const showLabel = useText;
                                return (
                                    <OptionCard
                                        key={opt.id}
                                        imagePath={useText ? null : opt.imagePath}
                                        label={opt.word}
                                        audioClip={opt.audioClip}
                                        wordId={opt.wordId}
                                        showLabel={showLabel}
                                        state={state}
                                        onClick={() => handlePick(opt)}
                                    />
                                );
                })}
            </div>
        </div>
    );
};

export default VocabGameMode;
