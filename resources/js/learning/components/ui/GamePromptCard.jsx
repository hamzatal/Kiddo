import React from "react";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";

const GamePromptCard = ({
    title,
    subtitle,
    accent = "#7C3AED",
    onReplay,
    replayDisabled = false,
    hint,
    hintActive = false,
    onHintToggle,
    showReplay = true,
}) => {
    return (
        <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border border-white bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
            {subtitle ? (
                <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: accent }}
                >
                    {subtitle}
                </p>
            ) : null}

            <div className="flex items-center gap-2">
                {showReplay ? (
                    <button
                        onClick={onReplay}
                        disabled={replayDisabled}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-xl text-white shadow-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-60 sm:h-16 sm:w-16 sm:text-2xl"
                        aria-label="Play again"
                    >
                        🔊
                    </button>
                ) : null}

                <div className="min-w-0 flex-1 text-center">
                    <h3 className="truncate text-base font-black text-slate-800 sm:text-lg">
                        {title}
                    </h3>
                    {hint ? (
                        <p className="mt-0.5 text-[10px] font-bold text-gray-500 sm:text-xs">
                            {hint}
                        </p>
                    ) : null}
                </div>

                {onHintToggle ? (
                    <button
                        onClick={onHintToggle}
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                            hintActive
                                ? "border-amber-300 bg-amber-100 text-amber-700"
                                : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500"
                        }`}
                        aria-label={hintActive ? "Hide hint" : "Show hint"}
                    >
                        {hintActive ? "🔠 Word" : "💡 Hint"}
                    </button>
                ) : null}
            </div>
        </div>
    );
};

export default GamePromptCard;
