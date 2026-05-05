import React, { useState, useEffect } from "react";
const PrimaryButton = ({
    variant = "purple",
    icon,
    children,
    onClick,
    className = "",
}) => {
    const variants = {
        purple: "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-[0_4px_0_#5B21B6] hover:shadow-[0_2px_0_#5B21B6] hover:translate-y-[2px]",
        green: "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-[0_4px_0_#166534] hover:shadow-[0_2px_0_#166534] hover:translate-y-[2px]",
    };
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 font-black rounded-2xl transition-all duration-150 active:translate-y-[3px] active:shadow-none px-5 py-3 text-base ${variants[variant]} ${className}`}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

const LessonCard = ({
    number,
    title,
    imagePath,
    colorClass,
    isLocked,
    onClick,
}) => (
    <div
        onClick={!isLocked ? onClick : undefined}
        className={`relative flex flex-col items-center justify-between rounded-2xl overflow-hidden border-2 transition-all duration-200 h-full
      ${
          isLocked
              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              : `${colorClass} border-transparent cursor-pointer hover:scale-105 hover:shadow-xl shadow-md`
      }`}
    >
        {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-2xl">🔒</span>
            </div>
        )}
        <div
            className={`w-full flex items-center justify-center flex-1 p-2 ${!isLocked ? "" : "opacity-30"}`}
        >
            <img
                src={imagePath}
                alt={title}
                className="w-full h-full object-contain max-h-full"
            />
        </div>
        <div
            className={`w-full text-center pb-1 px-1 ${isLocked ? "text-gray-400" : "text-white"}`}
        >
            <p className="text-[10px] lg:text-xs font-black uppercase tracking-wide opacity-80">
                {number}
            </p>
            <p className="text-xs lg:text-sm font-black leading-tight">
                {title}
            </p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Feature Card
───────────────────────────────────────────────────────── */
const FeatureCard = ({ emoji, title, desc, bg }) => (
    <div
        className={`${bg} rounded-2xl p-3 sm:p-4 flex items-center gap-3 border border-white/60 shadow-sm`}
    >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-sm">
            {emoji}
        </div>
        <div>
            <h3 className="font-black text-[#1E293B] text-sm sm:text-base leading-tight">
                {title}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 font-semibold mt-0.5">
                {desc}
            </p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Main HomeScreen
───────────────────────────────────────────────────────── */
const HomeScreen = ({ onNavigate = () => {} }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const el = document.getElementById("home-scroll");
        const onScroll = () => setScrolled(el?.scrollTop > 10);
        el?.addEventListener("scroll", onScroll);
        return () => el?.removeEventListener("scroll", onScroll);
    }, []);

    const lessons = [
        {
            number: "1",
            title: "Welcome",
            imagePath: "/assets/lessons/welcome/hello.png",
            colorClass: "bg-[#7C3AED]",
            isLocked: false,
        },
        {
            number: "2",
            title: "Family",
            imagePath: "/assets/lessons/family/family_group.png",
            colorClass: "bg-[#16A34A]",
            isLocked: false,
        },
        {
            number: "3",
            title: "School Bag",
            imagePath: "/assets/lessons/schoolbag/bag.png",
            colorClass: "bg-[#2563EB]",
            isLocked: true,
        },
        {
            number: "4",
            title: "Classroom",
            imagePath: "/assets/lessons/classroom/desk.png",
            colorClass: "bg-[#DB2777]",
            isLocked: true,
        },
        {
            number: "5",
            title: "Favourite Toy",
            imagePath: "/assets/lessons/toy/ball.png",
            colorClass: "bg-[#D97706]",
            isLocked: true,
        },
    ];

    const features = [
        {
            emoji: "🎧",
            title: "Audio Learning",
            desc: "Clear native English audio",
            bg: "bg-purple-50",
        },
        {
            emoji: "🎮",
            title: "Fun Games",
            desc: "Interactive mini-games",
            bg: "bg-green-50",
        },
        {
            emoji: "🏆",
            title: "Rewards",
            desc: "Stars, badges & streaks",
            bg: "bg-yellow-50",
        },
        {
            emoji: "🎤",
            title: "Speak & Practice",
            desc: "Hear yourself improve!",
            bg: "bg-pink-50",
        },
    ];

    return (
        <div
            id="home-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#F0F4FF] font-sans scroll-smooth"
        >
            {/* ── NAVBAR ─────────────────────────────────────────── */}
            <nav
                className={`sticky top-0 z-50 w-full transition-all duration-300
        ${scrolled ? "bg-white/95 backdrop-blur shadow-sm border-b border-gray-100" : "bg-transparent"}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-8 sm:h-9 object-contain drop-shadow-sm"
                    />

                    {/* Desktop Nav */}
                    <ul className="hidden md:flex gap-6 font-black text-sm text-[#334155]">
                        <li className="text-[#7C3AED] cursor-pointer flex items-center gap-1">
                            🏠 Home
                        </li>
                        <li className="cursor-pointer hover:text-[#7C3AED] transition-colors flex items-center gap-1">
                            📖 Lessons
                        </li>
                        <li className="cursor-pointer hover:text-[#7C3AED] transition-colors flex items-center gap-1">
                            ℹ️ About
                        </li>
                    </ul>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-2">
                        <PrimaryButton
                            variant="green"
                            onClick={() => onNavigate("map")}
                            className="!text-xs sm:!text-sm !px-3 sm:!px-4 !py-2"
                        >
                            ⭐ Start Learning
                        </PrimaryButton>
                        <button className="hidden sm:flex items-center px-4 py-2 rounded-2xl border-2 border-[#7C3AED] text-[#7C3AED] bg-white font-black hover:bg-[#7C3AED] hover:text-white transition-colors text-sm">
                            👨‍👩‍👧 Login
                        </button>
                        {/* Hamburger */}
                        <button
                            className="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-[5px] rounded-xl bg-white border border-gray-200"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <span
                                className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
                            />
                            <span
                                className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "opacity-0" : ""}`}
                            />
                            <span
                                className={`block w-5 h-0.5 bg-gray-600 transition-all ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
                            />
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-3 shadow-lg">
                        {["🏠 Home", "📖 Lessons", "ℹ️ About"].map((item) => (
                            <button
                                key={item}
                                className="text-left font-black text-[#334155] text-sm py-1 hover:text-[#7C3AED] transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[#7C3AED] text-[#7C3AED] font-black text-sm w-fit">
                            👨‍👩‍👧 Login
                        </button>
                    </div>
                )}
            </nav>

            {/* ── HERO ───────────────────────────────────────────── */}
            <section className="relative w-full overflow-hidden">
                {/* Background */}
                <img
                    src="/assets/ui/hero/clouds.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-bottom"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#F0F4FF]/50" />

                <div
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-12 lg:pb-16
          flex flex-col-reverse sm:flex-row items-center justify-between gap-6 sm:gap-4 min-h-[55vw] sm:min-h-0 sm:h-auto"
                >
                    {/* Text */}
                    <div className="w-full sm:w-[55%] lg:w-[58%] flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-3 py-1.5 mb-4 border border-purple-100 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-black text-[#334155]">
                                Safe · Fun · Ad-free
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.6rem] xl:text-[4rem] font-black text-[#1E293B] leading-[1.1]">
                            Learn English
                            <br />
                            with <span className="text-[#EF4444]">
                                Fun
                            </span>,{" "}
                            <span className="text-[#16A34A]">Games</span>,<br />
                            and <span className="text-[#7C3AED]">Sounds</span>!
                        </h1>

                        <p className="text-sm sm:text-base text-gray-600 font-semibold mt-3 sm:mt-4 max-w-sm sm:max-w-md leading-relaxed">
                            Kiddo is a playful learning adventure for kids aged
                            6–7. Play, listen, speak, and grow with every
                            lesson!
                        </p>

                        <div className="mt-5 sm:mt-6 flex flex-col items-center sm:items-start gap-3">
                            <PrimaryButton
                                variant="purple"
                                icon="🚀"
                                onClick={() => onNavigate("map")}
                                className="!text-base sm:!text-lg !px-6 sm:!px-8 !py-3.5"
                            >
                                Start Learning Now! ➔
                            </PrimaryButton>
                            <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
                                <span className="text-white bg-[#16A34A] rounded-full w-5 h-5 flex items-center justify-center text-[9px] shrink-0">
                                    ✔
                                </span>
                                No sign-up required · 100% free to start
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="mt-5 sm:mt-6 flex items-center gap-4 sm:gap-6">
                            {[
                                { val: "10K+", label: "Kids learning" },
                                { val: "5", label: "Fun units" },
                                { val: "⭐⭐⭐⭐⭐", label: "Parent rating" },
                            ].map(({ val, label }) => (
                                <div
                                    key={label}
                                    className="text-center sm:text-left"
                                >
                                    <p className="font-black text-base sm:text-lg text-[#1E293B]">
                                        {val}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-semibold">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fox + bubble */}
                    <div className="w-full sm:w-[40%] lg:w-[38%] flex justify-center sm:justify-end items-end relative">
                        <div
                            className="absolute top-[5%] left-[5%] sm:-left-4 lg:-left-8 bg-white px-4 py-2.5 rounded-2xl rounded-br-none
              shadow-xl border border-purple-100 text-[#7C3AED] font-black text-sm sm:text-base z-20 animate-bounce-slow"
                        >
                            Hi there! <br />
                            Let's learn <br />
                            together! 👋
                        </div>
                        <img
                            src="/assets/ui/mascot/fox-main.png"
                            alt="Kiddo mascot"
                            className="w-[60%] sm:w-[80%] max-w-[260px] sm:max-w-none object-contain drop-shadow-2xl relative z-10"
                        />
                    </div>
                </div>

                {/* Wave divider */}
                <div className="relative -mb-1">
                    <svg
                        viewBox="0 0 1440 40"
                        className="w-full fill-[#F0F4FF]"
                        preserveAspectRatio="none"
                    >
                        <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
                    </svg>
                </div>
            </section>

            {/* ── LESSONS ────────────────────────────────────────── */}
            <section className="w-full bg-[#F0F4FF] py-8 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-5 sm:mb-6">
                        <p className="text-xs sm:text-sm font-black text-[#7C3AED] uppercase tracking-widest mb-1">
                            📚 Curriculum
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] flex items-center justify-center gap-2 flex-wrap">
                            <span className="text-yellow-400 text-3xl">⭐</span>
                            Our Learning Units
                            <span className="text-yellow-400 text-3xl">⭐</span>
                        </h2>
                        <p className="text-sm text-gray-500 font-semibold mt-2">
                            5 themed units with games, audio &amp; activities
                        </p>
                    </div>

                    {/* Cards grid: 5 columns on lg, 3+2 on md, 2+scroll on mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {lessons.map((l) => (
                            <div
                                key={l.number}
                                className="aspect-[3/4] sm:aspect-auto sm:h-44 lg:h-48"
                            >
                                <LessonCard
                                    {...l}
                                    onClick={() => onNavigate("map")}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-5 sm:mt-6">
                        <button
                            onClick={() => onNavigate("map")}
                            className="inline-flex items-center gap-2 text-[#7C3AED] font-black text-sm border-2 border-[#7C3AED] rounded-2xl px-5 py-2.5
              hover:bg-[#7C3AED] hover:text-white transition-colors"
                        >
                            View All Units ➔
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────────── */}
            <section className="w-full bg-white py-8 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-5 sm:mb-6">
                        <p className="text-xs sm:text-sm font-black text-[#16A34A] uppercase tracking-widest mb-1">
                            ✨ Why Kiddo?
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                            Why Kids Love Kiddo
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {features.map((f) => (
                            <FeatureCard key={f.title} {...f} />
                        ))}
                    </div>

                    {/* Testimonial */}
                    <div className="mt-6 sm:mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-5 sm:p-6 border border-purple-100 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="flex -space-x-3">
                            {["👦", "👧", "🧒"].map((emoji, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-xl shadow"
                                >
                                    {emoji}
                                </div>
                            ))}
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="font-black text-[#1E293B] text-sm sm:text-base">
                                "My daughter asks to practice every single day!"
                            </p>
                            <p className="text-xs text-gray-400 font-semibold mt-1">
                                — Sarah M., parent of a 6-year-old
                            </p>
                        </div>
                        <div className="sm:ml-auto shrink-0">
                            <PrimaryButton
                                variant="purple"
                                onClick={() => onNavigate("map")}
                                className="!text-sm !px-5 !py-2.5"
                            >
                                Try it free 🎉
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────────── */}
            <section className="w-full bg-[#F0F4FF] py-8 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-5 sm:mb-6">
                        <p className="text-xs sm:text-sm font-black text-[#DB2777] uppercase tracking-widest mb-1">
                            🗺️ Journey
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                            How It Works
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
                        {/* connector line on desktop */}
                        <div className="hidden sm:block absolute top-[3.5rem] left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-0.5 bg-dashed bg-purple-200 border-t-2 border-dashed border-purple-200" />

                        {[
                            {
                                step: "1",
                                icon: "🎯",
                                title: "Pick a Unit",
                                desc: "Choose a topic that excites your child — greetings, family, school &amp; more.",
                            },
                            {
                                step: "2",
                                icon: "🔊",
                                title: "Learn &amp; Listen",
                                desc: "Hear native speakers, see colourful flashcards, and repeat out loud.",
                            },
                            {
                                step: "3",
                                icon: "🏆",
                                title: "Play &amp; Win",
                                desc: "Complete mini-games to earn stars and unlock the next adventure!",
                            },
                        ].map(({ step, icon, title, desc }) => (
                            <div
                                key={step}
                                className="bg-white rounded-3xl p-5 sm:p-6 border border-purple-100 shadow-sm flex flex-row sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-3 relative"
                            >
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-2xl text-white shadow-md shrink-0 relative z-10">
                                    {icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">
                                        Step {step}
                                    </p>
                                    <h3
                                        className="font-black text-[#1E293B] text-base sm:text-lg"
                                        dangerouslySetInnerHTML={{
                                            __html: title,
                                        }}
                                    />
                                    <p
                                        className="text-xs sm:text-sm text-gray-500 font-semibold mt-1 leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: desc,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────────────────── */}
            <section className="w-full bg-[#7C3AED] py-10 sm:py-14 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-8 text-6xl">⭐</div>
                    <div className="absolute top-6 right-12 text-5xl">🎮</div>
                    <div className="absolute bottom-4 left-1/4 text-4xl">
                        🏆
                    </div>
                    <div className="absolute bottom-2 right-1/3 text-6xl">
                        🎧
                    </div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                        Ready to start the
                        <br className="sm:hidden" /> adventure? 🚀
                    </h2>
                    <p className="text-purple-200 font-semibold text-sm sm:text-base mt-2 sm:mt-3 max-w-md mx-auto">
                        Join thousands of kids already learning English with
                        Kiddo — it's completely free!
                    </p>
                    <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                            onClick={() => onNavigate("map")}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#7C3AED] font-black rounded-2xl px-8 py-3.5 text-base
              shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:shadow-[0_2px_0_rgba(0,0,0,0.2)] hover:translate-y-[2px] transition-all"
                        >
                            🎉 Start for Free
                        </button>
                        <button
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-white/60 text-white font-black rounded-2xl px-8 py-3.5 text-base
              hover:bg-white/10 transition-colors"
                        >
                            👨‍👩‍👧 Parent Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <footer className="w-full bg-white border-t border-gray-100 py-4 sm:py-5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                        <img
                            src="/assets/ui/hero/title-logo.png"
                            alt="Kiddo"
                            className="h-6 grayscale opacity-50"
                        />
                        <p className="text-xs font-bold text-gray-400">
                            © 2026 Kiddo. Made with ❤️ for curious kids.
                        </p>
                    </div>
                    <div className="flex gap-4 sm:gap-6 text-xs font-bold text-gray-400">
                        {["Privacy", "Terms", "Contact"].map((t) => (
                            <span
                                key={t}
                                className="hover:text-[#7C3AED] cursor-pointer transition-colors"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </footer>

            {/* Slow bounce animation for speech bubble */}
            <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
        </div>
    );
};

export default HomeScreen;
