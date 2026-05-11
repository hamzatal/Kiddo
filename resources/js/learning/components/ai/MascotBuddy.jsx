import React, { useEffect, useState } from "react";

/**
 * Lightweight global mascot that lives on every student page. Unlike
 * FoxHelper (lesson-engine specific, complex state, speech + actions),
 * MascotBuddy only shows the fox avatar and a small speech bubble that
 * cycles every 10 seconds through five child-friendly encouragements.
 *
 * It intentionally uses z-index 40 so lesson screens with FoxHelper
 * (higher z) can always hide or sit on top of this global buddy.
 */
const ENCOURAGEMENTS = [
    "Hello!",
    "Keep going!",
    "You're doing great!",
    "Way to go! ⭐",
    "Let's learn together!",
];

function pickRandom(list, except) {
    if (list.length === 1) return list[0];
    let next = except;
    while (next === except) {
        next = list[Math.floor(Math.random() * list.length)];
    }
    return next;
}

const MascotBuddy = () => {
    const [message, setMessage] = useState(ENCOURAGEMENTS[0]);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const id = setInterval(() => {
            setMessage((prev) => pickRandom(ENCOURAGEMENTS, prev));
        }, 10_000);
        return () => clearInterval(id);
    }, []);

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-5 right-5 pointer-events-none select-none"
            style={{ zIndex: 40 }}
            aria-hidden="true"
        >
            <div className="flex items-end gap-2">
                <div className="pointer-events-auto bg-white rounded-2xl shadow-lg border border-purple-100 px-3 py-2 text-xs font-black text-[#1E293B] max-w-[180px] relative">
                    <span className="block leading-tight">{message}</span>
                    <span
                        className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-purple-100 rotate-45"
                        aria-hidden="true"
                    />
                    <button
                        type="button"
                        onClick={() => setVisible(false)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-black flex items-center justify-center hover:bg-red-100 hover:text-red-500 shadow"
                        aria-label="Hide mascot"
                        title="Hide"
                    >
                        ×
                    </button>
                </div>
                <img
                    src="/assets/ui/mascot/fox-main.png"
                    alt="Kiddo Fox"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
            </div>
        </div>
    );
};

export default MascotBuddy;
