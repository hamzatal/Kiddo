import React, { useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick, playPop, playBounce } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * DragDropMode - Tap-to-sort game (works on touch without actual drag API).
 * Shows images at the top and word labels at the bottom.
 * Child taps an image, then taps the matching word to connect them.
 * Simpler and more reliable than actual drag-and-drop on mobile.
 */
const DragDropMode = ({ lesson, deck = [], onComplete }) => {
  const items = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of (deck || [])) {
      const p = r?.prompt;
      if (!p?.text || seen.has(p.text)) continue;
      seen.add(p.text);
      out.push({ id: `item-${out.length}`, word: p.text, imagePath: p.imagePath, audioClip: p.audioClip });
      if (out.length >= 5) break;
    }
    return out;
  }, [deck]);

  const shuffledWords = useMemo(() => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [items]);

  const [selectedImage, setSelectedImage] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [attempts, setAttempts] = useState([]);

  const allMatched = items.length > 0 && matched.size >= items.length;

  React.useEffect(() => {
    if (allMatched) {
      setTimeout(() => {
        onComplete({
          correct: attempts.filter(a => a.correct).length,
          total: items.length,
          rounds: attempts,
        });
      }, 800);
    }
  }, [allMatched]);

  if (!items.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No items available.</p>
        <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">Skip</button>
      </div>
    );
  }

  const handleImageTap = (item) => {
    if (matched.has(item.id)) return;
    playPop();
    setSelectedImage(item.id);
    if (item.audioClip) playAudio(item.audioClip);
  };

  const handleWordTap = (item) => {
    if (!selectedImage || matched.has(item.id)) return;
    playClick();

    if (selectedImage === item.id) {
      // Correct match
      playSuccess();
      setMatched(prev => new Set([...prev, item.id]));
      setAttempts(prev => [...prev, { roundId: item.id, correct: true, timeMs: 0 }]);
      setSelectedImage(null);
      setWrongPair(null);
    } else {
      // Wrong match
      playFail();
      setAttempts(prev => [...prev, { roundId: item.id, correct: false, timeMs: 0 }]);
      setWrongPair(item.id);
      setTimeout(() => setWrongPair(null), 600);
      setSelectedImage(null);
    }
  };

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl shadow-sm border border-white/50 text-center w-full max-w-md">
        <p className="text-[10px] font-black text-teal-500 uppercase tracking-wider mb-1">Match the Pairs!</p>
        <p className="text-sm font-bold text-gray-600">
          Tap an image, then tap its name ・ <span className="text-teal-600 font-black">{matched.size}/{items.length}</span>
        </p>
      </div>

      {/* Images row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 w-full">
        {items.map((item) => {
          const isSelected = selectedImage === item.id;
          const isMatched = matched.has(item.id);
          
          return (
            <button
              key={`img-${item.id}`}
              onClick={() => handleImageTap(item)}
              disabled={isMatched}
              className={`aspect-square p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 shadow-sm flex flex-col items-center justify-center ${
                isMatched
                  ? 'bg-emerald-50 border-emerald-300 opacity-60 scale-90'
                  : isSelected
                  ? 'bg-purple-50 border-purple-400 scale-105 shadow-lg ring-2 ring-purple-200'
                  : 'bg-white/90 border-white/60 hover:border-teal-300 hover:shadow-md'
              }`}
            >
              {item.imagePath ? (
                <SmartImage src={item.imagePath} label={item.word || ""} className="w-full h-[80%]" imgClassName="w-full h-full object-contain" />
              ) : (
                <SmartImage src={null} label={item.word || "?"} className="w-full h-[80%]" />
              )}
              {isMatched && <span className="absolute text-lg">✅</span>}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-full max-w-xs flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-bold">↕️</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Words row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg">
        {shuffledWords.map((item) => {
          const isMatched = matched.has(item.id);
          const isWrong = wrongPair === item.id;
          
          return (
            <button
              key={`word-${item.id}`}
              onClick={() => handleWordTap(item)}
              disabled={isMatched || !selectedImage}
              className={`px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 shadow-sm font-black text-sm sm:text-base uppercase text-center ${
                isMatched
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60 line-through'
                  : isWrong
                  ? 'bg-red-50 border-red-300 text-red-500 animate-shake'
                  : selectedImage
                  ? 'bg-white/90 border-teal-200 text-gray-700 hover:bg-teal-50 hover:border-teal-400 cursor-pointer'
                  : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {item.word}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default DragDropMode;
