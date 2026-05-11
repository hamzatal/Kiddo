import React, { useState, useEffect, useRef } from "react";
import { router, usePage } from "@inertiajs/react";
import MascotBuddy from "@/learning/components/ai/MascotBuddy";

/**
 * Global top-bar / footer shell for the student-facing site.
 *
 * Auth UX contract (FIX 4):
 *   - Not signed in -> show a single green "Login / Register" pill.
 *   - Signed in    -> hide the green pill entirely; show a user pill
 *                     (avatar + truncated name + chevron) that opens a
 *                     dropdown with Admin panel (if admin), My progress,
 *                     Continue learning, and Logout.
 *   - Mobile menu mirrors the same behaviour.
 *
 * Mascot (FIX 8): the fox MascotBuddy mounts here, after the footer, only
 * when a user is signed in. It uses z-40 so the lesson-page FoxHelper
 * (higher z) always sits on top.
 */
const AppLayout = ({ children, active = "home" }) => {
    const { user, auth } = usePage().props;
    const currentUser = user || auth?.user;

    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const userMenuRef = useRef(null);

    // Close the user dropdown when the user clicks anywhere outside.
    useEffect(() => {
        if (!userMenuOpen) return;
        const handler = (e) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target)
            ) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [userMenuOpen]);

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
        ...(currentUser?.isAdmin
            ? [{ key: "admin", icon: "🛠️", label: "Admin", path: "/admin" }]
            : []),
    ];

    const truncatedName = (() => {
        const n = currentUser?.name || "";
        return n.length > 12 ? n.slice(0, 12) + "…" : n;
    })();

    const handleLogout = () => {
        setUserMenuOpen(false);
        setMenuOpen(false);
        router.post("/logout");
    };

    const goTo = (path) => {
        setUserMenuOpen(false);
        setMenuOpen(false);
        router.visit(path);
    };

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
                    <div className="hidden sm:flex items-center gap-3">
                        {!currentUser ? (
                            <button
                                onClick={() => router.visit("/login")}
                                className="relative inline-flex items-center justify-center gap-2 font-black select-none cursor-pointer px-5 py-2.5 text-sm text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px] shadow-none border-none"
                            >
                                Login / Register
                            </button>
                        ) : (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() =>
                                        setUserMenuOpen((v) => !v)
                                    }
                                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                >
                                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-lg">
                                        {currentUser.avatar || "👦🏻"}
                                    </span>
                                    <span className="font-black text-[#1E293B] text-sm">
                                        {truncatedName}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        ▾
                                    </span>
                                </button>
                                {userMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                                    >
                                        {currentUser.isAdmin && (
                                            <button
                                                onClick={() => goTo("/admin")}
                                                className="w-full text-left px-4 py-2 text-sm font-black text-[#1E293B] hover:bg-purple-50 hover:text-[#7C3AED] flex items-center gap-2"
                                            >
                                                <span>🛠️</span> Admin panel
                                            </button>
                                        )}
                                        <button
                                            onClick={() => goTo("/progress")}
                                            className="w-full text-left px-4 py-2 text-sm font-black text-[#1E293B] hover:bg-purple-50 hover:text-[#7C3AED] flex items-center gap-2"
                                        >
                                            <span>📊</span> My progress
                                        </button>
                                        <button
                                            onClick={() => goTo("/map")}
                                            className="w-full text-left px-4 py-2 text-sm font-black text-[#1E293B] hover:bg-purple-50 hover:text-[#7C3AED] flex items-center gap-2"
                                        >
                                            <span>📖</span> Continue learning
                                        </button>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm font-black text-red-500 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <span>🚪</span> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
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
                        <div className="pt-2 flex flex-col gap-2">
                            {!currentUser ? (
                                <button
                                    onClick={() => {
                                        router.visit("/login");
                                        setMenuOpen(false);
                                    }}
                                    className="w-full justify-center relative inline-flex items-center gap-2 font-black select-none cursor-pointer px-5 py-2.5 text-sm text-white bg-[#16A34A] hover:bg-[#15803D] rounded-[12px]"
                                >
                                    Login / Register
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 px-1">
                                        <span className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-xl">
                                            {currentUser.avatar || "👦🏻"}
                                        </span>
                                        <span className="font-black text-[#1E293B] text-sm truncate">
                                            {currentUser.name}
                                        </span>
                                    </div>
                                    {currentUser.isAdmin && (
                                        <button
                                            onClick={() => goTo("/admin")}
                                            className="w-full text-left px-4 py-2 rounded-xl bg-purple-50 text-[#7C3AED] font-black text-sm"
                                        >
                                            🛠️ Admin panel
                                        </button>
                                    )}
                                    <button
                                        onClick={() => goTo("/progress")}
                                        className="w-full text-left px-4 py-2 rounded-xl bg-gray-50 text-[#1E293B] font-black text-sm"
                                    >
                                        📊 My progress
                                    </button>
                                    <button
                                        onClick={() => goTo("/map")}
                                        className="w-full text-left px-4 py-2 rounded-xl bg-gray-50 text-[#1E293B] font-black text-sm"
                                    >
                                        📖 Continue learning
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 rounded-xl bg-red-50 text-red-500 font-black text-sm"
                                    >
                                        🚪 Logout
                                    </button>
                                </>
                            )}
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
                                                       if (link === "Help Center") {
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

            {/* Global fox mascot buddy (FIX 8) — only for signed-in users. */}
            {currentUser ? <MascotBuddy /> : null}
        </div>
    );
};

export default AppLayout;
