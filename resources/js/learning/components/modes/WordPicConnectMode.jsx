import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * WordPicConnectMode — "Connect Words to Pictures".
 *
 * Functionally identical to MatchConnectMode but slightly different
 * visual treatment so the curriculum can rotate between the two
 * without feeling repetitive:
 *
 *   • Cyan/teal palette instead of purple.
 *   • Pictures are inside soft round-corner cards on coloured tints.
 *   • Connector dots ("ports") on the inside edges of every card.
 *   • Generous middle gutter (160-220 px) so the green / red lines
 *     are always clearly visible.
 *   • Mobile (<= md): collapses to a single column with a downward
 *     arrow between the words and pictures.
 *
 * 4-5 unique pairs per round.
 */

const MAX_PAIRS = 5;

const WordPicConnectMode = ({ lesson, deck = [], onComplete }) => {
  const pairs = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of deck || []) {
      const p = r?.prompt;
      if (!p?.text || seen.has(p.text)) continue;
      seen.add(p.text);
      out.push({
        id: `pair-${out.length}`,
        wordId: r.wordId || null,
        word: p.text,
        imagePath: p.imagePath,
        audioClip: p.audioClip,
      });
      if (out.length >= MAX_PAIRS) break;
    }
    return out;
  }, [deck]);

  const imageOrder = useMemo(() => {
    const arr = pairs.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (pairs.length > 1 && arr.every((v, i) => v === i)) {
      [arr[0], arr[1]] = [arr[1], arr[0]];
    }
    return arr;
  }, [pairs]);

  const containerRef = useRef(null);
  const wordRefs = useRef({});
  const picRefs = useRef({});

  const [selectedWord, setSelectedWord] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [tick, setTick] = useState(0);

  const setWordRef = (id) => (el) => {
    if (el) wordRefs.current[id] = el; else delete wordRefs.current[id];
  };
  const setPicRef = (slotIdx) => (el) => {
    if (el) picRefs.current[slotIdx] = el; else delete picRefs.current[slotIdx];
  };

  useEffect(() => {
    if (!wrongFlash) return;
    const t = setTimeout(() => setWrongFlash(null), 700);
    return () => clearTimeout(t);
  }, [wrongFlash]);

  useEffect(() => {
    const t = setTimeout(() => setTick((n) => n + 1), 100);
    return () => clearTimeout(t);
  }, [pairs.length]);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (pairs.length === 0) return;
    if (matched.length >= pairs.length) {
      const t = setTimeout(() => {
        onComplete({
          correct: attempts.filter((a) => a.correct).length,
          total: pairs.length,
          rounds: attempts.map((a) => ({
            roundId: a.pairId,
            correct: a.correct,
            wordId: a.wordId || null,
            word: a.word || null,
            wrongChoice: a.wrongChoice || null,
            wrongChoiceId: a.wrongChoiceId || null,
          })),
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [matched.length, pairs.length, attempts, onComplete]);

  if (!pairs.length) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 font-bold">No items available.</p>
        <button
          onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
          className="mt-4 px-6 py-3 bg-cyan-600 text-white rounded-2xl font-bold"
        >
          Skip
        </button>
      </div>
    );
  }

  const handleWordTap = (pair) => {
    if (matched.includes(pair.id)) return;
    playClick();
    setSelectedWord(pair.id);
    // Speak the word the moment the kid taps it. Uses the speaker
    // chain (NCCD → server TTS → browser TTS) so there is always a
    // pronunciation, even for words with no audio file.
    speakWord({
      wordId: pair.wordId,
      label: pair.word,
      audioClip: pair.audioClip,
    });
  };

  const handlePicTap = (pairIdx) => {
    if (selectedWord == null) return;
    const targetPair = pairs[pairIdx];
    if (matched.includes(targetPair.id)) return;
    playClick();

    const sourcePair = pairs.find((p) => p.id === selectedWord);

    if (targetPair.id === selectedWord) {
      playSuccess();
      setMatched((prev) => [...prev, targetPair.id]);
      setAttempts((prev) => [
        ...prev,
        {
          pairId: targetPair.id,
          correct: true,
          wordId: sourcePair?.wordId || null,
          word: sourcePair?.word || null,
        },
      ]);
    } else {
      playFail();
      setWrongFlash({ wordId: selectedWord, picId: targetPair.id });
      setAttempts((prev) => [
        ...prev,
        {
          pairId: targetPair.id,
          correct: false,
          wordId: sourcePair?.wordId || null,
          word: sourcePair?.word || null,
          wrongChoice: targetPair.word,
          wrongChoiceId: targetPair.wordId || null,
        },
      ]);
    }
    setSelectedWord(null);
    setTick((n) => n + 1);
  };

  const getCoords = (wordId, picPairId) => {
    const container = containerRef.current;
    const a = wordRefs.current[wordId];
    let slotIdx = -1;
    for (let i = 0; i < imageOrder.length; i++) {
      if (imageOrder[i] === pairs.findIndex((p) => p.id === picPairId)) {
        slotIdx = i;
        break;
      }
    }
    if (slotIdx < 0) return null;
    const b = picRefs.current[slotIdx];
    if (!container || !a || !b) return null;
    const cRect = container.getBoundingClientRect();
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return {
      x1: aRect.right - cRect.left,
      y1: aRect.top + aRect.height / 2 - cRect.top,
      x2: bRect.left - cRect.left,
      y2: bRect.top + bRect.height / 2 - cRect.top,
    };
  };

  const matchedLines = matched
    .map((pid) => ({ pid, coords: getCoords(pid, pid) }))
    .filter((x) => x.coords);
  const wrongLine = wrongFlash ? getCoords(wrongFlash.wordId, wrongFlash.picId) : null;

  const progressPct = Math.round((matched.length / pairs.length) * 100);

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up px-2 sm:px-4">
      {/* Header card */}
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] shadow-md border border-white px-5 sm:px-8 py-3 sm:py-4 flex flex-col items-center gap-2">
        <p className="text-[10px] sm:text-[11px] font-black text-cyan-500 uppercase tracking-widest text-center">
          Connect each word to its picture
        </p>
        <div className="w-full flex items-center gap-2 sm:gap-3">
          <div className="flex-1 h-2 sm:h-2.5 bg-cyan-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-black text-cyan-600 shrink-0">
            {matched.length}/{pairs.length}
          </span>
        </div>
      </div>

      {/* Two-column board with generous middle gutter */}
      <div
        ref={containerRef}
        className="
          relative w-full max-w-5xl
          grid grid-cols-1
          md:grid-cols-[1fr_160px_1fr]
          lg:grid-cols-[1fr_200px_1fr]
          xl:grid-cols-[1fr_240px_1fr]
          gap-3 md:gap-2 lg:gap-3 items-stretch
        "
      >
        {/* ─── Words column ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:gap-4">
          <p className="md:hidden text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">
            Words
          </p>
          {pairs.map((p) => {
            const isMatched = matched.includes(p.id);
            const isSelected = selectedWord === p.id;
            const isWrong = wrongFlash?.wordId === p.id;

            let cls = "border-white hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5";
            if (isSelected) cls = "border-cyan-500 ring-4 ring-cyan-200 shadow-lg scale-[1.02]";
            if (isMatched) cls = "border-emerald-400 bg-emerald-50 opacity-90";
            if (isWrong) cls = "border-red-400 bg-red-50 animate-shake";

            return (
              <button
                key={p.id}
                ref={setWordRef(p.id)}
                disabled={isMatched}
                onClick={() => handleWordTap(p)}
                className={`relative w-full min-h-[60px] sm:min-h-[68px] lg:min-h-[80px] p-3 sm:p-4 bg-white rounded-2xl sm:rounded-[1.25rem] border-4 shadow-md transition-all duration-200 flex items-center gap-2.5 sm:gap-3 ${cls} ${isMatched ? "cursor-default" : ""}`}
              >
                <AudioClipButton
                  clip={p.audioClip}
                  wordId={p.wordId}
                  label={p.word}
                  size="sm"
                />
                <span className="text-base sm:text-xl lg:text-2xl font-black uppercase text-gray-800 tracking-tight flex-1 text-left truncate">
                  {p.word}
                </span>

                <span
                  aria-hidden
                  className={`hidden md:block absolute right-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                    isMatched
                      ? "bg-emerald-500"
                      : isSelected
                      ? "bg-cyan-500"
                      : "bg-cyan-300"
                  }`}
                />

                {isMatched && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-sm">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SVG canvas (hidden on phones) */}
        <svg
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
          aria-hidden="true"
        >
          {matchedLines.map(({ pid, coords }) => (
            <line
              key={`m-${pid}-${tick}`}
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke="#10B981"
              strokeWidth="5"
              strokeLinecap="round"
              className="wpc-line-correct"
            />
          ))}
          {wrongLine ? (
            <line
              key={`w-${tick}`}
              x1={wrongLine.x1}
              y1={wrongLine.y1}
              x2={wrongLine.x2}
              y2={wrongLine.y2}
              stroke="#EF4444"
              strokeWidth="5"
              strokeLinecap="round"
              className="wpc-line-wrong"
            />
          ) : null}
        </svg>

        {/* Phone-only direction hint */}
        <div className="md:hidden flex items-center justify-center py-1">
          <span className="text-2xl text-cyan-400">⬇️</span>
        </div>

        {/* ─── Pictures column ──────────────────────────────────── */}
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:gap-4">
          <p className="md:hidden text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-2">
            Pictures
          </p>
          {imageOrder.map((pairIdx, slotIdx) => {
            const p = pairs[pairIdx];
            const isMatched = matched.includes(p.id);
            const isWrong = wrongFlash?.picId === p.id;

            let cls = "border-white hover:border-cyan-300 hover:shadow-lg hover:-translate-y-0.5";
            if (isMatched) cls = "border-emerald-400 bg-emerald-50 opacity-90";
            if (isWrong) cls = "border-red-400 bg-red-50 animate-shake";

            return (
              <button
                key={p.id}
                ref={setPicRef(slotIdx)}
                disabled={isMatched || !selectedWord}
                onClick={() => handlePicTap(pairIdx)}
                className={`relative w-full min-h-[60px] sm:min-h-[68px] lg:min-h-[80px] p-2 sm:p-3 bg-white rounded-2xl sm:rounded-[1.25rem] border-4 shadow-md transition-all duration-200 flex items-center justify-center aspect-[5/3] sm:aspect-[3/2] ${cls} ${isMatched ? "cursor-default" : ""} ${selectedWord == null && !isMatched ? "opacity-70" : ""}`}
              >
                <span
                  aria-hidden
                  className={`hidden md:block absolute left-[-7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors ${
                    isMatched ? "bg-emerald-500" : "bg-cyan-300"
                  }`}
                />

                <SmartImage
                  src={p.imagePath}
                  label={p.word}
                  className="w-full h-full"
                  imgClassName="max-w-full max-h-full object-contain"
                />

                {isMatched && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-sm">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] sm:text-xs font-bold text-gray-500 text-center max-w-md">
        {selectedWord
          ? "✨ Now tap the matching picture →"
          : "👈 Tap a word on the left to start"}
      </p>

      {/* Mode type badge */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-100 border border-cyan-200 text-[10px] sm:text-xs font-black text-cyan-700 uppercase tracking-wider">
          <span>🔗</span>
          <span>Word-Picture Connect</span>
        </span>
      </div>

      <style>{`
        .wpc-line-correct {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: wpc-draw 480ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .wpc-line-wrong {
          animation: wpc-flash 700ms ease-in-out forwards;
        }
        @keyframes wpc-draw { to { stroke-dashoffset: 0; } }
        @keyframes wpc-flash {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  );
};

export default WordPicConnectMode;
