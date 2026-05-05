import React, { useState, useEffect } from "react";

const GameStage = ({ word, image, emoji }) => {
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("playing"); // 'playing', 'won'
    const [wrongClicks, setWrongClicks] = useState([]);

    // تجهيز الخيارات وخلطها عشوائياً عند فتح اللعبة
    useEffect(() => {
        const decoys = [
            { id: "d1", isCorrect: false, content: "🧸", type: "emoji" },
            { id: "d2", isCorrect: false, content: "🎒", type: "emoji" },
            { id: "d3", isCorrect: false, content: "🍎", type: "emoji" },
            { id: "d4", isCorrect: false, content: "🚗", type: "emoji" },
        ];

        // اختيار 2 غلط بشكل عشوائي
        const selectedDecoys = decoys
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);

        // الخيار الصحيح (جاي من الباك إند)
        const correctOption = {
            id: "correct",
            isCorrect: true,
            content: image,
            type: "image",
            fallbackEmoji: emoji,
        };

        // دمجهم وخلطهم
        const finalOptions = [...selectedDecoys, correctOption].sort(
            () => 0.5 - Math.random(),
        );
        setOptions(finalOptions);
    }, [word, image, emoji]);

    const handleTap = (opt) => {
        if (status === "won") return;

        if (opt.isCorrect) {
            setStatus("won");
            // هون بنقدر نشغل صوت نجاح (Success Sound)
            const audio = new Audio("/assets/audio/success.mp3");
            audio.play().catch((e) => console.log("Audio play ignored"));
        } else {
            if (!wrongClicks.includes(opt.id)) {
                setWrongClicks([...wrongClicks, opt.id]);
                // صوت خطأ (Error Sound)
                const audio = new Audio("/assets/audio/error.mp3");
                audio.play().catch((e) => console.log("Audio play ignored"));
            }
        }
    };

    return (
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-6 animate-fade-in-up p-4 sm:p-8 text-center relative overflow-hidden">
            {/* خلفية غيوم */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('/assets/ui/hero/clouds.png')] bg-cover pointer-events-none" />

            <div className="z-10 flex flex-col items-center gap-2">
                <span className="text-4xl animate-bounce-slow">🎮</span>
                <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B]">
                    Find the <span className="text-[#16A34A]">{word}</span>!
                </h2>
                <p className="text-gray-400 font-bold">
                    Tap the correct picture below.
                </p>
            </div>

            {/* أزرار اللعبة */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 z-10 w-full">
                {options.map((opt) => {
                    const isWrong = wrongClicks.includes(opt.id);
                    const isWonAndCorrect = status === "won" && opt.isCorrect;

                    let btnStyle =
                        "bg-gray-50 border-gray-200 text-gray-700 hover:border-[#7C3AED] hover:shadow-md";

                    if (isWrong) {
                        btnStyle =
                            "bg-red-50 border-red-200 opacity-50 grayscale scale-95 cursor-not-allowed";
                    } else if (isWonAndCorrect) {
                        btnStyle =
                            "bg-green-100 border-green-400 scale-110 shadow-[0_0_30px_rgba(22,163,74,0.4)] z-20";
                    }

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleTap(opt)}
                            disabled={isWrong || status === "won"}
                            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 transition-all duration-300 text-5xl sm:text-6xl flex items-center justify-center relative ${btnStyle}`}
                        >
                            {isWonAndCorrect && (
                                <span className="absolute -top-4 -right-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl border-2 border-white shadow-lg animate-bounce">
                                    ✓
                                </span>
                            )}

                            {opt.type === "emoji" ? (
                                <span className="drop-shadow-md">
                                    {opt.content}
                                </span>
                            ) : (
                                <img
                                    src={opt.content}
                                    alt="option"
                                    className="w-[70%] h-[70%] object-contain drop-shadow-md"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.insertAdjacentHTML(
                                            "afterend",
                                            `<span>${opt.fallbackEmoji}</span>`,
                                        );
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* رسالة النجاح */}
            <div
                className={`mt-4 transition-all duration-500 ${status === "won" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
            >
                <div className="bg-green-50 border border-green-200 px-6 py-3 rounded-2xl inline-flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <span className="font-black text-green-600 text-lg">
                        Amazing! You found it!
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GameStage;
