import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * PictureMatchMode - Match identical pictures.
 *
 * Shows pairs of identical images scattered around the grid (face-down).
 * Child must find matching pairs by flipping cards. Different from
 * MemoryGameMode because here both cards in a pair are images
 * (no word labels), pure visual matching.
 *
 * This is great for:
 *   - Visual recognition skills
 *   - Memory training
 *   - Younger learners who can't yet read
 */

const PictureMatchMode = ({ lesson, deck = [], onComplete }) => {
  const cards = useMemo(() => {
    // Take up to 6 unique items from deck, then duplicate each
    const items = [];
    const seenWords = new Set();
    for (const r of deck || []) {
      const p = r?.prompt;
      if (!p?.text || seenWords.has(p.text)) continue;
      seenWords.add(p.text);
      items.push({
        word: p.text,
        imagePath: p.imagePath,
        audioClip: p.audioClip,
      });
      if (items.length >= 6) break;
    }
    
    // Make pairs (each item appears twice)
    const pairs = [];
    items.forEach((item, idx) => {
      pairs.push({ id: `a-${idx}`, pairId: idx, ...item });
      pairs.push({ id: `b-${idx}`, pairId: idx, ...item });
    });

    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    return pairs;
  }, [deck]);

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState(0);

  const totalPairs = cards.length / 2;

  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      setTimeout(() => {
        onComplete({
          correct: totalPairs,
          total: totalPairs,
          rounds: [{ roundId: "picmatch", correct: errors === 0, timeMs: 0 }],
        });
      }, 1500);
    }
  }, [matched.size, totalPairs, onComplete, errors]);

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
      const first = cards.find(c => c.id === newFlipped[0]);
      const second = cards.find(c => c.id === newFlipped[1]);

      setTimeout(() => {
        if (first.pairId === second.pairId) {
          playSuccess();
          setMatched(prev => new Set([...prev, first.pairId]));
        } else {
          playFail();
          setErrors(e => e + 1);
        }
        setFlipped([]);
        setChecking(false);
      }, 900);
    }
  };

  if (!cards.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No pictures available.</p>
        <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">Skip</button>
      </div>
    );
  }

  // Grid layout based on count
  const cols = cards.length <= 8 ? 'grid-cols-4' : cards.length <= 12 ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6';

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl shadow-sm border border-white/50 text-center w-full max-w-md">
        <p className="text-[10px] font-black text-pink-500 uppercase tracking-wider mb-1">Picture Matching</p>
        <p className="text-sm font-bold text-gray-600">
          Find identical pairs · <span className="text-pink-600 font-black">{matched.size}/{totalPairs}</span>
        </p>
      </div>

      {/* Card grid */}
      <div className={`grid ${cols} gap-2 sm:gap-3 w-full max-w-3xl`}>
        {cards.map(card => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);

          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={isFlipped || checking}
              className={`aspect-square rounded-xl sm:rounded-2xl transition-all duration-500 border-2 shadow-sm flex items-center justify-center p-2 perspective-1000 ${
                isMatched
                  ? 'bg-emerald-50 border-emerald-300 scale-90 opacity-70'
                  : isFlipped
                  ? 'bg-white border-pink-300 shadow-lg scale-105'
                  : 'bg-gradient-to-br from-pink-400 to-rose-500 border-pink-300 hover:scale-105 hover:shadow-lg cursor-pointer'
              }`}
            >
              {isFlipped ? (
                <SmartImage
                  src={card.imagePath}
                  label={card.word}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-4xl text-white/90">🎴</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 font-bold">Attempts: {attempts}</p>
    </div>
  );
};

export default PictureMatchMode;
