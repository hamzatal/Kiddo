import React, { useEffect, useMemo, useRef, useState } from "react";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";
import GameShell from "@/learning/components/ui/GameShell";
import GamePromptCard from "@/learning/components/ui/GamePromptCard";
import GameChoiceCard from "@/learning/components/ui/GameChoiceCard";

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

    useEffect(() => {
        if (!prompt?.audioClip) return;
        const token = ++playToken.current;
        const t = setTimeout(async () => {
            if (token !== playToken.current) return;
            setIsPlaying(true);
            try {
                await playAudio(prompt.audioClip);
            } catch (_) {}
            if (token === playToken.current) setIsPlaying(false);
        }, 350);

        return () => {
            clearTimeout(t);
            stopAllAudio();
        };
    }, [idx, prompt?.audioClip]);

    useEffect(() => {
        if (wrong.length >= 1) setShowHint(true);
    }, [wrong.length]);

    useEffect(() => {
        setShowHint(false);
    }, [idx]);

    if (!activeRounds.length) {
        return (
            <div className="mx-auto max-w-sm p-6 text-center sm:p-10">
                <span className="mb-3 block text-5xl">🎧</span>
                <h3 className="mb-1 text-lg font-black text-gray-700 sm:text-xl">
                    No listening rounds yet
                </h3>
                <p className="mb-5 text-sm font-bold text-gray-500">
                    Your teacher hasn't recorded these clips yet — let's keep going.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 font-black text-white shadow-md transition-all hover:-translate-y-0.5"
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

    const handlePick = (option) => {
        if (correctId !== null) return;
        playClick();

        if (option.isCorrect) {
            setCorrectId(option.id);
            playSuccess();

            const firstTry = wrong.length === 0;
            const firstWrongOpt = round.options?.find((o) => o.id === wrong[0]);

            const next = [
                ...results,
                {
                    roundId: round.roundId,
                    wordId: round.wordId,
                    word: prompt?.text,
                    correct: firstTry,
                    timeMs: 0,
                    wrongChoice: firstWrongOpt?.word,
                    wrongChoiceId: firstWrongOpt?.wordId,
                },
            ];

            setResults(next);
            setTimeout(() => advance(next), 900);
        } else {
            playFail();
            setWrong((w) => [...w, option.id]);
        }
    };

    return (
        <GameShell
            title="Listen and tap"
            subtitle="Audio game"
            progressCurrent={idx + 1}
            progressTotal={activeRounds.length}
            accent="#2563EB"
            hint={
                wrong.length > 0
                    ? "Not quite — listen again"
                    : "Tap the picture that matches the sound"
            }
            footer={
                <p className="text-center text-[11px] font-bold text-gray-500">
                    {wrong.length > 0
                        ? "Not quite — listen again 🎧"
                        : "Tap the picture that matches the word you heard"}
                </p>
            }
        >
            <GamePromptCard
                title={showHint && prompt?.text ? prompt.text.toUpperCase() : "Listen carefully"}
                subtitle="Hear the word"
                accent="#2563EB"
                onReplay={handlePlayAgain}
                replayDisabled={isPlaying}
                hint={showHint ? "Hint is visible" : "Tap hint if the child gets stuck"}
                hintActive={showHint}
                onHintToggle={prompt?.text ? toggleHint : null}
            />

            <div className="mx-auto grid w-full max-w-2xl grid-cols-3 justify-items-center gap-2 sm:gap-3 lg:gap-4">
                {(round?.options || []).map((opt) => {
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong.includes(opt.id);

                    let state = "idle";
                    if (isCorrect) state = "correct";
                    else if (isWrong) state = "wrong";

                    return (
                        <GameChoiceCard
                            key={opt.id}
                            variant="image"
                            state={state}
                            imagePath={opt.imagePath}
                            label={opt.word}
                            disabled={correctId !== null}
                            onClick={() => handlePick(opt)}
                        />
                    );
                })}
            </div>
        </GameShell>
    );
};

export default ListeningGameMode;
