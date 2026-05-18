import React, { useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
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

    const round = rounds[idx];
    const prompt = round?.prompt;
    const style = round?.style || "word-to-image";

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();

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

            {/* Options grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl lg:max-w-3xl">
                {(round.options || []).map((opt) => {
                    let state = "idle";
                    if (correctId === opt.id) state = "correct";
                    else if (wrong.includes(opt.id)) state = "wrong";
                    else if (correctId !== null) state = "disabled";

                    const useText = style === "image-to-word";
                    return (
                        <OptionCard
                            key={opt.id}
                            imagePath={useText ? null : opt.imagePath}
                            label={opt.word}
                            audioClip={opt.audioClip}
                            wordId={opt.wordId}
                            showLabel={useText || style !== "audio-to-image"}
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
