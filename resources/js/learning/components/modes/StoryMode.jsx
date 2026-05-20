import React, { useState } from "react";
import TrackPlayer from "@/learning/components/ui/TrackPlayer";
import { playClick } from "@/learning/utils/soundEffects";

/**
 * Story mode — listen, follow & answer.
 *
 * Layout v3 (2026-05): the previous version showed a generic 📚
 * emoji and the audio player, then asked the child to tap "I
 * listened!". Operators rightly complained: this was the entire
 * experience. We now also surface:
 *   • A short "What to do" panel above the audio so the kid knows
 *     what's expected ("Listen to the story, then tap I listened").
 *   • Character chips with emoji so each character is recognisable.
 *   • A "Listened? Tap each character" interactive checklist that
 *     unlocks the Continue button — even if the audio fails to
 *     load, the kid has SOMETHING to interact with so the page
 *     never feels empty.
 */

const CHAR_EMOJI = {
    Hala: "👧", Lama: "👧", Bill: "👦", Malek: "👦",
    Ann: "👧", Sam: "👦", Mum: "👩", Dad: "👨",
    Brother: "🧒", Sister: "👧", Grandma: "👵", Grandpa: "👴",
};
const charEmojiFor = (name) => CHAR_EMOJI[name] || "🧒";

const StoryMode = ({ lesson, audioTrack, onComplete }) => {
    const cfg = lesson?.config || {};
    const value = cfg.value;
    const title = cfg.story_title || lesson?.title;
    const characters = cfg.characters || [];
    const [tapped, setTapped] = useState(new Set());

    const tapChar = (name) => {
        playClick();
        setTapped((s) => {
            const next = new Set(s);
            next.add(name);
            return next;
        });
    };

    const allMet = characters.length === 0 || tapped.size >= characters.length;

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-4 sm:gap-6 animate-fade-in-up px-2">
            <header className="text-center">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-pink-500 mb-1">
                    Story · Book page {lesson?.pageNumber}
                </p>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1E293B] mb-2">
                    {title}
                </h1>
                {value ? (
                    <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-700 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200">
                        💛 Lesson value: {value}
                    </p>
                ) : null}
            </header>

            {/* What to do */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl border-2 border-dashed border-pink-200 px-4 py-3 flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-pink-500">
                    What to do
                </p>
                <ol className="text-xs sm:text-sm text-[#1E293B] font-semibold list-decimal pl-5 leading-relaxed space-y-0.5">
                    <li>Press ▶ to listen to the story.</li>
                    {characters.length > 0 ? (
                        <li>Tap each character below as you hear them.</li>
                    ) : null}
                    <li>Then tap <span className="font-black text-emerald-600">I listened →</span></li>
                </ol>
            </div>

            {/* Audio player or graceful "no audio yet" message */}
            <div className="w-full bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-3xl shadow-xl border border-white p-5 sm:p-7 flex flex-col items-center gap-3">
                <div className="text-5xl sm:text-6xl">📚</div>
                {audioTrack ? (
                    <TrackPlayer audioTrack={audioTrack} autoPlay={false} />
                ) : (
                    <p className="text-xs sm:text-sm text-gray-500 font-bold text-center">
                        Story audio is on its way. Tap the characters below to keep going.
                    </p>
                )}

                {/* Characters checklist */}
                {characters.length > 0 ? (
                    <div className="w-full pt-2 border-t border-pink-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-2 text-center">
                            Characters · tap to greet
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {characters.map((c) => {
                                const met = tapped.has(c);
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => tapChar(c)}
                                        className={`flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                                            met
                                                ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-md ring-2 ring-emerald-200"
                                                : "bg-white border-pink-200 text-pink-600 shadow-sm hover:border-pink-400 hover:-translate-y-0.5"
                                        }`}
                                    >
                                        <span className="text-base">{charEmojiFor(c)}</span>
                                        <span>{c}</span>
                                        {met ? <span className="text-emerald-500">✓</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>

            <button
                onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                disabled={!allMet}
                className={`px-8 sm:px-10 py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-all ${
                    allMet
                        ? "bg-[#10B981] text-white shadow-[0_8px_0_#059669] hover:translate-y-[2px]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
                {allMet ? "I listened! →" : "Tap each character first"}
            </button>
        </div>
    );
};

export default StoryMode;
