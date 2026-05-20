import React, { useEffect, useMemo, useState } from "react";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * SequenceBuildMode — "Build the sentence!"
 *
 * Shows a small target sentence ("I have a cat") with the word tiles
 * shuffled. The child drags tiles into the slots in order. Once all
 * slots are filled, a "Done" button validates the order. Wrong order
 * = playFail and a shake; right = playSuccess and onComplete.
 *
 * Uses HTML5 drag-and-drop, with a fallback "tap to place / tap to
 * remove" interaction so it also works on touch devices that don't
 * fire dragstart events.
 *
 * Sentence source priority:
 *   1. lesson.config.sentence  (e.g. ["I", "have", "a", "cat"])
 *   2. derived from the first deck round's prompt word with template
 *      "I have a {word}" — friendly default for U1/U2.
 */
const DEFAULT_TEMPLATE = ["I", "have", "a", "cat"];
const ROUND_LIMIT = 3;

const buildRound = (deckEntry, lesson, idx) => {
    const cfgSentences = lesson?.config?.sentences;
    if (Array.isArray(cfgSentences) && cfgSentences[idx]?.length) {
        return { tokens: cfgSentences[idx], audioClip: deckEntry?.prompt?.audioClip || null };
    }
    const targetWord = deckEntry?.prompt?.text;
    if (targetWord) {
        const lower = targetWord.toLowerCase();
        return {
            tokens: ["I", "have", "a", lower],
            audioClip: deckEntry?.prompt?.audioClip || null,
        };
    }
    return { tokens: DEFAULT_TEMPLATE, audioClip: null };
};

