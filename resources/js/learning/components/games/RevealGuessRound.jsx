import React, { useCallback, useEffect, useRef, useState } from "react";
import SmartImage from "@/learning/components/ui/SmartImage";
import OptionCard from "@/learning/components/ui/OptionCard";
import { playAudio } from "@/learning/utils/playAudio";
import { playSuccess, playFail, playClick } from "@/learning/utils/soundEffects";
import { launchStars } from "@/learning/utils/confetti";

/**
 * RevealGuessRound — tap tiles away to uncover a hidden image.
 *
 * Standard round shape (style = "reveal-guess"):
 *   round.prompt.imagePath  — image to uncover
 *   round.prompt.audioClip  — auto-plays at start
 *   round.options           — [{id,word,imagePath,audioClip,isCorrect}]
 *
 * A 4×4 grid of opaque purple tiles sits over the image. One tile
 * is removed every REVEAL_MS until all are gone. The child should
 * pick the correct option before the image is fully revealed.
 */

const COLS = 4;
const ROWS = 4;
const TOTAL = COLS * ROWS;
const REVEAL_MS = 550;

function buildOrder() {
    const arr = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const RevealGuessRound = ({ round, onPick, correctId, wrong, disabled }) => {
    const prompt = round?.prompt;
    const options = round?.options || [];

    const [revealed, setRevealed] = useState(new Set());
    const [order] = useState(buildOrder);
    const stepRef = useRef(0);
    const timerRef = useRef(null);
    const containerRef = useRef(null);

    const startReveal = useCallback(() => {
        timerRef.current = setInterval(() => {
            if (stepRef.current >= TOTAL) {
                clearInterval(timerRef.current);
                return;
            }
            const idx = order[stepRef.current++];
            setRevealed((prev) => new Set([...prev, idx]));
        }, REVEAL_MS);
    }, [order]);

    useEffect(() => {
        setRevealed(new Set());
        stepRef.current = 0;
        clearInterval(timerRef.current);

        const audioDelay = prompt?.audioClip
            ? setTimeout(() => playAudio(prompt.audioClip), 300)
            : null;
        const startDelay = setTimeout(startReveal, 700);

        return () => {
            clearTimeout(audioDelay);
            clearTimeout(startDelay);
            clearInterval(timerRef.current);
        };
    }, [round?.roundId]);

    useEffect(() => {
        if (disabled) {
            clearInterval(timerRef.current);
            setRevealed(new Set(Array.from({ length: TOTAL }, (_, i) => i)));
        }
    }, [disabled]);

    const handlePick = useCallback(
        (opt) => {
            if (disabled) return;
            playClick();
            clearInterval(timerRef.current);
            if (opt.isCorrect) {
                setRevealed(new Set(Array.from({ length: TOTAL }, (_, i) => i)));
                const el = containerRef.current;
                if (el) {
                    const r = el.getBoundingClientRect();
                    launchStars(r.left + r.width / 2, r.top + r.height / 3, 6);
                }
                playSuccess();
            } else {
                playFail();
            }
            onPick?.(opt);
        },
        [disabled, onPick],
    );

    const pct = Math.round((revealed.size / TOTAL) * 100);

    return (
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3 sm:gap-5">
            <div className="flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 sm:text-xs">
                    Guess fast — the picture is revealing!
                </p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-100 sm:w-56">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Reveal grid */}
            <div
                className="relative overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl"
                style={{ width: "clamp(9rem,30vw,14rem)", height: "clamp(9rem,30vw,14rem)" }}
            >
                {prompt?.imagePath ? (
                    <SmartImage
                        src={prompt.imagePath}
                        label={prompt.text}
                        className="absolute inset-0 h-full w-full"
                        imgClassName="w-full h-full object-contain p-2"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        🖼️
                    </div>
                )}

                <div
                    className="absolute inset-0 grid"
                    style={{
                        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                    }}
                    aria-hidden="true"
                >
                    {Array.from({ length: TOTAL }).map((_, idx) => (
                        <div
                            key={idx}
                            className={`duration-400 bg-gradient-to-br from-purple-500 to-indigo-600 transition-all ${revealed.has(idx) ? "scale-110 opacity-0" : "opacity-100"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Options */}
            <div className="grid w-full max-w-lg grid-cols-3 gap-2 sm:gap-3">
                {options.map((opt) => {
                    let cardState = "idle";
                    if (correctId === opt.id) cardState = "correct";
                    else if (wrong?.includes(opt.id)) cardState = "wrong";
                    else if (correctId !== null) cardState = "disabled";
                    return (
                        <OptionCard
                            key={opt.id}
                            imagePath={opt.imagePath}
                            label={opt.word}
                            audioClip={opt.audioClip}
                            wordId={opt.wordId || null}
                            showLabel
                            state={cardState}
                            onClick={() => handlePick(opt)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RevealGuessRound;
