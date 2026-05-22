import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playClick, playSuccess, playFail, playStarCollect } from "@/learning/utils/soundEffects";
import { speakWord } from "@/learning/utils/playAudio";

/**
 * EmojiHuntMode — listen, hunt, tap.
 *
 * Round flow:
 *   1. A "scene" of 8-10 small picture tiles is laid out in a
 *      cluttered, slightly-rotated grid (looks more like a
 *      "spot the X" search-and-find page than a quiz grid).
 *   2. Audio plays: "Find the cat!" and the target word renders
 *      in a banner at the top.
 *   3. Kid taps tiles. Wrong taps shake briefly and dim. The
 *      correct tile gets a star burst + sparkle animation, and
 *      a new target loads.
 *   4. After 6 finds, the round completes.
 *
 * Why this works for first-graders
 * ────────────────────────────────
 *   • A "search-and-find" mechanic is famously kid-friendly
 *     (Where's Waldo, I-spy books). It's the only game in the
 *     library that combines AUDIO + SCANNING + TAPPING in a
 *     single mechanic, which fills a real gap.
 *   • The slight rotations make the scene feel playful rather
 *     than clinical. They also subtly increase the cognitive
 *     load (kid must orient each tile to recognise it), which
 *     is good practice without being frustrating.
 *   • Wrong taps are handled forgivingly — they dim out so the
 *     kid sees what they've already eliminated, but no penalty.
 *
 * Data
 * ────
 *   Standard lesson deck. Each round picks a target word from
 *   the deck; the scene is built from up to 10 distinct deck
 *   entries. Re-using the same deck between rounds lets the
 *   kid encounter every vocab word visually multiple times in
 *   a single lesson.
 */

const FINDS_PER_GAME = 6;
const SCENE_SIZE = 9; // tiles laid out in a 3×3 pseudo-grid

/** Pure helper — Fisher-Yates shuffle. */
const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

/** Deterministic 0-1 number from any string — used to pick a
 *  stable rotation per tile so the scene doesn't reshuffle on
 *  every render. */
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

const buildPool = (deck) => {
    const seen = new Set();
    const out = [];
    for (const r of deck || []) {
        const t = r?.prompt?.text;
        if (!t || seen.has(t)) continue;
        seen.add(t);
        if (!r.prompt?.imagePath) continue;
        out.push({
            wordId: r.wordId || null,
            word: r.prompt.text,
            imagePath: r.prompt.imagePath,
            audioClip: r.prompt.audioClip,
        });
    }
    return out;
};

const buildScene = (pool, target) => {
    // The scene MUST contain the target plus up to (SCENE_SIZE-1)
    // other distinct items. If the deck is too small, we let some
    // items repeat (kept rare via shuffle) so the scene still has
    // visual density.
    const others = pool.filter((p) => p.word !== target.word);
    const picks = shuffle(others).slice(0, SCENE_SIZE - 1);
    while (picks.length < SCENE_SIZE - 1 && pool.length > 0) {
        // pad with random repeats — better than a sparse scene
        picks.push(pool[picks.length % pool.length]);
    }
    const all = shuffle([target, ...picks]).map((it, idx) => ({
        ...it,
        tileId: `tile-${idx}-${hashStr(it.word + idx)}`,
        rot: ((hashStr(it.word + "rot" + idx) % 21) - 10), // -10..+10 deg
    }));
    return all;
};

const buildRounds = (pool) => {
    if (pool.length < 4) return [];
    // Each round picks a different target so the kid can't just
    // memorise one tile.
    const targets = shuffle(pool).slice(0, FINDS_PER_GAME);
    return targets.map((target, i) => ({
        roundId: `eh-${i}`,
        target,
        scene: buildScene(pool, target),
    }));
};

