import React, { useState } from "react";

/**
 * SmartImage - Image component with elegant child-friendly fallback.
 *
 * When `src` loads, shows the picture. When `src` is missing OR the
 * <img> fires an error, shows a colourful card with a meaningful emoji
 * (chosen from a curated word→emoji map) plus the word text. Each
 * label keeps a stable colour so the card looks the same every time.
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

/**
 * Curated word → emoji map. Hand-picked so the fallback tile actually
 * looks like the word the child is learning. Covers the entire Team
 * Together 1A vocabulary plus the most common general nouns.
 *
 * Lookup is case-insensitive and tries the whole word first then
 * substrings, so "my mum" → 👩 still works.
 */
const WORD_EMOJIS = {
    // Family
    "mum": "👩", "mom": "👩", "mummy": "👩", "mommy": "👩", "mother": "👩",
    "dad": "👨", "daddy": "👨", "father": "👨",
    "brother": "🧒", "sister": "👧", "baby": "👶",
    "grandma": "👵", "grandpa": "👴", "family": "👨‍👩‍👧‍👦",
    "boy": "👦", "girl": "👧", "kid": "🧒", "child": "🧒",
    // Numbers
    "one": "1️⃣", "two": "2️⃣", "three": "3️⃣", "four": "4️⃣", "five": "5️⃣",
    "six": "6️⃣", "seven": "7️⃣", "eight": "8️⃣", "nine": "9️⃣", "ten": "🔟",
    // Colours
    "red": "🟥", "blue": "🟦", "green": "🟩", "yellow": "🟨",
    "orange": "🟧", "purple": "🟪", "pink": "🌸", "black": "⬛",
    "white": "⬜", "brown": "🟫",
    // School / classroom
    "book": "📖", "pen": "🖊️", "pencil": "✏️", "ruler": "📏", "crayon": "🖍️",
    "bag": "🎒", "schoolbag": "🎒", "backpack": "🎒",
    "rubber": "🩹", "eraser": "🩹", "sharpener": "✏️",
    "desk": "🪑", "chair": "🪑", "table": "🪑", "board": "📋",
    "school": "🏫", "classroom": "🏫", "teacher": "👩‍🏫",
    "notebook": "📓", "paper": "📄", "scissors": "✂️", "glue": "🧴",
    // Toys & play
    "toy": "🧸", "ball": "⚽", "doll": "🧸", "kite": "🪁",
    "robot": "🤖", "puzzle": "🧩", "car": "🚗", "train": "🚂", "bike": "🚲",
    "teddy": "🧸", "bear": "🧸", "duck": "🦆", "kite ": "🪁",
    "drum": "🥁", "guitar": "🎸", "piano": "🎹",
    // Animals
    "cat": "🐱", "dog": "🐶", "rabbit": "🐰", "fish": "🐠",
    "bird": "🐦", "horse": "🐴", "cow": "🐄", "sheep": "🐑",
    "pig": "🐷", "frog": "🐸", "lion": "🦁", "tiger": "🐯",
    "elephant": "🐘", "monkey": "🐒", "bee": "🐝", "fox": "🦊",
    "panda": "🐼", "snake": "🐍", "mouse": "🐭",
    // Food
    "apple": "🍎", "banana": "🍌", "orange ": "🍊", "grape": "🍇",
    "bread": "🍞", "cake": "🍰", "cookie": "🍪", "ice cream": "🍦",
    "milk": "🥛", "juice": "🧃", "water": "💧",
    "pizza": "🍕", "burger": "🍔", "egg": "🥚", "rice": "🍚",
    "fruit": "🍎", "vegetable": "🥦",
    // Body
    "head": "🗣️", "eye": "👁️", "eyes": "👀", "ear": "👂", "ears": "👂",
    "nose": "👃", "mouth": "👄", "hand": "✋", "hands": "🙌",
    "foot": "🦶", "feet": "🦶", "leg": "🦵", "arm": "💪", "hair": "💇",
    "smile": "😊", "tooth": "🦷", "teeth": "🦷",
    // Greetings & general
    "hello": "👋", "hi": "👋", "bye": "👋", "goodbye": "👋",
    "yes": "✅", "no": "❌", "please": "🙏", "thanks": "🙏", "thank you": "🙏",
    // Nature
    "sun": "☀️", "moon": "🌙", "star": "⭐", "cloud": "☁️", "rain": "🌧️",
    "tree": "🌳", "flower": "🌸", "grass": "🌱", "leaf": "🍃",
    "river": "🏞️", "mountain": "⛰️", "sea": "🌊", "beach": "🏖️",
    // House
    "house": "🏠", "home": "🏠", "door": "🚪", "window": "🪟",
    "bed": "🛏️", "lamp": "💡", "tv": "📺", "phone": "📞", "computer": "💻",
    // Clothes
    "shirt": "👕", "trousers": "👖", "shoes": "👟", "hat": "👒",
    "sock": "🧦", "dress": "👗", "skirt": "👗", "jacket": "🧥",
    // Verbs / actions
    "play": "🎲", "run": "🏃", "jump": "🤸", "swim": "🏊", "read": "📖",
    "write": "✍️", "draw": "🎨", "paint": "🎨", "sing": "🎤", "dance": "💃",
    "eat": "🍽️", "drink": "🥤", "sleep": "😴", "walk": "🚶",
    "happy": "😊", "sad": "😢", "angry": "😠", "tired": "😴",
};

// Stand-bys when no word match is found. The hash function still
// gives a stable choice per label so the same word always looks the
// same.
const FALLBACK_EMOJIS = ["🌟", "🎈", "🦋", "🌈", "🎨", "🎵", "🌸", "✨", "🎁", "🦄", "🌻", "🍭"];

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

/**
 * Pick the best emoji for `label`. Tries the exact lowercase match,
 * then any single word in the label, then a stable fallback.
 */
function pickEmoji(label) {
    if (!label) return FALLBACK_EMOJIS[0];
    const key = String(label).trim().toLowerCase();
    if (WORD_EMOJIS[key]) return WORD_EMOJIS[key];

    // Try each whitespace-separated token (e.g. "my dad" → "dad")
    for (const part of key.split(/\s+/)) {
        if (WORD_EMOJIS[part]) return WORD_EMOJIS[part];
    }
    return FALLBACK_EMOJIS[hashCode(key) % FALLBACK_EMOJIS.length];
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
    const emoji = pickEmoji(label);
    const displayLabel = (label || "?").length > 12 ? label.slice(0, 10) + "…" : label;

    if (failed || !src) {
        return (
            <div
                className={`bg-gradient-to-br ${colors.bg} rounded-2xl flex flex-col items-center justify-center gap-1 font-black ${colors.text} border ${colors.border} shadow-inner p-2 ${className} ${fallbackClassName}`}
                title={label}
            >
                <span className="text-[min(2.5rem,40%)] leading-none drop-shadow-sm select-none">
                    {emoji}
                </span>
                <span className="text-[min(0.75rem,18%)] leading-tight text-center font-black uppercase tracking-wide truncate max-w-full px-1 drop-shadow-sm">
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
