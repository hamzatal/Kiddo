import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * PictureMatchMode — find identical pictures.
 *
 * Like Memory but BOTH cards in each pair are pictures (no word
 * labels). Aimed at the youngest learners who can't read yet, so:
 *
 *   • Card backs use a friendly 🎴 monogram on a soft pink/rose
 *     gradient so they look inviting and never blank.
 *   • Real 3-D flip animation (rotateY).
 *   • Spoken-word feedback when a card is revealed (uses the
 *     speakWord chain — server TTS → browser TTS → audio clip).
 *   • Aspect-square cards in a fluid grid: 3-up on phones, 4-up on
 *     small tablets, 6-up on desktops.
 *   • Progress bar with N/M counter at the top.
 */

const MAX_PAIRS = 6;

const PictureMatchMode = ({ lesson, deck = [], onComplete }) => {
  const cards = useMemo(() => {
    const items = [];
    const seenWords = new Set();
    for (const r of deck || []) {
      const p = r?.prompt;
      if (!p?.text || seenWords.has(p.text)) continue;
      seenWords.add(p.text);
      items.push({
        word: p.text,
        wordId: r?.wordId || null,
        imagePath: p.imagePath,
        audioClip: p.audioClip,
      });
      if (items.length >= MAX_PAIRS) break;
    }

    const out = [];
    items.forEach((item, idx) => {
      out.push({ id: `a-${idx}`, pairId: idx, ...item });
      out.push({ id: `b-${idx}`, pairId: idx, ...item });
    });
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }, [deck]);

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState(new Set());
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [errorRounds, setErrorRounds] = useState([]);

  const totalPairs = cards.length / 2;

  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      const t = setTimeout(() => {
        const correctRounds = Array.from({ length: totalPairs }).map((_, i) => ({
          roundId: `pic-correct-${i}`,
          correct: true,
        }));
        onComplete({
          correct: totalPairs,
          total: totalPairs,
          rounds: [...correctRounds, ...errorRounds],
        });
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [matched.size, totalPairs, onComplete, errorRounds]);

  const handleFlip = (card) => {
    if (
      checking ||
      flipped.length >= 2 ||
      flipped.includes(card.id) ||
      matched.has(card.pairId)
    ) {
      return;
    }

    playPop();
    const newFlipped = [...flipped, card.id];
    setFlipped(newFlipped);

    // Speak the word the moment the card flips so even pre-readers
    // hear the vocabulary.
    speakWord({
      wordId: card.wordId,
      label: card.word,
      audioClip: card.audioClip,
    });

    if (newFlipped.length === 2) {
      setChecking(true);
      setAttempts((a) => a + 1);
      const first = cards.find((c) => c.id === newFlipped[0]);
      const second = cards.find((c) => c.id === newFlipped[1]);

      setTimeout(() => {
        if (first.pairId === second.pairId) {
          playSuccess();
          setMatched((prev) => new Set([...prev, first.pairId]));
        } else {
          playFail();
          setErrorRounds((prev) => [
            ...prev,
            {
              roundId: `pic-${prev.length}`,
              correct: false,
              wordId: first.wordId || null,
              word: first.word,
              wrongChoice: second.word,
              wrongChoiceId: second.wordId || null,
            },
          ]);
        }
        setFlipped([]);
        setChecking(false);
      }, 1000);
    }
  };

  if (!cards.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No pictures available.</p>
        <button
          onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
          className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold"
        >
          Skip
        </button>
      </div>
    );
  }

  const colsClass =
    cards.length <= 8
      ? "grid-cols-2 xs:grid-cols-4"
      : "grid-cols-3 xs:grid-cols-4 md:grid-cols-6";

  const progressPct = Math.round((matched.size / Math.max(1, totalPairs)) * 100);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up px-2 sm:px-4">
      {/* Header */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] shadow-md border border-white px-5 sm:px-7 py-3 sm:py-4 flex flex-col items-center gap-2">
        <p className="text-[10px] sm:text-[11px] font-black text-pink-500 uppercase tracking-widest text-center">
          🎴 Picture Match · Find identical pairs
        </p>
        <div className="w-full flex items-center gap-2 sm:gap-3">
          <div className="flex-1 h-2 sm:h-2.5 bg-pink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-pink-600 shrink-0">
            {matched.size}/{totalPairs}
          </span>
          <span className="text-[10px] sm:text-xs font-black text-gray-400 shrink-0">
            · {attempts} flips
          </span>
        </div>
      </div>

      {/* Card grid */}
      <div className={`grid ${colsClass} gap-2 sm:gap-3 lg:gap-4 w-full max-w-3xl`}>
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);

          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={isFlipped || checking}
              className={`pic-card aspect-square rounded-xl sm:rounded-2xl transition-transform duration-300 ${
                isMatched ? "opacity-80 scale-95" : ""
              } ${
                !isFlipped && !checking
                  ? "hover:-translate-y-1 active:translate-y-0 hover:shadow-xl cursor-pointer"
                  : ""
              }`}
            >
              <div className={`pic-inner ${isFlipped ? "is-flipped" : ""}`}>
                <div className="pic-face pic-back">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-600 shadow-md border-2 border-white/30 flex items-center justify-center overflow-hidden">
                    <span className="absolute -top-3 -left-3 w-14 h-14 bg-white/15 rounded-full" />
                    <span className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/10 rounded-full" />
                    <span className="relative text-2xl sm:text-3xl lg:text-4xl drop-shadow">
                      🎴
                    </span>
                  </div>
                </div>

                <div className="pic-face pic-front">
                  <div
                    className={`absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-4 shadow-md flex items-center justify-center p-2 ${
                      isMatched
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-pink-200"
                    }`}
                  >
                    <SmartImage
                      src={card.imagePath}
                      label={card.word}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-contain"
                    />
                    {isMatched && (
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-sm">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] sm:text-xs font-bold text-gray-500 text-center">
        Flip two cards to find a matching pair!
      </p>

      {/* Mode type badge */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 border border-pink-200 text-[10px] sm:text-xs font-black text-pink-700 uppercase tracking-wider">
          <span>🎴</span>
          <span>Picture Match</span>
        </span>
      </div>

      <style>{`
        @media (min-width: 400px) {
          .xs\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        .pic-card { perspective: 800px; }
        .pic-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .pic-inner.is-flipped { transform: rotateY(180deg); }
        .pic-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .pic-front { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default PictureMatchMode;
