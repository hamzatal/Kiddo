import React from "react";
import TrackPlayer from "@/learning/components/ui/TrackPlayer";

/**
 * Story mode — shows a hero illustration, the story title, the moral
 * ("value"), and streams the story audio. Intentionally light: the
 * actual text isn't on NCCD so we don't invent it.
 */
const StoryMode = ({ lesson, audioTrack, onComplete }) => {
    const cfg = lesson?.config || {};
    const value = cfg.value;
    const title = cfg.story_title || lesson?.title;
    const characters = cfg.characters || [];

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-6 animate-fade-in-up">
            <header className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-500 mb-1">
                    Story · Book page {lesson?.pageNumber}
                </p>
                <h1 className="text-3xl sm:text-5xl font-black text-[#1E293B] mb-2">
                    {title}
                </h1>
                {value ? (
                    <p className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200">
                        💛 Value: {value}
                    </p>
                ) : null}
            </header>

            <div className="w-full bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-[2rem] shadow-xl border border-white p-8 flex flex-col items-center gap-4">
                <div className="text-6xl">📚</div>
                {characters.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {characters.map((c) => (
                            <span
                                key={c}
                                className="text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full bg-white border border-pink-100 text-pink-600 shadow-sm"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                ) : null}
                {audioTrack ? (
                    <TrackPlayer audioTrack={audioTrack} />
                ) : (
                    <p className="text-sm text-gray-500">Audio will play here when ready.</p>
                )}
            </div>

            <button
                onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                className="px-10 py-4 rounded-[2rem] font-black text-lg bg-[#10B981] text-white shadow-[0_8px_0_#059669] hover:translate-y-[2px] transition-all"
            >
                I listened! →
            </button>
        </div>
    );
};

export default StoryMode;
