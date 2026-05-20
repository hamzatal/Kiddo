import React, { useEffect, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    Home,
    Map as MapIcon,
    HelpCircle,
    BarChart3,
    Wrench,
    LogOut,
    Menu,
    X,
    ChevronDown,
} from "lucide-react";

import { useAuthUser } from "@/lib/usePageProps";
import { cn } from "@/lib/cn";
import PolicyModal, {
    PrivacyPolicyContent,
    TermsOfUseContent,
} from "@/learning/components/ui/PolicyModal";
import StreakBadge from "@/learning/components/ui/StreakBadge";
import StreakCelebration from "@/learning/components/ui/StreakCelebration";
import MascotBuddy from "@/learning/components/ai/MascotBuddy";

/**
 * Global top-bar / footer shell for the student-facing site.
 *
 * Rewrite highlights vs the previous version:
 *   1. Inertia <Link> everywhere instead of router.visit() — gives us
 *      prefetch on hover, scroll preservation, and zero-effort
 *      keyboard navigation (Tab + Enter just works).
 *   2. lucide-react icons replace OS-rendered emoji so navigation
 *      doesn't shift width when a font is missing.
 *   3. A useRef ('scrollContainerRef') replaces the previous
 *      `document.getElementById("app-scroll")` lookup — the ref-based
 *      version is the React-idiomatic approach and survives strict
 *      mode double mounts.
 *   4. The footer's Privacy / Terms buttons NOW open the shared
 *      PolicyModal. They were previously dead links (no onClick).
 *   5. `showMascot` and `noChrome` props let lesson / quiz screens
 *      opt out of the global fox + nav.
 *   6. Mobile hamburger button has full ARIA semantics
 *      (aria-expanded, aria-controls).
 *   7. The user dropdown closes on Escape (a11y) in addition to
 *      outside-click.
 */
