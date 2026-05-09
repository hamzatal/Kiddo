import React, { useState } from "react";
import { router } from "@inertiajs/react";

const QuizScreen = ({ quizData }) => {
    const [selected, setSelected] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    // داتا احتياطية عشان ما تضرب الشاشة لو تأخر الباك إند
    const data = quizData || {
        unit_id: 1,
        targetWord: "Word",
        options: [],
    };

    const handleFinish = () => {
        router.post("/quiz/submit", {
            unit_id: data.unit_id,
            stars_earned: 3,
            xp_earned: 50,
        });
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#F4F8FB] font-sans flex flex-col overflow-hidden relative">
            {/* ── خلفية ديناميكية متحركة (لطيفة للأطفال) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000"></div>
            </div>

            {/* ── الهيدر (زر الخروج واللوجو) ── */}
            <header className="absolute top-0 left-0 w-full p-6 flex justify-between z-20 pointer-events-none">
                <img
                    src="/assets/ui/hero/title-logo.png"
                    alt="Kiddo"
                    className="h-10 drop-shadow-md"
                />
                <button
                    onClick={() => router.visit("/map")}
                    className="pointer-events-auto w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-md transition-colors"
                >
                    ✕
                </button>
            </header>

            {!isFinished ? (
                // ═══════════════════════════════════════════
                // شاشة الكويز (السؤال)
                // ═══════════════════════════════════════════
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                    <h2 className="text-4xl sm:text-5xl font-black text-[#1E293B] mb-12 drop-shadow-sm text-center">
                        Where is the{" "}
                        <span className="text-[#7C3AED] relative inline-block">
                            {data.targetWord}
                            <svg
                                className="absolute w-full h-3 -bottom-2 left-0 text-purple-300"
                                viewBox="0 0 100 10"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M0 5 Q 50 10 100 5"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                        ?
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
                        {data.options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => {
                                    setSelected(opt.id);
                                    if (opt.isCorrect) {
                                        new Audio("/assets/audio/success.mp3")
                                            .play()
                                            .catch(() => {});
                                        setTimeout(
                                            () => setIsFinished(true),
                                            1200,
                                        );
                                    } else {
                                        new Audio("/assets/audio/error.mp3")
                                            .play()
                                            .catch(() => {});
                                    }
                                }}
                                className={`aspect-square sm:aspect-auto sm:h-64 p-6 bg-white rounded-[2.5rem] border-4 transition-all duration-300 shadow-md flex items-center justify-center relative
                                ${
                                    selected === opt.id
                                        ? opt.isCorrect
                                            ? "border-green-500 bg-green-50 scale-105 rotate-2"
                                            : "border-red-400 bg-red-50 opacity-60 grayscale scale-95"
                                        : "border-gray-100 hover:border-purple-300 hover:shadow-xl hover:-translate-y-2"
                                }`}
                            >
                                <img
                                    src={opt.imagePath}
                                    alt={opt.word}
                                    className="w-full h-full object-contain drop-shadow-md"
                                    onError={(e) =>
                                        (e.target.outerHTML =
                                            '<span class="text-7xl">❓</span>')
                                    }
                                />

                                {selected === opt.id && opt.isCorrect && (
                                    <div className="absolute top-4 right-4 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-black border-4 border-white shadow-lg animate-bounce">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                // ═══════════════════════════════════════════
                // شاشة النجاح والنهاية (الاحترافية)
                // ═══════════════════════════════════════════
                <div className="flex-1 flex items-center justify-center p-6 relative z-10 inset-0">
                    {/* تظليل الخلفية */}
                    <div className="absolute inset-0 bg-sky-900/10 backdrop-blur-[2px]" />

                    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 sm:p-14 flex flex-col items-center text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative animate-fade-in-up border border-white">
                        {/* النجوم الطائرة */}
                        <div
                            className="absolute -top-10 left-10 text-5xl animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                        >
                            ✨
                        </div>
                        <div className="absolute top-20 -left-12 text-6xl animate-pulse">
                            ⭐
                        </div>
                        <div
                            className="absolute top-10 -right-8 text-5xl animate-bounce"
                            style={{ animationDelay: "0.3s" }}
                        >
                            🌟
                        </div>
                        <div className="absolute -bottom-6 left-20 text-4xl animate-pulse">
                            ✨
                        </div>

                        {/* الكأس المنبثق */}
                        <div className="w-40 h-40 bg-gradient-to-br from-yellow-100 to-amber-200 rounded-full flex items-center justify-center shadow-inner border-8 border-white mb-6 relative z-10 -mt-28">
                            <img
                                src="/assets/ui/rewards/trophy.png"
                                alt="Trophy"
                                className="w-24 h-24 object-contain drop-shadow-xl animate-pulse"
                                onError={(e) =>
                                    (e.target.outerHTML =
                                        '<span class="text-7xl drop-shadow-lg">🏆</span>')
                                }
                            />
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-black text-[#1E293B] tracking-tight mb-3 drop-shadow-sm">
                            Unit Complete!
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-500 font-bold mb-10 max-w-md">
                            Amazing job! You've mastered this unit and earned
                            great rewards.
                        </p>

                        {/* بطاقات الإنجاز (النجوم والـ XP) */}
                        <div className="flex gap-4 mb-12 w-full justify-center">
                            <div className="flex-1 max-w-[200px] bg-amber-50 border border-amber-200 p-4 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 border border-amber-100">
                                    ⭐
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">
                                        Earned
                                    </p>
                                    <p className="text-2xl font-black text-[#1E293B] leading-none">
                                        3 Stars
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 max-w-[200px] bg-purple-50 border border-purple-200 p-4 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm shrink-0 border border-purple-100">
                                    ⚡
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest leading-none mb-1">
                                        Gained
                                    </p>
                                    <p className="text-2xl font-black text-[#1E293B] leading-none">
                                        50 XP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* زر الاستمرار */}
                        <button
                            onClick={handleFinish}
                            className="w-full sm:w-auto bg-[#10B981] text-white px-14 py-5 rounded-[2rem] font-black text-xl shadow-[0_6px_0_#059669] hover:shadow-[0_3px_0_#059669] hover:translate-y-[3px] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-3 relative z-20"
                        >
                            COLLECT REWARDS ➔
                        </button>

                        {/* الثعلب التشجيعي في الزاوية */}
                        <img
                            src="/assets/ui/mascot/fox-hint.png"
                            alt="Fox"
                            className="absolute -bottom-8 -right-12 w-44 object-contain pointer-events-none drop-shadow-2xl z-30"
                            onError={(e) => (e.target.style.display = "none")}
                        />
                    </div>
                </div>
            )}

            {/* أنيميشنز مخصصة */}
            <style>{`
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(40px) scale(0.95); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                @keyframes blob { 
                    0% { transform: translate(0px, 0px) scale(1); } 
                    33% { transform: translate(30px, -50px) scale(1.1); } 
                    66% { transform: translate(-20px, 20px) scale(0.9); } 
                    100% { transform: translate(0px, 0px) scale(1); } 
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
};

export default QuizScreen;
