import React, { useEffect, useState } from "react";

/**
 * SmartImage — image with elegant child-friendly fallback.
 *
 * When `src` loads, shows the picture. When `src` is missing OR the
 * <img> fires an error, shows a colourful card with a meaningful
 * emoji (chosen from a curated word→emoji map) plus the word text.
 *
 * v3 bugfix: previously, if a card flagged itself as "failed" in
 * round N (because the image 404'd), and then in round N+1 the
 * parent passed a NEW `src`, the `useState(!src)` initial value
 * was stale and the fallback tile would persist. This meant a
 * word like "two" — whose admin-provided image_path is correct —
 * rendered as the literal "2️⃣" emoji of the PREVIOUS word, which
 * the operator saw as "numbers leaking into the next question".
 *
 * The fix is a useEffect that resets `failed` whenever `src`
 * changes, so each round starts fresh.
 */

const COLORS = [
    { bg: "from-purple-100 to-purple-300", text: "text-purple-800" },
    { bg: "from-blue-100 to-blue-300", text: "text-blue-800" },
    { bg: "from-emerald-100 to-emerald-300", text: "text-emerald-800" },
    { bg: "from-amber-100 to-amber-300", text: "text-amber-800" },
    { bg: "from-pink-100 to-pink-300", text: "text-pink-800" },
    { bg: "from-cyan-100 to-cyan-300", text: "text-cyan-800" },
    { bg: "from-rose-100 to-rose-300", text: "text-rose-800" },
    { bg: "from-indigo-100 to-indigo-300", text: "text-indigo-800" },
    { bg: "from-teal-100 to-teal-300", text: "text-teal-800" },
    { bg: "from-orange-100 to-orange-300", text: "text-orange-800" },
];

/**
 * Curated word → emoji map. Hand-picked so the fallback tile
 * looks like the word the child is learning. Covers the full
 * Team Together 1A vocabulary plus common first-grade nouns.
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
    // School
    "book": "📖", "pen": "🖊️", "pencil": "✏️", "ruler": "📏", "crayon": "🖍️",
    "bag": "🎒", "schoolbag": "🎒", "backpack": "🎒",
    "rubber": "🩹", "eraser": "🩹", "sharpener": "✏️",
    "desk": "🪑", "chair": "🪑", "table": "🪑", "board": "📋",
    "school": "🏫", "classroom": "🏫", "teacher": "👩‍🏫",
    "notebook": "📓", "paper": "📄", "scissors": "✂️", "glue": "🧴",
    // Toys
    "toy": "🧸", "ball": "⚽", "doll": "🧸", "kite": "🪁",
    "robot": "🤖", "puzzle": "🧩", "car": "🚗", "train": "🚂", "bike": "🚲",
    "teddy": "🧸", "bear": "🧸", "duck": "🦆",
    "drum": "🥁", "guitar": "🎸", "piano": "🎹",
    // Animals
    "cat": "🐱", "dog": "🐶", "rabbit": "🐰", "fish": "🐠",
    "bird": "🐦", "horse": "🐴", "cow": "🐄", "sheep": "🐑",
    "pig": "🐷", "frog": "🐸", "lion": "🦁", "tiger": "🐯",
    "elephant": "🐘", "monkey": "🐒", "bee": "🐝", "fox": "🦊",
    // Food
    "apple": "🍎", "banana": "🍌", "grape": "🍇",
    "bread": "🍞", "cake": "🍰", "cookie": "🍪", "ice cream": "🍦",
    "milk": "🥛", "juice": "🧃", "water": "💧",
    "pizza": "🍕", "burger": "🍔", "egg": "🥚", "rice": "🍚",
    // Body
    "head": "🗣️", "eye": "👁️", "eyes": "👀", "ear": "👂", "ears": "👂",
    "nose": "👃", "mouth": "👄", "hand": "✋", "hands": "🙌",
    "foot": "🦶", "feet": "🦶", "leg": "🦵", "arm": "💪", "hair": "💇",
    "tooth": "🦷", "teeth": "🦷",
    // Greetings
    "hello": "👋", "hi": "👋", "bye": "👋", "goodbye": "👋",
    "yes": "✅", "no": "❌", "please": "🙏", "thanks": "🙏", "thank you": "🙏",
    // Nature
    "sun": "☀️", "moon": "🌙", "star": "⭐", "cloud": "☁️", "rain": "🌧️",
    "tree": "🌳", "flower": "🌸", "grass": "🌱", "leaf": "🍃",
    // House
    "house": "🏠", "home": "🏠", "door": "🚪", "window": "🪟",
    "bed": "🛏️", "lamp": "💡", "tv": "📺", "phone": "📞",
    // Clothes
    "shirt": "👕", "trousers": "👖", "shoes": "👟", "hat": "👒",
    "sock": "🧦", "dress": "👗", "skirt": "👗", "jacket": "🧥",
    // Verbs
    "play": "🎲", "run": "🏃", "jump": "🤸", "swim": "🏊", "read": "📖",
    "write": "✍️", "draw": "🎨", "paint": "🎨", "sing": "🎤", "dance": "💃",
    "eat": "🍽️", "drink": "🥤", "sleep": "😴", "walk": "🚶",
    "happy": "😊", "sad": "😢", "angry": "😠", "tired": "😴",
};

const FALLBACK_EMOJIS = ["🌟", "🎈", "🦋", "🌈", "🎨", "🎵", "🌸", "✨", "🎁", "🦄"];

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function pickEmoji(label) {
    if (!label) return FALLBACK_EMOJIS[0];
    const key = String(label).trim().toLowerCase();
    if (WORD_EMOJIS[key]) return WORD_EMOJIS[key];
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
    // Normalise to a stable string so undefined / "" both look like
    // "no image" and won't trigger a re-render storm.
    const cleanSrc = src ? String(src) : "";
    const [failed, setFailed] = useState(!cleanSrc);

    // CRITICAL: reset the failed flag whenever the src prop changes.
    // Without this, a card that 404'd in round N (e.g. an admin
    // reordered images) keeps the fallback in round N+1 even though
    // the new round legitimately has a real picture. Symptom: "the
    // number from the previous question keeps showing up".
    useEffect(() => {
        setFailed(!cleanSrc);
    }, [cleanSrc]);

    const hash = hashCode(label);
    const colors = COLORS[hash % COLORS.length];
    const emoji = pickEmoji(label);
    const displayLabel = (label || "?").length > 12 ? label.slice(0, 10) + "…" : label;

    if (failed || !cleanSrc) {
        return (
            <div
                className={`bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-center gap-1 font-black ${colors.text} shadow-inner p-2 ${className} ${fallbackClassName}`}
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
            // Bumping the key with cleanSrc forces a brand-new <img>
            // element when the URL changes. Without this React reuses
            // the same DOM node and (rarely) skips emitting the new
            // src causing a previous picture to "stick".
            key={cleanSrc}
            src={cleanSrc}
            alt={alt || label}
            className={`${className} ${imgClassName}`}
            draggable={false}
            onError={(e) => {
                setFailed(true);
                onError?.(e);
            }}
        />
    );
};

export default SmartImage;
