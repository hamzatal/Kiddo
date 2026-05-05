import React, { useState } from "react";

// استدعاء الشاشات من مجلد screens الخاص بك
import HomeScreen from "./screens/HomeScreen";
import MapScreen from "./screens/MapScreen";
import LessonScreen from "./screens/LessonScreen";
import ProgressScreen from "./screens/ProgressScreen";
import QuizScreen from "./screens/QuizScreen";

const Kiddo = () => {
    // الحالة المسؤولة عن تحديد الشاشة الحالية (نبدأ بالشاشة الرئيسية)
    const [currentScreen, setCurrentScreen] = useState("home");

    // دالة التنقل المركزية اللي بنمررها لكل الشاشات
    const navigateTo = (screenName) => {
        // تشغيل صوت النقر (إذا كان موجود في الـ utils أو الـ assets)
        try {
            const clickAudio = new Audio("/assets/audio/ui/click.mp3");
            clickAudio.volume = 0.5;
            clickAudio
                .play()
                .catch((e) => console.log("Audio blocked pending interaction"));
        } catch (error) {
            // صامت في حال عدم وجود الصوت
        }

        setCurrentScreen(screenName);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="kiddo-root w-full min-h-screen bg-[#F8FBFF] overflow-hidden">
            {/* شريط المطورين (Dev Menu) - للتنقل السريع أثناء البرمجة فقط */}
            <div className="fixed bottom-0 right-0 z-[9999] bg-black/80 text-white px-3 py-2 text-xs flex gap-3 rounded-tl-xl backdrop-blur-sm shadow-2xl border-t border-l border-white/20">
                <span className="opacity-50 font-black">Dev Menu:</span>
                <button
                    onClick={() => navigateTo("home")}
                    className="hover:text-[#FFC107] transition-colors"
                >
                    Home
                </button>
                <button
                    onClick={() => navigateTo("map")}
                    className="hover:text-[#FFC107] transition-colors"
                >
                    Map
                </button>
                <button
                    onClick={() => navigateTo("lesson")}
                    className="hover:text-[#FFC107] transition-colors"
                >
                    Lesson
                </button>
                <button
                    onClick={() => navigateTo("quiz")}
                    className="hover:text-[#FFC107] transition-colors"
                >
                    Quiz
                </button>
                <button
                    onClick={() => navigateTo("progress")}
                    className="hover:text-[#FFC107] transition-colors"
                >
                    Progress
                </button>
            </div>

            {/* نظام التوجيه (Routing) بناءً على الستركشر الخاص بك */}
            {currentScreen === "home" && <HomeScreen onNavigate={navigateTo} />}
            {currentScreen === "map" && <MapScreen onNavigate={navigateTo} />}
            {currentScreen === "lesson" && (
                <LessonScreen onNavigate={navigateTo} />
            )}
            {currentScreen === "quiz" && <QuizScreen onNavigate={navigateTo} />}
            {currentScreen === "progress" && (
                <ProgressScreen onNavigate={navigateTo} />
            )}
        </div>
    );
};

export default Kiddo;
