import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick, playPop } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

/**
 * BalloonPopRound v3 — bigger, prettier, more realistic.
 *
 * Operator complaint (May 2026, wave 5):
 *   "شكل البالونات جدا غبي ومش حلو ومش منطقي ... لازم يكون اكبر
 *    شوي ... لو كان في انيميشن افضل للبالونات بكون كمان واقعي
 *    اكثر واحلى من هيك"
 *
 *  Translation:
 *    • The previous balloons looked silly / not "balloon-y enough".
 *    • Cards inside (image + word) didn't fit comfortably.
 *    • Animations felt mechanical, not floaty / lifelike.
 *    • Bigger overall + more polish.
 *
 * What changed
 * ────────────
 *   • Real balloon SHAPE: I now draw an SVG balloon (round body
 *     with a knot tail) and use it as a coloured backdrop. The
 *     whole balloon scales naturally instead of being a rounded
 *     rectangle. The string is now a soft hand-drawn curve, not
 *     a 1px straight line.
 *   • Bigger by ~50%: balloon size is now clamp(110px, 24vw, 160px)
 *     (was 68-96px). Image inside grows to clamp(40px, 9vw, 60px)
 *     so the picture is finally readable.
 *   • Two-axis floating animation: balloons bob up/down AND drift
 *     side-to-side on independent timings, with a gentle rotation
 *     on the string anchor. This is what makes them feel like
 *     they're actually floating in air rather than rocking on a
 *     hinge.
 *   • Pop animation rebuilt: a 3-frame sequence — squash, burst
 *     into 8 colourful confetti shards, then fade. Way more
 *     satisfying than the old "scale up + opacity 0".
 *   • The arena box is taller (240px → 360px) AND has a soft
 *     gradient sky background with a faint sun + cloud emoji in
 *     the corners so the whole scene reads as an outdoor balloon
 *     festival rather than just "buttons on a page".
 *   • Better label legibility: a translucent dark band at the
 *     bottom of the balloon body holds the word, so even on
 *     light-colour balloons (yellow / pink) the white text stays
 *     readable.
 */

const PALETTE = [
    { from: "#fb7185", to: "#e11d48", shadow: "rgba(225,29,72,0.5)",   confetti: ["#fda4af","#fb7185","#e11d48"] },
    { from: "#a78bfa", to: "#6d28d9", shadow: "rgba(109,40,217,0.5)",   confetti: ["#c4b5fd","#a78bfa","#6d28d9"] },
    { from: "#38bdf8", to: "#0369a1", shadow: "rgba(3,105,161,0.5)",    confetti: ["#7dd3fc","#38bdf8","#0369a1"] },
    { from: "#34d399", to: "#047857", shadow: "rgba(4,120,87,0.5)",     confetti: ["#6ee7b7","#34d399","#047857"] },
    { from: "#fbbf24", to: "#b45309", shadow: "rgba(180,83,9,0.5)",     confetti: ["#fcd34d","#fbbf24","#b45309"] },
    { from: "#f472b6", to: "#be185d", shadow: "rgba(190,24,93,0.5)",    confetti: ["#f9a8d4","#f472b6","#be185d"] },
];

