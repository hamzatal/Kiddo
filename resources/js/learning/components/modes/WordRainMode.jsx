import React, { useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import {
    playClick,
    playSuccess,
    playFail,
    playPop,
    playStarCollect,
} from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * WordRainMode — "Catch the word!" arcade-style game.
 *
 * Why this game exists
 * ────────────────────
 * Operator request: "بدي العاب جديدة ومرتبة … الفرونت اند عصري جدا
 * وطفولي جدا وتحديدا بالالعاب". We needed a game that's playful,
 * arcade-y, and makes the kid LISTEN to vocabulary instead of just
 * reading it. Word Rain solves that:
 *   • The target word is announced repeatedly via audio.
 *   • Picture cards drift DOWN from the top of the play area like
 *     soft raindrops.
 *   • The kid taps every card that matches the target word as it
 *     falls. Each correct catch awards a quick pop + a tiny "+1".
 *   • Decoys also fall — tapping one costs a heart.
 *   • Every few seconds a new target is chosen, with audio.
 *
 * Game loop
 * ─────────
 *  • SESSION_DURATION ms total (default 60s).
 *  • Every TARGET_INTERVAL ms a new target word is selected and its
 *    audio plays — visible at the top in a "Now catch:" banner.
 *  • Cards spawn at SPAWN_INTERVAL ms intervals, randomly chosen
 *    from the pool (target + decoys), with the target weighted
 *    slightly higher so the kid gets enough chances to score.
 *  • Hearts start at 3. Hitting zero ends the game early.
 *  • At the end we report `correct = catches`, `total = catches +
 *    misses + decoy taps`, plus per-round detail for the parent
 *    dashboard's word_errors aggregator.
 */

const SESSION_DURATION = 60_000;
const TARGET_INTERVAL = 12_000;
const SPAWN_INTERVAL = 1_400;
const FALL_DURATION = 5_500; // ms a single card takes to drift across
const MAX_LIVE_CARDS = 6;
const HEARTS_TOTAL = 3;
const TARGET_WEIGHT = 2; // target appears 2x as often as a single decoy

let dropletId = 0;

const WordRainMode = ({ lesson, deck = [], onComplete }) => {
    // Build a flat pool of candidate words. The deck's prompt + all
    // the round options give us a varied pool with images and audio.
    const pool = useMemo(() => {
        const seen = new Map();
        for (const r of deck || []) {
            const t = r?.prompt;
            if (t?.text && !seen.has(t.text.toLowerCase())) {
                seen.set(t.text.toLowerCase(), {
                    word: t.text,
                    imagePath: t.imagePath,
                    audioClip: t.audioClip,
                    wordId: r.wordId || null,
                });
            }
            for (const o of r?.options || []) {
                if (o?.word && !seen.has(o.word.toLowerCase())) {
                    seen.set(o.word.toLowerCase(), {
                        word: o.word,
                        imagePath: o.imagePath,
                        audioClip: o.audioClip,
                        wordId: o.wordId || null,
                    });
                }
            }
        }
        return Array.from(seen.values());
    }, [deck]);

    const [target, setTarget] = useState(null);
    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [hearts, setHearts] = useState(HEARTS_TOTAL);
    const [drops, setDrops] = useState([]); // [{ id, word, imagePath, audioClip, wordId, isTarget, lane, spawnedAt }]
    const [phase, setPhase] = useState("ready"); // ready | playing | done
    const [tickFlash, setTickFlash] = useState(null); // {id, x, y, label}

    const startTime = useRef(0);
    const detail = useRef([]);

    // Pick a fresh target. Avoid repeating the immediately-previous one.
    const pickTarget = (prev) => {
        if (!pool.length) return null;
        if (pool.length === 1) return pool[0];
        let next;
        let safety = 8;
        do {
            next = pool[Math.floor(Math.random() * pool.length)];
            safety--;
        } while (prev && next.word === prev.word && safety > 0);
        return next;
    };

    /* Start the session — sets the first target and kicks off the
       three timers (target rotation, card spawning, end-of-game). */
    useEffect(() => {
        if (!pool.length) return;
        startTime.current = Date.now();
        const first = pickTarget(null);
        setTarget(first);
        setPhase("playing");
        if (first?.audioClip) {
            // Tiny delay so the first audio doesn't cut into the
            // page-transition animation.
            setTimeout(() => playAudio(first.audioClip), 350);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Target rotation.
    useEffect(() => {
        if (phase !== "playing") return;
        const interval = setInterval(() => {
            setTarget((prev) => {
                const next = pickTarget(prev);
                if (next?.audioClip) playAudio(next.audioClip);
                return next;
            });
        }, TARGET_INTERVAL);
        return () => clearInterval(interval);
    }, [phase, pool]);

    // Card spawning.
    useEffect(() => {
        if (phase !== "playing" || !pool.length) return;
        const interval = setInterval(() => {
            setDrops((current) => {
                if (current.length >= MAX_LIVE_CARDS) return current;
                // Weighted pick: target first, then anything else.
                const wantTarget =
                    target && Math.random() < TARGET_WEIGHT / (TARGET_WEIGHT + pool.length - 1);
                const choice = wantTarget
                    ? target
                    : pool[Math.floor(Math.random() * pool.length)];
                if (!choice) return current;
                dropletId += 1;
                const lane = 4 + Math.floor(Math.random() * 86); // 4–90% from left
                return [
                    ...current,
                    {
                        id: `drop-${dropletId}`,
                        ...choice,
                        isTarget: target && choice.word === target.word,
                        lane,
                        spawnedAt: Date.now(),
                    },
                ];
            });
        }, SPAWN_INTERVAL);
        return () => clearInterval(interval);
    }, [phase, pool, target]);

    // End-of-game timer.
    useEffect(() => {
        if (phase !== "playing") return;
        const t = setTimeout(() => endGame(), SESSION_DURATION);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // End early when hearts hit zero.
    useEffect(() => {
        if (phase !== "playing") return;
        if (hearts <= 0) endGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hearts, phase]);

    function endGame() {
        setPhase("done");
        const total = score + misses;
        onComplete({
            correct: score,
            total: Math.max(1, total),
            rounds: detail.current,
        });
    }

    function flash(label, x, y, kind = "good") {
        const id = `flash-${dropletId++}`;
        setTickFlash({ id, label, x, y, kind });
        setTimeout(() => setTickFlash(null), 700);
    }

    const handleDropClick = (drop, e) => {
        if (phase !== "playing") return;
        playClick();
        const rect = e.currentTarget.getBoundingClientRect();
        // Convert to play-area-relative coordinates.
        const stage = e.currentTarget.closest(".wr-stage");
        const stageRect = stage?.getBoundingClientRect();
        const x = stageRect ? rect.left - stageRect.left + rect.width / 2 : 0;
        const y = stageRect ? rect.top - stageRect.top + rect.height / 2 : 0;

        if (drop.isTarget) {
            playSuccess();
            playPop();
            playStarCollect();
            setScore((s) => s + 1);
            detail.current.push({
                roundId: drop.id,
                correct: true,
                wordId: drop.wordId || null,
                word: drop.word,
                style: "word-rain",
                timeMs: Date.now() - drop.spawnedAt,
            });
            flash("+1", x, y, "good");
        } else {
            playFail();
            setHearts((h) => Math.max(0, h - 1));
            setMisses((m) => m + 1);
            detail.current.push({
                roundId: drop.id,
                correct: false,
                wordId: drop.wordId || null,
                word: drop.word,
                style: "word-rain",
                timeMs: Date.now() - drop.spawnedAt,
                wrongChoice: drop.word,
            });
            flash("-1 ❤️", x, y, "bad");
        }

        // Remove the tapped card immediately.
        setDrops((current) => current.filter((d) => d.id !== drop.id));
    };

    const handleAnimEnd = (drop) => {
        // Card fell off the bottom — only counts as a miss for the TARGET
        // word. Decoys falling off-screen don't penalise the kid (we
        // wouldn't expect them to chase decoys anyway).
        if (drop.isTarget) {
            setMisses((m) => m + 1);
            detail.current.push({
                roundId: drop.id,
                correct: false,
                wordId: drop.wordId || null,
                word: drop.word,
                style: "word-rain",
                timeMs: FALL_DURATION,
            });
        }
        setDrops((current) => current.filter((d) => d.id !== drop.id));
    };

    if (!pool.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">🌧</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No words to rain yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Word Rain needs a few words to fall — your teacher hasn't added them yet.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl font-black shadow-md"
                >
                    Continue →
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header — target prompt, score, hearts. */}
            <div className="w-full max-w-md kiddo-surface rounded-2xl shadow-lg border border-white px-3 py-2 flex items-center gap-3">
                <button
                    onClick={() => target?.audioClip && playAudio(target.audioClip)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-lg shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
                    aria-label="Hear target word"
                >
                    🔊
                </button>
                <div className="flex-1 min-w-0 text-center">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        Catch the
                    </p>
                    <p className="text-base sm:text-lg font-black text-[#1E293B] uppercase tracking-tight truncate">
                        {target?.word || "..."}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((h) => (
                            <span
                                key={h}
                                className={`text-sm ${
                                    h <= hearts ? "" : "grayscale opacity-30"
                                }`}
                            >
                                ❤️
                            </span>
                        ))}
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                        Score: {score}
                    </span>
                </div>
            </div>

            {/* Play area — fixed height so cards always have a place
                to fall through, regardless of viewport. */}
            <div className="wr-stage relative w-full max-w-3xl h-[24rem] sm:h-[28rem] lg:h-[32rem] rounded-3xl bg-gradient-to-b from-sky-50 via-white to-purple-50 border-2 border-white shadow-inner overflow-hidden">
                {/* Cloud + sun decorations to sell the "rain" theme. */}
                <span className="absolute top-2 left-3 text-3xl opacity-60">☁️</span>
                <span className="absolute top-3 right-4 text-3xl opacity-60">🌤</span>

                {drops.map((drop) => (
                    <button
                        key={drop.id}
                        type="button"
                        onClick={(e) => handleDropClick(drop, e)}
                        onAnimationEnd={() => handleAnimEnd(drop)}
                        className="wr-drop absolute w-[22%] sm:w-[18%] aspect-square"
                        style={{
                            left: `${drop.lane}%`,
                            animationDuration: `${FALL_DURATION}ms`,
                        }}
                        aria-label={`Card showing ${drop.word}`}
                    >
                        <span className="absolute inset-0 rounded-full bg-white border-4 border-purple-200 shadow-xl flex flex-col items-center justify-center p-1.5 overflow-hidden hover:border-purple-400 transition-colors">
                            <SmartImage
                                src={drop.imagePath}
                                label={drop.word}
                                className="w-full h-[70%]"
                                imgClassName="w-full h-full object-contain drop-shadow"
                            />
                            <span className="text-[10px] sm:text-xs font-black uppercase text-[#1E293B] truncate max-w-full px-1 mt-0.5">
                                {drop.word}
                            </span>
                        </span>
                    </button>
                ))}

                {/* Floating "+1 / -❤️" feedback bubble — quick, then gone. */}
                {tickFlash ? (
                    <span
                        key={tickFlash.id}
                        className={`absolute pointer-events-none font-black text-lg sm:text-xl ${
                            tickFlash.kind === "good"
                                ? "text-emerald-600"
                                : "text-rose-500"
                        } wr-flash`}
                        style={{ left: tickFlash.x, top: tickFlash.y }}
                    >
                        {tickFlash.label}
                    </span>
                ) : null}

                {phase === "done" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <p className="text-base font-black text-purple-600 uppercase tracking-widest">
                            🌟 Round complete — saving your stars!
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Footer hint — visible only during play. */}
            {phase === "playing" ? (
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Tap only the card that matches the word above
                </p>
            ) : null}

            <style>{`
                @keyframes wr-fall {
                    0%   { transform: translateY(-25%) scale(0.7) rotate(-3deg); opacity: 0; }
                    8%   { opacity: 1; }
                    100% { transform: translateY(110%) scale(1) rotate(3deg); opacity: 0; }
                }
                .wr-drop {
                    border: none;
                    background: transparent;
                    padding: 0;
                    top: 0;
                    transform: translateY(-25%);
                    animation-name: wr-fall;
                    animation-timing-function: cubic-bezier(0.4, 0.0, 0.6, 1);
                    animation-fill-mode: forwards;
                    cursor: pointer;
                    transition: transform 200ms ease;
                    will-change: transform;
                }
                .wr-drop:hover { transform: scale(1.06); }
                @keyframes wr-flash-kf {
                    0%   { opacity: 0; transform: translate(-50%, 0) scale(0.7); }
                    25%  { opacity: 1; transform: translate(-50%, -8px) scale(1.1); }
                    100% { opacity: 0; transform: translate(-50%, -36px) scale(0.95); }
                }
                .wr-flash {
                    transform: translate(-50%, -50%);
                    animation: wr-flash-kf 700ms ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WordRainMode;
