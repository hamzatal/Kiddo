import React, { useState } from "react";

/**
 * SmartImage - Image component with elegant fallback.
 * 
 * Instead of showing a broken image icon when src fails to load,
 * shows a colorful placeholder with the first letter of the label.
 * Each label gets a consistent color based on its hash.
 * 
 * Usage:
 *   <SmartImage src="/path/to/img.png" label="Boy" className="w-20 h-20" />
 */

const COLORS = [
  { bg: "from-purple-200 to-purple-400", text: "text-purple-900" },
  { bg: "from-blue-200 to-blue-400", text: "text-blue-900" },
  { bg: "from-emerald-200 to-emerald-400", text: "text-emerald-900" },
  { bg: "from-amber-200 to-amber-400", text: "text-amber-900" },
  { bg: "from-pink-200 to-pink-400", text: "text-pink-900" },
  { bg: "from-cyan-200 to-cyan-400", text: "text-cyan-900" },
  { bg: "from-rose-200 to-rose-400", text: "text-rose-900" },
  { bg: "from-indigo-200 to-indigo-400", text: "text-indigo-900" },
  { bg: "from-teal-200 to-teal-400", text: "text-teal-900" },
  { bg: "from-orange-200 to-orange-400", text: "text-orange-900" },
];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) {
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

  const colorIdx = hashCode(label) % COLORS.length;
  const colors = COLORS[colorIdx];
  const firstLetter = (label || "?").charAt(0).toUpperCase();

  if (failed || !src) {
    return (
      <div 
        className={`bg-gradient-to-br ${colors.bg} rounded-2xl flex flex-col items-center justify-center font-black ${colors.text} shadow-inner ${className} ${fallbackClassName}`}
        title={label}
      >
        <span className="text-[42%] leading-none drop-shadow-sm">{firstLetter}</span>
        {label && label.length > 1 ? (
          <span className="text-[14%] leading-none mt-1 uppercase tracking-wider opacity-80 px-1 truncate max-w-full">
            {label}
          </span>
        ) : null}
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
