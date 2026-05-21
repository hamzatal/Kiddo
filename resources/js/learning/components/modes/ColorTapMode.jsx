import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    playClick,
    playSuccess,
    playFail,
    playPop,
    playStarCollect,
} from "@/learning/utils/soundEffects";
import { playAudio, speakText } from "@/learning/utils/playAudio";

/**
 * ColorTapMode — "Tap the colour you hear, fast!" reaction game.
 *
 * Why this game exists
 * ────────────────────
 * Operator wanted "ألعاب جديدة … عصرية وطفولية". This is a pure-fun
 * reflex game that doubles as colour-vocabulary drill. The kid sees
 * a 2x3 grid of brightly-painted tiles (red / blue / green / yellow
 * / orange / purple). A voice calls out a colour ("blue!") and the
 * kid has to tap the matching tile before the round timer expires.
 *
 * Why it works for first-graders
 * ──────────────────────────────
 * • No reading required — the call-out is pure audio.
 * • The colours are large, vibrant, and well-spaced so a misclick
 *   is the kid's intent, not a UI mistake.
 * • Each round has a generous 4-second timer with a thinning ring
 *   around the active tile so the kid sees pressure but doesn't
 *   freeze. Wrong answers cost a heart, time-outs do not.
 * • Visual + audio confirmation on success: the tapped tile pops
 *   with a success chime + a star sparkle.
 *
 * It does not depend on the deck — it builds its own colour set so
 * even a brand-new unit with no vocab can run this game.
 */
const COLOR_PALETTE = [
    { key: "red",    label: "Red",    hex: "#EF4444", textOn: "#FFFFFF" },
    { key: "blue",   label: "Blue",   hex: "#3B82F6", textOn: "#FFFFFF" },
    { key: "green",  label: "Green",  hex: "#10B981", textOn: "#FFFFFF" },
    { key: "yellow", label: "Yellow", hex: "#FACC15", textOn: "#1E293B" },
    { key: "orange", label: "Orange", hex: "#F97316", textOn: "#FFFFFF" },
    { key: "purple", label: "Purple", hex: "#A855F7", textOn: "#FFFFFF" },
];

const ROUNDS_PER_GAME = 8;
const ROUND_DURATION = 4_000; // ms — generous reaction window
const HEARTS_TOTAL = 3;

/**
 * Try to find the audio clip from the deck that matches a given
 * colour name, so we play the curriculum-quality recording first
 * and fall back to browser TTS only when we have to.
 */
function findColourClip(deck, colourKey) {
    if (!deck?.length) return null;
    for (const r of deck) {
        const target = r?.prompt;
        if (target?.text?.toLowerCase() === colourKey) return target.audioClip;
        for (const o of r?.options || []) {
            if (o?.word?.toLowerCase() === colourKey) return o.audioClip;
        }
    }
    return null;
}

