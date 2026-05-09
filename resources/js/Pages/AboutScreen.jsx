import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

const StatBadge = ({ value, label, color }) => (
    <div
        className="flex flex-col items-center justify-center rounded-3xl p-5 border border-white/60 shadow-sm"
        style={{ background: color }}
    >
        <span className="font-black text-3xl text-[#1E293B] leading-none">
            {value}
        </span>
        <span className="text-[11px] font-bold text-[#64748B] mt-1.5 text-center leading-snug">
            {label}
        </span>
    </div>
);

const TeamCard = ({ emoji, name, role, color }) => (
    <div
        className="rounded-3xl p-5 flex flex-col items-center text-center border-2 border-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
        style={{ background: color }}
    >
        <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center text-3xl shadow-sm mb-3">
            {emoji}
        </div>
        <p className="font-black text-[#1E293B] text-sm leading-tight">
            {name}
        </p>
        <p className="text-[11px] text-[#64748B] font-semibold mt-1">{role}</p>
    </div>
);

const ValueCard = ({ emoji, title, desc, bg }) => (
    <div
        className={`${bg} rounded-3xl p-5 border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
        <div className="text-2xl mb-3">{emoji}</div>
        <h3 className="font-black text-[#1E293B] text-sm mb-1.5">{title}</h3>
        <p className="text-[11px] text-[#64748B] font-semibold leading-relaxed">
            {desc}
        </p>
    </div>
);

const JuicyButton = ({
    variant = "purple",
    icon,
    children,
    onClick,
    className = "",
    size = "md",
}) => {
    const base =
        "relative inline-flex items-center justify-center gap-2 font-black select-none cursor-pointer transition-all duration-100 focus:outline-none";
    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-base",
    };
    const variants = {
        purple: "text-white bg-[linear-gradient(180deg,_#C84BFF_0%,_#8B2FCF_100%)] rounded-full shadow-[0_5px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:shadow-[0_3px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#5B0F99] active:translate-y-[4px]",
        flatAuth:
            "text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px] shadow-none border-none",
    };
    return (
        <button
            onClick={onClick}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {variant !== "flatAuth" && (
                <span
                    className="pointer-events-none absolute inset-x-3 top-0.5 h-[42%] rounded-full opacity-30"
                    style={{
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)",
                    }}
                />
            )}
            {icon && (
                <span className="relative z-10 text-[1.1em] leading-none">
                    {icon}
                </span>
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
};

const AboutScreen = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = usePage().props;

    useEffect(() => {
        const el = document.getElementById("about-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    const stats = [
        { value: "5", label: "Learning lessons", color: "#F3E8FF" },
        { value: "6–7", label: "Target Age", color: "#DCFCE7" },
        { value: "100%", label: "Free to Use", color: "#FEF3C7" },
    ];

    const values = [
        {
            emoji: "🎮",
            title: "Learning Through Play",
            desc: "Every concept is delivered through interactive games and activities, turning each lesson into an engaging experience children look forward to.",
            bg: "bg-[#F3E8FF]",
        },
        {
            emoji: "🔒",
            title: "Safe & Child-Friendly",
            desc: "No advertisements, no camera access, no microphone required — a fully secure environment designed with young learners in mind.",
            bg: "bg-[#DCFCE7]",
        },
        {
            emoji: "📘",
            title: "Curriculum-Aligned",
            desc: "All content is developed in direct alignment with the official Jordanian Ministry of Education Grade 1 English curriculum.",
            bg: "bg-[#FEF3C7]",
        },
        {
            emoji: "⭐",
            title: "Progress & Motivation",
            desc: "A built-in rewards system featuring stars, badges, and unlockable levels keeps students motivated and engaged throughout their learning journey.",
            bg: "bg-[#FFE4E6]",
        },
        {
            emoji: "🎧",
            title: "High-Quality Audio",
            desc: "Every vocabulary word and phrase is accompanied by clear, professionally recorded audio to support accurate pronunciation from the very first lesson.",
            bg: "bg-[#E0F2FE]",
        },
        {
            emoji: "📱",
            title: "Accessible on Any Device",
            desc: "Kiddo runs seamlessly on tablets, smartphones, and desktop computers — no installation required, accessible from any modern browser.",
            bg: "bg-[#F0FDF4]",
        },
    ];

    const pillars = [
        {
            emoji: "🎯",
            title: "Our Mission",
            desc: "To make high-quality English language education accessible, enjoyable, and effective for every first-grade student in Jordan — regardless of background or resources.",
            color: "#F3E8FF",
            textColor: "#9333EA",
        },
        {
            emoji: "🌟",
            title: "Our Vision",
            desc: "A future where every child enters the second grade with confidence in English, equipped with the vocabulary, listening skills, and enthusiasm to keep learning.",
            color: "#DCFCE7",
            textColor: "#16A34A",
        },
        {
            emoji: "💡",
            title: "Our Approach",
            desc: "We combine educational research with modern game design principles to deliver content that is both pedagogically sound and genuinely fun for young learners.",
            color: "#FEF3C7",
            textColor: "#D97706",
        },
    ];

    const navLinks = [
        { icon: "🏠", label: "Home", path: "/", active: false },
        { icon: "📖", label: "Lessons", path: "/map", active: false },
        { icon: "ℹ️", label: "About", path: "/about", active: true },
        { icon: "✉️", label: "Contact", path: "/contact", active: false },
    ];

    return (
        <div
            id="about-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans"
        >
            {/* ══ NAV ══ */}
            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2" : "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-3"}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => router.visit("/")}
                    >
                        <span className="font-black text-2xl sm:text-3xl tracking-wide">
                            <span className="text-[#0EA5E9]">Kid</span>
                            <span className="text-[#FF4B63]">d</span>
                            <span className="text-[#F59E0B]">o</span>
                        </span>
                    </div>
                    <ul className="hidden lg:flex items-center gap-7 font-black text-[14px] text-[#475569]">
                        {navLinks.map((item) => (
                            <li
                                key={item.label}
                                onClick={() => router.visit(item.path)}
                                className={`flex items-center gap-1.5 cursor-pointer pb-1 border-b-2 transition-colors ${item.active ? "text-[#9333EA] border-[#9333EA]" : "border-transparent hover:text-[#9333EA] hover:border-[#9333EA]"}`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </li>
                        ))}
                    </ul>
                    <div className="hidden sm:flex items-center gap-4">
                        <JuicyButton
                            variant="flatAuth"
                            onClick={() =>
                                router.visit(user ? "/map" : "/login")
                            }
                        >
                            {user ? "Continue Learning" : "Login / Register"}
                        </JuicyButton>
                        {user && (
                            <button
                                onClick={() => router.post("/logout")}
                                className="text-gray-400 hover:text-red-500 font-bold text-sm"
                            >
                                Logout
                            </button>
                        )}
                    </div>
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
                {menuOpen && (
                    <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg px-5 py-4 flex flex-col gap-3">
                        {navLinks.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    router.visit(item.path);
                                    setMenuOpen(false);
                                }}
                                className="text-left font-black text-[#1E293B] text-base border-b border-gray-50 pb-2 hover:text-[#9333EA]"
                            >
                                {item.icon} {item.label}
                            </button>
                        ))}
                        <div className="pt-2">
                            <JuicyButton
                                variant="flatAuth"
                                onClick={() =>
                                    router.visit(user ? "/map" : "/login")
                                }
                                className="w-full justify-center"
                            >
                                {user
                                    ? "Continue Learning"
                                    : "Login / Register"}
                            </JuicyButton>
                        </div>
                    </div>
                )}
            </nav>

            {/* ══ CONTENT ══ */}
            <div
                className="pt-16"
                style={{
                    background:
                        "linear-gradient(160deg,#BAE6FD 0%,#F0F4FF 40%,#FFF9E0 100%)",
                }}
            >
                {/* HERO */}
                <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 border border-purple-100 shadow-sm mb-6">
                        <span className="text-sm">📘</span>
                        <span className="text-xs font-black text-[#9333EA] uppercase tracking-widest">
                            Jordanian Grade 1 English Curriculum
                        </span>
                    </div>

                    <h1
                        className="font-black text-[#0F172A] leading-tight mb-5"
                        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                    >
                        About <span className="text-[#0EA5E9]">Kid</span>
                        <span className="text-[#FF4B63]">d</span>
                        <span className="text-[#F59E0B]">o</span>
                    </h1>

                    <p
                        className="text-[#475569] font-semibold leading-relaxed mx-auto mb-8"
                        style={{
                            fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                            maxWidth: "56ch",
                        }}
                    >
                        Kiddo is an interactive English learning platform
                        purpose-built for first-grade students, delivering
                        curriculum-aligned content through play, audio, and
                        rewards.
                    </p>

                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-75" />
                            <img
                                src="/assets/ui/mascot/fox-guide.png"
                                alt="Kiddo"
                                className="relative w-40 sm:w-52 object-contain drop-shadow-xl"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "/assets/ui/mascot/fox-main.png";
                                    e.currentTarget.onerror = () =>
                                        (e.currentTarget.style.display =
                                            "none");
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
                        {stats.map((s) => (
                            <StatBadge key={s.label} {...s} />
                        ))}
                    </div>
                </section>

                {/* MISSION / VISION / APPROACH */}
                <section className="bg-white py-12">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-8">
                            <p className="text-[11px] font-black text-[#9333EA] uppercase tracking-[0.15em] mb-2">
                                🎯 What Drives Us
                            </p>
                            <h2
                                className="font-black text-[#0F172A]"
                                style={{
                                    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                                }}
                            >
                                Mission, Vision & Approach
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {pillars.map((p) => (
                                <div
                                    key={p.title}
                                    className="rounded-3xl p-6 border-2 border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                                    style={{ background: p.color }}
                                >
                                    <div className="text-3xl mb-3">
                                        {p.emoji}
                                    </div>
                                    <h3
                                        className="font-black text-sm mb-2"
                                        style={{ color: p.textColor }}
                                    >
                                        {p.title}
                                    </h3>
                                    <p className="text-[11px] text-[#64748B] font-semibold leading-relaxed">
                                        {p.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* WHAT IS KIDDO */}
                <section className="py-12 bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-10">
                            <div className="w-full lg:w-2/5 flex justify-center">
                                <div className="relative">
                                    <div className="absolute -inset-3 bg-[#F3E8FF] rounded-3xl" />
                                    <img
                                        src="/assets/ui/backgrounds/classroom-bg.png"
                                        alt="Learning environment"
                                        className="relative w-full max-w-sm rounded-2xl shadow-lg object-cover"
                                        style={{ maxHeight: "280px" }}
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                "none";
                                            e.currentTarget.parentElement.style.display =
                                                "none";
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-full lg:w-3/5">
                                <p className="text-[11px] font-black text-[#9333EA] uppercase tracking-[0.15em] mb-2">
                                    📖 What is Kiddo?
                                </p>
                                <h2
                                    className="font-black text-[#0F172A] mb-4"
                                    style={{
                                        fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                                    }}
                                >
                                    A New Standard for Early English Education
                                </h2>
                                <p
                                    className="text-[#475569] font-semibold leading-relaxed mb-4"
                                    style={{
                                        fontSize:
                                            "clamp(0.875rem, 1.3vw, 1rem)",
                                    }}
                                >
                                    Kiddo is a web-based English learning
                                    platform developed specifically for
                                    first-grade students in Jordan. The platform
                                    is built in full alignment with the{" "}
                                    <strong className="text-[#1E293B]">
                                        Jordanian Ministry of Education Grade 1
                                        English curriculum
                                    </strong>
                                    , covering all five learning lessons through
                                    interactive activities, audio, and a
                                    reward-based progression system.
                                </p>
                                <p
                                    className="text-[#475569] font-semibold leading-relaxed"
                                    style={{
                                        fontSize:
                                            "clamp(0.875rem, 1.3vw, 1rem)",
                                    }}
                                >
                                    Unlike traditional digital tools that rely
                                    on reading or recording, Kiddo uses tap,
                                    drag-and-drop, and matching interactions —
                                    making it accessible to all learners without
                                    requiring any additional hardware or
                                    technical setup.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PLATFORM FEATURES */}
                <section className="bg-white py-12">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-8">
                            <p className="text-[11px] font-black text-[#16A34A] uppercase tracking-[0.15em] mb-2">
                                ✨ Platform Features
                            </p>
                            <h2
                                className="font-black text-[#0F172A]"
                                style={{
                                    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                                }}
                            >
                                Designed for Real Learning Outcomes
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {values.map((v) => (
                                <ValueCard key={v.title} {...v} />
                            ))}
                        </div>
                    </div>
                </section>

               
                {/* CTA */}
                <section className="py-12">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-white/60 relative overflow-hidden text-center">
                            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-purple-100/50 blur-2xl" />
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-100/50 blur-2xl" />
                            <div className="relative z-10">
                                <div className="text-4xl mb-4">🚀</div>
                                <h2
                                    className="font-black text-[#0F172A] mb-3"
                                    style={{
                                        fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                                    }}
                                >
                                    Start Learning Today
                                </h2>
                                <p className="text-[#64748B] font-semibold text-sm mb-7 max-w-sm mx-auto">
                                    Kiddo is available now, completely free of
                                    charge. No registration fees, no
                                    subscriptions — just learning.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button
                                        onClick={() => router.visit("/login")}
                                        className="px-7 py-3.5 font-black text-base text-white rounded-full transition-all bg-[linear-gradient(180deg,#C84BFF_0%,#8B2FCF_100%)] shadow-[0_5px_0_0_#5B0F99] hover:translate-y-[2px] hover:shadow-[0_3px_0_0_#5B0F99] active:translate-y-[4px]"
                                    >
                                        🌟 Get Started — It's Free
                                    </button>
                                    <button
                                        onClick={() => router.visit("/contact")}
                                        className="px-7 py-3.5 font-black text-base text-[#9333EA] bg-[#F3E8FF] rounded-full hover:bg-[#EDE9FE] transition-colors"
                                    >
                                        ✉️ Contact Us
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ FOOTER ══ */}
                <footer className="w-full bg-[#F8FAFF] border-t border-blue-50 pt-8 pb-5 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
                    <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-blue-100/40 blur-2xl pointer-events-none" />
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-blue-100/60">
                            <div className="flex items-center gap-3">
                                <span className="font-black text-2xl">
                                    <span className="text-[#0EA5E9]">Kid</span>
                                    <span className="text-[#FF4B63]">d</span>
                                    <span className="text-[#F59E0B]">o</span>
                                </span>
                                <div className="border-l border-gray-200 pl-3">
                                    <p className="text-xs font-black text-[#334155] leading-none">
                                        Learn. Play. Grow.
                                    </p>
                                    <p className="text-[10px] text-[#94A3B8] font-semibold mt-0.5">
                                        English for kids aged 6–7
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-6">
                                <img
                                    src="/assets/ui/mascot/fox-hint.png"
                                    alt="Kiddo mascot"
                                    className="w-10 h-10 object-contain drop-shadow-sm shrink-0"
                                    onError={(e) =>
                                        (e.currentTarget.style.display = "none")
                                    }
                                />
                                <div className="flex items-center gap-5 sm:gap-7 text-[11px] font-bold text-[#94A3B8]">
                                    {[
                                        { label: "Home", path: "/" },
                                        { label: "About", path: "/about" },
                                        { label: "Contact", path: "/contact" },
                                    ].map((link) => (
                                        <button
                                            key={link.label}
                                            onClick={() =>
                                                router.visit(link.path)
                                            }
                                            className="hover:text-[#9333EA] transition-colors duration-150 focus:outline-none"
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4">
                            <p className="text-[11px] font-bold text-[#CBD5E1]">
                                © 2026 Kiddo. All rights reserved.
                            </p>
                            <p className="text-[11px] text-[#CBD5E1] font-semibold">
                                🌍 Available worldwide · Free forever
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AboutScreen;
