import React, { useState } from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import TrackPlayer from "@/learning/components/ui/TrackPlayer";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";
import { playClick } from "@/learning/utils/soundEffects";

/**
 * IntroMode - Listen, point and say.
 * Tap each card to hear the word; once all are tapped, Continue unlocks.
 * Fully responsive grid that adjusts from phone to desktop.
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
        <div className="w-full max-w-5xl xl:max-w-6xl flex flex-col gap-4 sm:gap-6 animate-fade-in-up">
            <header className="text-center">
                {lesson?.pageNumber && (
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-purple-500 mb-1">
                        Book page {lesson.pageNumber}
                    </p>
                )}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-gray-800 mb-2">
                    {intro?.headline}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-500 font-semibold">
                    {lesson?.config?.prompt || "Listen, point and say."}
                </p>
            </header>

            {audioTrack ? (
                <div className="flex justify-center">
                    <TrackPlayer audioTrack={audioTrack} />
                </div>
            ) : null}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {cards.map((card, idx) => (
                    <button
                        key={card.id}
                        onClick={() => handleCardTap(card, idx)}
                        className={`relative aspect-square rounded-2xl border-2 sm:border-4 transition-all shadow-sm overflow-hidden group ${
                            tapped.has(idx)
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-white bg-white/95 hover:border-purple-300 hover:-translate-y-1"
                        }`}
                    >
                        <div className="absolute inset-3 sm:inset-4">
                            <SmartImage
                                src={card.imagePath}
                                label={card.word}
                                className="w-full h-full"
                                imgClassName="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <span className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-white drop-shadow">
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
                <p className="text-xs sm:text-sm font-bold text-gray-500">
                    {allTapped
                        ? "Nice work! Tap Continue."
                        : `Tap each card to hear it (${tapped.size}/${cards.length})`}
                </p>
                <button
                    onClick={() => onComplete({ correct: cards.length, total: Math.max(1, cards.length), rounds: [] })}
                    disabled={!allTapped}
                    className={`px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-all ${
                        allTapped
                            ? "bg-emerald-500 text-white shadow-[0_6px_0_#059669] hover:translate-y-[2px]"
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
