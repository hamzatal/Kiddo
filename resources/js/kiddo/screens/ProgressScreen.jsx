import React from "react";

const ProgressScreen = ({ onNavigate }) => {
    return (
        <div className="min-h-screen bg-kiddo-bg font-sans flex text-kiddo-text overflow-hidden">
            {/* 1. الشريط الجانبي (Sidebar) */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
                <div
                    className="p-6 cursor-pointer"
                    onClick={() => onNavigate("home")}
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
                                    Alex
                                </h4>
                                <span className="text-xs text-gray-500">
                                    Age 6
                                </span>
                            </div>
                        </div>
                        <span className="text-gray-400 font-bold">⌄</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-4 space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3 bg-kiddo-lightblue text-kiddo-purple rounded-xl font-bold cursor-pointer">
                        <span>📊</span> Overview
                    </div>
                    <div
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors"
                        onClick={() => onNavigate("map")}
                    >
                        <span>📖</span> Lessons
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors">
                        <span>🔤</span> Vocabulary
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors">
                        <span>🎮</span> Activities
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors">
                        <span>📈</span> Reports
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium cursor-pointer transition-colors">
                        <span>🏆</span> Certificates
                    </div>
                </nav>

                <div className="p-6">
                    <div className="bg-gradient-to-br from-purple-50 to-kiddo-lightblue p-4 rounded-2xl border border-purple-100 relative overflow-hidden">
                        <h4 className="font-bold text-kiddo-purple flex items-center gap-2 mb-1">
                            <span>👑</span> Go Premium
                        </h4>
                        <p className="text-xs text-gray-600 mb-3 relative z-10">
                            Unlock all lessons, games, and advanced reports.
                        </p>
                        <button className="w-full bg-kiddo-purple text-white py-2 rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 transition-colors relative z-10">
                            Upgrade Now
                        </button>
                    </div>
                </div>
            </aside>

            {/* 2. المحتوى الرئيسي (Main Content) */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
                {/* خلفية غيوم خفيفة */}
                <div className="absolute top-0 right-0 w-full h-64 bg-[url('/assets/ui/hero/clouds.png')] bg-cover opacity-20 -z-10 pointer-events-none"></div>

                {/* 2.1 الشريط العلوي للمحتوى */}
                <header className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-kiddo-text hidden sm:block">
                        Dashboard
                    </h2>
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="relative cursor-pointer">
                            <span className="text-2xl">🔔</span>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-kiddo-red text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                3
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 cursor-pointer">
                            <div className="w-6 h-6 bg-kiddo-purple text-white rounded-full flex items-center justify-center text-xs">
                                P
                            </div>
                            <span className="text-sm font-bold text-gray-600">
                                Parent ⌄
                            </span>
                        </div>
                    </div>
                </header>

                {/* 2.2 بانر الترحيب (Welcome Banner) */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 flex justify-between items-center mb-8 shadow-sm border border-purple-100 relative overflow-hidden">
                    <div className="z-10">
                        <h1 className="text-3xl font-black text-kiddo-purple mb-2 flex items-center gap-2">
                            Welcome back, Parent!{" "}
                            <span className="text-2xl">👋</span>
                        </h1>
                        <p className="text-gray-600 font-medium mb-6">
                            Here's how Alex is progressing in English.
                        </p>

                        <div className="flex items-center gap-4 bg-white/60 w-fit px-4 py-3 rounded-2xl backdrop-blur-sm border border-white">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">
                                👦🏻
                            </div>
                            <div>
                                <h3 className="font-bold text-kiddo-text flex items-center gap-2">
                                    Alex{" "}
                                    <span className="text-gray-400 text-xs">
                                        ✏️
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    Age 6 • Beginner Level
                                    <br />
                                    Member since May 2026
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* الثعلب والقلعة في الخلفية */}
                    <div className="absolute right-0 bottom-0 h-full w-1/2 flex justify-end items-end pointer-events-none opacity-90">
                        <img
                            src="/assets/ui/mascot/fox-main.png"
                            alt="Fox"
                            className="h-full object-contain drop-shadow-xl z-10 translate-y-4"
                        />
                        <div className="absolute right-10 bottom-0 w-48 h-48 bg-gradient-to-t from-pink-200 to-transparent rounded-full blur-3xl -z-10"></div>
                    </div>
                </div>

                {/* 2.3 الإحصائيات (Stats Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Progress Overview */}
                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            Progress Overview{" "}
                            <span className="text-kiddo-yellow">⭐</span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* الدائرة 68% */}
                            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs text-gray-500 font-bold mb-3">
                                    Overall Completion
                                </p>
                                <div className="w-20 h-20 rounded-full border-8 border-kiddo-purple flex items-center justify-center border-l-purple-200">
                                    <span className="font-black text-xl text-kiddo-purple">
                                        68%
                                    </span>
                                </div>
                            </div>

                            {/* النجوم */}
                            <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                <p className="text-xs text-gray-500 font-bold mb-2">
                                    Total Stars Earned
                                </p>
                                <span className="text-4xl">⭐</span>
                                <span className="font-black text-3xl text-kiddo-text mt-1">
                                    215
                                </span>
                                <span className="text-xs text-kiddo-yellow font-bold mt-1">
                                    Stars
                                </span>
                            </div>

                            {/* الدرس الأخير */}
                            <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                <p className="text-xs text-gray-500 font-bold mb-2">
                                    Latest Lesson
                                </p>
                                <div className="w-10 h-10 bg-kiddo-blue rounded-xl flex items-center justify-center text-white mb-2 shadow-sm">
                                    🎒
                                </div>
                                <span className="font-bold text-sm text-kiddo-text leading-tight">
                                    My School Bag
                                </span>
                                <button
                                    onClick={() => onNavigate("lesson")}
                                    className="text-xs text-kiddo-blue font-bold mt-2 hover:underline"
                                >
                                    Continue Learning
                                </button>
                            </div>

                            {/* نقاط القوة والضعف */}
                            <div className="flex flex-col gap-3">
                                <div className="bg-green-50 rounded-xl p-3 border border-green-100 flex-1 flex flex-col justify-center items-center text-center">
                                    <p className="text-[10px] text-gray-500 font-bold">
                                        Strongest Skill
                                    </p>
                                    <span className="text-kiddo-green font-bold text-sm mt-1 flex items-center gap-1">
                                        🎧 Listening
                                    </span>
                                    <span className="text-lg font-black text-kiddo-text">
                                        82%
                                    </span>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex-1 flex flex-col justify-center items-center text-center">
                                    <p className="text-[10px] text-gray-500 font-bold">
                                        Needs Practice
                                    </p>
                                    <span className="text-kiddo-red font-bold text-sm mt-1 flex items-center gap-1">
                                        📝 Quizzes
                                    </span>
                                    <span className="text-lg font-black text-kiddo-text">
                                        45%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Unit Progress List */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="font-bold text-lg mb-1">
                            Unit Progress
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            5 Units in total
                        </p>

                        <div className="space-y-4 flex-1">
                            {/* Unit 1 */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-kiddo-purple text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    1
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-kiddo-text">
                                            Welcome / Hello
                                        </span>
                                        <span className="text-kiddo-purple">
                                            100% ⭐
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-kiddo-purple w-full rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Unit 2 */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-kiddo-green text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    2
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-kiddo-text">
                                            Family and Friends
                                        </span>
                                        <span className="text-kiddo-green">
                                            80% ⭐
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-kiddo-green w-[80%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Unit 3 */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-kiddo-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    3
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-kiddo-text">
                                            My School Bag
                                        </span>
                                        <span className="text-kiddo-blue">
                                            60% ☆
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-kiddo-blue w-[60%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Unit 4 */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    4
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-kiddo-text">
                                            Our Classroom
                                        </span>
                                        <span className="text-pink-500">
                                            40% ☆
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-pink-500 w-[40%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Unit 5 */}
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-kiddo-yellow text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    5
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-kiddo-text">
                                            My Favourite Toy
                                        </span>
                                        <span className="text-kiddo-yellow">
                                            20% ☆
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full">
                                        <div className="h-full bg-kiddo-yellow w-[20%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="text-kiddo-purple text-xs font-bold w-full text-center mt-4 hover:underline">
                            View All Units
                        </button>
                    </div>
                </div>

                {/* بانر التشجيع السفلي */}
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200 flex items-center justify-center gap-4 relative overflow-hidden">
                    <span className="text-4xl absolute left-4 opacity-50">
                        🏆
                    </span>
                    <div className="text-center z-10">
                        <h4 className="font-black text-kiddo-text text-lg">
                            Keep it up, Alex!
                        </h4>
                        <p className="text-sm text-gray-600">
                            You're doing amazing! Consistency is the key to
                            success.
                        </p>
                    </div>
                    <span className="text-4xl absolute right-4 opacity-50">
                        ⭐
                    </span>
                </div>
            </main>
        </div>
    );
};

export default ProgressScreen;
