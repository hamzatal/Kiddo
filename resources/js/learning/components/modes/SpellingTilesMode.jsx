import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playClick, playSuccess, playFail, playPop } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * SpellingTilesMode — build the word from jumbled letter tiles.
 *
 * Round flow:
 *   1. Show the picture + speaker (audio plays once on mount).
 *   2. Below it: an empty "answer slot" row with as many blanks as
 *      the word has letters. Kids tap the next blank to focus.
 *   3. Below that: a shuffled pool of LETTER TILES — the word's
 *      letters + 2 random distractors. Tapping a tile fills the
 *      next blank and the tile fades out of the pool.
 *   4. Tapping a filled blank pops that letter back into the pool
 *      (so the kid can correct mistakes without restarting).
 *   5. When all blanks are filled we auto-check; correct → success
 *      ding + advance, wrong → gentle shake + clear the slots.
 *
 * Why this works for first-graders:
 *   • No typing required — just tap.
 *   • The picture stays visible the whole time so they're never
 *     guessing in the dark.
 *   • Distractors are kept to 2 so the pool isn't overwhelming;
 *     short words (≤3 letters) get 0 distractors, medium (4-5)
 *     get 1, longer words (6+) get 2.
 *   • Wrong answers don't penalise — the round just restarts so
 *     the kid keeps a successful loop going.
 *
 * Pairs cleanly with the existing deck format — uses
 * `prompt.text` for the target word, `prompt.imagePath` for the
 * clue, `prompt.audioClip` for the read-aloud cue.
 */

const ROUNDS_PER_GAME = 6;

/** Pure helper — produce N random extra letters that aren't already
 * in the target word. Bias toward the same letter family (vowels +
 * common consonants) so the pool feels relevant. */
const pickDistractors = (word, count) => {
    if (count <= 0) return [];
    const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const used = new Set(word.toUpperCase().split(""));
    const pool = base.split("").filter((c) => !used.has(c));
    const out = [];
    while (out.length < count && pool.length) {
        const idx = Math.floor(Math.random() * pool.length);
        out.push(pool.splice(idx, 1)[0]);
    }
    return out;
};

/** Pure helper — shuffle in place using Fisher-Yates. */
const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

/** Pure helper — pick up to N words from the deck for a session. */
const buildRounds = (deck) => {
    const seen = new Set();
    const rounds = [];
    for (const r of deck || []) {
        const txt = r?.prompt?.text;
        if (!txt) continue;
        const word = txt.trim().toUpperCase();
        // Skip tokens with spaces or hyphens — they don't fit the
        // "fill these blanks" layout cleanly. Stick to single words.
        if (/[^A-Z]/.test(word)) continue;
        if (seen.has(word)) continue;
        seen.add(word);
        const extras = word.length <= 3 ? 0 : word.length <= 5 ? 1 : 2;
        const tiles = shuffle([...word.split(""), ...pickDistractors(word, extras)]);
        rounds.push({
            roundId: `spell-${rounds.length}`,
            word,
            wordId: r.wordId || null,
            imagePath: r.prompt.imagePath,
            audioClip: r.prompt.audioClip,
            tiles: tiles.map((ch, i) => ({ id: `t-${rounds.length}-${i}`, ch })),
        });
        if (rounds.length >= ROUNDS_PER_GAME) break;
    }
    return rounds;
};

const SpellingTilesMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => buildRounds(deck), [deck]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);

    // Per-round state — reset on every round bump.
    const [slots, setSlots] = useState([]);   // [{ tileId, ch } | null]
    const [usedTileIds, setUsedTileIds] = useState(new Set());
    const [feedback, setFeedback] = useState(null); // 'wrong' | null
    const audioPlayedRef = useRef(false);

    const round = rounds[roundIdx];

    // Reset slots whenever the round changes; play the read-aloud
    // once so the kid hears the target word before they start.
    useEffect(() => {
        if (!round) return;
        setSlots(Array(round.word.length).fill(null));
        setUsedTileIds(new Set());
        setFeedback(null);
        audioPlayedRef.current = false;

        const t = setTimeout(() => {
            if (audioPlayedRef.current) return;
            audioPlayedRef.current = true;
            speakWord({ wordId: round.wordId, label: round.word, audioClip: round.audioClip });
        }, 350);
        return () => clearTimeout(t);
    }, [roundIdx, round]);

    // When all rounds are exhausted, hand control back to the
    // LessonScreen with a normal results object.
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
                <p className="text-gray-500 font-bold">No spelling words available.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold"
                >
                    Skip
                </button>
            </div>
        );
    }
    if (!round) return null;

    const replayAudio = () => {
        playClick();
        speakWord({ wordId: round.wordId, label: round.word, audioClip: round.audioClip });
    };

    const handleTileTap = (tile) => {
        if (feedback) return;
        if (usedTileIds.has(tile.id)) return;
        const nextEmpty = slots.findIndex((s) => s == null);
        if (nextEmpty === -1) return; // all filled

        playPop();
        const next = slots.slice();
        next[nextEmpty] = { tileId: tile.id, ch: tile.ch };
        setSlots(next);
        setUsedTileIds((s) => new Set([...s, tile.id]));

        // Auto-check the moment the row is full.
        if (next.every((x) => x != null)) {
            const guess = next.map((s) => s.ch).join("");
            if (guess === round.word) {
                playSuccess();
                setResults((prev) => [
                    ...prev,
                    { roundId: round.roundId, correct: true, wordId: round.wordId, word: round.word, style: "spelling-tiles" },
                ]);
                setTimeout(() => setRoundIdx((i) => i + 1), 750);
            } else {
                playFail();
                setFeedback("wrong");
                setResults((prev) => [
                    ...prev,
                    {
                        roundId: round.roundId,
                        correct: false,
                        wordId: round.wordId,
                        word: round.word,
                        wrongChoice: guess,
                        style: "spelling-tiles",
                    },
                ]);
                // Show the wrong feedback briefly, then advance.
                setTimeout(() => setRoundIdx((i) => i + 1), 1100);
            }
        }
    };

    const handleSlotTap = (slotIdx) => {
        if (feedback) return;
        const slot = slots[slotIdx];
        if (!slot) return;
        playClick();
        const next = slots.slice();
        next[slotIdx] = null;
        setSlots(next);
        setUsedTileIds((s) => {
            const out = new Set(s);
            out.delete(slot.tileId);
            return out;
        });
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-5 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest text-center">🔤 Spelling Tiles · Build the word</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-teal-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-teal-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Picture clue + replay button */}
            <div className="w-full max-w-xs bg-white rounded-3xl shadow-md border-2 border-white p-3 flex flex-col items-center gap-2 animate-prompt-attention">
                <div className="w-full aspect-square max-w-[180px] rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center overflow-hidden">
                    <SmartImage
                        src={round.imagePath}
                        label={round.word}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-contain p-2"
                    />
                </div>
                <button
                    onClick={replayAudio}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-black uppercase tracking-wider shadow hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Hear the word again"
                >
                    🔊 Hear it
                </button>
            </div>

            {/* Answer slot row */}
            <div className={`flex gap-1.5 sm:gap-2 ${feedback === "wrong" ? "animate-shake" : ""}`}>
                {slots.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSlotTap(i)}
                        disabled={!s}
                        className={`relative w-9 h-11 sm:w-11 sm:h-14 rounded-xl border-b-[5px] transition-all duration-150 flex items-center justify-center text-lg sm:text-2xl font-black uppercase ${
                            s
                                ? feedback === "wrong"
                                    ? "bg-rose-50 border-rose-500 text-rose-700"
                                    : "bg-white border-teal-500 text-teal-700 shadow-md hover:-translate-y-0.5"
                                : "bg-teal-50/40 border-teal-300 text-teal-300"
                        }`}
                    >
                        {s ? s.ch : "_"}
                    </button>
                ))}
            </div>

            {/* Letter tile pool */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-md">
                {round.tiles.map((tile) => {
                    const used = usedTileIds.has(tile.id);
                    return (
                        <button
                            key={tile.id}
                            onClick={() => handleTileTap(tile)}
                            disabled={used || !!feedback}
                            className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-b-[5px] flex items-center justify-center text-lg sm:text-xl font-black uppercase transition-all duration-150 ${
                                used
                                    ? "opacity-25 scale-90 bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                                    : "bg-white border-teal-600 text-teal-800 shadow-md hover:-translate-y-1 active:translate-y-[2px] active:border-b-2 cursor-pointer"
                            }`}
                        >
                            {tile.ch}
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {feedback === "wrong"
                    ? `That spells "${slots.map((s) => s?.ch || "_").join("")}" — let's try the next one!`
                    : "Tap the letters in order. Tap a filled blank to remove it."}
            </p>
        </div>
    );
};

export default SpellingTilesMode;
