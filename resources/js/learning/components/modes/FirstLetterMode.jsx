import React, { useEffect, useMemo, useState } from "react";
import OptionCard from "@/learning/components/ui/OptionCard";
import { playClick, playSuccess, playFail } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * FirstLetterMode — phonics warm-up. "Which picture starts with the
 * letter B?"
 *
 * Round flow:
 *   1. Show a giant target letter at the top (big, bold, in colour).
 *   2. Audio plays: "B! Which one starts with B?".
 *   3. Show 4 picture cards — exactly ONE starts with the target
 *      letter, the other 3 are decoys drawn from words starting
 *      with different letters.
 *   4. Kid taps a card. Right → green halo + advance. Wrong →
 *      shake the wrong card, ✓ on the right one, then advance.
 *
 * Why this works for first-graders:
 *   • Grounds letter sounds in real picture vocabulary they
 *     already know — strong phonics-to-meaning bridge.
 *   • Uses the new sticker-style OptionCard for the picture
 *     options so the visual language matches the rest of the
 *     curriculum.
 *   • No reading required — the target is one giant letter, the
 *     answer is a picture.
 *
 * Reuses the existing deck format. Each round picks a target
 * word from the deck (used as the "right answer") and 3 decoys
 * whose first letter ≠ the target's first letter.
 */

const ROUNDS_PER_GAME = 5;

const buildRounds = (deck) => {
    // Group deck entries by first letter so we can pull decoys
    // efficiently. Skip multi-word phrases for clarity.
    const byLetter = new Map();
    for (const r of deck || []) {
        const txt = r?.prompt?.text;
        if (!txt) continue;
        const word = txt.trim();
        if (!word || /\s/.test(word)) continue;
        const letter = word[0].toUpperCase();
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter).push(r);
    }

    const rounds = [];
    const used = new Set();
    // Iterate the deck so the first-encounter order seeds round
    // selection — this keeps the rotation deterministic for the
    // operator-test "same lesson same flow" expectation.
    for (const r of deck || []) {
        const txt = r?.prompt?.text;
        if (!txt) continue;
        const word = txt.trim();
        if (!word || /\s/.test(word)) continue;
        if (used.has(word)) continue;

        const letter = word[0].toUpperCase();
        // We need at least 3 decoys whose first letter is different.
        const decoys = [];
        for (const [otherLetter, items] of byLetter) {
            if (otherLetter === letter) continue;
            for (const it of items) {
                if (decoys.length >= 3) break;
                if (it.prompt?.text === word) continue;
                decoys.push(it);
            }
            if (decoys.length >= 3) break;
        }
        if (decoys.length < 3) continue; // not enough variety in this deck

        used.add(word);
        const allOptions = [r, ...decoys];
        // Shuffle so the right answer isn't always first.
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }
        rounds.push({
            roundId: `firstltr-${rounds.length}`,
            targetLetter: letter,
            targetWord: word,
            targetWordId: r.wordId || null,
            options: allOptions.map((opt, idx) => ({
                id: `opt-${rounds.length}-${idx}`,
                isCorrect: opt.prompt?.text === word,
                wordId: opt.wordId || null,
                word: opt.prompt?.text,
                imagePath: opt.prompt?.imagePath,
                audioClip: opt.prompt?.audioClip,
            })),
        });
        if (rounds.length >= ROUNDS_PER_GAME) break;
    }
    return rounds;
};

/** Helper — speak just a single letter. Most TTS systems pronounce
 * a single uppercase letter as the letter name (B → "bee"); some
 * read it phonetically. We send a tiny phrase to nudge them toward
 * the letter NAME so it lines up with what the kid sees on screen. */
const speakLetter = (letter) => {
    if (!letter) return;
    speakWord({ wordId: null, label: `Letter ${letter}` });
};

const FirstLetterMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => buildRounds(deck), [deck]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [picked, setPicked] = useState(null); // option.id

    const round = rounds[roundIdx];

    // Auto-play the target letter audio when each round mounts.
    useEffect(() => {
        if (!round) return;
        const t = setTimeout(() => speakLetter(round.targetLetter), 300);
        return () => clearTimeout(t);
    }, [round]);

    // When all rounds are done, hand control back.
    useEffect(() => {
        if (!rounds.length) return;
        if (results.length >= rounds.length) {
            const t = setTimeout(() => {
                onComplete({
                    correct: results.filter((r) => r.correct).length,
                    total: rounds.length,
                    rounds: results,
                });
            }, 600);
            return () => clearTimeout(t);
        }
    }, [results, rounds.length, onComplete]);

    if (!rounds.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">
                    Not enough letter variety in this deck.
                </p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold"
                >
                    Skip
                </button>
            </div>
        );
    }
    if (!round) return null;

    const handlePick = (opt) => {
        if (picked) return;
        playClick();
        setPicked(opt.id);
        if (opt.isCorrect) {
            playSuccess();
            // Read the word so the kid hears how the picture they
            // picked is pronounced — reinforces the letter →
            // picture → sound chain.
            setTimeout(() => speakWord({ wordId: opt.wordId, label: opt.word, audioClip: opt.audioClip }), 200);
            setResults((prev) => [
                ...prev,
                { roundId: round.roundId, correct: true, wordId: round.targetWordId, word: round.targetWord, style: "first-letter" },
            ]);
            setTimeout(() => {
                setPicked(null);
                setRoundIdx((i) => i + 1);
            }, 1100);
        } else {
            playFail();
            setResults((prev) => [
                ...prev,
                {
                    roundId: round.roundId,
                    correct: false,
                    wordId: round.targetWordId,
                    word: round.targetWord,
                    wrongChoice: opt.word,
                    wrongChoiceId: opt.wordId,
                    style: "first-letter",
                },
            ]);
            setTimeout(() => {
                setPicked(null);
                setRoundIdx((i) => i + 1);
            }, 1300);
        }
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest text-center">🔡 First Letter · Phonics</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-amber-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Big target letter — animated bob to hold attention. */}
            <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-gradient-to-br from-amber-300 via-orange-400 to-amber-500 shadow-xl border-4 border-white flex items-center justify-center animate-prompt-attention">
                    <span className="text-6xl sm:text-8xl font-black text-white drop-shadow-md">
                        {round.targetLetter}
                    </span>
                </div>
                <button
                    onClick={() => speakLetter(round.targetLetter)}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Hear the letter"
                >
                    🔊 Hear
                </button>
            </div>

            <p className="mt-3 text-sm sm:text-base font-black text-amber-700 tracking-wide text-center">
                Which one starts with <span className="text-amber-900 underline decoration-wavy decoration-2">{round.targetLetter}</span>?
            </p>

            {/* 4 option cards — same sticker style as every other mode. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg">
                {round.options.map((opt) => {
                    let state = "idle";
                    if (picked) {
                        if (opt.id === picked) {
                            state = opt.isCorrect ? "correct" : "wrong";
                        } else if (opt.isCorrect) {
                            state = "correct"; // reveal the right answer too
                        } else {
                            state = "disabled";
                        }
                    }
                    return (
                        <OptionCard
                            key={opt.id}
                            imagePath={opt.imagePath}
                            label={opt.word}
                            audioClip={opt.audioClip}
                            wordId={opt.wordId}
                            state={state}
                            onClick={() => handlePick(opt)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FirstLetterMode;
