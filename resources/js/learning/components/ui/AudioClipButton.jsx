import React, { useState } from "react";
import { playAudio, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * A small reusable speaker button that plays one word's audio clip.
 * Supports the new segment-based shape:
 *   clip = { src, startMs, endMs, label }
 * and also the legacy string (direct file URL) for backwards compat.
 *
 * Stops any other clip that might currently be playing, so tapping a
 * second card cuts the first one off cleanly.
 */
const AudioClipButton = ({
    clip,
    size = "md",
    className = "",
    onStart,
    onEnd,
    label,
}) => {
    const [playing, setPlaying] = useState(false);

    const sizes = {
        sm: "w-9 h-9 text-base",
        md: "w-12 h-12 text-xl",
        lg: "w-16 h-16 text-2xl",
    };

    const handleClick = async (e) => {
        e.stopPropagation();
        if (!clip) return;

        if (playing) {
            stopAllAudio();
            setPlaying(false);
            return;
        }

        setPlaying(true);
        onStart?.();
        await playAudio(clip);
        setPlaying(false);
        onEnd?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!clip}
            aria-label={label || clip?.label || "Play audio"}
            className={`rounded-full flex items-center justify-center text-white shadow-md transition-all
                ${sizes[size] || sizes.md}
                ${playing
                    ? "bg-[#F59E0B] shadow-[0_4px_0_#B45309]"
                    : "bg-[#10B981] shadow-[0_4px_0_#059669] hover:translate-y-[1px] active:translate-y-[4px] disabled:opacity-40 disabled:cursor-not-allowed"}
                ${className}`}
        >
            {playing ? "⏸" : "🔊"}
        </button>
    );
};

export default AudioClipButton;
