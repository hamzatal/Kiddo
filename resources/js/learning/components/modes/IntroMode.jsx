import React, { useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import TrackPlayer from "@/learning/components/ui/TrackPlayer";
import { playAudio } from "@/learning/utils/playAudio";
import { playClick } from "@/learning/utils/soundEffects";

/**
 * Intro / Listen-point-say mode.
 * Big image grid; tapping a card plays the word's segment from the
 * shared NCCD track. A banner at the top streams the full book audio
 * (Listen & follow).
 */
const IntroMode = ({ lesson, intro, audioTrack, onComplete }) => {
    const cards = intro?.cards || [];
    const [tapped, setTapped] = useState(new Set());

    const handleCardTap = async (card, idx) => {
        playClick();
        const next = new Set(tapped);
        next.add(idx);
        setTapped(next);
        await playAudio(card.audioClip);
    };

    const allTapped = cards.length > 0 && tapped.size >= cards.length;

    return (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-fade-in-up">
            <header className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-500 mb-1">
                    Book page {lesson?.pageNumber}
                </p>
                <h1 className="text-3xl sm:text-5xl font-black text-[#1E293B] mb-2">
                    {intro?.headline}
                </h1>
                <p className="text-sm sm:text-base text-gray-500 font-semibold">
                    {lesson?.config?.prompt || "Listen, point and say."}
                </p>
            </header>

            {audioTrack ? (
                <div className="flex justify-center">
                    <TrackPlayer audioTrack={audioTrack} />
                </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => (
                    <button
                        key={card.id}
                        onClick={() => handleCardTap(card, idx)}
                        className={`relative aspect-square rounded-[1.5rem] border-4 transition-all shadow-md overflow-hidden group ${
                            tapped.has(idx)
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-white bg-white/95 hover:border-purple-300 hover:-translate-y-1"
                        }`}
                    >
                        {card.imagePath ? (
                            <img
                                src={card.imagePath}
                                alt={card.word}
                                className="absolute inset-4 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        ) : null}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                            <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white drop-shadow">
                                {card.word}
                            </span>
                        </div>
                        <div className="absolute top-2 right-2">
                            <AudioClipButton clip={card.audioClip} size="sm" />
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-xs font-bold text-gray-500">
                    {allTapped
                        ? "Nice work! Tap Continue."
                        : `Tap each card to hear it (${tapped.size}/${cards.length})`}
                </p>
                <button
                    onClick={() => onComplete({ correct: cards.length, total: Math.max(1, cards.length), rounds: [] })}
                    disabled={!allTapped}
                    className={`px-10 py-4 rounded-[2rem] font-black text-lg shadow-lg transition-all ${
                        allTapped
                            ? "bg-[#10B981] text-white shadow-[0_8px_0_#059669] hover:translate-y-[2px]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                    Continue →
                </button>
            </div>
        </div>
    );
};

export default IntroMode;
