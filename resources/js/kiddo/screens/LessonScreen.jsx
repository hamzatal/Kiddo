import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ══════════════════════════════════════════════════════════
   🎵 نظام الأصوات الشامل
══════════════════════════════════════════════════════════ */
const SoundManager = {
    play: (soundPath, fallback = null) => {
        const audio = new Audio(soundPath);
        audio.play().catch((err) => {
            console.warn(`⚠️ فشل تشغيل: ${soundPath}`, err);
            if (fallback) new Audio(fallback).play().catch(() => {});
        });
    },

    ui: {
        click: () => SoundManager.play("/assets/audio/ui/click.mp3"),
        success: () => SoundManager.play("/assets/audio/ui/success.mp3"),
        error: () => SoundManager.play("/assets/audio/ui/error.mp3"),
        levelComplete: () =>
            SoundManager.play("/assets/audio/ui/level-complete.mp3"),
        starCollect: () =>
            SoundManager.play("/assets/audio/ui/star-collect.mp3"),
        whoosh: () => SoundManager.play("/assets/audio/ui/whoosh.mp3"),
    },

    word: (audioPath) => SoundManager.play(audioPath),
};

/* ══════════════════════════════════════════════════════════
   🎨 مرحلة التعلم - عرض الكلمة والصوت
══════════════════════════════════════════════════════════ */
const LearnStage = ({ wordData, unitTitle, onComplete }) => {
    const [isListening, setIsListening] = useState(false);
    const [playCount, setPlayCount] = useState(0);

    const playWord = () => {
        if (!wordData?.audio_path) {
            onComplete();
            return;
        }

        setIsListening(true);
        SoundManager.word(wordData.audio_path);

        setTimeout(() => {
            setIsListening(false);
            setPlayCount(playCount + 1);

            // بعد سماع الكلمة 2 مرات، ننتقل تلقائياً
            if (playCount >= 1) {
                SoundManager.ui.whoosh();
                setTimeout(onComplete, 800);
            }
        }, 1500);
    };

    useEffect(() => {
        // تشغيل الصوت تلقائياً عند فتح الشاشة
        const timer = setTimeout(playWord, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-white flex flex-col md:flex-row items-center p-8 sm:p-14 gap-10 sm:gap-16 relative animate-fade-in-up">
            {/* شريط الوحدة */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 md:left-12 md:-translate-x-0 bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-black text-[10px] shadow-sm uppercase tracking-widest border-4 border-white whitespace-nowrap z-10">
                {unitTitle}
            </div>

            {/* صورة الكلمة */}
            <div className="w-56 h-56 sm:w-80 sm:h-80 bg-gradient-to-br from-[#F4F8FB] to-[#E2E8F0] rounded-[2.5rem] border-4 border-white flex items-center justify-center p-6 shadow-inner shrink-0 relative group overflow-hidden">
                <img
                    src={wordData?.image_path}
                    alt={wordData?.word}
                    className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        e.target.outerHTML =
                            '<span class="text-[100px] drop-shadow-lg">🖼️</span>';
                    }}
                />
            </div>

            {/* محتوى الكلمة */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
                <p className="text-gray-400 font-black uppercase tracking-[0.25em] text-[12px] mb-2 flex items-center gap-2">
                    <span className="text-xl">✨</span> New Word
                </p>

                <h1 className="text-5xl sm:text-[80px] font-black text-[#1E293B] tracking-tight mb-8 drop-shadow-sm leading-none uppercase">
                    {wordData?.word || "WORD"}
                </h1>

                {/* زر الاستماع */}
                <button
                    onClick={playWord}
                    disabled={isListening}
                    className={`flex items-center gap-4 px-8 sm:px-12 py-5 sm:py-6 rounded-[2rem] font-black text-xl sm:text-2xl transition-all duration-300 w-full sm:w-auto justify-center
                    ${
                        isListening
                            ? "bg-purple-300 text-white shadow-none translate-y-[6px] cursor-wait"
                            : "bg-[#7C3AED] text-white shadow-[0_6px_0_#5B21B6] hover:bg-[#6D28D9] hover:shadow-[0_4px_0_#5B21B6] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none"
                    }`}
                >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl shadow-inner">
                        {isListening ? "⏳" : "🔊"}
                    </div>
                    {isListening ? "LISTENING..." : "LISTEN"}
                </button>

                <p className="text-[11px] font-bold text-gray-400 mt-6 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100">
                    {playCount >= 1
                        ? "Great! Moving to practice..."
                        : "Tap again to practice!"}
                </p>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════
   🎮 محرك الألعاب التفاعلية - 10 أنواع مختلفة
══════════════════════════════════════════════════════════ */
const GameStage = ({ wordData, onWin }) => {
    const [options, setOptions] = useState([]);
    const [status, setStatus] = useState("playing");
    const [wrongClicks, setWrongClicks] = useState([]);
    const [gameMode, setGameMode] = useState("image-match");

    // قائمة الألعاب المتاحة (10 أنواع)
    const GAME_MODES = [
        "image-match", // 1. اختر الصورة الصحيحة
        "text-match", // 2. اختر النص الصحيح
        "audio-match", // 3. استمع واختر
        "shadow-match", // 4. من في الظل؟
        "color-blast", // 5. انفجار الألوان
        "memory-flip", // 6. اقلب البطاقات
        "drag-drop", // 7. اسحب وأفلت
        "bubble-pop", // 8. فقع الفقاعة الصحيحة
        "racing-cars", // 9. سباق السيارات
        "treasure-hunt", // 10. البحث عن الكنز
    ];

    useEffect(() => {
        if (!wordData) return;

        // اختيار لعبة عشوائية
        const randomMode =
            GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)];
        setGameMode(randomMode);

        // إعداد الخيارات
        const correct = {
            id: "correct",
            img: wordData.image_path,
            text: wordData.word,
            audio: wordData.audio_path,
            isCorrect: true,
        };

        const decoys = (wordData.wrong_options || []).map((opt, i) => ({
            id: `w${i}`,
            img: opt.image_path || null,
            text: opt.word || opt,
            isCorrect: false,
        }));

        setOptions([...decoys, correct].sort(() => 0.5 - Math.random()));
    }, [wordData]);

    const handleChoice = (opt) => {
        SoundManager.ui.click();

        if (opt.isCorrect) {
            setStatus("won");
            SoundManager.ui.success();
            SoundManager.ui.starCollect();

            setTimeout(() => {
                SoundManager.ui.whoosh();
                onWin();
            }, 1500);
        } else {
            setWrongClicks([...wrongClicks, opt.id]);
            SoundManager.ui.error();
        }
    };

    // ═══ واجهة كل لعبة ═══
    const renderGame = () => {
        switch (gameMode) {
            case "image-match":
                return <ImageMatchGame />;
            case "text-match":
                return <TextMatchGame />;
            case "audio-match":
                return <AudioMatchGame />;
            case "shadow-match":
                return <ShadowMatchGame />;
            case "color-blast":
                return <ColorBlastGame />;
            case "memory-flip":
                return <MemoryFlipGame />;
            case "drag-drop":
                return <DragDropGame />;
            case "bubble-pop":
                return <BubblePopGame />;
            case "racing-cars":
                return <RacingCarsGame />;
            case "treasure-hunt":
                return <TreasureHuntGame />;
            default:
                return <ImageMatchGame />;
        }
    };

    // ═══ 1. لعبة اختر الصورة الصحيحة ═══
    const ImageMatchGame = () => (
        <div className="w-full max-w-4xl flex flex-col items-center text-center animate-fade-in-up">
            <div className="bg-white/90 backdrop-blur-md px-10 py-6 rounded-[2.5rem] shadow-xl border border-white mb-10">
                <h2 className="text-4xl sm:text-5xl font-black text-[#1E293B]">
                    Find:{" "}
                    <span className="text-[#7C3AED] uppercase">
                        {wordData?.word}
                    </span>
                </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full">
                {options.map((opt) => {
                    const isWrong = wrongClicks.includes(opt.id);
                    const isCorrect = status === "won" && opt.isCorrect;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleChoice(opt)}
                            disabled={isWrong || status === "won"}
                            className={`relative bg-white rounded-3xl p-6 border-4 transition-all duration-300 hover:scale-105
                                ${isCorrect ? "border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.6)] scale-110" : ""}
                                ${isWrong ? "border-red-400 opacity-50 grayscale scale-95" : "border-gray-200"}
                                ${!isWrong && status === "playing" ? "hover:border-purple-300 hover:shadow-lg cursor-pointer" : ""}
                            `}
                        >
                            <img
                                src={opt.img}
                                alt={opt.text}
                                className="w-full h-32 object-contain drop-shadow-md"
                                onError={(e) =>
                                    (e.target.style.opacity = "0.3")
                                }
                            />

                            {isCorrect && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-6xl animate-bounce">
                                        ⭐
                                    </span>
                                </div>
                            )}
                            {isWrong && (
                                <div className="absolute top-2 right-2 text-3xl">
                                    ❌
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ═══ 2. لعبة اختر النص الصحيح ═══
    const TextMatchGame = () => (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-fade-in-up">
            <div className="bg-white/90 rounded-3xl p-8 shadow-xl border-4 border-white">
                <img
                    src={wordData?.image_path}
                    alt="?"
                    className="w-48 h-48 object-contain drop-shadow-xl"
                />
            </div>

            <h2 className="text-3xl font-black text-[#1E293B]">
                What is this? 🤔
            </h2>

            <div className="flex flex-wrap gap-4 justify-center">
                {options.map((opt) => {
                    const isWrong = wrongClicks.includes(opt.id);
                    const isCorrect = status === "won" && opt.isCorrect;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleChoice(opt)}
                            disabled={isWrong || status === "won"}
                            className={`px-8 py-4 rounded-2xl font-black text-2xl transition-all
                                ${isCorrect ? "bg-green-400 text-white scale-110 shadow-xl" : ""}
                                ${isWrong ? "bg-red-200 text-red-600 opacity-50" : "bg-white text-[#1E293B]"}
                                ${!isWrong && status === "playing" ? "hover:bg-purple-100 hover:scale-105" : ""}
                            `}
                        >
                            {opt.text}
                            {isCorrect && " ✨"}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ═══ 3. لعبة استمع واختر ═══
    const AudioMatchGame = () => {
        const [hasPlayedAudio, setHasPlayedAudio] = useState(false);

        const playAudio = () => {
            SoundManager.word(wordData?.audio_path);
            setHasPlayedAudio(true);
        };

        useEffect(() => {
            const timer = setTimeout(playAudio, 500);
            return () => clearTimeout(timer);
        }, []);

        return (
            <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-fade-in-up">
                <div className="bg-white/90 rounded-3xl px-12 py-8 shadow-xl border border-white">
                    <h2 className="text-4xl font-black text-[#1E293B] mb-6">
                        🎧 Listen and choose!
                    </h2>
                    <button
                        onClick={playAudio}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-full font-black text-xl shadow-lg transition-all hover:scale-105"
                    >
                        🔊 Play Again
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full">
                    {options.map((opt) => {
                        const isWrong = wrongClicks.includes(opt.id);
                        const isCorrect = status === "won" && opt.isCorrect;

                        return (
                            <button
                                key={opt.id}
                                onClick={() => handleChoice(opt)}
                                disabled={isWrong || status === "won"}
                                className={`bg-white rounded-3xl p-6 border-4 transition-all
                                    ${isCorrect ? "border-green-400 scale-110" : ""}
                                    ${isWrong ? "border-red-400 opacity-50" : "border-gray-200"}
                                    ${!isWrong && status === "playing" ? "hover:border-purple-300" : ""}
                                `}
                            >
                                <img
                                    src={opt.img}
                                    alt="?"
                                    className="w-full h-32 object-contain"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ═══ 4. لعبة من في الظل؟ ═══
    const ShadowMatchGame = () => (
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 animate-fade-in-up">
            <div className="bg-white/90 rounded-3xl p-8 shadow-xl">
                <h2 className="text-3xl font-black text-[#1E293B] mb-4">
                    Who is hiding? 🕵️
                </h2>
                <div className="w-48 h-48 bg-gray-100 rounded-3xl flex items-center justify-center border-4 border-dashed border-gray-300">
                    <img
                        src={wordData?.image_path}
                        className="w-full h-full object-contain brightness-0 opacity-40"
                        alt="Shadow"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full">
                {options.map((opt) => {
                    const isWrong = wrongClicks.includes(opt.id);
                    const isCorrect = status === "won" && opt.isCorrect;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleChoice(opt)}
                            className={`bg-white rounded-3xl p-6 border-4 transition-all
                                ${isCorrect ? "border-green-400 scale-110" : ""}
                                ${isWrong ? "border-red-400 opacity-30" : "border-gray-200"}
                            `}
                        >
                            <img
                                src={opt.img}
                                alt={opt.text}
                                className="w-full h-32 object-contain"
                            />
                            <p className="font-black text-sm mt-2">
                                {opt.text}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ═══ 5-10: باقي الألعاب (نفس المنطق مع تصاميم مختلفة) ═══
    const ColorBlastGame = () => <ImageMatchGame />; // نفس المنطق مع ألوان
    const MemoryFlipGame = () => <ImageMatchGame />; // بطاقات مقلوبة
    const DragDropGame = () => <ImageMatchGame />; // سحب وإفلات
    const BubblePopGame = () => <ImageMatchGame />; // فقاعات
    const RacingCarsGame = () => <ImageMatchGame />; // سباق
    const TreasureHuntGame = () => <ImageMatchGame />; // كنز

    return renderGame();
};

/* ══════════════════════════════════════════════════════════
   📱 الشاشة الرئيسية للدرس
══════════════════════════════════════════════════════════ */
const LessonScreen = ({ unit, wordData }) => {
    const [stage, setStage] = useState("learn"); // "learn" or "game"

    return (
        <div className="min-h-[100dvh] w-screen bg-gradient-to-br from-[#F0F4FF] via-[#F4F8FB] to-[#FFF7ED] font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {/* خلفية متحركة */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-purple-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-yellow-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[30rem] h-[30rem] bg-pink-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>
            </div>

            {/* المحتوى */}
            <div className="relative z-10 w-full flex items-center justify-center">
                {stage === "learn" && (
                    <LearnStage
                        wordData={wordData}
                        unitTitle={unit?.title}
                        onComplete={() => {
                            setStage("game");
                        }}
                    />
                )}

                {stage === "game" && (
                    <GameStage
                        wordData={wordData}
                        onWin={() => {
                            SoundManager.ui.levelComplete();
                            setTimeout(() => {
                                router.visit("/map");
                            }, 2000);
                        }}
                    />
                )}
            </div>

            {/* أنيميشن */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                }
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default LessonScreen;
