import React from "react";

const RewardStage = ({ word }) => {
    return (
        <div className="flex-1 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center gap-6 animate-fade-in-up p-8 text-center relative overflow-hidden">
            {/* مؤثرات بصرية في الخلفية */}
            <div className="absolute top-10 left-10 text-4xl animate-bounce-slow">
                ⭐
            </div>
            <div
                className="absolute top-20 right-16 text-5xl animate-bounce-slow"
                style={{ animationDelay: "0.5s" }}
            >
                ✨
            </div>
            <div
                className="absolute bottom-16 left-1/4 text-3xl animate-bounce-slow"
                style={{ animationDelay: "1s" }}
            >
                🌟
            </div>

            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-6xl shadow-lg border-4 border-yellow-200 z-10">
                🎁
            </div>

            <div className="z-10">
                <h2 className="text-4xl font-black text-[#D97706] mb-2">
                    Awesome Job!
                </h2>
                <p className="text-lg font-bold text-gray-600">
                    You learned the word{" "}
                    <span className="text-[#7C3AED] font-black uppercase">
                        "{word}"
                    </span>
                </p>
            </div>

            <div className="mt-4 px-6 py-3 bg-white rounded-2xl border-2 border-yellow-200 inline-flex items-center gap-3 z-10 shadow-sm">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Lesson Reward
                    </p>
                    <p className="text-xl font-black text-[#D97706]">
                        Ready for Quiz!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RewardStage;
