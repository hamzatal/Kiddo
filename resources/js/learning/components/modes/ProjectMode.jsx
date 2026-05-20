import React from "react";
import TrackPlayer from "@/learning/components/ui/TrackPlayer";

/**
 * Project mode (Lesson 11 in each unit). The book's "Make and show"
 * craft page: we show the project title, the step-by-step make
 * instructions, any words involved, and the song audio.
 */
const ProjectMode = ({ lesson, audioTrack, onComplete, deck }) => {
    const cfg = lesson?.config || {};
    const steps = cfg.steps || [];
    const words = cfg.word_filter || [];
    const title = cfg.project_title || lesson?.title;

    const hasContent = steps.length > 0 || words.length > 0 || audioTrack;
    if (!hasContent) {
        return (
            <div className="text-center p-6 sm:p-10 max-w-sm mx-auto">
                <span className="text-5xl block mb-3">✂️</span>
                <h3 className="text-lg sm:text-xl font-black text-gray-700 mb-1">
                    No project steps yet
                </h3>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Your teacher hasn't added the make-and-show steps for this lesson.
                </p>
                <button
                    onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-black shadow-md hover:-translate-y-0.5 transition-all"
                >
                    Continue →
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl flex flex-col items-center gap-6 animate-fade-in-up">
            <header className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500 mb-1">
                    Project · Book page {lesson?.pageNumber}
                </p>
                <h1 className="text-3xl sm:text-5xl font-black text-[#1E293B]">
                    {title}
                </h1>
            </header>

            <div className="w-full bg-white/95 rounded-[2rem] shadow-xl border border-white p-6 sm:p-8 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-orange-600">
                    <span className="text-3xl">✂️</span>
                    <h2 className="font-black text-lg">How to make it</h2>
                </div>
                <ol className="flex flex-col gap-2">
                    {steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="w-7 h-7 shrink-0 rounded-full bg-orange-100 text-orange-700 font-black flex items-center justify-center text-sm">
                                {i + 1}
                            </span>
                            <span className="text-sm sm:text-base text-[#1E293B] leading-snug">
                                {s}
                            </span>
                        </li>
                    ))}
                </ol>

                {words.length > 0 ? (
                    <div className="mt-2 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Words in this project
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {words.map((w) => (
                                <span
                                    key={w}
                                    className="text-xs font-black uppercase px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100"
                                >
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                {audioTrack ? (
                    <div className="mt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Sing and play
                        </p>
                        <TrackPlayer audioTrack={audioTrack} />
                    </div>
                ) : null}
            </div>

            <button
                onClick={() => onComplete({ correct: 1, total: 1, rounds: [] })}
                className="px-10 py-4 rounded-[2rem] font-black text-lg bg-[#F97316] text-white shadow-[0_8px_0_#C2410C] hover:translate-y-[2px] transition-all"
            >
                I made it! →
            </button>
        </div>
    );
};

export default ProjectMode;
