import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ─────────────────────────────────────────────────────────
   JuicyButton — مطابق تماماً للموك أب
───────────────────────────────────────────────────────── */
const JuicyButton = ({
    variant = "purple",
    icon,
    children,
    onClick,
    className = "",
}) => {
    const variants = {
        purple: [
            "relative inline-flex items-center justify-center gap-2 font-black text-white rounded-full",
            "bg-gradient-to-b from-[#C84BFF] to-[#8B2FCF]",
            "shadow-[0_6px_0_#5B0F99,inset_0_1px_0_rgba(255,255,255,0.35)]",
            "hover:shadow-[0_4px_0_#5B0F99,inset_0_1px_0_rgba(255,255,255,0.35)]",
            "active:shadow-[0_1px_0_#5B0F99] active:translate-y-[4px]",
            "transition-all duration-100",
        ].join(" "),
        green: [
            "relative inline-flex items-center justify-center gap-2 font-black text-white rounded-full",
            "bg-gradient-to-b from-[#4ADE80] to-[#16A34A]",
            "shadow-[0_6px_0_#0E6B2C,inset_0_1px_0_rgba(255,255,255,0.35)]",
            "hover:shadow-[0_4px_0_#0E6B2C,inset_0_1px_0_rgba(255,255,255,0.35)]",
            "active:shadow-[0_1px_0_#0E6B2C] active:translate-y-[4px]",
            "transition-all duration-100",
        ].join(" "),
        outline: [
            "relative inline-flex items-center justify-center gap-2 font-black rounded-full",
            "bg-white border-2 border-[#9333EA] text-[#9333EA]",
            "shadow-[0_4px_0_#D8B4FE]",
            "hover:shadow-[0_2px_0_#D8B4FE] hover:bg-purple-50",
            "active:shadow-[0_1px_0_#D8B4FE] active:translate-y-[2px]",
            "transition-all duration-100",
        ].join(" "),
    };

    return (
        <button
            onClick={onClick}
            className={`${variants[variant]} px-5 py-2.5 text-sm sm:text-[15px] ${className}`}
        >
            {icon && <span className="leading-none">{icon}</span>}
            {children}
        </button>
    );
};

const LessonCard = ({
    number,
    title,
    imagePath,
    colorClass,
    numberBg,
    onClick,
}) => (
    <div
        onClick={onClick}
        className={`relative flex flex-col items-center rounded-3xl cursor-pointer hover:-translate-y-2 hover:shadow-xl transition-all duration-300 border-2 border-white/60 shadow-sm overflow-hidden ${colorClass}`}
        style={{ height: "100%" }}
    >
        {/* Number badge */}
        <div
            className={`absolute top-3 left-3 w-7 h-7 rounded-full ${numberBg} text-white font-black text-sm flex items-center justify-center shadow-md z-10`}
        >
            {number}
        </div>

        {/* Title */}
        <div className="w-full text-center pt-3 pb-1 px-3 pl-8 z-10">
            <h3 className="font-black text-[#1E293B] text-xs sm:text-sm leading-tight line-clamp-2">
                {title}
            </h3>
        </div>

        {/* Image — محاطة بالكامل داخل البطاقة */}
        <div className="flex-1 w-full flex items-center justify-center px-3 pb-3 overflow-hidden">
            <img
                src={imagePath}
                alt={title}
                className="max-h-full max-w-full object-contain drop-shadow-md"
                style={{ maxHeight: "9rem" }}
                onError={(e) => {
                    e.target.style.display = "none";
                }}
            />
        </div>

        <span className="absolute bottom-2 right-2 text-yellow-400 text-xs animate-pulse">
            ⭐
        </span>
    </div>
);