const ColorTapMode = ({ lesson, deck = [], onComplete }) => {
    const [idx, setIdx] = useState(0);
    const [target, setTarget] = useState(null);
    const [phase, setPhase] = useState("ready"); // ready | play | feedback | done
    const [picked, setPicked] = useState(null);
    const [hearts, setHearts] = useState(HEARTS_TOTAL);
    const [results, setResults] = useState([]);
    const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
    const startedAtRef = useRef(0);
    const tickerRef = useRef(null);

    // Cache colour audio clips up-front so each round just plays them.
    const colourClips = useMemo(() => {
        const map = {};
        for (const c of COLOR_PALETTE) {
            map[c.key] = findColourClip(deck, c.key) || null;
        }
        return map;
    }, [deck]);

    // Build the round sequence once. Avoid same target twice in a row.
    const sequence = useMemo(() => {
        const arr = [];
        let prev = null;
        for (let i = 0; i < ROUNDS_PER_GAME; i++) {
            let pick;
            let safety = 8;
            do {
                pick = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
                safety--;
            } while (prev && pick.key === prev.key && safety > 0);
            arr.push(pick);
            prev = pick;
        }
        return arr;
    }, []);

    // Start a new round — set the target, play its audio, start the timer.
    useEffect(() => {
        if (phase === "done") return;
        if (idx >= sequence.length) {
            // Defer the onComplete to break out of the render cycle.
            setPhase("done");
            const correct = results.filter((r) => r.correct).length;
            setTimeout(() => {
                onComplete({
                    correct,
                    total: sequence.length,
                    rounds: results,
                });
            }, 50);
            return;
        }
        const next = sequence[idx];
        setTarget(next);
        setPicked(null);
        setTimeLeft(ROUND_DURATION);
        startedAtRef.current = Date.now();
        setPhase("ready");
        // Tiny 350ms warm-up so the kid sees the tile state before audio plays.
        const warmup = setTimeout(() => {
            const clip = colourClips[next.key];
            if (clip) playAudio(clip);
            else speakText(next.label);
            setPhase("play");
            // Timer ticks every 100ms for a smooth shrinking ring.
            tickerRef.current = setInterval(() => {
                setTimeLeft((t) => {
                    const newT = t - 100;
                    if (newT <= 0) {
                        clearInterval(tickerRef.current);
                        // Time-out — record a miss but don't drop a heart.
                        setResults((curr) => [
                            ...curr,
                            {
                                roundId: `ct-${idx}`,
                                correct: false,
                                style: "color-tap",
                                word: next.label,
                                wrongChoice: null,
                                timeMs: ROUND_DURATION,
                            },
                        ]);
                        playFail();
                        setPhase("feedback");
                        setTimeout(() => setIdx(idx + 1), 700);
                        return 0;
                    }
                    return newT;
                });
            }, 100);
        }, 350);
        return () => {
            clearTimeout(warmup);
            if (tickerRef.current) clearInterval(tickerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idx]);

    // End early when hearts hit zero.
    useEffect(() => {
        if (phase === "done") return;
        if (hearts <= 0) {
            setPhase("done");
            const correct = results.filter((r) => r.correct).length;
            setTimeout(() => {
                onComplete({
                    correct,
                    total: Math.max(1, results.length),
                    rounds: results,
                });
            }, 50);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hearts]);

    const handleTap = (colour) => {
        if (phase !== "play" || picked) return;
        playClick();
        if (tickerRef.current) clearInterval(tickerRef.current);
        const elapsed = Date.now() - startedAtRef.current;

        if (colour.key === target.key) {
            setPicked(colour.key);
            playSuccess();
            playPop();
            playStarCollect();
            setResults((curr) => [
                ...curr,
                {
                    roundId: `ct-${idx}`,
                    correct: true,
                    style: "color-tap",
                    word: target.label,
                    timeMs: elapsed,
                },
            ]);
            setPhase("feedback");
            setTimeout(() => setIdx(idx + 1), 600);
        } else {
            setPicked(colour.key);
            playFail();
            setHearts((h) => Math.max(0, h - 1));
            setResults((curr) => [
                ...curr,
                {
                    roundId: `ct-${idx}`,
                    correct: false,
                    style: "color-tap",
                    word: target.label,
                    wrongChoice: colour.label,
                    timeMs: elapsed,
                },
            ]);
            setPhase("feedback");
            setTimeout(() => setIdx(idx + 1), 800);
        }
    };

    const correctCount = results.filter((r) => r.correct).length;
    const ringPct = Math.max(0, Math.min(100, (timeLeft / ROUND_DURATION) * 100));

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-4 animate-fade-in-up px-2">
            {/* Header */}
            <div className="w-full max-w-md kiddo-surface rounded-2xl shadow-lg border border-white px-4 py-2.5 flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (target) {
                            const clip = colourClips[target.key];
                            if (clip) playAudio(clip);
                            else speakText(target.label);
                        }
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white text-lg shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0"
                    aria-label="Hear the colour"
                >
                    🔊
                </button>
                <div className="flex-1 min-w-0 text-center">
                    <p className="text-[9px] font-black text-fuchsia-500 uppercase tracking-widest">
                        Tap the colour
                    </p>
                    <p
                        className="text-lg sm:text-2xl font-black uppercase tracking-tight"
                        style={{ color: target?.hex || "#1E293B" }}
                    >
                        {target?.label || "..."}
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
                        {correctCount}/{sequence.length}
                    </span>
                </div>
            </div>

            {/* Time-left ring — under the prompt so the kid sees a
                clear "how much time you have left" without it
                covering up the colour tiles. */}
            <div className="w-44 h-1.5 bg-white rounded-full overflow-hidden shadow-inner border border-gray-100">
                <div
                    className="h-full transition-all duration-100 ease-linear rounded-full"
                    style={{
                        width: `${ringPct}%`,
                        background: target
                            ? `linear-gradient(90deg, ${target.hex}, ${target.hex}cc)`
                            : "#9333EA",
                    }}
                />
            </div>

            {/* 2×3 colour grid — equal-size huge buttons. */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
                {COLOR_PALETTE.map((c) => {
                    const isPicked = picked === c.key;
                    const isCorrect =
                        phase === "feedback" && picked === c.key && c.key === target?.key;
                    const isWrong =
                        phase === "feedback" && picked === c.key && c.key !== target?.key;
                    return (
                        <button
                            key={c.key}
                            type="button"
                            disabled={phase !== "play" || isPicked}
                            onClick={() => handleTap(c)}
                            className={`relative aspect-square rounded-3xl shadow-xl border-4 border-white flex items-center justify-center font-black uppercase text-sm sm:text-base lg:text-lg transition-all duration-200 ${
                                isCorrect
                                    ? "ring-4 ring-emerald-300 scale-105"
                                    : isWrong
                                    ? "ring-4 ring-rose-300 opacity-70 grayscale"
                                    : phase === "play"
                                    ? "hover:scale-105 active:scale-95 cursor-pointer"
                                    : "opacity-90"
                            }`}
                            style={{ backgroundColor: c.hex, color: c.textOn }}
                            aria-label={`Tap if the colour is ${c.label}`}
                        >
                            <span className="drop-shadow">{c.label}</span>

                            {isCorrect ? (
                                <span className="absolute -top-2 -right-2 bg-white text-emerald-500 w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-md border-2 border-emerald-200">
                                    ✓
                                </span>
                            ) : null}
                            {isWrong ? (
                                <span className="absolute -top-2 -right-2 bg-white text-rose-500 w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-md border-2 border-rose-200">
                                    ✕
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ColorTapMode;
