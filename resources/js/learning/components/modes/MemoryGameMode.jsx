import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * MemoryGameMode — flip-card matching game (word ↔ image pairs).
 *
 * Visual / behaviour upgrades over the old version:
 *
 *   • Rich card-back design instead of the flat purple ❓ tile —
 *     each face-down card has a subtle pattern + the Kiddo "K"
 *     monogram so the board doesn't look monotonous.
 *   • Genuine 3-D flip animation (CSS rotateY) so the kid sees the
 *     card actually turning, not just changing colour.
 *   • Image-side cards now show the word label on the front of a
 *     soft tinted card (was a tiny gray caption before).
 *   • Word-side cards have a coloured pill so they read as "spoken
 *     word", not a label.
 *   • Auto-speak the word using the speakWord chain when a card is
 *     revealed (covers words with no NCCD audio via server TTS).
 *   • Responsive grid: 2 cols on tiny phones, 3 on phones, 4 on
 *     tablets, 5+ on desktop. Card aspect-square at every size.
 *   • Header card has a progress bar with the pair counter (was a
 *     plain text line).
 */

const MAX_PAIRS = 6;

const MemoryGameMode = ({ lesson, deck = [], onComplete }) => {
  const pairs = useMemo(() => {
    const items = (deck || []).slice(0, MAX_PAIRS);
    const cards = [];
    items.forEach((round, i) => {
      const target = round?.prompt;
      if (!target?.text) return;
      const wordId = round?.wordId || null;
      cards.push({
        id: `w-${i}`,
        pairId: i,
        type: "word",
        wordId,
        word: target.text,
        audioClip: target.audioClip,
      });
      cards.push({
        id: `i-${i}`,
        pairId: i,
        type: "image",
        wordId,
        imagePath: target.imagePath,
        word: target.text,
        audioClip: target.audioClip,
      });
    });
    // Fisher-Yates
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
  const [errorRounds, setErrorRounds] = useState([]);

  const totalPairs = pairs.length / 2;

  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      const t = setTimeout(() => {
        const correctRounds = Array.from({ length: totalPairs }).map((_, i) => ({
          roundId: `mem-correct-${i}`,
          correct: true,
        }));
        onComplete({
          correct: totalPairs,
          total: totalPairs,
          rounds: [...correctRounds, ...errorRounds],
        });
      }, 900);
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

    // Speak the word the moment the card flips so the kid hears the
    // pronunciation while looking at the picture / word.
    speakWord({
      wordId: card.wordId,
      label: card.word,
      audioClip: card.audioClip,
    });

    if (newFlipped.length === 2) {
      setChecking(true);
      setAttempts((a) => a + 1);
      const first = pairs.find((p) => p.id === newFlipped[0]);
      const second = pairs.find((p) => p.id === newFlipped[1]);

      setTimeout(() => {
        if (first.pairId === second.pairId) {
          playSuccess();
          setMatched((prev) => new Set([...prev, first.pairId]));
        } else {
          playFail();
          setErrorRounds((prev) => [
            ...prev,
            {
              roundId: `mem-${prev.length}`,
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
      }, 1100);
    }
  };

  if (!pairs.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No cards available yet.</p>
        <button
          onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
          className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold"
        >
          Skip
        </button>
      </div>
    );
  }

  // Pick a column count that always lays out as an even grid for the
  // 12-card max set: 4 cols on phones, 6 on tablets+. Smaller decks
  // (8 cards) shrink to 4 cols × 2 rows.
  const colsClass =
    pairs.length <= 8
      ? "grid-cols-2 xs:grid-cols-4"
      : "grid-cols-3 xs:grid-cols-4 md:grid-cols-6";

  const progressPct = Math.round((matched.size / Math.max(1, totalPairs)) * 100);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up px-2 sm:px-4">
      {/* Header */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] shadow-md border border-white px-5 sm:px-7 py-3 sm:py-4 flex flex-col items-center gap-2">
        <p className="text-[10px] sm:text-[11px] font-black text-orange-500 uppercase tracking-widest text-center">
          🧠 Memory Game · Find each pair
        </p>
        <div className="w-full flex items-center gap-2 sm:gap-3">
          <div className="flex-1 h-2 sm:h-2.5 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-orange-600 shrink-0">
            {matched.size}/{totalPairs}
          </span>
          <span className="text-[10px] sm:text-xs font-black text-gray-400 shrink-0">
            · {attempts} flips
          </span>
        </div>
      </div>

      {/* Card grid */}
      <div className={`grid ${colsClass} gap-2 sm:gap-3 lg:gap-4 w-full max-w-3xl`}>
        {pairs.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
          const isMatched = matched.has(card.pairId);

          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={isFlipped || checking}
              className={`mem-card aspect-square rounded-xl sm:rounded-2xl transition-transform duration-300 ${
                isMatched ? "opacity-80 scale-95" : ""
              } ${
                !isFlipped && !checking
                  ? "hover:-translate-y-1 active:translate-y-0 hover:shadow-xl cursor-pointer"
                  : ""
              }`}
              aria-label={isFlipped ? card.word : "Hidden card"}
            >
              <div className={`mem-inner ${isFlipped ? "is-flipped" : ""}`}>
                {/* Back of the card */}
                <div className="mem-face mem-back">
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-violet-600 shadow-md border-2 border-white/30 flex items-center justify-center overflow-hidden">
                    <span className="absolute -top-2 -right-2 w-12 h-12 bg-white/15 rounded-full" />
                    <span className="absolute -bottom-3 -left-3 w-16 h-16 bg-white/10 rounded-full" />
                    <span className="relative text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow">
                      K
                    </span>
                  </div>
                </div>

                {/* Front of the card */}
                <div className="mem-face mem-front">
                  <div
                    className={`absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-4 shadow-md flex flex-col items-center justify-center p-2 sm:p-3 ${
                      isMatched
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-purple-200"
                    }`}
                  >
                    {card.type === "image" ? (
                      <>
                        <SmartImage
                          src={card.imagePath}
                          label={card.word}
                          className="w-full h-[72%]"
                          imgClassName="w-full h-full object-contain drop-shadow"
                        />
                        <span className="mt-1 text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-wide text-gray-700 truncate max-w-full">
                          {card.word}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm sm:text-base lg:text-xl font-black uppercase tracking-tight text-purple-700 text-center break-words leading-tight">
                        {card.word}
                      </span>
                    )}
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
        Tap a card, then tap another to find its match!
      </p>

      {/* Mode type badge */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-[10px] sm:text-xs font-black text-orange-700 uppercase tracking-wider">
          <span>🧠</span>
          <span>Memory Game</span>
        </span>
      </div>

      <style>{`
        /* Custom 'xs' breakpoint at 400px so 4-up grids still work
           on slightly larger phones. */
        @media (min-width: 400px) {
          .xs\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }

        /* 3-D flip animation. The trick: a 'mem-inner' wrapper that
           rotates its preserved-3d face stack 180° when 'is-flipped'
           is added; the front face starts rotated 180° behind the
           back face so the rotation reveals it cleanly. */
        .mem-card { perspective: 800px; }
        .mem-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .mem-inner.is-flipped { transform: rotateY(180deg); }
        .mem-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .mem-front { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default MemoryGameMode;
