import React from "react";
import SmartImage from "@/learning/components/ui/SmartImage";

/**
 * OptionCard - Reusable clickable card for game modes.
 * Shows an image (with elegant fallback when missing) + optional label.
 *
 * Fully responsive: square on mobile, fixed height on tablet+.
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
        "group relative p-3 sm:p-4 lg:p-5 bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all duration-300 shadow-sm flex flex-col items-center justify-center select-none";

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
            className={`${base} ${stateClass} aspect-square sm:aspect-auto sm:h-40 lg:h-44 xl:h-52 ${className}`}
        >
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <SmartImage
                    src={imagePath}
                    label={label}
                    className="w-full h-full"
                    imgClassName="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                />
            </div>

            {showLabel && label ? (
                <span className="mt-2 text-xs sm:text-sm lg:text-base font-black uppercase tracking-wide text-gray-800 truncate max-w-full">
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
