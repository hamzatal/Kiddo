import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playClick, playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * HangmanFriendlyMode — guess letters to reveal the hidden word.
 *
 * The classic hangman game, but rebuilt for first-graders:
 *   • No gallows. Ever. The losing visual is a friendly fox
 *     mascot in a balloon basket; each wrong guess pops a balloon
 *     and the basket sinks one notch. When all balloons are
 *     popped the round simply ends — no death imagery, no scary
 *     red X, just a gentle "let's try the next one!".
 *   • Picture clue is always visible — kids work out the word
 *     from the image, then verify with letters.
 *   • Speaker chip plays the target word audio on demand.
 *   • A-Z keyboard with already-used letters dimmed but still
 *     showing what was tapped (helps kids learn the alphabet).
 *
 * Round flow:
 *   1. Hidden word renders as `_ _ _ _` blanks.
 *   2. Kid taps a letter on the on-screen keyboard.
 *   3. If the letter is in the word, every matching blank fills
 *      with a celebratory pop.
 *   4. If not, a balloon pops on the mascot and the heart count
 *      drops by one.
 *   5. Round ends when (a) all letters revealed → success, or
 *      (b) all 5 balloons popped → next round (no shame).
 */

const ROUNDS_PER_GAME = 5;
const BALLOONS_PER_ROUND = 5;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const buildRounds = (deck) => {
    const seen = new Set();
    const rounds = [];
    for (const r of deck || []) {
        const txt = r?.prompt?.text;
        if (!txt) continue;
        const word = txt.trim().toUpperCase();
        // Single-word, alpha only — same constraint as
        // SpellingTilesMode for the same reason (the keyboard view
        // assumes one contiguous alphabetic token).
        if (/[^A-Z]/.test(word)) continue;
        if (seen.has(word)) continue;
        seen.add(word);
        rounds.push({
            roundId: `hang-${rounds.length}`,
            word,
            wordId: r.wordId || null,
            imagePath: r.prompt.imagePath,
            audioClip: r.prompt.audioClip,
        });
        if (rounds.length >= ROUNDS_PER_GAME) break;
    }
    return rounds;
};

const HangmanFriendlyMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => buildRounds(deck), [deck]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);

    const [revealed, setRevealed] = useState(new Set()); // letters guessed correctly (chars)
    const [wrongLetters, setWrongLetters] = useState(new Set());
    const [phase, setPhase] = useState("play"); // 'play' | 'over'
    const audioPlayedRef = useRef(false);

    const round = rounds[roundIdx];

    // Reset on round change.
    useEffect(() => {
        if (!round) return;
        setRevealed(new Set());
        setWrongLetters(new Set());
        setPhase("play");
        audioPlayedRef.current = false;

        const t = setTimeout(() => {
            if (audioPlayedRef.current) return;
            audioPlayedRef.current = true;
            speakWord({ wordId: round.wordId, label: round.word, audioClip: round.audioClip });
        }, 350);
        return () => clearTimeout(t);
    }, [roundIdx, round]);

    // When all rounds done, hand control back to LessonScreen.
    useEffect(() => {
        if (!rounds.length) return;
        if (results.length >= rounds.length) {
            const t = setTimeout(() => {
                onComplete({
                    correct: results.filter((r) => r.correct).length,
                    total: rounds.length,
                    rounds: results,
                });
            }, 700);
            return () => clearTimeout(t);
        }
    }, [results, rounds.length, onComplete]);

    if (!rounds.length) {
        return (
            <div className="text-center p-8">
                <p className="text-gray-500 font-bold">No words available.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-fuchsia-600 text-white rounded-2xl font-bold"
                >
                    Skip
                </button>
            </div>
        );
    }
    if (!round) return null;

    // Convenient derived values.
    const wordChars = round.word.split("");
    const isWordSolved = wordChars.every((c) => revealed.has(c));
    const balloonsLeft = Math.max(0, BALLOONS_PER_ROUND - wrongLetters.size);

    const advanceWith = (correct) => {
        setPhase("over");
        setResults((prev) => [
            ...prev,
            {
                roundId: round.roundId,
                correct,
                wordId: round.wordId,
                word: round.word,
                style: "hangman-friendly",
            },
        ]);
        setTimeout(() => setRoundIdx((i) => i + 1), 1200);
    };

    const handleLetter = (letter) => {
        if (phase !== "play") return;
        if (revealed.has(letter) || wrongLetters.has(letter)) return;

        if (round.word.includes(letter)) {
            playPop();
            // We need to know whether THIS guess completed the
            // word. Compute the would-be next set OUTSIDE the
            // state updater so we can fire side effects safely
            // (StrictMode invokes the updater twice in dev — any
            // sound or `setResults` inside it would double-fire).
            const nextRevealed = new Set(revealed);
            nextRevealed.add(letter);
            setRevealed(nextRevealed);
            const done = wordChars.every((c) => nextRevealed.has(c));
            if (done) {
                playSuccess();
                advanceWith(true);
            }
        } else {
            playFail();
            const nextWrong = new Set(wrongLetters);
            nextWrong.add(letter);
            setWrongLetters(nextWrong);
            if (nextWrong.size >= BALLOONS_PER_ROUND) {
                advanceWith(false);
            }
        }
    };

    const replayAudio = () => {
        playClick();
        speakWord({ wordId: round.wordId, label: round.word, audioClip: round.audioClip });
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest text-center">🎈 Letter Quest · Guess the word</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-fuchsia-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-fuchsia-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Top row: picture clue (left) + balloon mascot (right). */}
            <div className="w-full max-w-md flex items-stretch gap-2 sm:gap-3">
                {/* Picture clue */}
                <div className="flex-1 bg-white rounded-3xl shadow-md border-2 border-white p-2 flex flex-col items-center gap-1 animate-prompt-attention">
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-fuchsia-50 to-pink-50 flex items-center justify-center overflow-hidden">
                        <SmartImage
                            src={round.imagePath}
                            label={round.word}
                            className="w-full h-full"
                            imgClassName="w-full h-full object-contain p-2"
                        />
                    </div>
                    <button
                        onClick={replayAudio}
                        className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-fuchsia-500 text-white text-[10px] font-black uppercase tracking-wider shadow hover:scale-105 active:scale-95 transition-transform"
                        aria-label="Hear the word"
                    >
                        🔊 Hear
                    </button>
                </div>

                {/* Balloon mascot */}
                <div className="flex-1 bg-gradient-to-br from-sky-50 via-white to-fuchsia-50 rounded-3xl shadow-md border-2 border-white p-3 flex flex-col items-center justify-end relative overflow-hidden">
                    {/* Five balloons across the top — pop one by one
                        as wrong guesses accumulate. The "popped"
                        ones still render in place but greyed out so
                        the kid sees the cost of the misses. */}
                    <div className="absolute inset-x-0 top-2 flex justify-center gap-1.5">
                        {Array.from({ length: BALLOONS_PER_ROUND }).map((_, i) => {
                            const popped = i >= balloonsLeft;
                            return (
                                <span
                                    key={i}
                                    className={`text-2xl sm:text-3xl transition-all duration-500 ${
                                        popped ? "opacity-25 grayscale scale-75" : "scale-100 drop-shadow"
                                    }`}
                                    style={{ transform: `translateY(${popped ? 8 : 0}px)` }}
                                    aria-hidden="true"
                                >
                                    🎈
                                </span>
                            );
                        })}
                    </div>
                    {/* Mascot — sits at the bottom; sinks one notch
                        per popped balloon. */}
                    <span
                        className="text-3xl sm:text-5xl transition-transform duration-500"
                        style={{ transform: `translateY(${(BALLOONS_PER_ROUND - balloonsLeft) * 4}px)` }}
                        aria-hidden="true"
                    >
                        🦊
                    </span>
                    <p className="mt-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-fuchsia-500">
                        {balloonsLeft}/{BALLOONS_PER_ROUND} balloons
                    </p>
                </div>
            </div>

            {/* Word display — one box per letter. Filled boxes show
                their letter; unfilled show an underscore. */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-md">
                {wordChars.map((c, i) => {
                    const shown = revealed.has(c) || phase === "over";
                    return (
                        <span
                            key={i}
                            className={`inline-flex w-8 h-10 sm:w-10 sm:h-12 items-center justify-center rounded-xl border-b-[5px] text-lg sm:text-2xl font-black uppercase transition-all duration-200 ${
                                shown
                                    ? phase === "over" && !isWordSolved
                                        ? "bg-rose-50 border-rose-500 text-rose-700"
                                        : "bg-white border-fuchsia-500 text-fuchsia-700 shadow"
                                    : "bg-fuchsia-50/40 border-fuchsia-300 text-fuchsia-300"
                            }`}
                        >
                            {shown ? c : "_"}
                        </span>
                    );
                })}
            </div>

            {/* On-screen alphabet keyboard. */}
            <div className="grid grid-cols-9 sm:grid-cols-13 gap-1 sm:gap-1.5 max-w-md">
                {ALPHABET.map((ch) => {
                    const usedHit = revealed.has(ch);
                    const usedMiss = wrongLetters.has(ch);
                    const used = usedHit || usedMiss;
                    return (
                        <button
                            key={ch}
                            onClick={() => handleLetter(ch)}
                            disabled={used || phase !== "play"}
                            className={`w-7 h-9 sm:w-8 sm:h-10 rounded-lg border-b-[4px] text-xs sm:text-sm font-black uppercase transition-all duration-150 ${
                                usedHit
                                    ? "bg-emerald-100 border-emerald-500 text-emerald-700 cursor-not-allowed"
                                    : usedMiss
                                    ? "bg-rose-100 border-rose-500 text-rose-700 cursor-not-allowed opacity-70"
                                    : "bg-white border-fuchsia-500 text-fuchsia-700 shadow hover:-translate-y-0.5 active:translate-y-[2px] active:border-b-2 cursor-pointer"
                            }`}
                        >
                            {ch}
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {phase === "over" && !isWordSolved
                    ? `The word was "${round.word}" — let's try the next one!`
                    : "Tap a letter to guess. Each wrong guess pops a balloon."}
            </p>

            <style>{`
                /* The default Tailwind grid only goes to grid-cols-12;
                   we need 13 to fit A-M on one row + N-Z on the next
                   on tablet width. Custom utility for this single
                   layout to avoid touching the global config. */
                @media (min-width: 640px) {
                    .grid-cols-13 { grid-template-columns: repeat(13, minmax(0, 1fr)); }
                }
            `}</style>
        </div>
    );
};

export default HangmanFriendlyMode;
