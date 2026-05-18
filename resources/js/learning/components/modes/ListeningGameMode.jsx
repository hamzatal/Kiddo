import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * ListeningGameMode — audio-only matching game (no word displayed).
 *
 * Layout v3:
 *  • Compact prompt header with progress + 🔊 button + listen-again
 *    hint inside one rounded card.
 *  • 3-column grid on desktop, 2 on phones, all aspect-square so
 *    the grid never breaks alignment.
 *  • Fits a 720p tablet without scroll.
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

    const round = activeRounds[idx];
    const prompt = round?.prompt;

    useEffect(() => {
        if (prompt?.audioClip) {
            const t = setTimeout(() => {
                setIsPlaying(true);
                playAudio(prompt.audioClip).then(() => setIsPlaying(false));
            }, 400);
            return () => clearTimeout(t);
        }
    }, [idx]);

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
        if (prompt?.audioClip) {
            setIsPlaying(true);
            playAudio(prompt.audioClip).then(() => setIsPlaying(false));
        }
    };

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
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl text-white shadow-xl transition-all ${
                            isPlaying
                                ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse scale-110"
                                : "bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95"
                        }`}
                    >{isPlaying ? "🎵" : "🔊"}</button>
                    <p className="text-[10px] text-gray-400 font-bold">Tap to listen again</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 w-full max-w-2xl">
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
                            className={`relative aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-300 shadow-sm flex items-center justify-center overflow-hidden bg-white ${cls}`}
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
        </div>
    );
};

export default ListeningGameMode;
