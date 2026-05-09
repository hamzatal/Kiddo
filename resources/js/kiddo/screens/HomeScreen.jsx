import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

/* ═══════════════════════════════════════════════════════════════
   PolicyModal
═══════════════════════════════════════════════════════════════ */
const POLICY_CONTENT = {
    "Privacy Policy": {
        icon: "🔒",
        color: "#9333EA",
        items: [
            "We do not collect any personal data from children under 13 without parental consent.",
            "No microphone, camera, or location access is required or requested.",
            "Progress data is stored locally on your device only.",
            "We do not share any user information with third parties.",
            "Cookies are used solely for session management and improving performance.",
            "You may contact us at any time to request data deletion.",
        ],
    },
    "Terms of Use": {
        icon: "📋",
        color: "#0284C7",
        items: [
            "Kiddo is designed exclusively for children aged 6–7 under parental supervision.",
            "All content, images, audio, and games are protected by copyright.",
            "You may not reproduce or redistribute any part of this platform.",
            "The platform is provided free of charge for personal, non-commercial use.",
            "We reserve the right to update these terms at any time with prior notice.",
            "Continued use of the platform constitutes acceptance of the current terms.",
        ],
    },
};

const PolicyModal = ({ type, onClose }) => {
    const content = POLICY_CONTENT[type];
    if (!content) return null;
    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 flex flex-col gap-5 animate-fadeInScale"
                onClick={(e) => e.stopPropagation()}
                style={{ border: `2px solid ${content.color}22` }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                            style={{ background: `${content.color}15` }}
                        >
                            {content.icon}
                        </span>
                        <h2 className="font-black text-[#0F172A] text-lg leading-tight">
                            {type}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 font-black text-base transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div
                    className="h-0.5 rounded-full"
                    style={{ background: `${content.color}22` }}
                />
                <ul className="flex flex-col gap-3">
                    {content.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5 shadow-sm"
                                style={{ background: content.color }}
                            >
                                {i + 1}
                            </span>
                            <p className="text-[12px] text-[#475569] font-semibold leading-relaxed">
                                {item}
                            </p>
                        </li>
                    ))}
                </ul>
                <p className="text-[10px] text-[#94A3B8] font-semibold text-center border-t border-gray-100 pt-4">
                    © 2026 Kiddo · Last updated May 2026
                </p>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   JuicyButton
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
        "relative inline-flex items-center justify-center gap-2 font-black select-none cursor-pointer transition-all duration-100 focus:outline-none";
    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-base",
    };
    const variants = {
        purple: "text-white bg-[linear-gradient(180deg,_#C84BFF_0%,_#8B2FCF_100%)] rounded-full shadow-[0_5px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:shadow-[0_3px_0_0_#5B0F99,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#5B0F99] active:translate-y-[4px]",
        green: "text-white bg-[linear-gradient(180deg,_#4ADE80_0%,_#16A34A_100%)] rounded-full shadow-[0_5px_0_0_#0E6B2C,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:shadow-[0_3px_0_0_#0E6B2C,_inset_0_1px_0_0_rgba(255,255,255,0.40)] hover:translate-y-[2px] active:shadow-[0_1px_0_0_#0E6B2C] active:translate-y-[4px]",
        white: "text-[#7C3AED] bg-white rounded-full shadow-[0_5px_0_0_rgba(0,0,0,0.18)] hover:translate-y-[2px] active:translate-y-[4px]",
        flatAuth:
            "text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px] shadow-none border-none",
    };

    return (
        <button
            onClick={onClick}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {variant !== "flatAuth" && variant !== "white" && (
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

/* ═══════════════════════════════════════════════════════════════
   LessonCard
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
            className={`group relative flex flex-col rounded-3xl border-2 border-white overflow-hidden h-full transition-all duration-250 ease-out ${
                isLocked
                    ? "opacity-60 cursor-not-allowed grayscale-[40%]"
                    : `cursor-pointer hover:-translate-y-1.5 hover:shadow-xl ring-2 ring-transparent ${c.ring}`
            } ${c.bg} shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}
        >
            <div
                className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full ${c.badge} text-white font-black text-[13px] flex items-center justify-center shadow-md`}
            >
                {number}
            </div>
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="bg-white/70 backdrop-blur-[2px] rounded-full w-12 h-12 flex items-center justify-center shadow-sm">
                        <span className="text-2xl">🔒</span>
                    </div>
                </div>
            )}
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
            <div className="px-3 pb-3 text-center">
                <p className="font-black text-[#1E293B] text-[11px] sm:text-xs leading-tight line-clamp-2">
                    {title}
                </p>
            </div>
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
   MascotSection
═══════════════════════════════════════════════════════════════ */
const MascotSection = ({ goToApp }) => {
    return (
        <>
            <style>{`
                .mascot-wrap { position: relative; width: 100%; display: flex; justify-content: center; align-items: flex-end; min-height: 280px; }
                @media (min-width: 640px) { .mascot-wrap { min-height: 360px; } }
                @media (min-width: 1024px) { .mascot-wrap { min-height: 460px; } }

                .abc-blocks { position: absolute; z-index: 0; object-fit: contain; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15)); left: -15px; bottom: 10px; width: 140px; }
                @media (min-width: 480px) { .abc-blocks { left: -10px; width: 160px; bottom: 15px; } }
                @media (min-width: 640px) { .abc-blocks { left: 0px; bottom: 20px; width: 180px; } }
                @media (min-width: 768px) { .abc-blocks { left: 0px; width: 200px; bottom: 20px; } }
                @media (min-width: 1024px) { .abc-blocks { left: -20px; bottom: 20px; width: 220px; } }
                @media (min-width: 1280px) { .abc-blocks { left: -30px; bottom: 25px; width: 240px; } }

                .fox-mascot { position: relative; z-index: 10; object-fit: contain; filter: drop-shadow(0 16px 32px rgba(0,0,0,0.18)); width: 190px; max-height: 50vh; transform: translateX(40px) translateY(-5px); }
                @media (min-width: 480px) { .fox-mascot { width: 220px; transform: translateX(50px) translateY(-5px); } }
                @media (min-width: 640px) { .fox-mascot { width: 260px; max-height: 52vh; transform: translateX(60px) translateY(-10px); } }
                @media (min-width: 768px) { .fox-mascot { width: 300px; transform: translateX(70px) translateY(-10px); } }
                @media (min-width: 1024px) { .fox-mascot { width: 340px; max-height: 56vh; transform: translateX(80px) translateY(-15px); } }
                @media (min-width: 1280px) { .fox-mascot { width: 380px; max-height: 58vh; transform: translateX(100px) translateY(-15px); } }
                @media (min-width: 1536px) { .fox-mascot { width: 420px; transform: translateX(110px) translateY(-20px); } }

                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                .animate-fadeInScale { animation: fadeInScale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>

            <div className="mascot-wrap">
                <img
                    src="/assets/ui/hero/abc-blocks.png"
                    alt="ABC Blocks"
                    className="abc-blocks"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <img
                    src="/assets/ui/mascot/fox-main.png"
                    alt="Kiddo Mascot"
                    className="fox-mascot"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                />
            </div>
        </>
    );
};

/* ═══════════════════════════════════════════════════════════════
   HomeScreen
═══════════════════════════════════════════════════════════════ */
const HomeScreen = ({ units }) => {
    // ◄ استقبال الداتا من الباك إند
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeModal, setActiveModal] = useState(null);

    // ◄ جلب اليوزر بالطريقة الصحيحة للارافيل/انرشيا لتفادي الأخطاء
    const { auth, user: propUser } = usePage().props;
    const user = auth?.user || propUser;

    useEffect(() => {
        const el = document.getElementById("home-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    useEffect(() => {
        if (activeModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [activeModal]);

    // ◄ الداتا الافتراضية في حال ما اجا إشي من الباك إند
    const defaultLessons = [
        {
            id: 1,
            number: "1",
            title: "Welcome / Hello",
            imagePath: "/assets/lessons/welcome/hello.png",
            colorKey: "purple",
            isLocked: false,
        },
        {
            id: 2,
            number: "2",
            title: "Family and Friends",
            imagePath: "/assets/lessons/family/family_group.png",
            colorKey: "green",
            isLocked: false,
        },
        {
            id: 3,
            number: "3",
            title: "My School Bag",
            imagePath: "/assets/lessons/schoolbag/bag.png",
            colorKey: "blue",
            isLocked: true,
        },
        {
            id: 4,
            number: "4",
            title: "Our Classroom",
            imagePath: "/assets/lessons/classroom/desk.png",
            colorKey: "pink",
            isLocked: true,
        },
        {
            id: 5,
            number: "5",
            title: "My Favourite Toy",
            imagePath: "/assets/lessons/toy/toy.png",
            colorKey: "amber",
            isLocked: true,
        },
    ];

    // ◄ تحويل داتا الباك إند (إن وجدت) عشان تناسب شكل الكرت
    const displayLessons =
        units && units.length > 0
            ? units.map((u) => ({
                  id: u.id,
                  number: u.unit_number || u.id,
                  title: u.title,
                  imagePath: u.image_path || u.imagePath,
                  colorKey: u.color_key || u.colorKey || "purple",
                  isLocked: u.status === "locked",
              }))
            : defaultLessons;

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
            emoji: "🧩",
            title: "Interactive Activities",
            desc: "Hands-on exercises to reinforce every new word without microphones.",
        },
    ];

    const goToApp = () => router.visit(user ? "/map" : "/login");

    const navLinks = [
        { icon: "🏠", label: "Home", path: "/", active: true },
        { icon: "📖", label: "Lessons", path: "/map", active: false },
        { icon: "ℹ️", label: "About", path: "/about", active: false },
        { icon: "✉️", label: "Contact", path: "/contact", active: false },
    ];

    return (
        <>
            {activeModal && (
                <PolicyModal
                    type={activeModal}
                    onClose={() => setActiveModal(null)}
                />
            )}

            <div
                id="home-scroll"
                className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans scroll-smooth"
                style={{ scrollBehavior: "smooth" }}
            >
                {/* ══════════════════════ HERO ══════════════════════ */}
                <section
                    id="hero"
                    className="relative w-full overflow-hidden flex flex-col"
                    style={{
                        background:
                            "linear-gradient(155deg, #BAE6FD 0%, #C7F0FF 25%, #D9F0FF 50%, #EFF9FF 75%, #FFF9E0 100%)",
                        minHeight: "100svh",
                    }}
                >
                    <img
                        src="/assets/ui/hero/clouds.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
                        style={{ opacity: 0.55 }}
                    />
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,255,255,0.38) 0%, transparent 70%)",
                        }}
                    />

                    {/* ── NAV ── */}
                    <nav
                        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2" : "bg-transparent py-3"}`}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                            <div
                                className="flex items-center cursor-pointer"
                                onClick={() => router.visit("/")}
                            >
                                <img
                                    src="/assets/ui/hero/title-logo.png"
                                    alt="Kiddo"
                                    className="h-8 sm:h-10 object-contain drop-shadow-sm"
                                />
                            </div>

                            <ul className="hidden lg:flex items-center gap-7 font-black text-[14px] text-[#475569]">
                                {navLinks.map((item) => (
                                    <li
                                        key={item.label}
                                        onClick={() => router.visit(item.path)}
                                        className={`flex items-center gap-1.5 cursor-pointer pb-1 border-b-2 transition-colors ${item.active ? "text-[#9333EA] border-[#9333EA]" : "border-transparent hover:text-[#9333EA] hover:border-[#9333EA]"}`}
                                    >
                                        <span className="text-base">
                                            {item.icon}
                                        </span>{" "}
                                        {item.label}
                                    </li>
                                ))}
                            </ul>

                            {/* ◄ أزرار الديسكتوب المربوطة بشكل صحيح باليوزر واللوج أوت */}
                            <div className="hidden sm:flex items-center gap-3">
                                {user ? (
                                    <>
                                        <JuicyButton
                                            variant="flatAuth"
                                            onClick={() => router.visit("/map")}
                                        >
                                            Continue Learning
                                        </JuicyButton>
                                        <button
                                            onClick={() =>
                                                router.post("/logout")
                                            }
                                            className="text-gray-400 hover:text-red-500 font-bold text-sm bg-white/50 hover:bg-red-50 border border-gray-200 px-4 py-2 rounded-xl transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <JuicyButton
                                        variant="flatAuth"
                                        onClick={() => router.visit("/login")}
                                    >
                                        Login / Register
                                    </JuicyButton>
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
                                        {item.label}
                                    </button>
                                ))}
                                {/* ◄ أزرار الموبايل المربوطة بشكل صحيح */}
                                <div className="pt-2 flex flex-col gap-2">
                                    {user ? (
                                        <>
                                            <JuicyButton
                                                variant="flatAuth"
                                                onClick={() =>
                                                    router.visit("/map")
                                                }
                                                className="w-full justify-center"
                                            >
                                                Continue Learning
                                            </JuicyButton>
                                            <button
                                                onClick={() =>
                                                    router.post("/logout")
                                                }
                                                className="w-full text-center text-red-500 font-bold text-sm bg-red-50 py-2.5 rounded-[12px] border border-red-100"
                                            >
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <JuicyButton
                                            variant="flatAuth"
                                            onClick={() =>
                                                router.visit("/login")
                                            }
                                            className="w-full justify-center"
                                        >
                                            Login / Register
                                        </JuicyButton>
                                    )}
                                </div>
                            </div>
                        )}
                    </nav>

                    {/* ── HERO CONTENT ── */}
                    <div className="relative z-10 flex-1 flex items-center pt-16">
                        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                            <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-6 lg:gap-8">
                                <div className="w-full lg:w-[54%] flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <h1
                                        className="font-black text-[#0F172A] leading-[1.1] tracking-tight mt-6"
                                        style={{
                                            fontSize:
                                                "clamp(2.2rem, 5vw, 4rem)",
                                        }}
                                    >
                                        Learn English <br /> with{" "}
                                        <span className="inline-block -rotate-2 bg-[#FF4B63] text-white px-3 py-1 rounded-xl shadow-[0_4px_0_#cc0019]">
                                            Fun
                                        </span>
                                        ,{" "}
                                        <span className="inline-block rotate-2 bg-[#10B981] text-white px-3 py-1 rounded-xl shadow-[0_4px_0_#059669] mx-1">
                                            Games
                                        </span>
                                        , <br /> and{" "}
                                        <span className="inline-block -rotate-1 bg-[#8B5CF6] text-white px-3 py-1 rounded-xl shadow-[0_4px_0_#6D28D9] mt-2">
                                            Sounds
                                        </span>
                                        !
                                    </h1>
                                    <p
                                        className="text-[#475569] font-semibold mt-6 max-w-[400px] leading-relaxed"
                                        style={{
                                            fontSize:
                                                "clamp(0.9rem, 1.5vw, 1.1rem)",
                                        }}
                                    >
                                        Kiddo is a playful learning adventure
                                        for kids aged 6–7. Play, listen, and
                                        grow with every lesson!
                                    </p>
                                    <div className="mt-8 flex flex-col items-center lg:items-start gap-3">
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
                                        <p className="flex items-center gap-2 text-xs text-[#64748B] font-semibold mt-2">
                                            <span
                                                className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[9px] shrink-0 font-black"
                                                style={{
                                                    boxShadow:
                                                        "0 2px 0 #059669",
                                                }}
                                            >
                                                ✔
                                            </span>
                                            No sign-up required · Free to start
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full lg:w-[46%]">
                                    <MascotSection goToApp={goToApp} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Wave ── */}
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

                {/* ══════════════════════ LESSONS ══════════════════════ */}
                <section className="w-full bg-white py-10 sm:py-14">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-7 sm:mb-8">
                            <p className="text-[11px] sm:text-xs font-black text-[#9333EA] uppercase tracking-[0.15em] mb-2">
                                📚 Curriculum
                            </p>
                            <h2
                                className="font-black text-[#0F172A] inline-flex items-center gap-2 flex-wrap justify-center"
                                style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                            >
                                <span className="text-yellow-400">⭐</span> Our
                                Learning Units{" "}
                                <span className="text-yellow-400">⭐</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            {/* ◄ استخدام داتا الباك إند هنا */}
                            {displayLessons.map((l, index) => (
                                <div
                                    key={index}
                                    style={{
                                        height: "clamp(150px, 20vw, 210px)",
                                    }}
                                >
                                    <LessonCard
                                        {...l}
                                        onClick={() =>
                                            router.visit(
                                                user
                                                    ? `/lesson/${l.id}`
                                                    : "/login",
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════ FEATURES ══════════════════════ */}
                <section className="w-full py-10 sm:py-14 bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF]">
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
                    </div>
                </section>

                {/* ══════════════════════ FOOTER ══════════════════════ */}
                <footer className="w-full bg-[#F8FAFF] border-t border-blue-50 pt-8 pb-5 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-purple-100/40 blur-3xl pointer-events-none" />
                    <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-blue-100/40 blur-2xl pointer-events-none" />

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-blue-100/60">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/assets/ui/hero/title-logo.png"
                                    alt="Kiddo"
                                    className="h-7 sm:h-8 object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
                                    onClick={() => router.visit("/")}
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

                            <div className="flex flex-col items-center gap-1 select-none">
                                <img
                                    src="/assets/ui/mascot/fox-hint.png"
                                    alt="Kiddo Safe"
                                    className="w-14 h-14 object-contain drop-shadow-md"
                                    onError={(e) =>
                                        (e.currentTarget.style.display = "none")
                                    }
                                />
                                <p className="text-[9px] font-black text-[#CBD5E1] uppercase tracking-widest">
                                    Safe &amp; Free
                                </p>
                            </div>

                            <div className="flex items-center gap-5 sm:gap-7 text-[11px] font-bold text-[#94A3B8]">
                                {[
                                    "Privacy Policy",
                                    "Terms of Use",
                                    "Help Center",
                                ].map((link) => (
                                    <button
                                        key={link}
                                        onClick={() => {
                                            if (
                                                link === "Privacy Policy" ||
                                                link === "Terms of Use"
                                            ) {
                                                setActiveModal(link);
                                            } else {
                                                router.visit("/contact");
                                            }
                                        }}
                                        className="hover:text-[#9333EA] transition-colors duration-150 focus:outline-none"
                                    >
                                        {link}
                                    </button>
                                ))}
                            </div>
                        </div>

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
            </div>
        </>
    );
};

export default HomeScreen;
