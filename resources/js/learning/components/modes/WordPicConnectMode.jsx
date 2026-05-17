import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * WordPicConnectMode - Connect words to pictures with visible lines.
 *
 * Two columns: words on the left, pictures on the right (shuffled).
 * Child taps a word, then taps the matching picture. We draw an SVG
 * line between them. Correct = green permanent line; wrong = red flash.
 *
 * Different from MatchConnectMode (which has the same pattern but
 * with a different visual style and pairing mechanism).
 *
 * 4-5 pairs per round.
 */

const WordPicConnectMode = ({ lesson, deck = [], onComplete }) => {
  const pairs = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const r of (deck || [])) {
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
      if (out.length >= 5) break;
    }
    return out;
  }, [deck]);

  // Shuffle order of images (to avoid trivial top-to-bottom matching)
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
  const [matched, setMatched] = useState([]);  // [pairId, ...]
  const [wrongFlash, setWrongFlash] = useState(null);  // { wordId, picId, until }
  const [attempts, setAttempts] = useState([]);
  const [tick, setTick] = useState(0);

  const setWordRef = (id) => (el) => {
    if (el) wordRefs.current[id] = el; else delete wordRefs.current[id];
  };
  const setPicRef = (slotIdx) => (el) => {
    if (el) picRefs.current[slotIdx] = el; else delete picRefs.current[slotIdx];
  };

  // Auto-clear wrong flash
  useEffect(() => {
    if (!wrongFlash) return;
    const t = setTimeout(() => setWrongFlash(null), 700);
    return () => clearTimeout(t);
  }, [wrongFlash]);

  // Tick after layout for first paint
  useEffect(() => {
    const t = setTimeout(() => setTick(n => n + 1), 100);
    return () => clearTimeout(t);
  }, [pairs.length]);

  // Recompute on resize
  useEffect(() => {
    const onResize = () => setTick(t => t + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Trigger completion
  useEffect(() => {
    if (pairs.length === 0) return;
    if (matched.length >= pairs.length) {
      const t = setTimeout(() => {
        onComplete({
          correct: attempts.filter(a => a.correct).length,
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
        <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })} className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">Skip</button>
      </div>
    );
  }

  const handleWordTap = (pair) => {
    if (matched.includes(pair.id)) return;
    playClick();
    setSelectedWord(pair.id);
    if (pair.audioClip) playAudio(pair.audioClip);
  };

  const handlePicTap = (pairIdx) => {
    if (selectedWord == null) return;
    const targetPair = pairs[pairIdx];
    if (matched.includes(targetPair.id)) return;
    playClick();

    const sourcePair = pairs.find((p) => p.id === selectedWord);

    if (targetPair.id === selectedWord) {
      // Correct
      playSuccess();
      setMatched(prev => [...prev, targetPair.id]);
      setAttempts(prev => [...prev, {
        pairId: targetPair.id,
        correct: true,
        wordId: sourcePair?.wordId || null,
        word: sourcePair?.word || null,
      }]);
    } else {
      // Wrong
      playFail();
      setWrongFlash({ wordId: selectedWord, picId: targetPair.id });
      setAttempts(prev => [...prev, {
        pairId: targetPair.id,
        correct: false,
        wordId: sourcePair?.wordId || null,
        word: sourcePair?.word || null,
        wrongChoice: targetPair.word,
        wrongChoiceId: targetPair.wordId || null,
      }]);
    }
    setSelectedWord(null);
    setTick(n => n + 1);
  };

  // Compute coordinates between word card and picture card
  const getCoords = (wordId, picPairId) => {
    const container = containerRef.current;
    const a = wordRefs.current[wordId];
    let slotIdx = -1;
    for (let i = 0; i < imageOrder.length; i++) {
      if (imageOrder[i] === pairs.findIndex(p => p.id === picPairId)) {
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

  const matchedLines = matched.map(pid => ({ pid, coords: getCoords(pid, pid) })).filter(x => x.coords);
  const wrongLine = wrongFlash ? getCoords(wrongFlash.wordId, wrongFlash.picId) : null;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-5 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl shadow-sm border border-white/50 text-center w-full max-w-md">
        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-wider mb-1">Connect Words to Pictures</p>
        <p className="text-sm font-bold text-gray-600">
          Tap a word, then tap its picture · <span className="text-cyan-600 font-black">{matched.length}/{pairs.length}</span>
        </p>
      </div>

      {/* Two-column layout with SVG overlay for connecting lines */}
      {/* Wider middle column so the SVG connector lines have real
          breathing room and never look like the two card columns are
          glued together. 140px on phones, 200px on tablet+. */}
      <div ref={containerRef} className="relative w-full max-w-3xl grid grid-cols-[1fr_140px_1fr] sm:grid-cols-[1fr_200px_1fr] gap-2 sm:gap-3 items-stretch px-2">
        {/* Words column */}
        <div className="flex flex-col gap-2 sm:gap-3">
          {pairs.map(p => {
            const isMatched = matched.includes(p.id);
            const isSelected = selectedWord === p.id;
            const isWrong = wrongFlash?.wordId === p.id;

            let cls = "border-white/60 hover:border-cyan-300 hover:-translate-y-0.5";
            if (isSelected) cls = "border-cyan-500 ring-2 ring-cyan-200 scale-[1.02]";
            if (isMatched) cls = "border-emerald-400 bg-emerald-50 opacity-90";
            if (isWrong) cls = "border-red-400 bg-red-50 animate-shake";

            return (
              <button
                key={p.id}
                ref={setWordRef(p.id)}
                disabled={isMatched}
                onClick={() => handleWordTap(p)}
                className={`relative p-3 sm:p-4 bg-white/95 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-all duration-200 flex items-center gap-2 ${cls} ${isMatched ? 'cursor-default' : ''}`}
              >
                <AudioClipButton clip={p.audioClip} size="sm" />
                <span className="text-sm sm:text-lg font-black uppercase text-gray-800 tracking-tight flex-1 text-left truncate">{p.word}</span>
                {isMatched && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* SVG canvas in the middle */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }} aria-hidden="true">
          {matchedLines.map(({ pid, coords }) => (
            <line
              key={`m-${pid}-${tick}`}
              x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}
              stroke="#10B981" strokeWidth="4" strokeLinecap="round"
              className="wpc-line-correct"
            />
          ))}
          {wrongLine ? (
            <line
              key={`w-${tick}`}
              x1={wrongLine.x1} y1={wrongLine.y1} x2={wrongLine.x2} y2={wrongLine.y2}
              stroke="#EF4444" strokeWidth="4" strokeLinecap="round"
              className="wpc-line-wrong"
            />
          ) : null}
        </svg>

        {/* Pictures column (shuffled) */}
        <div className="flex flex-col gap-2 sm:gap-3">
          {imageOrder.map((pairIdx, slotIdx) => {
            const p = pairs[pairIdx];
            const isMatched = matched.includes(p.id);
            const isWrong = wrongFlash?.picId === p.id;

            let cls = "border-white/60 hover:border-cyan-300 hover:-translate-y-0.5";
            if (isMatched) cls = "border-emerald-400 bg-emerald-50 opacity-90";
            if (isWrong) cls = "border-red-400 bg-red-50 animate-shake";

            return (
              <button
                key={p.id}
                ref={setPicRef(slotIdx)}
                disabled={isMatched || !selectedWord}
                onClick={() => handlePicTap(pairIdx)}
                className={`relative p-2 sm:p-3 bg-white/95 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-all duration-200 flex items-center justify-center aspect-[4/3] ${cls} ${isMatched ? 'cursor-default' : ''}`}
              >
                <SmartImage
                  src={p.imagePath}
                  label={p.word}
                  className="w-full h-full"
                  imgClassName="max-w-full max-h-full object-contain"
                />
                {isMatched && (
                  <span className="absolute -top-2 -right-2 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-sm text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .wpc-line-correct {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: wpc-draw 400ms ease-out forwards;
        }
        .wpc-line-wrong {
          animation: wpc-flash 700ms ease-in-out forwards;
        }
        @keyframes wpc-draw { to { stroke-dashoffset: 0; } }
        @keyframes wpc-flash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default WordPicConnectMode;
