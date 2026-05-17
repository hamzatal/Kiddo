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
            // When the kid took multiple tries, surface the FIRST wrong
            // choice in the round payload so the parent dashboard can
            // tell which distractor confused them.
            const firstWrongOpt = round.options?.find((o) => wrong.includes(o.id));
            const next = [...results, {
                roundId: round.roundId,
                wordId: round.wordId || null,
                word: prompt?.text || null,
                correct: firstTry,
                timeMs: 0,
                wrongChoice: firstWrongOpt?.word || null,
                wrongChoiceId: firstWrongOpt?.wordId || null,
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
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-5 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <RoundProgress total={rounds.length} current={idx} results={results} />
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                    {idx + 1} / {rounds.length}
                </span>
            </div>

            <div className="bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm border border-white/60 flex flex-col items-center gap-2 w-full max-w-md">
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider">
                    {label}
                </p>

                {style === "audio-to-image" ? (
                    <button
                        onClick={() => playAudio(prompt?.audioClip)}
                        className="w-14 h-14 sm:w-18 sm:h-18 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg hover:scale-110 active:scale-95 transition-transform"
                        aria-label="Play target audio"
                    >
                        🔊
                    </button>
                ) : style === "image-to-word" ? (
                    prompt?.imagePath ? (
                        <img
                            src={prompt.imagePath}
                            alt={prompt.text}
                            className="w-20 h-20 sm:w-28 sm:h-28 object-contain"
                        />
                    ) : (
                        <span className="text-5xl">🔤</span>
                    )
                ) : (
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="text-2xl sm:text-4xl font-black uppercase text-gray-800 tracking-tight">
                            {prompt?.text}
                        </h2>
                        <AudioClipButton clip={prompt?.audioClip} size="md" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg sm:max-w-2xl">
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