const EmojiHuntMode = ({ lesson, deck = [], onComplete }) => {
    const pool = useMemo(() => buildPool(deck), [deck]);
    const rounds = useMemo(() => buildRounds(pool), [pool]);

    const [roundIdx, setRoundIdx] = useState(0);
    const [results, setResults] = useState([]);
    const [wrongTiles, setWrongTiles] = useState(new Set());
    const [foundTile, setFoundTile] = useState(null);
    const audioRef = useRef(false);

    const round = rounds[roundIdx];

    // Reset between rounds. Auto-play the target word so the kid
    // hears what they're hunting for.
    useEffect(() => {
        if (!round) return;
        setWrongTiles(new Set());
        setFoundTile(null);
        audioRef.current = false;

        const t = setTimeout(() => {
            if (audioRef.current) return;
            audioRef.current = true;
            speakWord({
                wordId: round.target.wordId,
                label: round.target.word,
                audioClip: round.target.audioClip,
            });
        }, 350);
        return () => clearTimeout(t);
    }, [round?.roundId]);

    // When all rounds are done, finalise.
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
                <p className="text-gray-500 font-bold">Not enough vocabulary for a hunt yet.</p>
                <button
                    onClick={() => onComplete({ correct: 0, total: 1, rounds: [] })}
                    className="mt-4 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold"
                >
                    Skip
                </button>
            </div>
        );
    }
    if (!round) return null;

    const handleTileTap = (tile) => {
        if (foundTile) return;
        if (wrongTiles.has(tile.tileId)) return;
        playClick();

        if (tile.word === round.target.word) {
            setFoundTile(tile.tileId);
            playSuccess();
            setTimeout(() => playStarCollect(), 250);
            setResults((prev) => [
                ...prev,
                {
                    roundId: round.roundId,
                    correct: wrongTiles.size === 0,
                    wordId: round.target.wordId,
                    word: round.target.word,
                    style: "emoji-hunt",
                    wrongCount: wrongTiles.size,
                },
            ]);
            setTimeout(() => setRoundIdx((i) => i + 1), 1100);
        } else {
            playFail();
            setWrongTiles((prev) => {
                const out = new Set(prev);
                out.add(tile.tileId);
                return out;
            });
        }
    };

    const replayAudio = () => {
        playClick();
        speakWord({
            wordId: round.target.wordId,
            label: round.target.word,
            audioClip: round.target.audioClip,
        });
    };

    const totalRounds = rounds.length;
    const progressPct = Math.round((roundIdx / totalRounds) * 100);

    return (
        <div className="w-full max-w-2xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white px-4 py-2 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">🔭 Find &amp; Tap · Spot the picture</p>
                <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600">{roundIdx + 1}/{totalRounds}</span>
                </div>
            </div>

            {/* Target banner */}
            <div className="w-full max-w-xs bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg border-4 border-white px-4 py-3 flex items-center gap-3">
                <button
                    type="button"
                    onClick={replayAudio}
                    className="shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-lg text-white shadow"
                    aria-label="Hear the target again"
                >
                    🔊
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Find the</p>
                    <p
                        className="font-black text-white truncate uppercase tracking-tight"
                        style={{ fontSize: "clamp(1.1rem, 4.5vw, 1.6rem)" }}
                    >
                        {round.target.word}
                    </p>
                </div>
            </div>

            {/* Scene — 3×3 cluttered grid with playful rotations. */}
            <div className="w-full max-w-md rounded-3xl border-4 border-white bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-3 sm:p-4 shadow-md">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {round.scene.map((tile) => {
                        const isFound = foundTile === tile.tileId;
                        const isWrong = wrongTiles.has(tile.tileId);
                        return (
                            <button
                                key={tile.tileId}
                                type="button"
                                onClick={() => handleTileTap(tile)}
                                disabled={!!foundTile || isWrong}
                                className={[
                                    "relative aspect-square rounded-2xl border-4 flex items-center justify-center overflow-hidden bg-white shadow",
                                    "transition-all duration-200",
                                    isFound
                                        ? "scale-110 border-emerald-500 ring-4 ring-emerald-200 z-10"
                                        : isWrong
                                        ? "opacity-35 grayscale border-rose-300"
                                        : "border-white hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95 hover:shadow-lg cursor-pointer",
                                ].join(" ")}
                                style={{
                                    transform: isFound
                                        ? "scale(1.10)"
                                        : `rotate(${tile.rot}deg)`,
                                }}
                                aria-label={`Tile: ${tile.word}`}
                            >
                                <SmartImage
                                    src={tile.imagePath}
                                    label={tile.word}
                                    className="w-full h-full"
                                    imgClassName="w-full h-full object-contain p-1.5"
                                />
                                {isFound && (
                                    <>
                                        <span className="absolute -top-2 -right-2 z-20 bg-emerald-500 text-white w-7 h-7 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-sm animate-bounce">✓</span>
                                        <span className="eh-burst pointer-events-none" aria-hidden="true">
                                            <span className="eh-spark eh-spark-1">✨</span>
                                            <span className="eh-spark eh-spark-2">⭐</span>
                                            <span className="eh-spark eh-spark-3">✨</span>
                                            <span className="eh-spark eh-spark-4">⭐</span>
                                        </span>
                                    </>
                                )}
                                {isWrong && (
                                    <span className="absolute -top-2 -right-2 z-20 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md text-xs">✕</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="text-[10px] sm:text-xs font-bold text-gray-500 text-center">
                {foundTile
                    ? "You found it! 🎉"
                    : wrongTiles.size > 0
                    ? "Keep looking — listen again with the speaker."
                    : "Listen to the word, then tap the matching picture."}
            </p>

            <style>{`
                .eh-burst {
                    position: absolute;
                    inset: 0;
                    z-index: 25;
                }
                .eh-spark {
                    position: absolute;
                    top: 50%; left: 50%;
                    font-size: 18px;
                    will-change: transform, opacity;
                }
                .eh-spark-1 { animation: eh-spark-tl 700ms ease-out forwards; }
                .eh-spark-2 { animation: eh-spark-tr 700ms ease-out forwards; }
                .eh-spark-3 { animation: eh-spark-bl 700ms ease-out forwards; }
                .eh-spark-4 { animation: eh-spark-br 700ms ease-out forwards; }
                @keyframes eh-spark-tl { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%,-180%) scale(1.1); opacity: 0; } }
                @keyframes eh-spark-tr { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%,-180%) scale(1.1); opacity: 0; } }
                @keyframes eh-spark-bl { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-180%, 80%) scale(1.1); opacity: 0; } }
                @keyframes eh-spark-br { 0% { transform: translate(-50%,-50%) scale(0.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate( 80%, 80%) scale(1.1); opacity: 0; } }

                @media (prefers-reduced-motion: reduce) {
                    .eh-spark { animation: none !important; }
                }
            `}</style>
        </div>
    );
};

export default EmojiHuntMode;
