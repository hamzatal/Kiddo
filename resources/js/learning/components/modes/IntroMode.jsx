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
    const someTapped = tapped.size > 0;

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
                        className={`relative aspect-square w-full rounded-2xl border-2 sm:border-4 transition-all shadow-md overflow-hidden group ${
                            tapped.has(idx)
                                ? "border-emerald-300 bg-emerald-50 scale-[0.97]"
                                : "border-purple-200 bg-white/95 hover:border-purple-400 hover:-translate-y-1 hover:shadow-xl ring-2 ring-purple-100 animate-introPulse"
                        }`}
                        aria-label={`Tap to hear ${card.word}`}
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
                        {/* Tap hint badge — disappears once the kid
                            has tapped this card. Makes it crystal
                            clear that the card is a button, not just
                            decoration. The previous design only had
                            a static 🔊 chip in the corner which read
                            as decorative on every layout. */}
                        <div className="absolute top-2 right-2 pointer-events-none">
                            {tapped.has(idx) ? (
                                <span className="w-9 h-9 rounded-full bg-emerald-500 text-white text-base shadow-md flex items-center justify-center border-2 border-white">
                                    ✓
                                </span>
                            ) : (
                                <span className="w-9 h-9 rounded-full bg-[#10B981] text-white text-base shadow-md flex items-center justify-center border-2 border-white animate-introBounce">
                                    🔊
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
                <p className={`text-xs sm:text-sm font-bold transition-colors ${
                    allTapped ? "text-emerald-600" : "text-gray-500"
                }`}>
                    {allTapped
                        ? "🎉 Nice work! Tap Continue."
                        : someTapped
                        ? `Great — ${tapped.size}/${cards.length} cards tapped. Tap more or hit Continue.`
                        : `👆 Tap each card to hear it (or hit Continue any time)`}
                </p>
                {/*
                  IMPORTANT FIX (May 2026):
                  Continue is now ALWAYS enabled. Previously this was
                  `disabled={!allTapped}` which meant a child who saw
                  only the audio button (because the cards looked like
                  decorations and the disabled grey button looked
                  unclickable) had no path forward — the lesson dead-
                  ended on the very first screen. Even the floating
                  Skip pill was too small/hidden on phones to act as
                  a recovery. The new behaviour: tapping cards is
                  rewarded with stars (3 vs 1), but Continue ALWAYS
                  works. We compute a partial-credit "correct" count
                  from how many cards were actually tapped so the
                  reward stays motivating without ever blocking
                  progression.
                */}
                <button
                    onClick={() =>
                        onComplete({
                            correct: Math.max(1, tapped.size),
                            total: Math.max(1, cards.length),
                            rounds: [],
                        })
                    }
                    className={`px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-all ${
                        allTapped
                            ? "bg-emerald-500 text-white shadow-[0_6px_0_#059669] hover:translate-y-[2px] active:translate-y-[6px]"
                            : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_6px_0_#4F46E5] hover:translate-y-[2px] active:translate-y-[6px]"
                    }`}
                >
                    Continue →
                </button>
            </div>

            <style>{`
                @keyframes introPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.0); }
                    50%      { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.12); }
                }
                .animate-introPulse { animation: introPulse 2.4s ease-in-out infinite; }
                @keyframes introBounce {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-3px); }
                }
                .animate-introBounce { animation: introBounce 1.8s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default IntroMode;