export default function AppLayout({
    children,
    active = "home",
    showMascot = true,
    noChrome = false,
}) {
    const currentUser = useAuthUser();

    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [policy, setPolicy] = useState(null); // 'privacy' | 'terms' | null

    // When the title-logo PNG 404s we fall back to a styled wordmark.
    // Tracking this in React state — instead of imperatively appending
    // a <span> to the DOM from inside onError — keeps the DOM under
    // React's control. The previous version called
    // `document.createElement("span")` and `appendChild` on the parent,
    // which broke during strict-mode double mounts (the wordmark would
    // duplicate) and during Inertia <Link> navigations (the appended
    // span survived component unmount because React never tracked it).
    const [logoFailed, setLogoFailed] = useState(false);

    const userMenuRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Close the user dropdown on outside-click + ESC.
    useEffect(() => {
        if (!userMenuOpen) return;
        const onClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === "Escape") setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [userMenuOpen]);

    // Track scroll on our own container so the navbar can compress.
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const onScroll = () => setScrolled(el.scrollTop > 24);
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const navLinks = [
        { key: "home", icon: Home, label: "Home", path: "/" },
        { key: "lessons", icon: MapIcon, label: "Lessons", path: "/map" },
        { key: "help", icon: HelpCircle, label: "Help", path: "/help" },
        { key: "progress", icon: BarChart3, label: "Progress", path: "/progress" },
        ...(currentUser?.isAdmin
            ? [{ key: "admin", icon: Wrench, label: "Admin", path: "/admin" }]
            : []),
    ];

    const truncatedName = (() => {
        const n = currentUser?.name || "";
        return n.length > 12 ? n.slice(0, 12) + "…" : n;
    })();

    const closeAllMenus = () => {
        setUserMenuOpen(false);
        setMenuOpen(false);
    };

    const handleLogout = () => {
        closeAllMenus();
        router.post("/logout");
    };

    // Lesson/quiz screens render full-bleed and don't want the chrome.
    if (noChrome) {
        return <>{children}</>;
    }

    return (
        <div
            ref={scrollContainerRef}
            className="h-screen w-screen overflow-y-auto overflow-x-hidden font-sans"
        >
            {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
            <nav
                className={cn(
                    "fixed left-0 top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md transition-all duration-300",
                    scrolled ? "py-2 shadow-sm" : "py-3 shadow-sm",
                )}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center"
                        aria-label="Kiddo home"
                    >
                        {logoFailed ? (
                            <span className="font-extrabold text-2xl bg-gradient-to-r from-purple-600 to-sky-500 bg-clip-text text-transparent">
                                Kiddo
                            </span>
                        ) : (
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-8 object-contain drop-shadow-sm sm:h-9"
                                onError={() => setLogoFailed(true)}
                            />
                        )}
                    </Link>

                    {/* Desktop nav */}
                    <ul className="hidden items-center gap-7 text-[14px] font-black text-slate-600 lg:flex">
                        {navLinks.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.key;
                            return (
                                <li key={item.key}>
                                    <Link
                                        href={item.path}
                                        className={cn(
                                            "flex items-center gap-1.5 border-b-2 pb-1 transition-colors",
                                            isActive
                                                ? "border-purple-600 text-purple-700"
                                                : "border-transparent hover:border-purple-600 hover:text-purple-700",
                                        )}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Desktop auth actions */}
                    <div className="hidden items-center gap-3 sm:flex">
                        {!currentUser ? (
                            <Link
                                href="/login"
                                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/70"
                            >
                                Login / Register
                            </Link>
                        ) : (
                            <>
                                {/* Streak pill — sits to the LEFT of the user
                                    chip so the navbar reads
                                    "🔥 5 days · [avatar] Hamza ▾". Hidden on
                                    very narrow tablets to make room for the
                                    user pill. */}
                                <div className="hidden md:block">
                                    <StreakBadge size="sm" />
                                </div>

                                <div className="relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                                    aria-haspopup="menu"
                                    aria-expanded={userMenuOpen}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-200 to-pink-200 text-lg">
                                        {currentUser.avatar || "🦊"}
                                    </span>
                                    <span className="text-sm font-black text-slate-900">
                                        {truncatedName}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            "h-3.5 w-3.5 text-gray-400 transition",
                                            userMenuOpen && "rotate-180",
                                        )}
                                        aria-hidden="true"
                                    />
                                </button>

                                {userMenuOpen && (
                                    <div
                                        role="menu"
                                        className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl"
                                    >
                                        {currentUser.isAdmin && (
                                            <UserMenuItem
                                                href="/admin"
                                                icon={Wrench}
                                                onClose={closeAllMenus}
                                            >
                                                Admin panel
                                            </UserMenuItem>
                                        )}
                                        <UserMenuItem
                                            href="/progress"
                                            icon={BarChart3}
                                            onClose={closeAllMenus}
                                        >
                                            My progress
                                        </UserMenuItem>
                                        <UserMenuItem
                                            href="/map"
                                            icon={MapIcon}
                                            onClose={closeAllMenus}
                                        >
                                            Continue learning
                                        </UserMenuItem>
                                        <div className="my-1 border-t border-gray-100" />
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-black text-rose-600 hover:bg-rose-50"
                                        >
                                            <LogOut
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-nav"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white/80 shadow-sm sm:hidden"
                    >
                        {menuOpen ? (
                            <X className="h-5 w-5 text-slate-700" aria-hidden="true" />
                        ) : (
                            <Menu className="h-5 w-5 text-slate-700" aria-hidden="true" />
                        )}
                    </button>
                </div>

                {/* Mobile nav drawer */}
                {menuOpen && (
                    <div
                        id="mobile-nav"
                        className="absolute left-0 top-full flex w-full flex-col gap-3 border-b border-gray-100 bg-white px-5 py-4 shadow-lg sm:hidden"
                    >
                        {navLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.key}
                                    href={item.path}
                                    onClick={closeAllMenus}
                                    className="flex items-center gap-2 border-b border-gray-50 pb-2 text-base font-black text-slate-900 hover:text-purple-700"
                                >
                                    <Icon
                                        className="h-4 w-4 text-slate-500"
                                        aria-hidden="true"
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}

                        <div className="flex flex-col gap-2 pt-2">
                            {!currentUser ? (
                                <Link
                                    href="/login"
                                    onClick={closeAllMenus}
                                    className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-black text-white"
                                >
                                    Login / Register
                                </Link>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 px-1">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-200 to-pink-200 text-xl">
                                            {currentUser.avatar || "🦊"}
                                        </span>
                                        <span className="truncate text-sm font-black text-slate-900">
                                            {currentUser.name}
                                        </span>
                                    </div>
                                    {/* Streak pill on mobile drawer */}
                                    <div className="px-1">
                                        <StreakBadge size="md" className="w-full justify-start" />
                                    </div>
                                    {currentUser.isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={closeAllMenus}
                                            className="rounded-xl bg-purple-50 px-4 py-2 text-left text-sm font-black text-purple-700"
                                        >
                                            Admin panel
                                        </Link>
                                    )}
                                    <Link
                                        href="/progress"
                                        onClick={closeAllMenus}
                                        className="rounded-xl bg-gray-50 px-4 py-2 text-left text-sm font-black text-slate-900"
                                    >
                                        My progress
                                    </Link>
                                    <Link
                                        href="/map"
                                        onClick={closeAllMenus}
                                        className="rounded-xl bg-gray-50 px-4 py-2 text-left text-sm font-black text-slate-900"
                                    >
                                        Continue learning
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="rounded-xl bg-rose-50 px-4 py-2 text-left text-sm font-black text-rose-600"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* ═══════════════════════ MAIN ═══════════════════════ */}
            <main className="min-h-screen bg-gradient-to-b from-sky-100 via-[#F0F4FF] to-amber-50 pt-16">
                {children}
            </main>

            {/* ═══════════════════════ FOOTER ═══════════════════════ */}
            <footer className="relative w-full overflow-hidden border-t border-blue-50 bg-[#F8FAFF] pb-5 pt-8">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-purple-100/40 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 h-24 w-24 rounded-full bg-blue-100/40 blur-2xl"
                />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 border-b border-blue-100/60 pb-6 md:flex-row">
                        <Link
                            href="/"
                            className="flex items-center gap-3 transition hover:opacity-80"
                        >
                            <img
                                src="/assets/ui/hero/title-logo.png"
                                alt="Kiddo"
                                className="h-7 object-contain opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 sm:h-8"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                            <div className="border-l border-gray-200 pl-3">
                                <p className="text-xs font-black leading-none text-slate-700">
                                    Learn. Play. Grow.
                                </p>
                                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                    English for kids aged 6–7
                                </p>
                            </div>
                        </Link>

                        <div className="flex select-none flex-col items-center gap-1">
                            <img
                                src="/assets/ui/mascot/fox-hint.png"
                                alt=""
                                aria-hidden="true"
                                className="h-14 w-14 object-contain drop-shadow-md"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                                Safe &amp; Free
                            </p>
                        </div>

                        <div className="flex items-center gap-5 text-[11px] font-bold text-slate-400 sm:gap-7">
                            <button
                                type="button"
                                onClick={() => setPolicy("privacy")}
                                className="rounded transition-colors duration-150 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                            >
                                Privacy Policy
                            </button>
                            <button
                                type="button"
                                onClick={() => setPolicy("terms")}
                                className="rounded transition-colors duration-150 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                            >
                                Terms of Use
                            </button>
                            <Link
                                href="/help"
                                className="rounded transition-colors duration-150 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                            >
                                Help Center
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row">
                        <p className="text-[11px] font-bold text-slate-300">
                            © {new Date().getFullYear()} Kiddo. Made with ❤️ for curious kids.
                        </p>
                        <p className="text-[11px] font-semibold text-slate-300">
                            🌍 Available worldwide · Free forever
                        </p>
                    </div>
                </div>
            </footer>

            {/* Global mascot — only when signed in and not suppressed. */}
            {currentUser && showMascot ? <MascotBuddy /> : null}

            {/* Streak celebration — fires once per session whenever the
                shared streak prop ticks up (Streaks + Daily Quest feature). */}
            {currentUser ? <StreakCelebration /> : null}

            {/* Privacy / Terms modals */}
            <PolicyModal
                open={policy === "privacy"}
                onClose={() => setPolicy(null)}
                title="Privacy Policy"
            >
                <PrivacyPolicyContent />
            </PolicyModal>
            <PolicyModal
                open={policy === "terms"}
                onClose={() => setPolicy(null)}
                title="Terms of Use"
            >
                <TermsOfUseContent />
            </PolicyModal>
        </div>
    );
}

/** Local helper that renders a standard dropdown row. */
function UserMenuItem({ href, icon: Icon, onClose, children }) {
    return (
        <Link
            href={href}
            onClick={onClose}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-black text-slate-900 hover:bg-purple-50 hover:text-purple-700"
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {children}
        </Link>
    );
}
