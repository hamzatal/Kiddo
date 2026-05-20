import React, { useEffect, useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * VocabGameMode — multi-round picture/word matching game.
 *
 * Layout v4 (2026-05) — fixes "the page only shows the audio button"
 * complaint:
 *  • Compact prompt header. Word always visible for `word-to-image`
 *    so the child sees what they're looking for.
 *  • For `audio-to-image` rounds the word stays hidden as a pure
 *    listening challenge, but a "Show word" hint pill reveals it
 *    after a wrong attempt (or whenever the child taps the pill).
 *    Without this hint stuck kids had no path forward — they'd see
 *    only a 🔊 button and bland fallback tiles below.
 *  • Grid is 3 columns on every breakpoint so all three same-
 *    category cards are visible above the fold on a 360px phone
 *    (was 2 cols on phone, putting the third option below the fold).
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

                {/* Prompt body — depends on the round style. */}
                <div className="flex items-center justify-center gap-2 min-h-[3rem]">
                    {isAudioStyle ? (
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => playAudio(prompt?.audioClip)}
                                className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
                                aria-label="Play target audio"
                            >🔊</button>
                            {/* Hint pill — reveals the word for audio-style
                                rounds. Auto-shown after a wrong attempt. */}
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

            {/* Options grid — 3 columns on every breakpoint so all three
                same-category siblings stay visible above the fold even
                on a 360px phone. Larger screens get 4-up. */}
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full max-w-2xl lg:max-w-3xl mx-auto justify-items-center">
                {(round.options || []).map((opt) => {
                    let state = "idle";
                    if (correctId === opt.id) state = "correct";
                    else if (wrong.includes(opt.id)) state = "wrong";
                    else if (correctId !== null) state = "disabled";

                    const useText = style === "image-to-word";
                    // Show the word label only for the image-to-word
                    // round (where the option IS a word). Every other
                    // style hides the label so the child can't read
                    // their way to the answer.
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
        </div>
    );
};

export default VocabGameMode;
