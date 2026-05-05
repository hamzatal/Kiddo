import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ═══════════════════════════════════════════════════════════════
   JuicyButton — Premium Glossy Pill Button
═══════════════════════════════════════════════════════════════ */
const JuicyButton = ({
    variant = "purple",
    icon,
    children,
    onClick,
    className = "",
    size = "md",
}) => {
    const base =
        "relative inline-flex items-center justify-center gap-2 font-black rounded-full select-none cursor-pointer transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-base",
    };

    const variants = {
        purple: [
            "text-white",
            "bg-[linear-gradient(180deg,_#C84BFF_0%,_#8B2FCF_100%)]",
            "shadow-[0_5px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40),_inset_0_-1px_0_0_rgba(0,0,0,0.15)]",
            "hover:shadow-[0_3px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40)]",
            "hover:translate-y-[2px]",
            "active:shadow-[0_1px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.20)]",
            "active:translate-y-[4px]",
            "focus-visible:ring-purple-400",
        ].join(" "),

        green: [
            "text-white",
            "bg-[linear-gradient(180deg,_#4ADE80_0%,_#16A34A_100%)]",
            "shadow-[0_5px_0_0_#0E6B2C,_inset_0_1px_0_0_rgba(255,255,255,0.40),_inset_0_-1px_0_0_rgba(0,0,0,0.15)]",
            "hover:shadow-[0_3px_0_0_#0E6B2C,_inset_0_1px_0_0_rgba(255,255,255,0.40)]",
            "hover:translate-y-[2px]",
            "active:shadow-[0_1px_0_0_#0E6B2C,_inset_0_1px_0_0_rgba(255,255,255,0.20)]",
            "active:translate-y-[4px]",
            "focus-visible:ring-green-400",
        ].join(" "),

        outline: [
            "text-[#7C3AED] bg-white",
            "border-[2.5px] border-[#9333EA]",
            "shadow-[0_4px_0_0_#C4B5FD,_inset_0_1px_0_0_rgba(255,255,255,0.9)]",
            "hover:shadow-[0_2px_0_0_#C4B5FD]",
            "hover:translate-y-[2px]",
            "hover:bg-purple-50",
            "active:shadow-[0_1px_0_0_#C4B5FD]",
            "active:translate-y-[3px]",
            "focus-visible:ring-purple-400",
        ].join(" "),

        white: [
            "text-[#7C3AED] bg-white",
            "shadow-[0_5px_0_0_rgba(0,0,0,0.18),_inset_0_1px_0_0_rgba(255,255,255,0.9)]",
            "hover:shadow-[0_3px_0_0_rgba(0,0,0,0.18)]",
            "hover:translate-y-[2px]",
            "active:shadow-[0_1px_0_0_rgba(0,0,0,0.18)]",
            "active:translate-y-[4px]",
            "focus-visible:ring-white",
        ].join(" "),
    };

    return (
        <button
            onClick={onClick}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {/* Inner gloss highlight */}
            <span
                className="pointer-events-none absolute inset-x-3 top-0.5 h-[42%] rounded-full opacity-30"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)",
                }}
            />
            {icon && (
                <span className="relative z-10 text-[1.1em] leading-none">
                    {icon}
                </span>
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
};

/* ═══════════════════════════════════════════════════════════════
   LessonCard — حافظ على الصور داخل الإطار 100%
═══════════════════════════════════════════════════════════════ */
const CARD_COLORS = {
    purple: {
        bg: "bg-[#F3E8FF]",
        badge: "bg-[#9333EA]",
        ring: "hover:ring-[#C084FC]",
        star: "text-[#9333EA]",
    },
    green: {
        bg: "bg-[#DCFCE7]",
        badge: "bg-[#16A34A]",
        ring: "hover:ring-[#4ADE80]",
        star: "text-[#16A34A]",
    },
    blue: {
        bg: "bg-[#E0F2FE]",
        badge: "bg-[#0284C7]",
        ring: "hover:ring-[#38BDF8]",
        star: "text-[#0284C7]",
    },
    pink: {
        bg: "bg-[#FFE4E6]",
        badge: "bg-[#E11D48]",
        ring: "hover:ring-[#FB7185]",
        star: "text-[#E11D48]",
    },
    amber: {
        bg: "bg-[#FEF3C7]",
        badge: "bg-[#D97706]",
        ring: "hover:ring-[#FCD34D]",
        star: "text-[#D97706]",
    },
};

const LessonCard = ({
    number,
    title,
    imagePath,
    colorKey = "purple",
    isLocked = false,
    onClick,
}) => {
    const c = CARD_COLORS[colorKey] ?? CARD_COLORS.purple;

    return (
        <div
            onClick={!isLocked ? onClick : undefined}
            className={[
                "group relative flex flex-col rounded-3xl border-2 border-white overflow-hidden h-full",
                "transition-all duration-250 ease-out",
                isLocked
                    ? "opacity-60 cursor-not-allowed grayscale-[40%]"
                    : `cursor-pointer hover:-translate-y-1.5 hover:shadow-xl ring-2 ring-transparent ${c.ring}`,
                c.bg,
                "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
            ].join(" ")}
        >
            {/* Number badge */}
            <div
                className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full ${c.badge} text-white font-black text-[13px] flex items-center justify-center shadow-md`}
            >
                {number}
            </div>

            {/* Lock overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="bg-white/70 backdrop-blur-[2px] rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
                        <span className="text-2xl">🔒</span>
                    </div>
                </div>
            )}

            {/* Image area — fixed height, contained */}
            <div className="flex-1 flex items-center justify-center p-3 pt-10 overflow-hidden">
                <img
                    src={imagePath}
                    alt={title}
                    loading="lazy"
                    className="w-full h-full object-contain drop-shadow-md"
                    style={{ maxHeight: "8rem" }}
                    onError={(e) => {
                        e.target.style.opacity = "0.3";
                    }}
                />
            </div>

            {/* Title area */}
            <div className="px-3 pb-3 text-center">
                <p className="font-black text-[#1E293B] text-[11px] sm:text-xs leading-tight line-clamp-2">
                    {title}
                </p>
            </div>

            {/* Star sparkle */}
            {!isLocked && (
                <span
                    className={`absolute bottom-2 right-2.5 ${c.star} text-[11px] opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                    ⭐
                </span>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   FeatureCard
═══════════════════════════════════════════════════════════════ */
const FEATURE_COLORS = {
    purple: { wrap: "bg-[#F3E8FF]", icon: "bg-[#9333EA]/10 text-[#9333EA]" },
    green: { wrap: "bg-[#DCFCE7]", icon: "bg-[#16A34A]/10 text-[#16A34A]" },
    amber: { wrap: "bg-[#FEF9C3]", icon: "bg-[#D97706]/10 text-[#D97706]" },
    pink: { wrap: "bg-[#FFE4E6]", icon: "bg-[#E11D48]/10 text-[#E11D48]" },
};

const FeatureCard = ({ colorKey = "purple", emoji, title, desc }) => {
    const c = FEATURE_COLORS[colorKey];
    return (
        <div
            className={`${c.wrap} rounded-3xl p-5 flex items-start gap-4 border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200`}
        >
            <div
                className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center text-2xl shrink-0 shadow-sm`}
            >
                {emoji}
            </div>
            <div className="min-w-0">
                <h3 className="font-black text-[#1E293B] text-sm mb-1 leading-tight">
                    {title}
                </h3>
                <p className="text-[11px] text-[#64748B] font-semibold leading-relaxed">
                    {desc}
                </p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   StatPill — للـ Hero stats
═══════════════════════════════════════════════════════════════ */
const StatPill = ({ value, label }) => (
    <div className="flex flex-col items-center sm:items-start">
        <span className="font-black text-[#0F172A] text-base sm:text-lg leading-none">
            {value}
        </span>
        <span className="text-[10px] text-[#64748B] font-semibold mt-0.5">
            {label}
        </span>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   HomeScreen — Main Page
═══════════════════════════════════════════════════════════════ */
const HomeScreen = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = usePage().props;

    useEffect(() => {
        const el = document.getElementById("home-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    const lessons = [
        {
            number: "1",
            title: "Welcome / Hello",
            imagePath: "/assets/lessons/welcome/hello.png",
            colorKey: "purple",
        },
        {
            number: "2",
            title: "Family and Friends",
            imagePath: "/assets/lessons/family/family_group.png",
            colorKey: "green",
        },
        {
            number: "3",
            title: "My School Bag",
            imagePath: "/assets/lessons/schoolbag/bag.png",
            colorKey: "blue",
            isLocked: true,
        },
        {
            number: "4",
            title: "Our Classroom",
            imagePath: "/assets/lessons/classroom/desk.png",
            colorKey: "pink",
            isLocked: true,
        },
        {
            number: "5",
            title: "My Favourite Toy",
            imagePath: "/assets/lessons/toy/ball.png",
            colorKey: "amber",
            isLocked: true,
        },
    ];

    const features = [
        {
            colorKey: "purple",
            emoji: "🎧",
            title: "Audio Learning",
            desc: "Clear native English audio by professional speakers.",
        },
        {
            colorKey: "green",
            emoji: "🎮",
            title: "Fun Games",
            desc: "Interactive mini-games that make every lesson exciting.",
        },
        {
            colorKey: "amber",
            emoji: "🏆",
            title: "Rewards & Badges",
            desc: "Earn stars, badges and certificates along the way.",
        },
        {
            colorKey: "pink",
            emoji: "✍️",
            title: "Practice Activities",
            desc: "Hands-on exercises to reinforce every new word.",
        },
    ];

    const goToApp = () => router.visit(user ? "/map" : "/login");
    const goToLogin = () => router.visit(user ? "/progress" : "/login");

    const navLinks = [
        { icon: "🏠", label: "Home", path: "/", active: true },
        { icon: "📖", label: "Lessons", path: "/map", active: false },
        { icon: "ℹ️", label: "About", path: "/", active: false },
        { icon: "✉️", label: "Contact", path: "/", active: false },
    ];

    return (
        <div
            id="home-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans scroll-smooth"
            style={{ scrollBehavior: "smooth" }}
        >
            {/* ═════════════════════════════════════════════
                HERO SECTION (contains transparent navbar)
            ═════════════════════════════════════════════ */}
            <section
                id="hero"
                className="relative w-full overflow-hidden flex flex-col"
                style={{
                    background:
                        "linear-gradient(155deg, #BAE6FD 0%, #C7F0FF 25%, #D9F0FF 50%, #EFF9FF 75%, #FFF9E0 100%)",
                    minHeight: "100svh",
                }}
            >
                {/* ── Background clouds ── */}
                <img
                    src="/assets/ui/hero/clouds.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
                    style={{ opacity: 0.55 }}
                />

                {/* ── Subtle radial light in center ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,255,255,0.38) 0%, transparent 70%)",
                    }}
                />

                {/* ── Decorative blobs ── */}
                <div className="absolute top-16 right-[12%] w-24 h-24 rounded-full bg-yellow-200/40 blur-2xl pointer-events-none" />
                <div className="absolute bottom-[30%] left-[8%] w-32 h-32 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />
                <div className="absolute bottom-[20%] right-[5%] w-20 h-20 rounded-full bg-pink-200/40 blur-2xl pointer-events-none" />

                {/* ── Floating decorative elements ── */}
                <span
                    className="absolute select-none pointer-events-none hidden sm:block"
                    style={{
                        top: "22%",
                        left: "4%",
                        fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                        animation: "floatA 4s ease-in-out infinite",
                    }}
                >
                    🎈
                </span>
                <span
                    className="absolute select-none pointer-events-none"
                    style={{
                        top: "14%",
                        right: "6%",
                        fontSize: "clamp(1.2rem, 2.2vw, 1.8rem)",
                        animation: "floatB 5s ease-in-out infinite",
                    }}
                >
                    ⭐
                </span>
                <span
                    className="absolute select-none pointer-events-none hidden md:block"
                    style={{
                        top: "38%",
                        right: "2.5%",
                        fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
                        animation: "floatA 6s ease-in-out infinite 0.5s",
                    }}
                >
                    ✨
                </span>
                <span
                    className="absolute select-none pointer-events-none hidden lg:block"
                    style={{
                        top: "20%",
                        right: "22%",
                        fontSize: "clamp(2rem, 4vw, 3.5rem)",
                        opacity: 0.7,
                        animation: "floatB 7s ease-in-out infinite 1s",
                    }}
                >
                    🌈
                </span>
                <span
                    className="absolute select-none pointer-events-none hidden lg:block"
                    style={{
                        bottom: "28%",
                        right: "3%",
                        fontSize: "clamp(3rem, 7vw, 6rem)",
                        opacity: 0.5,
                    }}
                >
                    🏰
                </span>

                {/* ════════════════════════════════════════
                    NAVBAR (floating transparent → glass)
                ════════════════════════════════════════ */}
                <nav
                    className={[
                        "sticky top-0 z-50 w-full transition-all duration-300",
                        scrolled
                            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-white/60 py-2"
                            : "bg-transparent py-3.5",
                    ].join(" ")}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
                        {/* Logo */}
                        <button
                            onClick={() => router.visit("/")}
                            className="shrink-0 focus:outline-none"
                            aria-label="Kiddo Home"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-9 sm:h-10 object-contain drop-shadow-sm"
                                onError={(e) => {
                                    e.currentTarget.outerHTML = `<span class="font-black text-2xl"><span class="text-[#0EA5E9]">Kid</span><span class="text-[#FF4B63]">d</span><span class="text-[#F59E0B]">o</span></span>`;
                                }}
                            />
                        </button>

                        {/* Desktop nav */}
                        <ul className="hidden lg:flex items-center gap-7 font-black text-[13.5px] text-[#475569]">
                            {navLinks.map((item) => (
                                <li key={item.label}>
                                    <button
                                        onClick={() => router.visit(item.path)}
                                        className={[
                                            "flex items-center gap-1.5 pb-0.5 border-b-2 transition-colors duration-150",
                                            item.active
                                                ? "text-[#9333EA] border-[#9333EA]"
                                                : "border-transparent hover:text-[#9333EA] hover:border-[#9333EA]",
                                        ].join(" ")}
                                    >
                                        <span className="text-base leading-none">
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* CTA desktop */}
                        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                            <JuicyButton
                                variant="green"
                                icon="⭐"
                                onClick={goToApp}
                            >
                                {user ? "Play Now" : "Start Learning"}
                            </JuicyButton>
                            <JuicyButton
                                variant="outline"
                                icon="👨‍👩‍👧"
                                onClick={goToLogin}
                                className="hidden md:inline-flex"
                            >
                                {user ? "Dashboard" : "Login"}
                            </JuicyButton>
                            {user && (
                                <button
                                    onClick={() => router.post("/logout")}
                                    className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors ml-1"
                                >
                                    Logout
                                </button>
                            )}
                        </div>

                        {/* Hamburger */}
                        <button
                            onClick={() => setMenuOpen((o) => !o)}
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            className="sm:hidden w-9 h-9 flex flex-col justify-center items-center gap-[5px] rounded-xl bg-white/80 border border-white/60 shadow-sm shrink-0 focus:outline-none"
                        >
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className={[
                                        "block w-5 h-[2.5px] bg-[#334155] rounded-full transition-all duration-200 origin-center",
                                        i === 0 && menuOpen
                                            ? "rotate-45 translate-y-[7.5px]"
                                            : "",
                                        i === 1 && menuOpen
                                            ? "opacity-0 scale-x-0"
                                            : "",
                                        i === 2 && menuOpen
                                            ? "-rotate-45 -translate-y-[7.5px]"
                                            : "",
                                    ].join(" ")}
                                />
                            ))}
                        </button>
                    </div>

                    {/* Mobile dropdown */}
                    <div
                        className={[
                            "sm:hidden overflow-hidden transition-all duration-300",
                            menuOpen
                                ? "max-h-96 opacity-100"
                                : "max-h-0 opacity-0",
                        ].join(" ")}
                    >
                        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg px-5 py-4 flex flex-col gap-2">
                            {navLinks.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        router.visit(item.path);
                                        setMenuOpen(false);
                                    }}
                                    className={[
                                        "text-left font-black text-sm py-2 border-b border-gray-50 transition-colors",
                                        item.active
                                            ? "text-[#9333EA]"
                                            : "text-[#1E293B] hover:text-[#9333EA]",
                                    ].join(" ")}
                                >
                                    {item.icon} {item.label}
                                </button>
                            ))}
                            <div className="flex flex-col gap-2 pt-2">
                                <JuicyButton
                                    variant="green"
                                    onClick={goToApp}
                                    className="w-full"
                                >
                                    {user ? "Play Now" : "Start Learning"}
                                </JuicyButton>
                                <JuicyButton
                                    variant="outline"
                                    onClick={goToLogin}
                                    className="w-full"
                                >
                                    {user
                                        ? "Dashboard"
                                        : "Parent / Teacher Login"}
                                </JuicyButton>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ════════════════════════════════════════
                    HERO BODY
                ════════════════════════════════════════ */}
                <div className="relative z-10 flex-1 flex items-center">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-6 lg:gap-8">
                            {/* ── LEFT: Text ── */}
                            <div className="w-full lg:w-[54%] flex flex-col items-center lg:items-start text-center lg:text-left">
                                {/* ABC blocks */}
                                <div className="flex items-end gap-1.5 mb-5 sm:mb-6">
                                    {[
                                        {
                                            l: "A",
                                            bg: "#3B82F6",
                                            shadow: "#1D4ED8",
                                        },
                                        {
                                            l: "B",
                                            bg: "#F59E0B",
                                            shadow: "#B45309",
                                            offset: true,
                                        },
                                        {
                                            l: "C",
                                            bg: "#EC4899",
                                            shadow: "#BE185D",
                                        },
                                    ].map(({ l, bg, shadow, offset }) => (
                                        <div
                                            key={l}
                                            className={`flex items-center justify-center text-white font-black rounded-xl select-none ${offset ? "-translate-y-2" : ""}`}
                                            style={{
                                                width: "clamp(2.2rem, 4vw, 3rem)",
                                                height: "clamp(2.2rem, 4vw, 3rem)",
                                                fontSize:
                                                    "clamp(1rem, 2vw, 1.4rem)",
                                                background: `linear-gradient(180deg, ${bg} 0%, ${shadow} 100%)`,
                                                boxShadow: `0 4px 0 0 ${shadow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                                            }}
                                        >
                                            {l}
                                        </div>
                                    ))}
                                </div>

                                {/* Headline */}
                                <h1
                                    className="font-black text-[#0F172A] leading-[1.08] tracking-tight"
                                    style={{
                                        fontSize:
                                            "clamp(1.9rem, 4.5vw, 3.75rem)",
                                    }}
                                >
                                    Learn English
                                    <br />
                                    with{" "}
                                    <span
                                        style={{
                                            color: "#FF4B63",
                                            WebkitTextStroke: "1px #cc0019",
                                            textShadow:
                                                "0 2px 0 rgba(255,75,99,0.18)",
                                        }}
                                    >
                                        Fun
                                    </span>
                                    ,{" "}
                                    <span
                                        style={{
                                            color: "#10B981",
                                            WebkitTextStroke: "1px #059669",
                                            textShadow:
                                                "0 2px 0 rgba(16,185,129,0.18)",
                                        }}
                                    >
                                        Games
                                    </span>
                                    ,
                                    <br />
                                    and{" "}
                                    <span
                                        style={{
                                            color: "#8B5CF6",
                                            WebkitTextStroke: "1px #6D28D9",
                                            textShadow:
                                                "0 2px 0 rgba(139,92,246,0.18)",
                                        }}
                                    >
                                        Sounds
                                    </span>
                                    !
                                </h1>

                                {/* Sub-headline badge */}
                                <div className="flex items-center gap-2 mt-4 sm:mt-5 bg-white/80 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/60 shadow-sm w-fit mx-auto lg:mx-0">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                    <span className="text-[11px] font-black text-[#334155]">
                                        Safe · Fun · 100% Ad-free
                                    </span>
                                </div>

                                <p
                                    className="text-[#475569] font-semibold mt-3 max-w-[400px] leading-relaxed"
                                    style={{
                                        fontSize: "clamp(0.8rem, 1.5vw, 1rem)",
                                    }}
                                >
                                    Kiddo is a playful learning adventure for
                                    kids aged 6–7. Play, listen, and grow with
                                    every lesson!
                                </p>

                                {/* CTA */}
                                <div className="mt-5 sm:mt-6 flex flex-col items-center lg:items-start gap-3">
                                    <JuicyButton
                                        variant="purple"
                                        icon="🚀"
                                        onClick={goToApp}
                                        size="lg"
                                    >
                                        {user
                                            ? "Continue Journey ➔"
                                            : "Start Learning Now! ➔"}
                                    </JuicyButton>
                                    <p className="flex items-center gap-2 text-xs text-[#64748B] font-semibold">
                                        <span
                                            className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] shrink-0 font-black"
                                            style={{
                                                boxShadow: "0 2px 0 #059669",
                                            }}
                                        >
                                            ✔
                                        </span>
                                        No sign-up required · Free to start
                                    </p>
                                </div>

                                {/* Stats row */}
                                <div className="mt-5 sm:mt-6 flex items-center gap-5 sm:gap-7">
                                    <StatPill
                                        value="10K+"
                                        label="Kids learning"
                                    />
                                    <span className="w-px h-8 bg-gray-200" />
                                    <StatPill value="5" label="Fun units" />
                                    <span className="w-px h-8 bg-gray-200" />
                                    <StatPill
                                        value="⭐⭐⭐⭐⭐"
                                        label="Parent rating"
                                    />
                                </div>
                            </div>

                            {/* ── RIGHT: Fox ── */}
                            <div className="w-full lg:w-[46%] relative flex justify-center items-end">
                                {/* Speech bubble */}
                                <div
                                    className="absolute z-20 bg-white rounded-[20px] rounded-br-[4px] px-4 py-3 shadow-xl border border-white/60 text-center"
                                    style={{
                                        top: "8%",
                                        left: "8%",
                                        animation:
                                            "floatB 3s ease-in-out infinite",
                                        minWidth: "130px",
                                    }}
                                >
                                    <p className="font-black text-[#7C3AED] text-sm leading-snug">
                                        Hi there! 👋
                                    </p>
                                    <p className="text-[11px] font-semibold text-[#475569] mt-0.5">
                                        Let's learn
                                        <br />
                                        together!
                                    </p>
                                    {/* tail */}
                                    <div
                                        className="absolute -bottom-2 right-3 w-4 h-4 bg-white border-b border-r border-white/60 rotate-45"
                                        style={{
                                            boxShadow:
                                                "2px 2px 0 rgba(255,255,255,0.6)",
                                        }}
                                    />
                                </div>

                                {/* Fox image — clamp size, never overflows */}
                                <img
                                    src="/assets/ui/mascot/fox-main.png"
                                    alt="Kiddo Fox Mascot"
                                    className="relative z-10 object-contain drop-shadow-2xl"
                                    style={{
                                        width: "clamp(170px, 32vw, 340px)",
                                        maxHeight: "52vh",
                                        marginTop: "auto",
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── WAVE DIVIDER ── */}
                <div
                    className="relative z-20 mt-auto"
                    style={{ lineHeight: 0, marginBottom: "-2px" }}
                >
                    <svg
                        viewBox="0 0 1440 80"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="w-full block"
                        style={{ height: "clamp(44px, 6vw, 80px)" }}
                    >
                        <path
                            d="M0,35 C120,65 240,10 360,40 C480,70 600,8 720,38 C840,68 960,12 1080,42 C1200,72 1320,18 1440,45 L1440,80 L0,80 Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                OUR LEARNING UNITS
            ═════════════════════════════════════════════ */}
            <section className="w-full bg-white py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section heading */}
                    <div className="text-center mb-7 sm:mb-8">
                        <p className="text-[11px] sm:text-xs font-black text-[#9333EA] uppercase tracking-[0.15em] mb-2">
                            📚 Curriculum
                        </p>
                        <h2
                            className="font-black text-[#0F172A] inline-flex items-center gap-2 flex-wrap justify-center"
                            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                        >
                            <span className="text-yellow-400">⭐</span>
                            Our Learning Units
                            <span className="text-yellow-400">⭐</span>
                        </h2>
                        <p className="text-sm text-[#94A3B8] font-semibold mt-1.5">
                            5 themed units · games, audio &amp; activities
                        </p>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        {lessons.map((l) => (
                            <div
                                key={l.number}
                                style={{ height: "clamp(150px, 20vw, 210px)" }}
                            >
                                <LessonCard {...l} onClick={goToApp} />
                            </div>
                        ))}
                    </div>

                    {/* View all */}
                    <div className="text-center mt-6 sm:mt-8">
                        <button
                            onClick={goToApp}
                            className="inline-flex items-center gap-2 text-[#9333EA] font-black text-sm border-2 border-[#9333EA] rounded-full px-6 py-2.5
                                hover:bg-[#9333EA] hover:text-white transition-all duration-150
                                shadow-[0_3px_0_#7E22CE] hover:shadow-[0_1px_0_#7E22CE] hover:translate-y-[2px]"
                        >
                            View All Units ➔
                        </button>
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                WHY KIDS LOVE KIDDO
            ═════════════════════════════════════════════ */}
            <section
                className="w-full py-10 sm:py-14"
                style={{
                    background:
                        "linear-gradient(180deg, #F8FAFF 0%, #F0F4FF 100%)",
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-7 sm:mb-8">
                        <p className="text-[11px] sm:text-xs font-black text-[#16A34A] uppercase tracking-[0.15em] mb-2">
                            ✨ Why Kiddo?
                        </p>
                        <h2
                            className="font-black text-[#0F172A]"
                            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                        >
                            Why Kids Love Kiddo
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((f) => (
                            <FeatureCard key={f.title} {...f} />
                        ))}
                    </div>

                    {/* Testimonial banner */}
                    <div className="mt-7 sm:mt-10 bg-gradient-to-r from-purple-50 via-white to-blue-50 rounded-3xl p-5 sm:p-7 border border-purple-100 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                        <div className="flex -space-x-3 shrink-0">
                            {["👦", "👧", "🧒"].map((e, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-xl shadow-md"
                                >
                                    {e}
                                </div>
                            ))}
                        </div>
                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <p className="font-black text-[#1E293B] text-sm sm:text-base leading-snug">
                                "My daughter asks to practice every single day!"
                            </p>
                            <p className="text-xs text-[#94A3B8] font-semibold mt-1">
                                — Sarah M., parent of a 6-year-old
                            </p>
                        </div>
                        <JuicyButton
                            variant="purple"
                            onClick={goToApp}
                            className="shrink-0 !text-sm !px-6 !py-3"
                        >
                            Try it free 🎉
                        </JuicyButton>
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                HOW IT WORKS
            ═════════════════════════════════════════════ */}
            <section className="w-full bg-white py-10 sm:py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-7 sm:mb-8">
                        <p className="text-[11px] sm:text-xs font-black text-[#DB2777] uppercase tracking-[0.15em] mb-2">
                            🗺️ Journey
                        </p>
                        <h2
                            className="font-black text-[#0F172A]"
                            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                        >
                            How It Works
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative">
                        {/* Connector line (desktop) */}
                        <div className="hidden sm:block absolute top-[2.8rem] left-[calc(16.6%+2rem)] right-[calc(16.6%+2rem)] h-px border-t-2 border-dashed border-purple-200 z-0" />

                        {[
                            {
                                step: "1",
                                icon: "🎯",
                                title: "Pick a Unit",
                                desc: "Choose a topic that excites your child — greetings, family, school & more.",
                            },
                            {
                                step: "2",
                                icon: "🔊",
                                title: "Learn & Listen",
                                desc: "Hear native speakers, see colourful flashcards, and repeat out loud.",
                            },
                            {
                                step: "3",
                                icon: "🏆",
                                title: "Play & Win",
                                desc: "Complete activities to earn stars and unlock the next adventure!",
                            },
                        ].map(({ step, icon, title, desc }) => (
                            <div
                                key={step}
                                className="relative z-10 bg-white rounded-3xl p-5 sm:p-6 border border-purple-50 shadow-sm flex flex-row sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-3 hover:shadow-md transition-shadow"
                            >
                                <div
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#9333EA] flex items-center justify-center text-2xl text-white shrink-0 relative z-10"
                                    style={{
                                        boxShadow:
                                            "0 4px 0 #6B21A8, inset 0 1px 0 rgba(255,255,255,0.25)",
                                    }}
                                >
                                    {icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-0.5">
                                        Step {step}
                                    </p>
                                    <h3 className="font-black text-[#1E293B] text-base sm:text-lg leading-tight">
                                        {title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#64748B] font-semibold mt-1.5 leading-relaxed">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                CTA BANNER
            ═════════════════════════════════════════════ */}
            <section
                className="w-full py-12 sm:py-16 relative overflow-hidden"
                style={{
                    background:
                        "linear-gradient(135deg, #7C3AED 0%, #9333EA 50%, #A855F7 100%)",
                }}
            >
                {/* Background sparkles */}
                {[
                    "top-3 left-10 text-5xl",
                    "top-8 right-14 text-4xl",
                    "bottom-5 left-1/4 text-4xl",
                    "bottom-3 right-1/3 text-5xl",
                ].map((cls, i) => (
                    <span
                        key={i}
                        className={`absolute ${cls} opacity-[0.12] pointer-events-none select-none`}
                    >
                        {["⭐", "🎮", "🏆", "🎧"][i]}
                    </span>
                ))}

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <h2
                        className="font-black text-white leading-tight"
                        style={{ fontSize: "clamp(1.5rem, 4vw, 2.4rem)" }}
                    >
                        Ready to start the adventure? 🚀
                    </h2>
                    <p className="text-purple-200 font-semibold text-sm sm:text-base mt-2 sm:mt-3 max-w-md mx-auto">
                        Join thousands of kids already learning English with
                        Kiddo — it's completely free!
                    </p>
                    <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <JuicyButton
                            variant="white"
                            icon="🎉"
                            onClick={goToApp}
                            size="lg"
                        >
                            Start for Free
                        </JuicyButton>
                        <button
                            onClick={goToLogin}
                            className="inline-flex items-center gap-2 border-2 border-white/60 text-white font-black rounded-full px-7 py-3.5 text-base
                                hover:bg-white/15 transition-colors duration-150"
                        >
                            👨‍👩‍👧 Parent Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* ═════════════════════════════════════════════
                FOOTER
            ═════════════════════════════════════════════ */}
            <footer className="w-full bg-[#F8FAFF] border-t border-blue-50 pt-8 pb-5 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-blue-100/40 blur-2xl pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top row */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-blue-100/60">
                        {/* Logo + tagline */}
                        <div className="flex items-center gap-3">
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-8 object-contain"
                                onError={(e) => {
                                    e.currentTarget.outerHTML = `<span class="font-black text-xl"><span class="text-[#0EA5E9]">Kid</span><span class="text-[#FF4B63]">d</span><span class="text-[#F59E0B]">o</span></span>`;
                                }}
                            />
                            <div className="border-l border-gray-200 pl-3">
                                <p className="text-xs font-black text-[#334155] leading-none">
                                    Learn. Play. Grow.
                                </p>
                                <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">
                                    English for kids aged 6–7
                                </p>
                            </div>
                        </div>

                        {/* Footer links */}
                        <div className="flex items-center gap-5 sm:gap-7 text-[11px] font-bold text-[#94A3B8]">
                            {[
                                "Privacy Policy",
                                "Terms of Use",
                                "Help Center",
                                "Contact",
                            ].map((link) => (
                                <button
                                    key={link}
                                    className="hover:text-[#9333EA] transition-colors duration-150 focus:outline-none focus-visible:underline"
                                >
                                    {link}
                                </button>
                            ))}
                        </div>

                        {/* Social icons */}
                        <div className="flex items-center gap-2">
                            {[
                                { bg: "#1877F2", label: "Facebook", char: "f" },
                                {
                                    bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)",
                                    label: "Instagram",
                                    char: "in",
                                },
                                { bg: "#FF0000", label: "YouTube", char: "▶" },
                            ].map(({ bg, label, char }) => (
                                <button
                                    key={label}
                                    aria-label={label}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs hover:scale-110 hover:shadow-lg transition-all duration-150 focus:outline-none"
                                    style={{ background: bg }}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4">
                        <p className="text-[11px] font-bold text-[#CBD5E1]">
                            © 2026 Kiddo. Made with ❤️ for curious kids.
                        </p>
                        <p className="text-[11px] text-[#CBD5E1] font-semibold">
                            🌍 Available worldwide · Free forever
                        </p>
                    </div>
                </div>
            </footer>

            {/* ═════════════════════════════════════════════
                GLOBAL ANIMATIONS
            ═════════════════════════════════════════════ */}
            <style>{`
                @keyframes floatA {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%       { transform: translateY(-10px) rotate(3deg); }
                }
                @keyframes floatB {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%       { transform: translateY(-7px) rotate(-2deg); }
                }
            `}</style>
        </div>
    );
};

export default HomeScreen;
