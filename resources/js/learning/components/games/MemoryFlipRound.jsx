import React, { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playCheer } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

/**
 * MemoryFlipRound — flip cards to match every image with its word.
 *
 * Data shape (style = "memory-flip"):
 *   round.pairs = [
 *     { pairId, wordId, word, imagePath, audioClip },
 *     ...  (3–4 pairs recommended)
 *   ]
 *
 * The component shuffles pairs × 2 (one image tile + one word tile
 * each) into one flat grid. Two taps reveal cards; matching pair
 * stays face-up; mismatch shakes and flips back.
 * All pairs matched → calls onComplete({ correct: true }).
 */

const CARD_COLORS = [
    "from-violet-100 to-purple-200",
    "from-blue-100   to-sky-200",
    "from-emerald-100 to-teal-200",
    "from-amber-100  to-yellow-200",
    "from-pink-100   to-rose-200",
    "from-cyan-100   to-blue-200",
    "from-orange-100 to-amber-200",
    "from-indigo-100 to-violet-200",
];

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function buildTiles(pairs) {
    if (!pairs?.length) return [];
    const tiles = [];
    pairs.forEach((p) => {
        tiles.push({ tileId: `img-${p.pairId}`, pairId: p.pairId, type: "image", ...p });
        tiles.push({ tileId: `wrd-${p.pairId}`, pairId: p.pairId, type: "word", ...p });
    });
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
}

const MemoryFlipRound = ({ round, onComplete }) => {
    const pairs = round?.pairs || [];

    const [tiles, setTiles] = useState(() => buildTiles(pairs));
    const [flipped, setFlipped] = useState([]); // tileIds face-up
    const [matched, setMatched] = useState([]); // pairIds matched
    const [shake, setShake] = useState([]); // tileIds shaking
    const [locked, setLocked] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setTiles(buildTiles(round?.pairs || []));
        setFlipped([]);
        setMatched([]);
        setShake([]);
        setLocked(false);
    }, [round?.roundId]);

    const handleFlip = useCallback(
        (tile) => {
            if (locked) return;
            if (flipped.includes(tile.tileId)) return;
            if (matched.includes(tile.pairId)) return;

            if (tile.type === "image" && tile.audioClip) {
                playAudio(tile.audioClip).catch(() => {});
            }

            const nextFlipped = [...flipped, tile.tileId];
            setFlipped(nextFlipped);
            if (nextFlipped.length < 2) return;

            setLocked(true);
            const [idA, idB] = nextFlipped;
            const tileA = tiles.find((t) => t.tileId === idA);
            const tileB = tiles.find((t) => t.tileId === idB);

            if (tileA.pairId === tileB.pairId && tileA.type !== tileB.type) {
                playSuccess();
                const nextMatched = [...matched, tileA.pairId];
                setTimeout(() => {
                    const el = containerRef.current;
                    if (el) {
                        const r = el.getBoundingClientRect();
                        launchStars(r.left + r.width / 2, r.top + r.height / 3, 5);
                    }
                    setMatched(nextMatched);
                    setFlipped([]);
                    setLocked(false);
                    if (nextMatched.length === pairs.length) {
                        playCheer();
                        setTimeout(() => onComplete?.({ correct: true, perfect: true }), 500);
                    }
                }, 700);
            } else {
                playFail();
                setShake([idA, idB]);
                setTimeout(() => {
                    setFlipped([]);
                    setShake([]);
                    setLocked(false);
                }, 900);
            }
        },
        [locked, flipped, matched, tiles, pairs.length, onComplete],
    );

    const totalPairs = pairs.length;
    const matchedCount = matched.length;
    const gridCols =
        tiles.length <= 4
            ? "grid-cols-2"
            : tiles.length <= 6
              ? "grid-cols-2 xs:grid-cols-3"
              : "grid-cols-2 xs:grid-cols-3 sm:grid-cols-4";

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-4">
            {/* Instruction */}
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 sm:text-xs">
                Match every picture to its word!
            </p>

            {/* Progress chips */}
            <div className="flex items-center gap-2">
                {Array.from({ length: totalPairs }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black transition-all duration-300 sm:h-7 sm:w-7 ${
                            i < matchedCount
                                ? "scale-110 border-emerald-400 bg-emerald-500 text-white shadow-md"
                                : "border-gray-200 bg-white text-gray-300"
                        }`}
                    >
                        {i < matchedCount ? "✓" : i + 1}
                    </div>
                ))}
            </div>

            {/* Card grid */}
            <div className={`grid ${gridCols} w-full max-w-xl gap-2 sm:gap-3`}>
                {tiles.map((tile) => {
                    const isFlipped =
                        flipped.includes(tile.tileId) || matched.includes(tile.pairId);
                    const isMatched = matched.includes(tile.pairId);
                    const isShaking = shake.includes(tile.tileId);
                    const colorCls = CARD_COLORS[hashStr(tile.word || "") % CARD_COLORS.length];

                    return (
                        <button
                            key={tile.tileId}
                            type="button"
                            disabled={isMatched || locked}
                            onClick={() => handleFlip(tile)}
                            className={[
                                "relative aspect-square overflow-hidden rounded-2xl",
                                "select-none border-2 transition-all duration-300",
                                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400",
                                isMatched
                                    ? "scale-[1.02] border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.22)]"
                                    : isFlipped
                                      ? "border-purple-400 shadow-[0_4px_16px_rgba(124,58,237,0.28)]"
                                      : "cursor-pointer border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(124,58,237,0.22)]",
                                isShaking ? "[animation:shake_0.5s_ease-in-out]" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            aria-label={isFlipped ? tile.word : "Mystery card — tap to reveal"}
                        >
                            {/* Back */}
                            <div
                                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 transition-opacity duration-300 ${isFlipped ? "pointer-events-none opacity-0" : "opacity-100"}`}
                                aria-hidden="true"
                            >
                                <span className="select-none text-3xl sm:text-4xl">❓</span>
                            </div>

                            {/* Front */}
                            <div
                                className={`absolute inset-0 transition-opacity duration-300 ${isFlipped ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            >
                                {tile.type === "image" ? (
                                    <SmartImage
                                        src={tile.imagePath}
                                        label={tile.word}
                                        className="h-full w-full"
                                        imgClassName="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <div
                                        className={`h-full w-full bg-gradient-to-br ${colorCls} flex items-center justify-center px-2`}
                                    >
                                        <span
                                            className="break-words text-center font-black uppercase tracking-wide text-[#1E293B]"
                                            style={{ fontSize: "clamp(0.7rem, 3.5vw, 1.1rem)" }}
                                        >
                                            {tile.word}
                                        </span>
                                    </div>
                                )}

                                {isMatched && (
                                    <div className="absolute inset-0 flex items-end justify-center bg-emerald-400/20 pb-1.5">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-black text-white shadow">
                                            ✓
                                        </span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <style>{`
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    20%     { transform: translateX(-7px); }
                    40%     { transform: translateX(7px); }
                    60%     { transform: translateX(-4px); }
                    80%     { transform: translateX(4px); }
                }
            `}</style>
        </div>
    );
};

export default MemoryFlipRound;
