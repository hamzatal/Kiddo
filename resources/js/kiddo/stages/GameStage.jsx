import React, { useState, useEffect } from "react";

const GameStage = ({ wordData, onWin }) => {
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("playing");
    const [wrongClicks, setWrongClicks] = useState([]);

    useEffect(() => {
        const correct = {
            id: "correct",
            content: wordData.image_path,
            isCorrect: true,
            text: wordData.word,
        };
        const decoys = wordData.wrong_options.map((w, i) => ({
            id: `w${i}`,
            content: null,
            isCorrect: false,
            text: w,
        }));
        setOptions([...decoys, correct].sort(() => 0.5 - Math.random()));
    }, [wordData]);

    const handleSelect = (opt) => {
        if (opt.isCorrect) {
            setStatus("won");
            setTimeout(onWin, 2000);
        } else {
            setWrongClicks([...wrongClicks, opt.id]);
        }
    };

    return (
        <div className="flex-1 bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100">
            <h2 className="text-3xl font-black text-[#1E293B] mb-8">
                Find the{" "}
                <span className="text-[#7C3AED] underline decoration-dashed">
                    {wordData.word}
                </span>
                !
            </h2>
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        disabled={
                            status === "won" || wrongClicks.includes(opt.id)
                        }
                        onClick={() => handleSelect(opt)}
                        className={`aspect-square rounded-3xl border-4 transition-all flex items-center justify-center text-6xl shadow-sm
                        ${
                            wrongClicks.includes(opt.id)
                                ? "bg-red-50 border-red-200 opacity-40"
                                : status === "won" && opt.isCorrect
                                  ? "bg-green-100 border-green-500 scale-105 shadow-xl"
                                  : "bg-gray-50 border-gray-100 hover:border-purple-300"
                        }`}
                    >
                        {opt.isCorrect ? (
                            <img
                                src={opt.content}
                                className="w-24 h-24 object-contain"
                            />
                        ) : (
                            "❓"
                        )}
                    </button>
                ))}
            </div>
            {status === "won" && (
                <div className="mt-6 text-2xl font-black text-green-600 animate-bounce">
                    Perfect! 🎉
                </div>
            )}
        </div>
    );
};
export default GameStage;
