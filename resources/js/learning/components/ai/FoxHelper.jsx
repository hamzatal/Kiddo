import React, { useState } from "react";
import axios from "axios";

/**
 * The child-facing "Fox Helper" panel. Lives at the bottom-right of
 * LessonScreen. Tapping the avatar opens a small overlay with 3
 * quick-prompt buttons; free-typing is limited to short strings to
 * keep GPT constrained.
 */
const QUICK_PROMPTS = [
    { key: "explain",  label: "Explain this word", prompt: "Explain this word in one short, simple sentence." },
    { key: "slow",     label: "Say it slowly",     prompt: "Say it slowly, syllable by syllable." },
    { key: "sentence", label: "Give me a short sentence", prompt: "Give me a very short sentence using this word." },
];

const FoxHelper = ({ unitId, wordId, aiEnabled = true }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [answer, setAnswer] = useState(null);
    const [customPrompt, setCustomPrompt] = useState("");
    const [error, setError] = useState(null);

    const ask = async (prompt) => {
        if (!unitId) return;
        setLoading(true);
        setError(null);
        setAnswer(null);
        try {
            const res = await axios.post("/ai/lesson-helper", {
                unitId,
                wordId: String(wordId || "1"),
                prompt,
            });
            setAnswer(res.data?.answer || "You're doing great!");
        } catch (e) {
            setError("Try again in a moment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-4 sm:right-6 z-[60]">
            {open && (
                <div className="mb-3 w-[88vw] max-w-sm bg-white/98 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-purple-100 p-4 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🦊</span>
                            <span className="font-black text-sm text-[#1E293B]">
                                Kiddo Fox {aiEnabled ? "" : <span className="text-[10px] text-amber-500 ml-1">offline</span>}
                            </span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-gray-400 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-full"
                            aria-label="Close helper"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Answer / loading bubble */}
                    {loading && (
                        <p className="text-sm text-gray-500 bg-purple-50 rounded-2xl p-3 mb-2">
                            Thinking…
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-rose-500 bg-rose-50 rounded-2xl p-3 mb-2">
                            {error}
                        </p>
                    )}
                    {answer && !loading && (
                        <p className="text-sm text-[#1E293B] bg-amber-50 rounded-2xl p-3 mb-2 leading-snug">
                            {answer}
                        </p>
                    )}

                    {/* Quick prompts */}
                    <div className="flex flex-col gap-2">
                        {QUICK_PROMPTS.map((q) => (
                            <button
                                key={q.key}
                                disabled={loading}
                                onClick={() => ask(q.prompt)}
                                className="text-left text-xs sm:text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 px-3 py-2 rounded-xl transition"
                            >
                                ✨ {q.label}
                            </button>
                        ))}
                    </div>

                    {/* Limited free text */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (customPrompt.trim().length < 3) return;
                            ask(customPrompt.trim().slice(0, 120));
                            setCustomPrompt("");
                        }}
                        className="mt-3 flex gap-2"
                    >
                        <input
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            maxLength={120}
                            placeholder="Ask about this word..."
                            className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading || customPrompt.trim().length < 3}
                            className="px-3 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-bold disabled:opacity-40"
                        >
                            Ask
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                className="group flex items-center gap-2 bg-white border-2 border-purple-200 rounded-full pl-2 pr-4 py-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                aria-label="Open Kiddo Fox helper"
            >
                <span className="text-3xl" role="img" aria-label="fox">🦊</span>
                <span className="text-xs sm:text-sm font-black text-purple-700">
                    Need help?
                </span>
            </button>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default FoxHelper;