function hashStr(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

/** Deterministic 0-1 number from an id + a label (used to vary
 *  per-balloon timings without re-randomising on every render). */
function rng(id, seed) {
    return (hashStr(String(id) + seed) % 1000) / 1000;
}

/**
 * Inline SVG balloon — drawn here once and used as the visual base
 * for every balloon. Two stops in the radial gradient give the
 * highlight, the knot is a tiny triangle at the bottom of the body.
 */
function BalloonShape({ from, to, balloonId }) {
    // Unique gradient ID per balloon so multiple balloons don't
    // share the same `<defs>` reference (would cause one balloon's
    // gradient to override another's in some browsers).
    const gid = `bg-${balloonId}`;
    const hid = `bh-${balloonId}`;
    return (
        <svg
            viewBox="0 0 100 130"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full h-full"
            aria-hidden="true"
        >
            <defs>
                <radialGradient id={gid} cx="35%" cy="30%" r="70%">
                    <stop offset="0%"   stopColor={from} stopOpacity="1"  />
                    <stop offset="100%" stopColor={to}   stopOpacity="1"  />
                </radialGradient>
                <radialGradient id={hid} cx="30%" cy="25%" r="20%">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
                </radialGradient>
            </defs>

            {/* Body — egg-shaped ellipse */}
            <ellipse cx="50" cy="48" rx="38" ry="44" fill={`url(#${gid})`} />
            {/* Highlight glare */}
            <ellipse cx="38" cy="34" rx="14" ry="10" fill={`url(#${hid})`} />
            {/* Knot — tiny triangle at the bottom of the body */}
            <path d="M44 90 L56 90 L52 100 L48 100 Z" fill={to} />
            {/* String — gentle curve from the knot down */}
            <path
                d="M50 100 C 47 110, 53 116, 50 128"
                stroke="rgba(75,85,99,0.65)"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
            />
        </svg>
    );
}

const BalloonPopRound = ({ round, onPick, correctId, wrong, disabled }) => {
    const prompt = round?.prompt;
    const options = round?.options || [];

    const [popped, setPopped] = useState({});
    const containerRef = useRef(null);

    useEffect(() => {
        setPopped({});
        if (prompt?.audioClip) {
            const t = setTimeout(() => playAudio(prompt.audioClip), 350);
            return () => clearTimeout(t);
        }
    }, [round?.roundId]);

    /** Per-balloon layout — computed ONCE per round so a re-render
     *  doesn't shuffle balloons under the kid's finger. */
    const layout = useMemo(() => {
        return options.map((opt, idx) => {
            // Spread balloons evenly across the width with a tiny
            // jitter so they don't look perfectly grid-aligned.
            const slot = options.length > 1 ? idx / (options.length - 1) : 0.5;
            const baseX = 6 + slot * 78 + rng(opt.id, "x") * 6;
            const baseY = 18 + rng(opt.id, "y") * 30;
            // Dual-axis float — each balloon drifts on its own
            // timer so the cluster never moves in lockstep.
            const ampY = 14 + rng(opt.id, "ay") * 14; // px up-down
            const ampX = 8  + rng(opt.id, "ax") * 10; // px left-right
            const durY = 4.5 + rng(opt.id, "dy") * 2.5;
            const durX = 5.5 + rng(opt.id, "dx") * 3.0;
            const delayY = -rng(opt.id, "ly") * durY;
            const delayX = -rng(opt.id, "lx") * durX;
            return { baseX, baseY, ampY, ampX, durY, durX, delayY, delayX };
        });
    }, [round?.roundId, options.length]);

    const handlePop = useCallback(
        (opt, idx) => {
            if (disabled || popped[opt.id]) return;
            playClick();
            playPop();
            setPopped((p) => ({ ...p, [opt.id]: true }));
            if (opt.isCorrect) {
                playSuccess();
                const el = containerRef.current;
                if (el) {
                    const r = el.getBoundingClientRect();
                    launchStars(r.left + r.width / 2, r.top + r.height / 2.5, 8);
                }
            } else {
                playFail();
            }
            // Slightly longer hold (350ms vs 220ms) — gives the
            // confetti burst time to register before the next round
            // paints.
            setTimeout(() => onPick?.(opt), 350);
        },
        [disabled, popped, onPick],
    );

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-4">
            {/* Prompt panel */}
            <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:px-8 sm:py-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 sm:text-[10px]">
                    Pop the right balloon!
                </p>
                {prompt?.text && (
                    <h2
                        className="text-center font-black text-gray-800"
                        style={{ fontSize: "clamp(1.25rem, 5vw, 2rem)" }}
                    >
                        {prompt.text}
                    </h2>
                )}
                {prompt?.audioClip && (
                    <button
                        type="button"
                        onClick={() => playAudio(prompt.audioClip)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-lg text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                        aria-label="Listen again"
                    >
                        🔊
                    </button>
                )}
            </div>

            {/* Sky / arena — taller now and dressed up like an
                outdoor scene. The soft gradient + sun emoji + cloud
                emojis turn the empty rectangle into "a sky" so the
                balloons read as floating, not as buttons on a page. */}
            <div
                className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 shadow-inner"
                style={{
                    height: "clamp(260px, 50vw, 380px)",
                    background:
                        "linear-gradient(to bottom, #DBEAFE 0%, #EFF6FF 60%, #FEF9C3 100%)",
                }}
            >
                {/* Sky decorations — sun + clouds — purely visual,
                    pointer-events: none so they never block taps. */}
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-3 text-3xl drop-shadow-sm sm:text-4xl">
                    ☀️
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute left-6 top-12 text-2xl opacity-70 drop-shadow sm:text-3xl">
                    ☁️
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute right-12 bottom-12 text-2xl opacity-60 drop-shadow sm:text-3xl">
                    ☁️
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute left-4 bottom-2 text-2xl opacity-80">
                    🌳
                </span>
                <span aria-hidden="true" className="pointer-events-none absolute right-2 bottom-2 text-2xl opacity-80">
                    🌳
                </span>

                {/* Balloons */}
                {options.map((opt, idx) => {
                    const pal = PALETTE[idx % PALETTE.length];
                    const lay = layout[idx];
                    if (!lay) return null;
                    const isPopped = popped[opt.id];
                    const isCorrect = correctId === opt.id;
                    const isWrong = wrong?.includes(opt.id);
                    const balloonSize = "clamp(108px, 24vw, 156px)";
                    const balloonId = `${round?.roundId || "r"}-${idx}`;

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            disabled={isPopped || disabled}
                            onClick={() => handlePop(opt, idx)}
                            className="absolute select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 cursor-pointer"
                            style={{
                                left: `${lay.baseX}%`,
                                top: `${lay.baseY}%`,
                                width: balloonSize,
                                // Two CSS variables drive the dual-axis
                                // float animation defined in the
                                // <style> block below.
                                "--bf-amp-y": `${lay.ampY}px`,
                                "--bf-amp-x": `${lay.ampX}px`,
                            }}
                            aria-label={`Pop balloon: ${opt.word}`}
                        >
                            <div
                                className={[
                                    "relative w-full",
                                    isPopped ? "balloon-pop" : "balloon-float",
                                ].join(" ")}
                                style={{
                                    aspectRatio: "10/13",
                                    animationDelay: `${lay.delayY}s, ${lay.delayX}s`,
                                    animationDuration: `${lay.durY}s, ${lay.durX}s`,
                                }}
                            >
                                {/* Balloon shape (SVG) sits in the
                                    background so the image + word
                                    overlay can be vector-aligned. */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        filter: `drop-shadow(0 8px 14px ${pal.shadow})`,
                                        outline: isCorrect ? "3px solid white" : undefined,
                                        outlineOffset: isCorrect ? "3px" : undefined,
                                        borderRadius: "50%",
                                    }}
                                >
                                    <BalloonShape
                                        from={pal.from}
                                        to={pal.to}
                                        balloonId={balloonId}
                                    />
                                </div>

                                {/* Image — sits in the upper part of
                                    the balloon body where the rounded
                                    egg shape gives the most space. */}
                                {opt.imagePath && (
                                    <div
                                        className="absolute left-1/2 top-[24%] -translate-x-1/2 overflow-hidden rounded-full bg-white/40 ring-2 ring-white/60"
                                        style={{
                                            width: "clamp(40px, 9.5vw, 60px)",
                                            height: "clamp(40px, 9.5vw, 60px)",
                                        }}
                                    >
                                        <SmartImage
                                            src={opt.imagePath}
                                            label={opt.word}
                                            className="h-full w-full"
                                            imgClassName="w-full h-full object-contain p-1"
                                        />
                                    </div>
                                )}

                                {/* Word ribbon — translucent dark band
                                    so the white text always reads,
                                    even on yellow / pink balloons. */}
                                <div
                                    className="absolute left-1/2 top-[63%] flex w-[78%] -translate-x-1/2 items-center justify-center rounded-full bg-black/30 px-1.5 py-0.5 backdrop-blur-[1px]"
                                >
                                    <span
                                        className="block w-full break-words text-center font-black uppercase leading-tight tracking-wide text-white"
                                        style={{
                                            fontSize: "clamp(0.6rem, 2.2vw, 0.95rem)",
                                            textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                        }}
                                    >
                                        {opt.word}
                                    </span>
                                </div>

                                {/* Confetti shards — only shown during
                                    the pop animation. Eight tiny
                                    coloured rectangles burst outward. */}
                                {isPopped && (
                                    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <span
                                                key={i}
                                                className="balloon-confetti"
                                                // We set --r inline so the
                                                // animation can use it as the
                                                // rotation origin in
                                                // @keyframes balloonConfetti.
                                                // Eight shards = one shard
                                                // every 45° around the burst.
                                                style={{
                                                    left: "50%",
                                                    top: "40%",
                                                    backgroundColor:
                                                        pal.confetti[i % pal.confetti.length],
                                                    "--r": `${i * 45}deg`,
                                                    animationDelay: `${i * 25}ms`,
                                                }}
                                            />
                                        ))}
                                    </span>
                                )}
                            </div>

                            {/* Status pip — outside the floating
                                wrapper so it doesn't drift along
                                with the balloon. */}
                            {isCorrect && !isPopped && (
                                <div className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[11px] font-black text-white shadow">
                                    ✓
                                </div>
                            )}
                            {isWrong && !isPopped && (
                                <div className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[11px] font-black text-white shadow">
                                    ✕
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <style>{`
                /* Dual-axis float — Y bob + X drift on independent
                   timings so balloons never move in lockstep. */
                .balloon-float {
                    animation-name: balloonFloatY, balloonFloatX;
                    animation-iteration-count: infinite;
                    animation-direction: alternate;
                    animation-timing-function: ease-in-out;
                }
                @keyframes balloonFloatY {
                    0%   { transform: translateY(0)   rotate(-2deg); }
                    100% { transform: translateY(calc(-1 * var(--bf-amp-y, 14px))) rotate(2deg); }
                }
                @keyframes balloonFloatX {
                    0%   { margin-left: 0; }
                    100% { margin-left: calc(-1 * var(--bf-amp-x, 8px)); }
                }

                /* Pop = squash → fade. Confetti spans handle the
                   actual "burst outward" effect on top of this. */
                .balloon-pop {
                    animation: balloonPop 380ms cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
                }
                @keyframes balloonPop {
                    0%   { transform: scale(1)   rotate(0deg); opacity: 1; }
                    25%  { transform: scale(1.18) rotate(-6deg); opacity: 1; }
                    55%  { transform: scale(0.55) rotate( 4deg); opacity: 0.7; }
                    100% { transform: scale(0)   rotate(0deg); opacity: 0; }
                }

                /* Confetti shards — eight little rectangles arranged
                   around a circle that fly outward as the balloon
                   pops. Each shard has its own rotation set inline. */
                .balloon-confetti {
                    position: absolute;
                    width: 8px;
                    height: 12px;
                    border-radius: 2px;
                    transform-origin: center bottom;
                    animation: balloonConfetti 600ms ease-out forwards;
                    will-change: transform, opacity;
                }
                @keyframes balloonConfetti {
                    0%   { transform: rotate(var(--r, 0deg)) translateY(0)   scale(1); opacity: 1; }
                    100% { transform: rotate(var(--r, 0deg)) translateY(-90px) scale(0.4); opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .balloon-float, .balloon-pop, .balloon-confetti { animation: none !important; }
                }
            `}</style>
        </div>
    );
};

export default BalloonPopRound;
