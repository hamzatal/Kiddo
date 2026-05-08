import React from "react";

const RewardStage = ({ word }) => (
    <div className="flex-1 bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-10 left-10 text-4xl animate-pulse">⭐</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-pulse delay-75">
            ✨
        </div>
        <img
            src="/assets/ui/rewards/fox-certificate.png"
            alt="Success"
            className="w-64 md:w-80 object-contain drop-shadow-2xl mb-6"
        />
        <h2 className="text-4xl font-black text-[#D97706]">Awesome Job!</h2>
        <p className="text-gray-500 font-bold text-lg mt-2">
            You mastered the word{" "}
            <span className="text-[#7C3AED]">"{word}"</span>
        </p>
    </div>
);
export default RewardStage;
