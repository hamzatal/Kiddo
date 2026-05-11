import React from "react";

/**
 * Simple dots-with-fill progress indicator for game rounds.
 * Shows completed, current, remaining in three distinct colours.
 */
const RoundProgress = ({ total, current, results = [] }) => {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => {
                const r = results[i];
                const isCurrent = i === current;
                const done = r !== undefined;

                let color = "bg-gray-200";
                if (done && r?.correct) color = "bg-emerald-400";
                else if (done && !r?.correct) color = "bg-rose-300";
                else if (isCurrent) color = "bg-[#7C3AED] ring-2 ring-purple-200";

                return (
                    <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${color} ${
                            isCurrent ? "scale-125" : ""
                        }`}
                    />
                );
            })}
        </div>
    );
};

export default RoundProgress;