const SequenceBuildMode = ({ lesson, deck = [], onComplete }) => {
    const rounds = useMemo(() => {
        const want = Math.min(ROUND_LIMIT, Math.max(1, deck.length || 1));
        return Array.from({ length: want }).map((_, i) =>
            buildRound(deck[i] || deck[0], lesson, i)
        );
    }, [deck, lesson]);

    const [idx, setIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [shuffledTokens, setShuffledTokens] = useState([]); // unplaced tiles
    const [placed, setPlaced] = useState([]); // filled slots in order
    const [shake, setShake] = useState(false);

    // Reset when entering a new round.
    useEffect(() => {
        const tokens = rounds[idx]?.tokens || DEFAULT_TEMPLATE;
        const arr = tokens.map((t, i) => ({ id: `tok-${idx}-${i}`, text: t }));
        // Shuffle until different from canonical order.
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr.length > 1 && arr.every((t, i) => t.text === tokens[i])) {
            [arr[0], arr[1]] = [arr[1], arr[0]];
        }
        setShuffledTokens(arr);
        setPlaced([]);
        setShake(false);
    }, [idx, rounds]);

    const round = rounds[idx];
    // Friendly empty state — also fires when the deck is empty and
    // we'd otherwise fall back to the hardcoded "I have a cat"
    // template (DEFAULT_TEMPLATE), which is a confusing
    // experience for the kid because it doesn't match the lesson.
    if (!round || !deck?.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">📝</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No sentences yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Your teacher hasn't added the build-a-sentence task for this lesson yet.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md hover:-translate-y-0.5 transition-all"
                >
                    Continue →
                </button>
            </div>
        );
    }

    const placeToken = (tok) => {
        playClick();
        playPop();
        setShuffledTokens((arr) => arr.filter((t) => t.id !== tok.id));
        setPlaced((arr) => [...arr, tok]);
    };

    const removePlaced = (tok) => {
        playClick();
        setPlaced((arr) => arr.filter((t) => t.id !== tok.id));
        setShuffledTokens((arr) => [...arr, tok]);
    };

    const onDragStart = (e, tok) => {
        e.dataTransfer.setData("text/plain", tok.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDropZone = (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const tok = shuffledTokens.find((t) => t.id === id);
        if (tok) placeToken(tok);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const validate = () => {
        const target = round.tokens;
        const ok = placed.length === target.length &&
            placed.every((t, i) => t.text.toLowerCase() === target[i].toLowerCase());
        if (ok) {
            playSuccess();
            if (round.audioClip) playAudio(round.audioClip);
            const next = [
                ...results,
                { roundId: `seq-${idx}`, correct: true, wordId: deck[idx]?.wordId || null },
            ];
            setResults(next);
            setTimeout(() => {
                if (idx + 1 >= rounds.length) {
                    onComplete({
                        correct: next.filter((r) => r.correct).length,
                        total: rounds.length,
                        rounds: next,
                    });
                } else {
                    setIdx(idx + 1);
                }
            }, 800);
        } else {
            playFail();
            setShake(true);
            setResults((arr) => [
                ...arr,
                { roundId: `seq-${idx}-try`, correct: false, wordId: deck[idx]?.wordId || null },
            ]);
            setTimeout(() => setShake(false), 500);
        }
    };

    const expectedLen = round.tokens.length;

    return (
        <div className="w-full flex flex-col items-center gap-6 animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-md border border-white flex items-center gap-3">
                <p className="text-sm sm:text-base font-black text-[#1E293B]">
                    Build the sentence — drag the words in order.
                </p>
            </div>

            {/* Slots */}
            <div
                onDrop={onDropZone}
                onDragOver={onDragOver}
                className={`flex flex-wrap items-center justify-center gap-2 lg:gap-3 p-4 lg:p-6 min-h-[5rem] rounded-3xl border-4 border-dashed transition-colors w-full max-w-3xl ${
                    placed.length === expectedLen
                        ? "border-emerald-300 bg-emerald-50/60"
                        : "border-purple-200 bg-white/70"
                } ${shake ? "seq-shake" : ""}`}
            >
                {Array.from({ length: expectedLen }).map((_, i) => {
                    const tok = placed[i];
                    if (tok) {
                        return (
                            <button
                                key={tok.id}
                                type="button"
                                draggable
                                onDragStart={(e) => onDragStart(e, tok)}
                                onClick={() => removePlaced(tok)}
                                className="px-4 py-2 lg:px-5 lg:py-3 rounded-2xl bg-white border-2 border-purple-300 shadow-sm font-black text-base lg:text-lg text-[#1E293B] cursor-grab active:cursor-grabbing"
                                title="Tap to remove"
                            >
                                {tok.text}
                            </button>
                        );
                    }
                    return (
                        <span
                            key={`slot-${i}`}
                            className="px-4 py-2 lg:px-5 lg:py-3 rounded-2xl border-2 border-dashed border-purple-200 text-purple-300 font-black text-base lg:text-lg"
                        >
                            ___
                        </span>
                    );
                })}
            </div>

            {/* Token tray */}
            <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 w-full max-w-3xl">
                {shuffledTokens.map((tok) => (
                    <button
                        key={tok.id}
                        type="button"
                        draggable
                        onDragStart={(e) => onDragStart(e, tok)}
                        onClick={() => placeToken(tok)}
                        className="px-4 py-2 lg:px-5 lg:py-3 rounded-2xl bg-gradient-to-b from-yellow-300 to-amber-400 text-[#1E293B] font-black text-base lg:text-lg shadow-md hover:-translate-y-0.5 transition-transform cursor-grab active:cursor-grabbing"
                    >
                        {tok.text}
                    </button>
                ))}
                {shuffledTokens.length === 0 ? (
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                        All words placed — press Done!
                    </span>
                ) : null}
            </div>

            <button
                type="button"
                onClick={validate}
                disabled={placed.length !== expectedLen}
                className="px-10 py-4 rounded-[2rem] font-black text-base lg:text-lg shadow-[0_8px_0_#059669] hover:translate-y-[2px] active:translate-y-[6px] transition-all bg-[#10B981] text-white disabled:bg-gray-300 disabled:shadow-[0_4px_0_#9CA3AF] disabled:cursor-not-allowed"
            >
                Done →
            </button>

            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Round {idx + 1} of {rounds.length}
            </p>

            <style>{`
                @keyframes seq-shake-kf {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
                .seq-shake { animation: seq-shake-kf 480ms ease-in-out; }
            `}</style>
        </div>
    );
};

export default SequenceBuildMode;
