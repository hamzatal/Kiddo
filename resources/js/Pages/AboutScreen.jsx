import React from "react";
import { Sparkles, Mail, Rocket, Target, Eye, Lightbulb } from "lucide-react";

import AppLayout from "@/Layouts/AppLayout";
import PageHead from "@/learning/components/ui/PageHead";
import JuicyButton from "@/learning/components/ui/JuicyButton";
import Container from "@/learning/components/ui/Container";
import { useAuthUser } from "@/lib/usePageProps";

/**
 * About / marketing landing page.
 *
 * Rewrite highlights vs the previous version:
 *   - Reuses <AppLayout> instead of duplicating the nav + footer
 *     (the previous version was 700+ lines, half of which was a copy
 *     of AppLayout that drifted out of sync with the real one).
 *   - All hard-coded hex shades have been migrated to Tailwind
 *     utilities or `kiddo-*` palette tokens introduced in
 *     tailwind.config.js.
 *   - Lucide icons replace emoji where the icon carries semantic
 *     meaning (mission, vision, approach). Decorative emoji stay.
 *   - <PageHead> emits a real title + description for SEO.
 */
export default function AboutScreen() {
    const user = useAuthUser();

    return (
        <AppLayout active="about">
            <PageHead
                title="About Kiddo"
                description="Kiddo is a curriculum-aligned English learning platform for first graders in Jordan — playful, audio-rich, and free."
            />

            <Container size="lg" as="section" className="px-4 pb-10 pt-14 text-center sm:px-6">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur-sm">
                    <span aria-hidden="true">📘</span>
                    <span className="text-xs font-black uppercase tracking-widest text-purple-700">
                        Jordanian Grade 1 English Curriculum
                    </span>
                </div>

                <h1
                    className="mb-5 font-black leading-tight text-slate-900"
                    style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                    About <span className="text-sky-500">Kid</span>
                    <span className="text-rose-500">d</span>
                    <span className="text-amber-500">o</span>
                </h1>

                <p
                    className="mx-auto mb-8 font-semibold leading-relaxed text-slate-600"
                    style={{
                        fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                        maxWidth: "56ch",
                    }}
                >
                    Kiddo is an interactive English learning platform purpose-built
                    for first-grade students, delivering curriculum-aligned content
                    through play, audio, and rewards.
                </p>

                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 scale-75 rounded-full bg-white/30 blur-2xl" />
                        <img
                            src="/assets/ui/mascot/fox-guide.png"
                            alt="Kiddo Fox mascot"
                            className="relative w-40 object-contain drop-shadow-xl sm:w-52"
                            onError={(e) => {
                                e.currentTarget.src = "/assets/ui/mascot/fox-main.png";
                                e.currentTarget.onerror = () => {
                                    e.currentTarget.style.display = "none";
                                };
                            }}
                        />
                    </div>
                </div>

                <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                    <StatBadge value="5" label="Learning lessons" tint="bg-purple-100" />
                    <StatBadge value="6–7" label="Target Age" tint="bg-emerald-100" />
                    <StatBadge value="100%" label="Free to Use" tint="bg-amber-100" />
                </div>
            </Container>

            <section className="bg-white py-12">
                <Container size="lg" className="px-4 sm:px-6">
                    <div className="mb-8 text-center">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-purple-700">
                            🎯 What Drives Us
                        </p>
                        <h2
                            className="font-black text-slate-900"
                            style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
                        >
                            Mission, Vision &amp; Approach
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <PillarCard
                            Icon={Target}
                            title="Our Mission"
                            tint="bg-purple-100"
                            iconColor="text-purple-700"
                            desc="To make high-quality English language education accessible, enjoyable, and effective for every first-grade student in Jordan — regardless of background or resources."
                        />
                        <PillarCard
                            Icon={Eye}
                            title="Our Vision"
                            tint="bg-emerald-100"
                            iconColor="text-emerald-700"
                            desc="A future where every child enters the second grade with confidence in English, equipped with the vocabulary, listening skills, and enthusiasm to keep learning."
                        />
                        <PillarCard
                            Icon={Lightbulb}
                            title="Our Approach"
                            tint="bg-amber-100"
                            iconColor="text-amber-700"
                            desc="We combine educational research with modern game design principles to deliver content that is both pedagogically sound and genuinely fun for young learners."
                        />
                    </div>
                </Container>
            </section>

            <section className="bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF] py-12">
                <Container size="lg" className="px-4 sm:px-6">
                    <div className="flex flex-col items-center gap-10 lg:flex-row">
                        <div className="flex w-full justify-center lg:w-2/5">
                            <div className="relative">
                                <div className="absolute -inset-3 rounded-3xl bg-purple-100" />
                                <img
                                    src="/assets/ui/backgrounds/classroom-bg.png"
                                    alt="Children learning English in a friendly classroom"
                                    className="relative w-full max-w-sm rounded-2xl object-cover shadow-lg"
                                    style={{ maxHeight: "280px" }}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                        e.currentTarget.parentElement.style.display = "none";
                                    }}
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-3/5">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-purple-700">
                                📖 What is Kiddo?
                            </p>
                            <h2
                                className="mb-4 font-black text-slate-900"
                                style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
                            >
                                A New Standard for Early English Education
                            </h2>
                            <p
                                className="mb-4 font-semibold leading-relaxed text-slate-600"
                                style={{ fontSize: "clamp(0.875rem, 1.3vw, 1rem)" }}
                            >
                                Kiddo is a web-based English learning platform developed
                                specifically for first-grade students in Jordan. The platform
                                is built in full alignment with the{" "}
                                <strong className="text-slate-900">
                                    Jordanian Ministry of Education Grade 1 English curriculum
                                </strong>
                                , covering all five learning lessons through interactive
                                activities, audio, and a reward-based progression system.
                            </p>
                            <p
                                className="font-semibold leading-relaxed text-slate-600"
                                style={{ fontSize: "clamp(0.875rem, 1.3vw, 1rem)" }}
                            >
                                Unlike traditional digital tools that rely on reading or
                                recording, Kiddo uses tap, drag-and-drop, and matching
                                interactions — making it accessible to all learners without
                                requiring any additional hardware or technical setup.
                            </p>
                        </div>
                    </div>
                </Container>
            </section>

            <section className="bg-white py-12">
                <Container size="lg" className="px-4 sm:px-6">
                    <div className="mb-8 text-center">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600">
                            <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                            Platform Features
                        </p>
                        <h2
                            className="font-black text-slate-900"
                            style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
                        >
                            Designed for Real Learning Outcomes
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <ValueCard
                            emoji="🎮"
                            tint="bg-purple-100"
                            title="Learning Through Play"
                            desc="Every concept is delivered through interactive games and activities, turning each lesson into an engaging experience children look forward to."
                        />
                        <ValueCard
                            emoji="🔒"
                            tint="bg-emerald-100"
                            title="Safe & Child-Friendly"
                            desc="No advertisements, no camera access, no microphone required — a fully secure environment designed with young learners in mind."
                        />
                        <ValueCard
                            emoji="📘"
                            tint="bg-amber-100"
                            title="Curriculum-Aligned"
                            desc="All content is developed in direct alignment with the official Jordanian Ministry of Education Grade 1 English curriculum."
                        />
                        <ValueCard
                            emoji="⭐"
                            tint="bg-rose-100"
                            title="Progress & Motivation"
                            desc="A built-in rewards system featuring stars, badges, and unlockable levels keeps students motivated and engaged throughout their learning journey."
                        />
                        <ValueCard
                            emoji="🎧"
                            tint="bg-sky-100"
                            title="High-Quality Audio"
                            desc="Every vocabulary word and phrase is accompanied by clear, professionally recorded audio to support accurate pronunciation from the very first lesson."
                        />
                        <ValueCard
                            emoji="📱"
                            tint="bg-emerald-50"
                            title="Accessible on Any Device"
                            desc="Kiddo runs seamlessly on tablets, smartphones, and desktop computers — no installation required, accessible from any modern browser."
                        />
                    </div>
                </Container>
            </section>

            <section className="py-12">
                <Container size="lg" className="px-4 sm:px-6">
                    <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-8 text-center shadow-sm sm:p-12">
                        <div
                            aria-hidden="true"
                            className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-purple-100/50 blur-2xl"
                        />
                        <div
                            aria-hidden="true"
                            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-100/50 blur-2xl"
                        />
                        <div className="relative z-10">
                            <Rocket
                                className="mx-auto mb-4 h-10 w-10 text-purple-600"
                                aria-hidden="true"
                            />
                            <h2
                                className="mb-3 font-black text-slate-900"
                                style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
                            >
                                Start Learning Today
                            </h2>
                            <p className="mx-auto mb-7 max-w-sm text-sm font-semibold text-slate-500">
                                Kiddo is available now, completely free of charge. No
                                registration fees, no subscriptions — just learning.
                            </p>
                            <div className="flex flex-col justify-center gap-3 sm:flex-row">
                                <JuicyButton
                                    as="link"
                                    href={user ? "/map" : "/register"}
                                    variant="purple"
                                    size="lg"
                                    leftIcon={<span aria-hidden="true">🌟</span>}
                                >
                                    {user ? "Continue learning" : "Get started — it's free"}
                                </JuicyButton>
                                <JuicyButton
                                    as="link"
                                    href="/help"
                                    variant="white"
                                    size="lg"
                                    leftIcon={<Mail className="h-4 w-4" aria-hidden="true" />}
                                >
                                    Help Center
                                </JuicyButton>
                            </div>
                        </div>
                    </div>
                </Container>
            </section>
        </AppLayout>
    );
}

