import React from "react";

/**
 * Reusable clickable card used by every game mode. Shows an image
 * (with a safe text fallback), optional label, and feedback states
 * for correct / wrong / disabled.
 *
 * The Tailwind classes are tuned for both phone and laptop — the card
 * scales with its container via aspect-square on narrow viewports and
 * a fixed height on sm+.
 */
const OptionCard = ({
    imagePath,
    label,
    state = "idle",      // idle | correct | wrong | disabled
    onClick,
    showLabel = true,
    className = "",
}) => {
    const base =
        "group relative p-5 sm:p-6 bg-white/95 backdrop-blur-xl rounded-[2rem] border-4 transition-all duration-300 shadow-md flex flex-col items-center justify-center select-none";

    const stateClass = {
        idle:     "border-white hover:border-purple-300 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0",
        correct:  "border-green-500 bg-green-50 scale-105 z-10 shadow-2xl ring-4 ring-green-200 animate-[pop_0.4s_ease-out]",
        wrong:    "border-red-200 bg-red-50 opacity-40 grayscale scale-95 cursor-not-allowed",
        disabled: "border-gray-100 opacity-60 cursor-not-allowed",
    }[state];

    return (
        <button
            type="button"
            disabled={state === "wrong" || state === "disabled" || state === "correct"}
            onClick={onClick}
            className={`${base} ${stateClass} aspect-square sm:aspect-auto sm:h-56 lg:h-64 ${className}`}
        >
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                {imagePath ? (
                    <img
                        src={imagePath}
                        alt={label || ""}
                        className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                        onError={(e) => {
                            e.currentTarget.outerHTML = `<span class="text-3xl sm:text-5xl font-black uppercase text-gray-400">${label ?? "?"}</span>`;
                        }}
                    />
                ) : (
                    <span className="text-3xl sm:text-5xl font-black uppercase text-gray-400">
                        {label ?? "?"}
                    </span>
                )}
            </div>

            {showLabel && label ? (
                <span className="mt-2 text-xs sm:text-sm font-black uppercase tracking-wide text-[#1E293B]">
                    {label}
                </span>
            ) : null}

            {state === "correct" && (
                <div className="absolute -top-3 -right-3 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg animate-bounce">
                    ✓
                </div>
            )}
            {state === "wrong" && (
                <div className="absolute -top-3 -right-3 bg-red-400 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg">
                    ✕
                </div>
            )}

            <style>{`
                @keyframes pop {
                    0% { transform: scale(0.92); }
                    60% { transform: scale(1.08); }
                    100% { transform: scale(1.05); }
                }
            `}</style>
        </button>
    );
};

export default OptionCard;
