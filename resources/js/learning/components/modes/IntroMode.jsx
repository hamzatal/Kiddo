import React, { useState } from "react";
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

    if (!cards.length) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">👋</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No words yet for this intro
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Your teacher hasn't added the listen-and-point cards yet.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md hover:-translate-y-0.5 transition-all"
                >
                    Continue →
                </button>
            </div>
        );
    }

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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mx-auto w-full justify-items-center">
                {cards.map((card, idx) => (
                    <button
                        key={card.id}
                        onClick={() => handleCardTap(card, idx)}
                        className={`relative aspect-square w-full rounded-2xl border-2 sm:border-4 transition-all shadow-sm overflow-hidden group ${
                            tapped.has(idx)
                                ? "border-emerald-300 bg-emerald-50"
                                : "border-white bg-white/95 hover:border-purple-300 hover:-translate-y-1"
                        }`}
                    >
                        <div className="absolute inset-0">
                            <SmartImage
                                src={card.imagePath}
                                label={card.word}
                                className="w-full h-full"
                                imgClassName="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <span className="text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-white drop-shadow">
                                {card.word}
                            </span>
                        </div>
                        <div className="absolute top-2 right-2 pointer-events-none">
                            {/* Decorative speaker chip — the parent
                                <button> already plays the audio on
                                tap. Rendering AudioClipButton (which
                                is itself a <button>) here would be
                                invalid HTML (button-in-button) and
                                Firefox lifts the inner button out of
                                the outer one in the DOM, breaking
                                layout. We keep the visual cue with
                                `pointer-events-none` so the wrap
                                stays a single click target. */}
                            <span className="w-9 h-9 rounded-full bg-[#10B981] text-white text-base shadow-md flex items-center justify-center">
                                🔊
                            </span>
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