/* ─────────────────────────────────────────────────────────
   FeatureCard
───────────────────────────────────────────────────────── */
const FeatureCard = ({ iconBg, iconColor, icon, title, desc }) => (
    <div className="bg-white rounded-3xl p-5 flex items-start gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div
            className={`w-12 h-12 rounded-full ${iconBg} ${iconColor} flex items-center justify-center text-2xl shrink-0`}
        >
            {icon}
        </div>
        <div>
            <h3 className="font-black text-[#1E293B] text-sm mb-1">{title}</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {desc}
            </p>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   HomeScreen
───────────────────────────────────────────────────────── */
const HomeScreen = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = usePage().props;

    useEffect(() => {
        const el = document.getElementById("home-scroll");
        const onScroll = () => setScrolled((el?.scrollTop ?? 0) > 20);
        el?.addEventListener("scroll", onScroll);
        return () => el?.removeEventListener("scroll", onScroll);
    }, []);

    const lessons = [
        {
            number: "1",
            title: "Welcome / Hello",
            imagePath: "/assets/lessons/welcome/hello.png",
            colorClass: "bg-[#F3E8FF]",
            numberBg: "bg-[#9333EA]",
        },
        {
            number: "2",
            title: "Family and Friends",
            imagePath: "/assets/lessons/family/family_group.png",
            colorClass: "bg-[#DCFCE7]",
            numberBg: "bg-[#16A34A]",
        },
        {
            number: "3",
            title: "My School Bag",
            imagePath: "/assets/lessons/schoolbag/bag.png",
            colorClass: "bg-[#E0F2FE]",
            numberBg: "bg-[#0284C7]",
        },
        {
            number: "4",
            title: "Our Classroom",
            imagePath: "/assets/lessons/classroom/desk.png",
            colorClass: "bg-[#FFE4E6]",
            numberBg: "bg-[#E11D48]",
        },
        {
            number: "5",
            title: "My Favourite Toy",
            imagePath: "/assets/lessons/toy/ball.png",
            colorClass: "bg-[#FEF3C7]",
            numberBg: "bg-[#D97706]",
        },
    ];

    return (
        <div
            id="home-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-white font-sans scroll-smooth"
        >
            {/* ══════════════════════════════════════
                NAVBAR — متصل بالهيرو، خلفية شفافة
            ══════════════════════════════════════ */}
            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2"
                        : "bg-transparent py-3"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => router.visit("/")}
                    >
                        <img
                            src="/assets/ui/hero/title-logo.png"
                            alt="Kiddo"
                            className="h-9 sm:h-10 object-contain drop-shadow-sm"
                            onError={(e) => {
                                e.target.style.display = "none";
                                e.target.insertAdjacentHTML(
                                    "afterend",
                                    `<span class="font-black text-2xl"><span class="text-[#0EA5E9]">Kid</span><span class="text-[#FF4B63]">d</span><span class="text-[#F59E0B]">o</span></span>`,
                                );
                            }}
                        />
                    </div>

                    {/* Desktop nav links */}
                    <ul className="hidden lg:flex items-center gap-7 font-black text-[14px] text-[#475569]">
                        {[
                            {
                                icon: "🏠",
                                label: "Home",
                                active: true,
                                path: "/",
                            },
                            {
                                icon: "📖",
                                label: "Lessons",
                                active: false,
                                path: "/map",
                            },
                            {
                                icon: "ℹ️",
                                label: "About",
                                active: false,
                                path: "/",
                            },
                            {
                                icon: "✉️",
                                label: "Contact",
                                active: false,
                                path: "/",
                            },
                        ].map((item) => (
                            <li
                                key={item.label}
                                onClick={() => router.visit(item.path)}
                                className={`flex items-center gap-1.5 cursor-pointer pb-1 border-b-2 transition-colors ${
                                    item.active
                                        ? "text-[#9333EA] border-[#9333EA]"
                                        : "border-transparent hover:text-[#9333EA] hover:border-[#9333EA]"
                                }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </li>
                        ))}
                    </ul>

                    {/* Desktop CTA buttons */}
                    <div className="hidden sm:flex items-center gap-2.5">
                        <JuicyButton
                            variant="green"
                            icon="★"
                            onClick={() =>
                                router.visit(user ? "/map" : "/login")
                            }
                        >
                            {user ? "Play Now" : "Start Learning"}
                        </JuicyButton>
                        <JuicyButton
                            variant="outline"
                            icon="👨‍👩‍👧"
                            onClick={() =>
                                router.visit(user ? "/progress" : "/login")
                            }
                            className="hidden md:inline-flex"
                        >
                            {user ? "Dashboard" : "Parent/Teacher Login"}
                        </JuicyButton>
                        {user && (
                            <button
                                onClick={() => router.post("/logout")}
                                className="text-gray-400 hover:text-red-500 font-bold text-sm ml-1"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="sm:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-xl bg-white/80 border border-gray-200 shadow-sm"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <span
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-[8px]" : ""}`}
                        />
                        <span
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
                        />
                        <span
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-[8px]" : ""}`}
                        />
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                {menuOpen && (
                    <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg px-5 py-4 flex flex-col gap-3">
                        {[
                            ["🏠 Home", "/"],
                            ["📖 Lessons", "/map"],
                            ["ℹ️ About", "/"],
                            ["✉️ Contact", "/"],
                        ].map(([label, path], i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    router.visit(path);
                                    setMenuOpen(false);
                                }}
                                className="text-left font-black text-[#1E293B] text-base border-b border-gray-50 pb-2 hover:text-[#9333EA]"
                            >
                                {label}
                            </button>
                        ))}
                        <div className="flex flex-col gap-2 mt-1 pt-2">
                            <JuicyButton
                                variant="green"
                                onClick={() =>
                                    router.visit(user ? "/map" : "/login")
                                }
                                className="w-full"
                            >
                                {user ? "Play Now" : "Start Learning"}
                            </JuicyButton>
                            <JuicyButton
                                variant="outline"
                                onClick={() =>
                                    router.visit(user ? "/progress" : "/login")
                                }
                                className="w-full"
                            >
                                {user
                                    ? "Parent Dashboard"
                                    : "Parent/Teacher Login"}
                            </JuicyButton>
                        </div>
                    </div>
                )}
            </nav>

            {/* ══════════════════════════════════════
                HERO SECTION
                - الهيدر متصل (bg-transparent)
                - الخلفية واضحة ومرئية
                - responsive كامل
            ══════════════════════════════════════ */}
            <section
                className="relative w-full min-h-screen flex flex-col overflow-hidden"
                style={{
                    background:
                        "linear-gradient(160deg, #BAE6FD 0%, #C7F0FF 30%, #E0F2FE 55%, #FFF9C4 100%)",
                }}
            >
                {/* Background clouds image */}
                <img
                    src="/assets/ui/hero/clouds.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none select-none"
                />

                {/* Decorative floating elements */}
                <span
                    className="absolute top-28 left-[5%] text-4xl sm:text-5xl animate-bounce pointer-events-none select-none"
                    style={{ animationDuration: "3s" }}
                >
                    🎈
                </span>
                <span className="absolute top-[15%] right-[8%] text-2xl text-yellow-400 animate-pulse pointer-events-none select-none">
                    ⭐
                </span>
                <span
                    className="absolute top-[35%] right-[3%] text-4xl text-yellow-300 animate-pulse pointer-events-none select-none"
                    style={{ animationDelay: "0.7s" }}
                >
                    ✨
                </span>

                {/* Castle & rainbow (right side decoration) */}
                <div className="absolute bottom-16 right-0 w-[22%] opacity-70 pointer-events-none select-none hidden md:block">
                    <span className="text-[8rem]">🏰</span>
                </div>
                <span className="absolute top-[18%] right-[18%] text-5xl pointer-events-none select-none hidden lg:block">
                    🌈
                </span>

                {/* ── Hero content ── */}
                <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-8 pt-20 sm:pt-24 pb-28 sm:pb-32">
                    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
                        {/* ── LEFT: Text + CTA ── */}
                        <div className="w-full lg:w-[52%] flex flex-col items-center lg:items-start text-center lg:text-left">
                            {/* ABC blocks */}
                            <div className="flex items-end gap-1 mb-4 sm:mb-5">
                                {[
                                    { letter: "A", bg: "bg-[#3B82F6]" },
                                    {
                                        letter: "B",
                                        bg: "bg-[#F59E0B]",
                                        offset: "-translate-y-2",
                                    },
                                    { letter: "C", bg: "bg-[#EC4899]" },
                                ].map(({ letter, bg, offset = "" }) => (
                                    <div
                                        key={letter}
                                        className={`w-10 h-10 sm:w-12 sm:h-12 ${bg} ${offset} rounded-xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]`}
                                    >
                                        {letter}
                                    </div>
                                ))}
                            </div>

                            {/* Headline */}
                            <h1 className="text-[clamp(2rem,5vw,4rem)] font-black text-[#0F172A] leading-[1.1] tracking-tight">
                                Learn English <br />
                                with <span className="text-[#FF4B63]">Fun</span>
                                , <span className="text-[#10B981]">Games</span>,
                                <br />
                                and{" "}
                                <span className="text-[#8B5CF6]">Sounds</span>!
                            </h1>

                            <p className="text-sm sm:text-base text-gray-600 font-bold mt-4 max-w-sm">
                                Kiddo is a playful learning adventure for kids
                                aged 6–7. Play, listen, speak, and grow with
                                every lesson!
                            </p>

                            {/* CTA */}
                            <div className="mt-6 flex flex-col items-center lg:items-start gap-3">
                                <JuicyButton
                                    variant="purple"
                                    icon="🚀"
                                    onClick={() =>
                                        router.visit(user ? "/map" : "/login")
                                    }
                                    className="!text-base !px-7 !py-3"
                                >
                                    {user
                                        ? "Continue Journey ➔"
                                        : "Start Learning Now! ➔"}
                                </JuicyButton>
                                <p className="text-xs text-gray-500 font-bold flex items-center gap-2">
                                    <span className="text-white bg-[#10B981] rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0">
                                        ✔
                                    </span>
                                    Safe, fun & ad-free environment
                                </p>
                            </div>
                        </div>

                        {/* ── RIGHT: Fox mascot ── */}
                        <div className="w-full lg:w-[48%] relative flex justify-center items-end">
                            {/* Speech bubble */}
                            <div
                                className="absolute top-0 left-1/2 -translate-x-[75%] sm:left-[15%] sm:translate-x-0 bg-white px-4 py-2.5 rounded-[1.5rem] rounded-br-sm shadow-xl text-center z-20 animate-bounce"
                                style={{ animationDuration: "2.5s" }}
                            >
                                <p className="font-black text-[#9333EA] text-sm sm:text-base leading-tight">
                                    Hi there!
                                </p>
                                <p className="text-xs font-bold text-gray-600">
                                    Let's learn
                                    <br />
                                    together!
                                </p>
                            </div>

                            {/* Fox image — حجمها مسيطر عليه بالكامل */}
                            <img
                                src="/assets/ui/mascot/fox-main.png"
                                alt="Fox Mascot"
                                className="relative z-10 drop-shadow-2xl object-contain mt-10 sm:mt-8"
                                style={{
                                    width: "clamp(180px, 35vw, 360px)",
                                    maxHeight: "55vh",
                                }}
                                onError={(e) => {
                                    e.target.style.display = "none";
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Wave divider (نفس شكل الموك) ── */}
                <div
                    className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20"
                    style={{ lineHeight: 0 }}
                >
                    <svg
                        viewBox="0 0 1440 90"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full"
                        style={{
                            height: "clamp(50px, 8vw, 90px)",
                            display: "block",
                        }}
                    >
                        <path
                            d="M0,40 C180,90 360,0 540,45 C720,90 900,10 1080,50 C1260,90 1380,30 1440,50 L1440,90 L0,90 Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* ══════════════════════════════════════
                UNITS SECTION
            ══════════════════════════════════════ */}
            <section className="w-full bg-white pt-6 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B] inline-flex items-center gap-2">
                            <span className="text-yellow-400">⭐</span>
                            Our Learning Units
                            <span className="text-yellow-400">⭐</span>
                        </h2>
                        <p className="text-gray-500 font-bold mt-1 text-sm">
                            Five exciting units to explore and master!
                        </p>
                    </div>

                    {/* Grid — cards بارتفاع ثابت ومنضبط */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {lessons.map((l) => (
                            <div
                                key={l.number}
                                style={{ height: "clamp(160px, 22vw, 220px)" }}
                            >
                                <LessonCard
                                    {...l}
                                    onClick={() =>
                                        router.visit(user ? "/map" : "/login")
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                WHY KIDS LOVE KIDDO
            ══════════════════════════════════════ */}
            <section className="w-full bg-white pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-8 flex items-center justify-center gap-3">
                        <svg
                            width="36"
                            height="18"
                            viewBox="0 0 40 20"
                            className="stroke-[#FF4B63] opacity-60"
                        >
                            <path
                                d="M0,10 Q10,0 20,10 T40,10"
                                fill="none"
                                strokeWidth="3"
                            />
                        </svg>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#1E293B]">
                            Why Kids Love Kiddo
                        </h2>
                        <svg
                            width="36"
                            height="18"
                            viewBox="0 0 40 20"
                            className="stroke-[#FF4B63] opacity-60"
                        >
                            <path
                                d="M0,10 Q10,20 20,10 T40,10"
                                fill="none"
                                strokeWidth="3"
                            />
                        </svg>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FeatureCard
                            iconBg="bg-[#F3E8FF]"
                            iconColor="text-[#9333EA]"
                            icon="🎧"
                            title="Audio Learning"
                            desc="Listen to clear and fun English audio by native speakers."
                        />
                        <FeatureCard
                            iconBg="bg-[#DCFCE7]"
                            iconColor="text-[#16A34A]"
                            icon="🎮"
                            title="Games"
                            desc="Interactive games that make learning exciting and effective."
                        />
                        <FeatureCard
                            iconBg="bg-[#FEF3C7]"
                            iconColor="text-[#D97706]"
                            icon="🏆"
                            title="Rewards"
                            desc="Earn stars, badges, and certificates as you complete lessons."
                        />
                        <FeatureCard
                            iconBg="bg-[#FFE4E6]"
                            iconColor="text-[#E11D48]"
                            icon="🎤"
                            title="Pronunciation Practice"
                            desc="Speak, record, and hear yourself improve!"
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                FOOTER — مطابق للموك
            ══════════════════════════════════════ */}
            <footer className="w-full bg-[#F8FBFF] pt-8 pb-6 border-t border-blue-50 relative overflow-hidden">
                {/* Decorative smiley cloud (bottom right) */}
                <div className="absolute bottom-4 right-6 text-5xl opacity-60 pointer-events-none select-none">
                    😊
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-5">
                        {/* Logo + copyright */}
                        <div className="flex items-center gap-3">
                            <span className="font-black text-xl">
                                <span className="text-[#0EA5E9]">Kid</span>
                                <span className="text-[#FF4B63]">d</span>
                                <span className="text-[#F59E0B]">o</span>
                            </span>
                            <p className="text-[11px] font-bold text-gray-400 border-l border-gray-200 pl-3">
                                © 2024 Kiddo. All rights reserved.
                            </p>
                        </div>

                        {/* Footer links */}
                        <div className="flex items-center gap-5 text-[11px] font-bold text-gray-400">
                            {[
                                "Privacy Policy",
                                "Terms of Use",
                                "Help Center",
                            ].map((link) => (
                                <span
                                    key={link}
                                    className="cursor-pointer hover:text-[#9333EA] transition-colors"
                                >
                                    {link}
                                </span>
                            ))}
                        </div>                       
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeScreen;
