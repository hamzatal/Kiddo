import React from "react";
import { router, Link, usePage } from "@inertiajs/react";

/**
 * Shared shell for every /admin page. Holds the sidebar + mobile
 * header and renders children inside the main area. The active tab
 * is highlighted via the `active` prop.
 *
 * Layout rules:
 *   - Outer container pins to the viewport height (h-[100dvh]) and hides
 *     its own overflow so only the <main> region scrolls. Without this the
 *     admin pages previously grew past the bottom edge with no scroll bar.
 *   - The right-hand column uses `flex-1 min-w-0 flex flex-col h-full` so
 *     its height matches the container and its children can size against it.
 *   - The <main> region itself is `flex-1 overflow-y-auto` so long tables
 *     (Words, Tracks) scroll inside the layout while the sidebar stays put.
 */
const AdminLayout = ({ active, children }) => {
    const { auth } = usePage().props;
    const user = auth?.user;

    const tabs = [
        { key: "dashboard", label: "Dashboard", icon: "📊", href: "/admin" },
        { key: "units",     label: "Units",     icon: "🗺️", href: "/admin/units" },
        { key: "lessons",   label: "Lessons",   icon: "📖", href: "/admin/lessons" },
        { key: "words",     label: "Words & Segments", icon: "🔊", href: "/admin/words" },
        { key: "tracks",    label: "Audio Tracks",     icon: "🎧", href: "/admin/tracks" },
    ];

    return (
        <div className="h-[100dvh] w-full bg-[#F4F8FB] font-sans flex relative overflow-hidden">
            {/* Sidebar */}
            <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-white border-r border-gray-100 shadow-sm h-full">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
                    <img
                        src="/assets/ui/hero/title-logo.png"
                        alt="Kiddo"
                        className="h-10 w-auto shrink-0"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div className="flex flex-col leading-tight min-w-0">
                        <span className="font-black text-[#1E293B] text-base truncate">
                            Kiddo Admin
                        </span>
                        <span className="self-start mt-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 uppercase tracking-widest">
                            Admin
                        </span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => router.visit(t.href)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black text-left transition ${
                                active === t.key
                                    ? "bg-[#7C3AED] text-white shadow"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-[#1E293B]"
                            }`}
                        >
                            <span className="text-base">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => router.visit("/")}
                        className="w-full text-xs font-black text-gray-500 hover:text-gray-900 text-left flex items-center gap-2"
                    >
                        ← Back to site
                    </button>
                    {user ? (
                        <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                            {user.name} · Admin
                        </p>
                    ) : null}
                </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 min-w-0 flex flex-col h-full">
                {/* Mobile header */}
                <header className="lg:hidden h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <img
                            src="/assets/ui/hero/title-logo.png"
                            alt="Kiddo"
                            className="h-8 w-auto shrink-0"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <span className="font-black text-[#1E293B] truncate">
                            Kiddo Admin
                        </span>
                    </div>
                    <select
                        value={active}
                        onChange={(e) => router.visit(tabs.find((t) => t.key === e.target.value)?.href || "/admin")}
                        className="text-xs font-black border border-gray-200 rounded-lg px-2 py-1"
                    >
                        {tabs.map((t) => (
                            <option key={t.key} value={t.key}>{t.label}</option>
                        ))}
                    </select>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
