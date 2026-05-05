import React from "react";
import { router } from "@inertiajs/react";

const ProgressScreen = ({ user, stats, unitsList }) => {
    // ألوان الوحدات بالترتيب
    const unitColors = [
        "bg-kiddo-purple",
        "bg-kiddo-green",
        "bg-kiddo-blue",
        "bg-pink-500",
        "bg-kiddo-yellow",
    ];

    return (
        <div className="min-h-screen bg-[#F8FBFF] font-sans flex text-[#1E293B] overflow-hidden">
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
                <div
                    className="p-6 cursor-pointer"
                    onClick={() => router.visit("/")}
                >
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8"
                    />
                </div>
                <div className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                        Parent Dashboard
                    </p>
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                👦🏻
                            </div>
                            <div>
                                <h4 className="font-bold text-sm leading-none">
                                    {user?.name || "Alex"}
                                </h4>
                                <span className="text-xs text-gray-500">
                                    Level {user?.level || 1}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-4 mt-4 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-[#7C3AED] rounded-xl font-bold cursor-pointer">
                        <span>📊</span> Overview
                    </div>
                    <div
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors"
                        onClick={() => router.visit("/map")}
                    >
                        <span>🗺️</span> Learning Map
                    </div>
                </nav>
            </aside>

            <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-[#1E293B] hidden sm:block">
                        Dashboard
                    </h2>
                    <button
                        onClick={() => router.visit("/map")}
                        className="bg-[#7C3AED] text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-[#6D28D9] transition-colors"
                    >
                        Back to Map ➔
                    </button>
                </header>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 flex justify-between items-center mb-8 shadow-sm border border-purple-100 relative overflow-hidden">
                    <div className="z-10">
                        <h1 className="text-3xl font-black text-[#7C3AED] mb-2 flex items-center gap-2">
                            Welcome back! <span className="text-2xl">👋</span>
                        </h1>
                        <p className="text-gray-600 font-medium mb-6">
                            Here's how {user?.name || "your child"} is
                            progressing in English.
                        </p>
                    </div>
                    <img
                        src="/assets/ui/mascot/fox-main.png"
                        alt="Fox"
                        className="absolute right-0 bottom-0 h-full object-contain drop-shadow-xl z-10 translate-y-4 opacity-90"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Progress Overview{" "}
                            <span className="text-yellow-400">⭐</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs text-gray-500 font-bold mb-3">
                                    Overall Completion
                                </p>
                                <div className="w-20 h-20 rounded-full border-8 border-[#7C3AED] flex items-center justify-center border-l-purple-200">
                                    <span className="font-black text-xl text-[#7C3AED]">
                                        {stats?.completion_percentage || 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <p className="text-xs text-gray-500 font-bold mb-2">
                                    Total Stars Earned
                                </p>
                                <span className="text-4xl">⭐</span>
                                <span className="font-black text-3xl text-[#1E293B] mt-1">
                                    {user?.total_stars || 0}
                                </span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                <p className="text-xs text-gray-500 font-bold mb-2">
                                    Latest Lesson
                                </p>
                                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-2 shadow-sm">
                                    🎒
                                </div>
                                <span className="font-bold text-sm text-[#1E293B] leading-tight">
                                    {stats?.latest_lesson || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="font-bold text-lg mb-4">
                            Unit Progress
                        </h3>
                        <div className="space-y-4 flex-1">
                            {unitsList &&
                                unitsList.map((unit, index) => (
                                    <div
                                        key={unit.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full ${unitColors[index % 5]} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                                        >
                                            {unit.id}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-[#1E293B]">
                                                    {unit.name}
                                                </span>
                                                <span className="text-gray-500">
                                                    {unit.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${unitColors[index % 5]} rounded-full`}
                                                    style={{
                                                        width: `${unit.percentage}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProgressScreen;
