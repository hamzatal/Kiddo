import React, { useState } from "react";

/**
 * SmartImage - Image component with elegant child-friendly fallback.
 *
 * Instead of showing a broken image icon when src fails to load,
 * shows a colorful card with a fun emoji + the word text so the
 * child can still identify the option by reading the label.
 *
 * Usage:
 *   <SmartImage src="/path/to/img.png" label="Boy" className="w-20 h-20" />
 */

const COLORS = [
    { bg: "from-purple-100 to-purple-300", text: "text-purple-800", border: "border-purple-200" },
    { bg: "from-blue-100 to-blue-300", text: "text-blue-800", border: "border-blue-200" },
    { bg: "from-emerald-100 to-emerald-300", text: "text-emerald-800", border: "border-emerald-200" },
    { bg: "from-amber-100 to-amber-300", text: "text-amber-800", border: "border-amber-200" },
    { bg: "from-pink-100 to-pink-300", text: "text-pink-800", border: "border-pink-200" },
    { bg: "from-cyan-100 to-cyan-300", text: "text-cyan-800", border: "border-cyan-200" },
    { bg: "from-rose-100 to-rose-300", text: "text-rose-800", border: "border-rose-200" },
    { bg: "from-indigo-100 to-indigo-300", text: "text-indigo-800", border: "border-indigo-200" },
    { bg: "from-teal-100 to-teal-300", text: "text-teal-800", border: "border-teal-200" },
    { bg: "from-orange-100 to-orange-300", text: "text-orange-800", border: "border-orange-200" },
];

// Fun emojis that rotate based on label hash — keeps it playful for kids.
const FUN_EMOJIS = ["🌟", "🎈", "🦋", "🌈", "🎨", "🍎", "🐱", "🌸", "🎵", "🧸", "🦊", "🐝"];

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

const SmartImage = ({
    src,
    label = "?",
    className = "",
    imgClassName = "",
    fallbackClassName = "",
    alt,
    onError,
}) => {
    const [failed, setFailed] = useState(!src);

    const hash = hashCode(label);
    const colorIdx = hash % COLORS.length;
    const colors = COLORS[colorIdx];
    const emoji = FUN_EMOJIS[hash % FUN_EMOJIS.length];
    const displayLabel = (label || "?").length > 12 ? label.slice(0, 10) + "…" : label;

    if (failed || !src) {
        return (
            <div
                className={`bg-gradient-to-br ${colors.bg} rounded-2xl flex flex-col items-center justify-center gap-1 font-black ${colors.text} border ${colors.border} shadow-inner p-2 ${className} ${fallbackClassName}`}
                title={label}
            >
                <span className="text-[min(2.5rem,35%)] leading-none drop-shadow-sm select-none">
                    {emoji}
                </span>
                <span className="text-[min(0.75rem,22%)] leading-tight text-center font-black uppercase tracking-wide truncate max-w-full px-1 drop-shadow-sm">
                    {displayLabel}
                </span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || label}
            className={`${className} ${imgClassName}`}
            onError={(e) => {
                setFailed(true);
                onError?.(e);
            }}
        />
    );
};

export default SmartImage;
