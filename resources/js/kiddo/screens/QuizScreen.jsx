import React, { useState } from "react";
import { router } from "@inertiajs/react";

const QuizScreen = ({ quizData }) => {
    const [selected, setSelected] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    const handleFinish = () => {
        router.post("/quiz/submit", {
            unit_id: quizData.unit_id,
            stars_earned: 3,
            xp_earned: 50,
        });
    };

    return (
        <div className="h-screen w-screen bg-[#F8FBFF] flex flex-col items-center justify-center p-6">
            {!isFinished ? (
                <div className="max-w-4xl w-full text-center">
                    <h2 className="text-4xl font-black text-[#1E293B] mb-12">
                        Where is the{" "}
                        <span className="text-[#7C3AED] underline">
                            {quizData.targetWord}
                        </span>
                        ?
                    </h2>
                    <div className="grid grid-cols-3 gap-8">
                        {quizData.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    setSelected(opt.id);
                                    if (opt.isCorrect)
                                        setTimeout(
                                            () => setIsFinished(true),
                                            1000,
                                        );
                                }}
                                className={`p-6 bg-white rounded-[2.5rem] border-4 transition-all shadow-sm
                                ${selected === opt.id ? (opt.isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50") : "border-gray-100 hover:border-purple-200"}`}
                            >
                                <img
                                    src={opt.imagePath}
                                    className="w-full aspect-square object-contain"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center animate-fade-in">
                    <div className="w-48 h-48 bg-yellow-100 rounded-full flex items-center justify-center text-8xl mx-auto mb-8 shadow-xl border-8 border-white">
                        🏆
                    </div>
                    <h1 className="text-5xl font-black text-[#1E293B] mb-4">
                        Unit Complete!
                    </h1>
                    <p className="text-xl text-gray-500 font-bold mb-10">
                        You earned 3 Stars and 50 XP!
                    </p>
                    <button
                        onClick={handleFinish}
                        className="bg-[#10B981] text-white px-12 py-4 rounded-[2rem] font-black text-xl shadow-[0_6px_0_#059669]"
                    >
                        Collect Rewards ➔
                    </button>
                </div>
            )}
        </div>
    );
};
export default QuizScreen;
