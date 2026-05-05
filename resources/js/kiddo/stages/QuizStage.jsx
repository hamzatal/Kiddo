import React, { useState, useEffect } from "react";

const QuizStage = ({ word }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [progress, setProgress] = useState(0);

    // محاكاة عملية التسجيل
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setProgress((old) => {
                    if (old >= 100) {
                        clearInterval(interval);
                        setIsRecording(false);
                        setIsDone(true);
                        return 100;
                    }
                    return old + 2; // زيادة التقدم كل 50 ملي ثانية
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleRecordClick = () => {
        if (!isRecording && !isDone) {
            setIsRecording(true);
            setProgress(0);
        }
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl shadow-sm border border-pink-100 flex flex-col items-center justify-center gap-6 animate-fade-in-up p-4 sm:p-8 text-center relative overflow-hidden">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-md z-10 border border-pink-100">
                🎤
            </div>

            <div className="z-10">
                <h2 className="text-3xl sm:text-4xl font-black text-[#1E293B]">
                    Speak Now
                </h2>
                <p className="text-base sm:text-lg font-bold text-gray-600 mt-2">
                    Can you say{" "}
                    <span className="text-[#DB2777] font-black uppercase text-xl">
                        "{word}"
                    </span>{" "}
                    out loud?
                </p>
            </div>

            {/* زر المايكروفون التفاعلي */}
            <div className="relative mt-4 flex flex-col items-center">
                {isRecording && (
                    <>
                        <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-20 scale-150"></div>
                        <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-40 scale-125 animation-delay-300"></div>
                    </>
                )}

                <button
                    onClick={handleRecordClick}
                    disabled={isRecording || isDone}
                    className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-4xl sm:text-5xl transition-all duration-300 shadow-xl border-4 
                    ${
                        isDone
                            ? "bg-[#16A34A] border-green-300 text-white"
                            : isRecording
                              ? "bg-[#DB2777] border-pink-300 text-white scale-110 shadow-[0_0_40px_rgba(219,39,119,0.5)]"
                              : "bg-white border-pink-200 hover:scale-105 active:scale-95"
                    }`}
                >
                    {isDone ? "✓" : "🎙️"}
                </button>

                {/* شريط التقدم أثناء التسجيل */}
                {isRecording && (
                    <div className="w-32 h-2 bg-pink-100 rounded-full mt-6 overflow-hidden">
                        <div
                            className="h-full bg-[#DB2777] rounded-full transition-all duration-75"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>

            {/* رسالة التقييم بعد التسجيل */}
            <div
                className={`mt-2 transition-all duration-500 ${isDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
            >
                <div className="bg-white border border-pink-100 px-6 py-3 rounded-2xl shadow-sm">
                    <p className="font-black text-[#DB2777] text-lg">
                        Perfect Pronunciation! 🌟
                    </p>
                    <p className="text-xs text-gray-500 font-bold mt-1">
                        You sound just like a native speaker.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuizStage;
