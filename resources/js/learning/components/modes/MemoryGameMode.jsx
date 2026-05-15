import React, { useEffect, useMemo, useState } from "react";
import { playSuccess, playFail, playClick, playPop, playBounce } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * MemoryGameMode - Flip-card matching game.
 * Cards are laid face-down, child flips two at a time to find matching pairs.
 * Matches can be word-to-image or word-to-word.
 */
const MemoryGameMode = ({ lesson, deck = [], onComplete }) => {
  const pairs = useMemo(() => {
    const items = (deck || []).slice(0, 6);
    const cards = [];
    items.forEach((round, i) => {
      const target = round?.prompt;
      if (!target) return;
      // Word card
      cards.push({ id: `w-${i}`, pairId: i, type: 'word', word: target.text, audioClip: target.audioClip });
      // Image card
      cards.push({ id: `i-${i}`, pairId: i, type: 'image', imagePath: target.imagePath, word: target.text, audioClip: target.audioClip });
    });
    // Shuffle
    for (let j = cards.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [cards[j], cards[k]] = [cards[k], cards[j]];
    }
    return cards;
  }, [deck]);

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);

  const totalPairs = pairs.length / 2;

  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      setTimeout(() => {
        onComplete({
          correct: totalPairs,
          total: totalPairs,
          rounds: [{ roundId: 'memory', correct: true, timeMs: 0 }],
        });
      }, 800);
    }
  }, [matched.size, totalPairs, onComplete]);

  const handleFlip = (card) => {
    if (checking || flipped.length >= 2 || flipped.includes(card.id) || matched.has(card.pairId)) return;
    
    playPop();
    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    if (card.audioClip) {
      playAudio(card.audioClip);
    }

    if (newFlipped.length === 2) {
      setChecking(true);
      setAttempts(a => a + 1);
      const first = pairs.find(p => p.id === newFlipped[0]);
      const second = pairs.find(p => p.id === newFlipped[1]);

      setTimeout(() => {
        if (first.pairId === second.pairId) {
          playSuccess();
          setMatched(prev => new Set([...prev, first.pairId]));
        } else {
          playFail();
        }
        setFlipped([]);
        setChecking(false);
      }, 1000);
    }
  };

  if (!pairs.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No cards available yet.</p>
        <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">
          Skip
        </button>
      </div>
    );
  }

  const cols = pairs.length <= 8 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4';

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl shadow-sm border border-white/50 text-center w-full max-w-md">
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">Memory Game</p>
        <p className="text-sm font-bold text-gray-600">
          Pairs found: <span className="text-orange-600 font-black">{matched.size}</span> / {totalPairs}
        </p>
      </div>

      {/* Grid */}
      <div className={`grid ${cols} gap-2 sm:gap-3 w-full max-w-xl`}>
        {pairs.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
          
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={isFlipped || checking}
              className={`aspect-square rounded-xl sm:rounded-2xl transition-all duration-300 border-2 shadow-sm flex items-center justify-center p-2 sm:p-3 ${
                matched.has(card.pairId)
                  ? 'bg-emerald-50 border-emerald-300 scale-95 opacity-70'
                  : isFlipped
                  ? 'bg-white border-purple-300 shadow-md scale-105'
                  : 'bg-gradient-to-br from-purple-400 to-indigo-500 border-purple-300 hover:scale-105 hover:shadow-lg cursor-pointer'
              }`}
            >
              {isFlipped ? (
                <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                  {card.type === 'image' && card.imagePath ? (
                    <img src={card.imagePath} alt={card.word} className="w-full h-[70%] object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : null}
                  <span className={`font-black uppercase text-center leading-tight ${card.type === 'image' ? 'text-[10px] sm:text-xs text-gray-600' : 'text-sm sm:text-lg text-purple-700'}`}>
                    {card.word}
                  </span>
                </div>
              ) : (
                <span className="text-2xl sm:text-4xl text-white/90">❓</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 font-bold">Attempts: {attempts}</p>
    </div>
  );
};

export default MemoryGameMode;
