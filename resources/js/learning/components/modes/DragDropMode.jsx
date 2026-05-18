import React, { useEffect, useMemo, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * DragDropMode — tap-to-sort game (works on touch without HTML5 drag).
 *
 * Layout v3:
 *  • Pictures row → divider → words row, each as `aspect-square`
 *    cards in a responsive grid.
 *  • Picture frames use `object-contain` so illustrations never clip.
 *  • Header card includes pair counter as compact pill.
 */
const DragDropMode = ({ lesson, deck = [], onComplete }) => {
    const items = useMemo(() => {
        const seen = new Set();
        const out = [];
        for (const r of deck || []) {
            const p = r?.prompt;
            if (!p?.text || seen.has(p.text)) continue;
            seen.add(p.text);
            out.push({
                id: `item-${out.length}`,
                wordId: r.wordId || null,
                word: p.text,
                imagePath: p.imagePath,
                audioClip: p.audioClip,
            });
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

    useEffect(() => {
        if (allMatched) {
            const t = setTimeout(() => {
                onComplete({
                    correct: attempts.filter((a) => a.correct).length,
                    total: items.length,
                    rounds: attempts,
                });
            }, 800);
            return () => clearTimeout(t);
        }
    }, [allMatched]);

    if (!items.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No items available.</p>
                <button onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold">
                    Skip
                </button>
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

        const sourceItem = items.find((it) => it.id === selectedImage);

        if (selectedImage === item.id) {
            playSuccess();
            setMatched((prev) => new Set([...prev, item.id]));
            setAttempts((prev) => [...prev, {
                roundId: item.id,
                wordId: item.wordId,
                word: item.word,
                correct: true,
                timeMs: 0,
            }]);
            setSelectedImage(null);
            setWrongPair(null);
        } else {
            playFail();
            setAttempts((prev) => [...prev, {
                roundId: sourceItem?.id,
                wordId: sourceItem?.wordId,
                word: sourceItem?.word,
                wrongChoice: item.word,
                wrongChoiceId: item.wordId,
                correct: false,
                timeMs: 0,
            }]);
            setWrongPair(item.id);
            setTimeout(() => setWrongPair(null), 600);
            setSelectedImage(null);
        }
    };

    const progressPct = Math.round((matched.size / items.length) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5 animate-fade-in-up px-2">
            <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-md border border-white/50 px-4 py-2.5">
                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest text-center mb-1.5">Match the Pairs!</p>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-teal-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-teal-600">{matched.size}/{items.length}</span>
                </div>
            </div>

            {/* Pictures row */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 w-full max-w-2xl">
                {items.map((item) => {
                    const isSelected = selectedImage === item.id;
                    const isMatched = matched.has(item.id);
                    return (
                        <button
                            key={`img-${item.id}`}
                            onClick={() => handleImageTap(item)}
                            disabled={isMatched}
                            className={`relative aspect-square p-2 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 shadow-sm flex items-center justify-center ${
                                isMatched
                                    ? "bg-emerald-50 border-emerald-300 opacity-60 scale-90"
                                    : isSelected
                                    ? "bg-purple-50 border-purple-400 scale-105 shadow-lg ring-2 ring-purple-200"
                                    : "bg-white/90 border-white/60 hover:border-teal-300 hover:shadow-md"
                            }`}
                        >
                            <SmartImage src={item.imagePath} label={item.word} className="w-full h-full" imgClassName="w-full h-full object-contain" />
                            {isMatched && <span className="absolute top-1 right-1 text-base">✅</span>}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full max-w-2xl">
                {shuffledWords.map((item) => {
                    const isMatched = matched.has(item.id);
                    const isWrong = wrongPair === item.id;
                    return (
                        <button
                            key={`word-${item.id}`}
                            onClick={() => handleWordTap(item)}
                            disabled={isMatched || !selectedImage}
                            className={`px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 shadow-sm font-black text-xs sm:text-sm uppercase text-center ${
                                isMatched
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-600 opacity-60 line-through"
                                    : isWrong
                                    ? "bg-red-50 border-red-300 text-red-500 animate-shake"
                                    : selectedImage
                                    ? "bg-white/90 border-teal-200 text-gray-700 hover:bg-teal-50 hover:border-teal-400 cursor-pointer"
                                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {item.word}
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] font-bold text-gray-500 text-center">
                {selectedImage ? "✨ Now tap the matching word →" : "👆 Tap a picture to start"}
            </p>
        </div>
    );
};

export default DragDropMode;
