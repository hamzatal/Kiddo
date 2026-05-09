import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

const ContactInfoCard = ({ emoji, title, value, sub, bg, textColor }) => (
    <div
        className={`${bg} rounded-3xl p-6 flex flex-col items-center text-center border-2 border-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200`}
    >
        <div className="text-3xl mb-3">{emoji}</div>
        <h3 className="font-black text-[#1E293B] text-sm mb-1">{title}</h3>
        <p className={`font-black text-sm ${textColor} mb-1`}>{value}</p>
        {sub && (
            <p className="text-[11px] text-[#94A3B8] font-semibold">{sub}</p>
        )}
    </div>
);

const FaqItem = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-4 text-left font-black text-[#1E293B] text-sm hover:bg-gray-50 transition-colors"
            >
                <span className="pr-4">{q}</span>
                <span
                    className={`text-[#9333EA] text-lg shrink-0 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                >
                    ▾
                </span>
            </button>
            {open && (
                <div className="px-5 pb-4 text-[13px] text-[#64748B] font-semibold leading-relaxed border-t border-gray-50">
                    {a}
                </div>
            )}
        </div>
    );
};

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

const HelpCenter = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = usePage().props;

    useEffect(() => {
        const el = document.getElementById("help-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    const faqs = [
        {
            q: "Is Kiddo completely free to use?",
            a: "Yes. Kiddo is available at no cost to students, parents, or educators. All platform features and learning units are fully accessible without any subscription or payment.",
        },
        {
            q: "What age group is Kiddo designed for?",
            a: "Kiddo is specifically developed for first-grade students aged 6–7, in alignment with the official Jordanian Ministry of Education Grade 1 English curriculum.",
        },
        {
            q: "Does Kiddo require a microphone or camera?",
            a: "No. All activities on Kiddo are interaction-based — tap, drag-and-drop, and matching. No microphone or camera is required at any point.",
        },
        {
            q: "Which devices are supported?",
            a: "Kiddo runs on any modern browser — tablets, smartphones, and desktop computers are all fully supported. No installation or download is required.",
        },
        {
            q: "How is student data handled?",
            a: "Kiddo collects only the minimum data necessary to operate the platform — specifically, a username and learning progress records. No personal information is collected, and data is never shared with third parties.",
        },
    ];

    const contactCards = [
        {
            emoji: "✉️",
            title: "Support Email",
            value: "hello@kiddo.test",
            sub: "Response within 24 hours",
            bg: "bg-[#F3E8FF]",
            textColor: "text-[#9333EA]",
        },
        {
            emoji: "🌐",
            title: "Platform",
            value: "Web-Based",
            sub: "No installation required",
            bg: "bg-[#DCFCE7]",
            textColor: "text-[#16A34A]",
        },
        {
            emoji: "🕐",
            title: "Availability",
            value: "24 / 7",
            sub: "Always accessible, always free",
            bg: "bg-[#E0F2FE]",
            textColor: "text-[#0284C7]",
        },
    ];

    const navLinks = [
        { icon: "🏠", label: "Home", path: "/", active: false },
        { icon: "📖", label: "Lessons", path: "/map", active: false },
        { icon: "ℹ️", label: "About", path: "/about", active: false },
        { icon: "❓", label: "Help Center", path: "/help", active: true },
    ];

    return (
        <div
            id="help-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans"
        >
            {/* NAV */}
            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2"
                        : "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-3"
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                    <div
                        className="flex items-center cursor-pointer"
                        onClick={() => router.visit("/")}
                    >
                        <img
                            src="/assets/ui/hero/title-logo.png"
                            alt="Kiddo"
                            className="h-8 sm:h-9 object-contain drop-shadow-sm"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                    <ul className="hidden lg:flex items-center gap-7 font-black text-[14px] text-[#475569]">
                        {navLinks.map((item) => (
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
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${
                                menuOpen ? "rotate-45 translate-y-[8px]" : ""
                            }`}
                        />
                        <span
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${
                                menuOpen ? "opacity-0" : ""
                            }`}
                        />
                        <span
                            className={`block w-5 h-0.5 bg-[#1E293B] rounded-full transition-all duration-200 ${
                                menuOpen ? "-rotate-45 -translate-y-[8px]" : ""
                            }`}
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

            {/* CONTENT */}
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
                        <span className="text-sm">❓</span>
                        <span className="text-xs font-black text-[#9333EA] uppercase tracking-widest">
                            Help Center & Support
                        </span>
                    </div>

                    <h1
                        className="font-black text-[#0F172A] leading-tight mb-5"
                        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                    >
                        Need{" "}
                        <span className="inline-block -rotate-1 bg-[#FF4B63] text-white px-3 py-1 rounded-xl shadow-[0_3px_0_#cc0019]">
                            Help
                        </span>{" "}
                        with Kiddo?
                    </h1>

                    <p
                        className="text-[#475569] font-semibold leading-relaxed mx-auto mb-10"
                        style={{
                            fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                            maxWidth: "52ch",
                        }}
                    >
                        Browse common questions, learn how Kiddo works, or reach
                        our support team directly for additional assistance.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
                        {contactCards.map((c) => (
                            <ContactInfoCard key={c.title} {...c} />
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-12 bg-white">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="text-center mb-8">
                            <p className="text-[11px] font-black text-[#16A34A] uppercase tracking-[0.15em] mb-2">
                                FAQ
                            </p>
                            <h2
                                className="font-black text-[#0F172A]"
                                style={{
                                    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                                }}
                            >
                                Frequently Asked Questions
                            </h2>
                            <p className="text-[#64748B] font-semibold text-sm mt-2 max-w-sm mx-auto">
                                Still need help? Reach us at{" "}
                                <span className="font-black text-[#9333EA]">
                                    hello@kiddo.test
                                </span>
                                .
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
                            {faqs.map((f) => (
                                <FaqItem key={f.q} {...f} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-10 bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6">
                        <div className="bg-gradient-to-r from-[#9333EA] to-[#7C3AED] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
                                <div className="flex-1 text-center sm:text-left">
                                    <p className="font-black text-lg mb-1">
                                        Contact Support Team
                                    </p>
                                    <p className="text-purple-200 text-sm font-semibold">
                                        We review all messages and respond
                                        within one business day.
                                    </p>
                                </div>
                                <a
                                    href="mailto:hello@kiddo.test"
                                    className="shrink-0 px-6 py-3 bg-white text-[#9333EA] font-black text-sm rounded-full shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-all"
                                >
                                    ✉️ Email Us
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
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
                                        { label: "Help", path: "/help" },
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

export default HelpCenter;
