import React, { useEffect, useMemo, useState } from "react";
import { playSuccess, playFail, playClick, playBounce } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * ListeningGameMode - Audio-only matching game.
 * The child hears a word and must pick the correct image from options.
 * Unlike VocabGame, the word is NEVER shown - only heard.
 * Forces listening comprehension skills.
 */
const ListeningGameMode = ({ lesson, deck = [], onComplete }) => {
  const rounds = useMemo(() => deck || [], [deck]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [correctId, setCorrectId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const maxRounds = Math.min(rounds.length, lesson?.config?.rounds || 6);
  const activeRounds = rounds.slice(0, maxRounds);

  if (!activeRounds.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No rounds available yet.</p>
        <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">Skip</button>
      </div>
    );
  }

  const round = activeRounds[idx];
  const prompt = round?.prompt;

  // Auto-play audio when a new round starts
  useEffect(() => {
    if (prompt?.audioClip) {
      setTimeout(() => {
        setIsPlaying(true);
        playAudio(prompt.audioClip).then(() => setIsPlaying(false));
      }, 400);
    }
  }, [idx]);

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
      const next = [...results, { roundId: round.roundId, correct: firstTry, timeMs: 0 }];
      setResults(next);
      setTimeout(() => advance(next), 1000);
    } else {
      playFail();
      setWrong(w => [...w, option.id]);
    }
  };

  const advance = (finalResults) => {
    if (idx + 1 >= activeRounds.length) {
      onComplete({
        correct: finalResults.filter(r => r.correct).length,
        total: activeRounds.length,
        rounds: finalResults,
      });
      return;
    }
    setIdx(idx + 1);
    setWrong([]);
    setCorrectId(null);
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up">
      {/* Progress */}
      <div className="flex items-center gap-2 w-full max-w-sm">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(idx / activeRounds.length) * 100}%` }} />
        </div>
        <span className="text-xs font-black text-gray-500">{idx + 1}/{activeRounds.length}</span>
      </div>

      {/* Audio prompt - big listen button */}
      <div className="bg-white/90 backdrop-blur px-6 sm:px-10 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-lg border border-white/50 flex flex-col items-center gap-3 w-full max-w-sm">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Listen & Choose!</p>
        <button
          onClick={handlePlayAgain}
          disabled={isPlaying}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl text-white shadow-xl transition-all ${
            isPlaying 
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse scale-110' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:scale-110 active:scale-95'
          }`}
        >
          {isPlaying ? '🎵' : '🔊'}
        </button>
        <p className="text-xs text-gray-400 font-bold">Tap to listen again</p>
      </div>

      {/* Options - images only, no word shown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-lg">
        {(round.options || []).map((opt) => {
          const isCorrect = correctId === opt.id;
          const isWrong = wrong.includes(opt.id);
          const disabled = correctId !== null || isWrong;

          let style = "border-white/60 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1";
          if (isCorrect) style = "border-emerald-400 bg-emerald-50 scale-[1.02] shadow-xl ring-2 ring-emerald-200";
          if (isWrong) style = "border-red-200 bg-red-50/50 opacity-50 scale-95";

          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => handlePick(opt)}
              className={`aspect-square p-3 sm:p-4 bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl border-2 transition-all duration-300 shadow-sm flex flex-col items-center justify-center gap-1 ${style}`}
            >
              {opt.imagePath ? (
                <img src={opt.imagePath} alt="" className="w-full h-[75%] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="text-3xl text-gray-300">🖼️</span>
              )}
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
