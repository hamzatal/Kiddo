import React, { useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playClick } from "@/learning/utils/soundEffects";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * Picture dictionary — last lesson of each unit. 8 cards laid out
 * in a grid; tapping one plays its segment and marks it as reviewed.
 */
const PictureDictMode = ({ lesson, intro, onComplete }) => {
    const cards = intro?.cards || [];
    const [seen, setSeen] = useState(new Set());

    const onTap = async (c, i) => {
        playClick();
        const next = new Set(seen);
        next.add(i);
        setSeen(next);
        await playAudio(c.audioClip);
    };

    const allSeen = cards.length > 0 && seen.size >= cards.length;

    return (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-fade-in-up">
            <header className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-500 mb-1">
                    Picture dictionary · Book page {lesson?.pageNumber}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B]">
                    {lesson?.title}
                </h1>
                <p className="text-sm text-gray-500 font-semibold mt-1">
                    Tap each word to listen and trace.
                </p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mx-auto justify-items-center">
                {cards.map((c, i) => (
                    <button
                        key={c.id}
                        onClick={() => onTap(c, i)}
                        className={`group relative flex flex-col items-center gap-2 p-3 rounded-[1.25rem] border-2 bg-white/95 shadow-md transition-all w-full ${
                            seen.has(i)
                                ? "border-teal-300 bg-teal-50"
                                : "border-white hover:border-teal-200 hover:-translate-y-0.5"
                        }`}
                    >
                        <SmartImage
                            src={c.imagePath}
                            label={c.word}
                            className="w-full aspect-square"
                            imgClassName="w-full h-full object-contain"
                        />
                        <span className="font-black text-sm text-[#1E293B] uppercase tracking-wide">
                            {c.word}
                        </span>
                        <AudioClipButton
                            clip={c.audioClip}
                            wordId={c.id}
                            label={c.word}
                            size="sm"
                        />
                    </button>
                ))}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => onComplete({ correct: cards.length, total: Math.max(1, cards.length), rounds: [] })}
                    disabled={!allSeen}
                    className={`px-10 py-4 rounded-[2rem] font-black text-lg shadow-lg transition-all ${
                        allSeen
                            ? "bg-[#14B8A6] text-white shadow-[0_8px_0_#0F766E]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Finish →
                </button>
            </div>
        </div>
    );
};

export default PictureDictMode;
