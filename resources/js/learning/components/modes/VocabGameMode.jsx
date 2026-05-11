import React, { useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import RoundProgress from "@/learning/components/ui/RoundProgress";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * Generic multi-round matching game. Used for vocab, phonics, song
 * and review modes — only the prompt style differs.
 */
const VocabGameMode = ({ lesson, deck = [], onComplete, promptText }) => {
    const rounds = useMemo(() => deck || [], [deck]);
    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrong, setWrong] = useState([]);     // option ids tried this round
    const [correctId, setCorrectId] = useState(null);

    if (!rounds.length) {
        return (
            <div className="text-center p-10">
                <p className="text-gray-500 font-bold">No rounds available for this lesson yet.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-2 bg-[#7C3AED] text-white rounded-full"
                >
                    Skip
                </button>
            </div>
        );
    }

    const round = rounds[idx];
    const prompt = round?.prompt;
    const style = round?.style || "word-to-image";

    const handlePick = async (option) => {
        if (correctId !== null) return;
        playClick();

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();
            const firstTry = wrong.length === 0;
            const next = [...results, {
                roundId: round.roundId,
                correct: firstTry,
                timeMs: 0,
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

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <RoundProgress total={rounds.length} current={idx} results={results} />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    {idx + 1} / {rounds.length}
                </span>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-6 sm:px-10 py-5 rounded-[2rem] shadow-md border border-white flex flex-col items-center gap-3 w-full max-w-2xl">
                <p className="text-[11px] font-black text-purple-500 uppercase tracking-widest">
                    {label}
                </p>

                {style === "audio-to-image" ? (
                    <button
                        onClick={() => playAudio(prompt?.audioClip)}
                        className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center text-white text-4xl shadow-[0_6px_0_#059669] hover:translate-y-[2px] active:translate-y-[6px] transition-all"
                        aria-label="Play target audio"
                    >
                        🔊
                    </button>
                ) : style === "image-to-word" ? (
                    prompt?.imagePath ? (
                        <img
                            src={prompt.imagePath}
                            alt={prompt.text}
                            className="w-32 h-32 object-contain drop-shadow-xl"
                        />
                    ) : (
                        <span className="text-7xl">🔤</span>
                    )
                ) : (
                    <div className="flex items-center gap-3">
                        <h2 className="text-4xl sm:text-5xl font-black uppercase text-[#1E293B] tracking-tight">
                            {prompt?.text}
                        </h2>
                        <AudioClipButton clip={prompt?.audioClip} size="md" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                {(round.options || []).map((opt) => {
                    let state = "idle";
                    if (correctId === opt.id) state = "correct";
                    else if (wrong.includes(opt.id)) state = "wrong";
                    else if (correctId !== null) state = "disabled";

                    // In image-to-word mode we show word labels instead of images.
                    const useText = style === "image-to-word";

                    return (
                        <OptionCard
                            key={opt.id}
                            imagePath={useText ? null : opt.imagePath}
                            label={opt.word}
                            showLabel={useText || style !== "word-to-image"}
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
