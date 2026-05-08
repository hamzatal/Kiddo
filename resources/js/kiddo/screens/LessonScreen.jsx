import React, { useState } from "react";
import { router } from "@inertiajs/react";
import GameStage from "../stages/GameStage";
import RewardStage from "../stages/RewardStage";

const LessonScreen = ({ unit, wordData }) => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Learn, 1: Play, 2: Reward

    const steps = [
        { id: 0, label: "Learn", icon: "📖", color: "bg-blue-500" },
        { id: 1, label: "Play", icon: "🎮", color: "bg-green-500" },
        { id: 2, label: "Reward", icon: "🏆", color: "bg-amber-500" },
    ];

    return (
        <div className="h-screen w-screen flex flex-col bg-[#F0F4FF] font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
                <img
                    src="/assets/ui/hero/title-logo.png"
                    className="h-8"
                    alt="Kiddo"
                    onClick={() => router.visit("/")}
                />
                <button
                    onClick={() => router.visit("/map")}
                    className="w-10 h-10 bg-gray-100 rounded-full font-black text-gray-500"
                >
                    ✕
                </button>
            </header>

            {/* Step Progress */}
            <div className="flex justify-center gap-4 py-4 bg-white/50">
                {steps.map((s, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm transition-all ${currentStep === i ? `${s.color} text-white shadow-md scale-105` : "bg-white text-gray-400 opacity-60"}`}
                    >
                        <span>{s.icon}</span> {s.label}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-6 flex flex-col items-center">
                {currentStep === 0 && (
                    <div className="flex-1 bg-white rounded-[2.5rem] w-full max-w-4xl p-8 flex flex-col lg:flex-row items-center justify-center gap-12 shadow-sm border border-gray-100 animate-fade-in">
                        <div className="w-64 h-64 bg-purple-50 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-inner">
                            <img
                                src={wordData.image_path}
                                className="w-48 object-contain drop-shadow-xl"
                                alt={wordData.word}
                            />
                        </div>
                        <div className="text-center lg:text-left">
                            <h1 className="text-7xl font-black text-[#1E293B] tracking-tight mb-6">
                                {wordData.word.toUpperCase()}
                            </h1>
                            <button className="bg-[#7C3AED] text-white px-10 py-4 rounded-2xl font-black text-xl shadow-[0_5px_0_#5B21B6] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3">
                                <span>🔊</span> Listen
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <GameStage
                        wordData={wordData}
                        onWin={() => setCurrentStep(2)}
                    />
                )}

                {currentStep === 2 && <RewardStage word={wordData.word} />}
            </main>

            {/* Bottom Nav */}
            <footer className="p-6 bg-white border-t flex justify-between items-center">
                <button
                    onClick={() => router.visit("/map")}
                    className="text-gray-400 font-black hover:text-[#7C3AED]"
                >
                    ← Back to Map
                </button>
                <button
                    onClick={() =>
                        currentStep < 2
                            ? setCurrentStep(currentStep + 1)
                            : router.visit(`/quiz/${unit.id}`)
                    }
                    className="bg-[#10B981] text-white px-10 py-3.5 rounded-2xl font-black shadow-[0_4px_0_#059669] hover:translate-y-1 hover:shadow-none transition-all"
                >
                    {currentStep === 2 ? "Go to Final Quiz ➔" : "Next Step ➔"}
                </button>
            </footer>
        </div>
    );
};
export default LessonScreen;
