import React from "react";
import { router, Link, usePage } from "@inertiajs/react";

/**
 * Shared shell for every /admin page. Holds the sidebar + mobile
 * header and renders children inside the main area. The active tab
 * is highlighted via the `active` prop.
 *
 * The sidebar intentionally re-uses the same visual language as the
 * Parent Dashboard so admins feel at home.
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
        <div className="min-h-[100dvh] w-full bg-[#F4F8FB] font-sans flex relative">
            {/* Sidebar */}
            <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-white border-r border-gray-100 shadow-sm">
                <div className="h-[72px] px-5 flex items-center justify-between border-b border-gray-50">
                    <span className="font-black text-[#1E293B] text-lg">
                        Kiddo Admin
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 uppercase tracking-widest">
                        Admin
                    </span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
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

            {/* Mobile header */}
            <div className="flex-1 min-w-0 flex flex-col">
                <header className="lg:hidden h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between">
                    <span className="font-black text-[#1E293B]">
                        Kiddo Admin
                    </span>
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

                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