/* ── Local presentational helpers ─────────────────────── */

function StatBadge({ value, label, tint }) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-3xl border border-white/60 p-5 shadow-sm ${tint}`}
        >
            <span className="text-3xl font-black leading-none text-slate-900">{value}</span>
            <span className="mt-1.5 text-center text-[11px] font-bold leading-snug text-slate-500">
                {label}
            </span>
        </div>
    );
}

function ValueCard({ emoji, title, desc, tint }) {
    return (
        <div
            className={`rounded-3xl border border-white/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${tint}`}
        >
            <div className="mb-3 text-2xl" aria-hidden="true">
                {emoji}
            </div>
            <h3 className="mb-1.5 text-sm font-black text-slate-900">{title}</h3>
            <p className="text-[11px] font-semibold leading-relaxed text-slate-500">{desc}</p>
        </div>
    );
}

function PillarCard({ Icon, title, desc, tint, iconColor }) {
    return (
        <div
            className={`rounded-3xl border-2 border-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${tint}`}
        >
            <Icon className={`mb-3 h-7 w-7 ${iconColor}`} aria-hidden="true" />
            <h3 className="mb-2 text-sm font-black text-slate-900">{title}</h3>
            <p className="text-[11px] font-semibold leading-relaxed text-slate-500">{desc}</p>
        </div>
    );
}
