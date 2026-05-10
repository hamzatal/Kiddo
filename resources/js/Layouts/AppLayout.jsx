import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";

const AppLayout = ({ children, active = "home" }) => {
    const { user } = usePage().props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const el = document.getElementById("app-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", handler, { passive: true });
        return () => el.removeEventListener("scroll", handler);
    }, []);

    const navLinks = [
        { key: "home", icon: "🏠", label: "Home", path: "/" },
        { key: "lessons", icon: "📖", label: "Lessons", path: "/map" },
        { key: "help", icon: "❓", label: "Help", path: "/help" },
        { key: "progress", icon: "📊", label: "Progress", path: "/progress" },
    ];

    return (
        <div
            id="app-scroll"
            className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans"
        >
            {/* NAVBAR */}
            <nav
                className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2"
                        : "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100 py-3"
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
                            className="h-8 sm:h-9 object-contain drop-shadow-sm"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>

                    {/* Desktop nav */}
                    <ul className="hidden lg:flex items-center gap-7 font-black text-[14px] text-[#475569]">
                        {navLinks.map((item) => (
                            <li
                                key={item.key}
                                onClick={() => router.visit(item.path)}
                                className={`flex items-center gap-1.5 cursor-pointer pb-1 border-b-2 transition-colors ${
                                    active === item.key
                                        ? "text-[#9333EA] border-[#9333EA]"
                                        : "border-transparent hover:text-[#9333EA] hover:border-[#9333EA]"
                                }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </li>
                        ))}
                    </ul>

                    {/* Desktop auth actions */}
                    <div className="hidden sm:flex items-center gap-4">
                        <button
                            onClick={() =>
                                router.visit(user ? "/map" : "/login")
                            }
                            className="relative inline-flex items-center justify-center gap-2 font-black select-none cursor-pointer px-5 py-2.5 text-sm text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px] shadow-none border-none"
                        >
                            {user ? "Continue Learning" : "Login / Register"}
                        </button>
                        {user && (
                            <button
                                onClick={() => router.post("/logout")}
                                className="text-gray-400 hover:text-red-500 font-bold text-sm"
                            >
                                Logout
                            </button>
                        )}
                    </div>

                    {/* Mobile menu button */}
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

                {/* Mobile nav */}
                {menuOpen && (
                    <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg px-5 py-4 flex flex-col gap-3">
                        {navLinks.map((item) => (
                            <button
                                key={item.key}
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
                            <button
                                onClick={() =>
                                    router.visit(user ? "/map" : "/login")
                                }
                                className="w-full justify-center relative inline-flex items-center justify-center gap-2 font-black select-none cursor-pointer px-5 py-2.5 text-sm text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px]"
                            >
                                {user
                                    ? "Continue Learning"
                                    : "Login / Register"}
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* MAIN CONTENT + BACKGROUND */}
            <div
                className="pt-16 min-h-screen"
                style={{
                    background:
                        "linear-gradient(160deg,#BAE6FD 0%,#F0F4FF 40%,#FFF9E0 100%)",
                }}
            >
                {children}
            </div>

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
    );
};

export default AppLayout;
