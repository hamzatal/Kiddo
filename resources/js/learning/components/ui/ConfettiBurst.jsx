import React, { useMemo } from "react";

/**
 * FIX 7 — A self-contained, dependency-free confetti overlay used by
 * the lesson reward stage. We render N absolutely-positioned <span>
 * elements with random colours, sizes and start positions, then drop
 * + rotate them with pure CSS keyframes. No canvas, no library.
 *
 * Props:
 *   pieces    — how many confetti spans to spawn (default 60)
 *   className — extra classes for the absolute layer
 *
 * The layer is `pointer-events-none` so it never blocks the click on
 * the celebration card behind it.
 */
const COLORS = [
    "#F472B6", // pink
    "#FBBF24", // amber
    "#34D399", // emerald
    "#60A5FA", // sky
    "#A78BFA", // violet
    "#F87171", // red
    "#22D3EE", // cyan
    "#FACC15", // yellow
];

const rand = (min, max) => Math.random() * (max - min) + min;

const ConfettiBurst = ({ pieces = 60, className = "" }) => {
    const items = useMemo(() => {
        // We generate the random params once on mount so the animation
        // doesn't reshuffle on every parent re-render.
        return Array.from({ length: pieces }).map((_, i) => {
            const left = rand(0, 100);                 // % across viewport
            const delay = rand(0, 1.4).toFixed(2);     // s
            const duration = rand(2.4, 4.8).toFixed(2); // s — must be >= 2s
            const size = rand(6, 12).toFixed(0);       // px
            const color = COLORS[i % COLORS.length];
            const drift = rand(-30, 30).toFixed(0);    // px lateral wiggle
            const rotate = rand(-360, 720).toFixed(0); // deg total spin
            const shape = i % 3; // 0=square, 1=rect, 2=circle
            return { left, delay, duration, size, color, drift, rotate, shape, key: i };
        });
    }, [pieces]);

    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 overflow-hidden z-30 ${className}`}
        >
            {items.map((p) => {
                const style = {
                    left: `${p.left}%`,
                    top: `-12px`,
                    width: `${p.size}px`,
                    height: p.shape === 1 ? `${Number(p.size) * 1.6}px` : `${p.size}px`,
                    background: p.color,
                    borderRadius: p.shape === 2 ? "50%" : "2px",
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                    "--cb-drift": `${p.drift}px`,
                    "--cb-rotate": `${p.rotate}deg`,
                };
                return <span key={p.key} className="cb-piece" style={style} />;
            })}

            <style>{`
                .cb-piece {
                    position: absolute;
                    display: block;
                    will-change: transform, opacity;
                    opacity: 0.95;
                    animation-name: cb-fall;
                    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    animation-fill-mode: forwards;
                    animation-iteration-count: infinite;
                }
                @keyframes cb-fall {
                    0%   { transform: translate3d(0,-20px,0) rotate(0deg); opacity: 0; }
                    8%   { opacity: 1; }
                    100% { transform: translate3d(var(--cb-drift), 110vh, 0) rotate(var(--cb-rotate)); opacity: 0.85; }
                }
            `}</style>
        </div>
    );
};

export default ConfettiBurst;
