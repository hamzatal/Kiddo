import React, { useEffect, useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import SmartImage from "@/learning/components/ui/SmartImage";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * VocabGameMode — multi-round picture/word matching game.
 *
 * Layout v5 (May 2026) — visibility overhaul.
 *
 * Operator complaint round 2: "kid sees only the audio button at
 * the top and the words 'Blue', 'Red' as plain text below — page
 * looks empty, can't progress". Two contributing factors:
 *
 *   1. The OptionCard previously rendered as a near-white tile on
 *      a near-white page so kids didn't recognise it as a button.
 *      Fixed in OptionCard.jsx v7 (tinted gradient + thick purple
 *      ring + animated TAP badge + min-h fallback).
 *
 *   2. THIS file's prompt header buried the "what to do" message
 *      in a tiny 10px purple chip ("Find the colour or number!")
 *      that was easy to skip. The audio-to-image branch was the
 *      worst offender — just a button, a hint pill, and nothing
 *      pointing the kid at the cards below. So we now surface a
 *      bold, eye-catching "👇 Tap a picture below!" instruction
 *      under the prompt, and bump the prompt-card padding so the
 *      whole header reads like a single confident block.
 */
const VocabGameMode = ({ lesson, deck = [], onComplete, promptText }) => {
    const rounds = useMemo(() => deck || [], [deck]);
    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);
    const [correctId, setCorrectId] = useState(null);
    const [showHint, setShowHint] = useState(false);

    if (!rounds.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">🧩</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No rounds yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Your teacher hasn't added words for this lesson yet — let's keep going.
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

    const round = rounds[idx];
    const prompt = round?.prompt;
    const style = round?.style || "word-to-image";
    const isAudioStyle = style === "audio-to-image";

    // Reveal hint after first wrong attempt for audio-style rounds.
    useEffect(() => {
        if (isAudioStyle && wrong.length >= 1) setShowHint(true);
    }, [wrong.length, isAudioStyle]);

    // Reset hint between rounds.
    useEffect(() => {
        setShowHint(false);
    }, [idx]);

    // Auto-play the word once when a new audio-style round starts.
    useEffect(() => {
        if (isAudioStyle && prompt?.audioClip) {
            const t = setTimeout(() => playAudio(prompt.audioClip), 300);
            return () => clearTimeout(t);
        }
    }, [idx, isAudioStyle, prompt?.audioClip]);

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
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
    const optionsCount = round?.options?.length || 0;

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            {/* Compact progress + prompt header */}
            <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border-2 border-purple-100 px-4 py-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-purple-600">{idx + 1}/{rounds.length}</span>
                </div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest text-center">{label}</p>

                {/* Prompt body — depends on the round style. */}
                <div className="flex items-center justify-center gap-2 min-h-[3rem]">
                    {isAudioStyle ? (
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => playAudio(prompt?.audioClip)}
                                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                aria-label="Play target audio"
                            >🔊</button>
                            <button
                                onClick={() => setShowHint((h) => !h)}
                                aria-label={showHint ? "Hide hint" : "Show hint"}
                                aria-pressed={showHint}
                                className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                                    showHint
                                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                                        : "bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50 border border-gray-200"
                                }`}
                            >
                                {showHint && prompt?.text ? `🔠 ${prompt.text.toUpperCase()}` : "💡 Hint"}
                            </button>
                        </div>
                    ) : style === "image-to-word" ? (
                        // SmartImage so kids always see a clear
                        // visual prompt — even when the target word
                        // doesn't have a configured image_path the
                        // colourful emoji-tile fallback gives a
                        // recognisable hint.
                        <SmartImage
                            src={prompt?.imagePath}
                            label={prompt?.text || ""}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl"
                            imgClassName="w-full h-full object-contain"
                        />
                    ) : (
                        <>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-gray-800 tracking-tight">{prompt?.text}</h2>
                            <AudioClipButton clip={prompt?.audioClip} wordId={round?.wordId} label={prompt?.text} size="sm" />
                        </>
                    )}
                </div>
            </div>

            {/*
              "👇 Tap a picture below!" arrow — the single most
              important UX fix from May 2026. Without this, kids
              were staring at the audio button at the top wondering
              what to do; the option cards below were too subtle to
              register as the next step. The arrow + bold call-to-
              action makes the relationship between the prompt and
              the cards obvious.
            */}
            <div className="flex flex-col items-center gap-0.5 -mb-1">
                <span className="text-2xl animate-bounceArrow leading-none">👇</span>
                <span className="text-[11px] sm:text-xs font-black text-purple-600 uppercase tracking-widest">
                    {isAudioStyle
                        ? "Tap the picture you heard!"
                        : style === "image-to-word"
                        ? "Tap the matching word!"
                        : "Tap the matching picture!"}
                </span>
            </div>

            {/* Options grid — 3 columns on every breakpoint so all
                three same-category siblings stay visible above the
                fold even on a 360px phone. Wider max-width and
                gap so cards have proper breathing room. */}
            <div
                className={`grid gap-3 sm:gap-4 lg:gap-5 w-full max-w-3xl mx-auto justify-items-stretch ${
                    optionsCount === 2
                        ? "grid-cols-2"
                        : optionsCount === 4
                        ? "grid-cols-2 sm:grid-cols-4"
                        : "grid-cols-3"
                }`}
            >
                {(round.options || []).map((opt) => {
                    let state = "idle";
                    if (correctId === opt.id) state = "correct";
                    else if (wrong.includes(opt.id)) state = "wrong";
                    else if (correctId !== null) state = "disabled";

                    const useText = style === "image-to-word";
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

            {wrong.length > 0 ? (
                <p className="text-[11px] font-bold text-red-500 text-center">
                    Not quite — try another one!
                </p>
            ) : null}

            <style>{`
                @keyframes bounceArrow {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(4px); }
                }
                .animate-bounceArrow { animation: bounceArrow 1.2s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default VocabGameMode;
