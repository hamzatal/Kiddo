import React from "react";
import { Link, router } from "@inertiajs/react";
import { Sparkles, Rocket, Headphones, Gamepad2, Trophy, Puzzle } from "lucide-react";

import AppLayout from "@/Layouts/AppLayout";
import PageHead from "@/learning/components/ui/PageHead";
import JuicyButton from "@/learning/components/ui/JuicyButton";
import HeroMascot from "@/learning/components/ui/HeroMascot";
import HomeAISection from "@/learning/components/ai/HomeAISection";
import { useAuthUser } from "@/lib/usePageProps";
import { cn } from "@/lib/cn";

/**
 * HomeScreen / landing page.
 *
 * Rewrite highlights vs the previous version:
 *   - The inline PolicyModal + JuicyButton + ABC-mascot CSS got
 *     extracted to shared components in learning/components/ui.
 *     HomeScreen is now ~250 lines instead of ~700, and the legal
 *     modal is the same one the AppLayout footer opens (single
 *     source of truth for the copy).
 *   - <PageHead> emits a real title + description for SEO.
 *   - Inertia <Link> replaces router.visit() for inter-page links so
 *     the 'Continue learning' click is instant + prefetched.
 *   - Hardcoded hex shades replaced with Tailwind palette tokens.
 *   - LessonCard + FeatureCard remain local because they're tightly
 *     coupled to this page's marketing visuals; they aren't reused
 *     elsewhere yet.
 */
export default function HomeScreen({ units }) {
    const user = useAuthUser();

    const defaultLessons = [
        {
            id: 1,
            number: "0",
            title: "Welcome / Hello",
            imagePath: "/assets/lessons/welcome/hello.png",
            colorKey: "purple",
            isLocked: false,
        },
        {
            id: 2,
            number: "1",
            title: "Family and Friends",
            imagePath: "/assets/lessons/family/family_group.png",
            colorKey: "green",
            isLocked: true,
        },
        {
            id: 3,
            number: "2",
            title: "My School Bag",
            imagePath: "/assets/lessons/schoolbag/bag.png",
            colorKey: "blue",
            isLocked: true,
        },
    ];

    const displayLessons =
        units && units.length > 0
            ? units.map((u) => ({
                  id: u.id,
                  number: u.unit_number ?? u.id,
                  title: u.title,
                  imagePath: u.image_path || u.imagePath,
                  colorKey: u.color_key || u.colorKey || "purple",
                  isLocked: u.status === "locked",
              }))
            : defaultLessons;

    const features = [
        {
            colorKey: "purple",
            Icon: Headphones,
            title: "Audio Learning",
            desc: "Clear native English audio by professional speakers.",
        },
        {
            colorKey: "green",
            Icon: Gamepad2,
            title: "Fun Games",
            desc: "Interactive mini-games that make every lesson exciting.",
        },
        {
            colorKey: "amber",
            Icon: Trophy,
            title: "Rewards & Badges",
            desc: "Earn stars, badges and certificates along the way.",
        },
        {
            colorKey: "pink",
            Icon: Puzzle,
            title: "Interactive Activities",
            desc: "Hands-on exercises to reinforce every new word without microphones.",
        },
    ];

    const goToLesson = (lessonId) => {
        // We use router.visit() (instead of <Link>) here because the
        // exact destination depends on whether the user is signed in.
        router.visit(user ? `/lesson/${lessonId}` : "/login");
    };

    return (
        <AppLayout active="home">
            <PageHead
                title="Home"
                description="Kiddo — playful English-learning adventure for kids aged 6–7. Curriculum-aligned, audio-first, and free."
            />

            {/* ═══════════════════════ HERO ═══════════════════════ */}
            <section
                id="hero"
                className="relative -mt-16 flex w-full flex-col overflow-hidden bg-gradient-to-br from-sky-200 via-sky-100 to-amber-50"
                style={{ minHeight: "100svh" }}
            >
                <img
                    src="/assets/ui/hero/clouds.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top opacity-55"
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,255,255,0.38) 0%, transparent 70%)",
                    }}
                />

                <div className="relative z-10 flex flex-1 items-center pt-16">
                    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:max-w-[1400px] 2xl:max-w-[1600px]">
                        <div className="flex flex-col-reverse items-center justify-between gap-6 lg:flex-row lg:gap-8">
                            <div className="flex w-full flex-col items-center text-center lg:w-[54%] lg:items-start lg:text-left">
                                <h1
                                    className="mt-6 font-black leading-[1.1] tracking-tight text-slate-900"
                                    style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
                                >
                                    Learn English <br /> with{" "}
                                    <span className="inline-block -rotate-2 rounded-xl bg-rose-500 px-3 py-1 text-white shadow-[0_4px_0_#cc0019]">
                                        Fun
                                    </span>
                                    ,{" "}
                                    <span className="mx-1 inline-block rotate-2 rounded-xl bg-emerald-500 px-3 py-1 text-white shadow-[0_4px_0_#059669]">
                                        Games
                                    </span>
                                    , <br /> and{" "}
                                    <span className="mt-2 inline-block -rotate-1 rounded-xl bg-purple-500 px-3 py-1 text-white shadow-[0_4px_0_#6D28D9]">
                                        Sounds
                                    </span>
                                    !
                                </h1>

                                <p
                                    className="mt-6 max-w-[400px] font-semibold leading-relaxed text-slate-600"
                                    style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }}
                                >
                                    Kiddo is a playful learning adventure for kids
                                    aged 6–7. Play, listen, and grow with every lesson!
                                </p>

                                <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
                                    <JuicyButton
                                        as="link"
                                        href={user ? "/map" : "/register"}
                                        variant="purple"
                                        size="lg"
                                        leftIcon={<Rocket className="h-5 w-5" aria-hidden="true" />}
                                    >
                                        {user ? "Continue Journey" : "Start Learning Now!"}
                                    </JuicyButton>

                                    <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                        <span
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-white"
                                            style={{ boxShadow: "0 2px 0 #059669" }}
                                            aria-hidden="true"
                                        >
                                            ✔
                                        </span>
                                        No microphone or camera needed · Free forever
                                    </p>
                                </div>
                            </div>

                            <div className="w-full lg:w-[46%]">
                                <HeroMascot />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave separator */}
                <div className="relative z-20 mt-auto" style={{ lineHeight: 0, marginBottom: "-2px" }}>
                    <svg
                        viewBox="0 0 1440 80"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        className="block w-full"
                        style={{ height: "clamp(44px, 6vw, 80px)" }}
                    >
                        <path
                            d="M0,35 C120,65 240,10 360,40 C480,70 600,8 720,38 C840,68 960,12 1080,42 C1200,72 1320,18 1440,45 L1440,80 L0,80 Z"
                            fill="white"
                        />
                    </svg>
                </div>
            </section>

            {/* ═══════════════════════ LESSONS ═══════════════════════ */}
            <section className="w-full bg-white py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:max-w-[1400px] 2xl:max-w-[1600px]">
                    <div className="mb-7 text-center sm:mb-8">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-purple-700 sm:text-xs">
                            <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                            Curriculum
                        </p>
                        <h2
                            className="inline-flex flex-wrap items-center justify-center gap-2 font-black text-slate-900"
                            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                        >
                            <span className="text-amber-400" aria-hidden="true">⭐</span>
                            Our Learning Units
                            <span className="text-amber-400" aria-hidden="true">⭐</span>
                        </h2>
                    </div>

                    <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 xl:max-w-4xl 2xl:max-w-5xl">
                        {displayLessons.map((l) => (
                            <div
                                key={l.id}
                                className="w-[calc(50%-0.75rem)] sm:w-[200px] lg:w-[240px] xl:w-[260px]"
                                style={{ height: "clamp(150px, 18vw, 260px)" }}
                            >
                                <LessonCard {...l} onClick={() => goToLesson(l.id)} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI marketing strip */}
            <HomeAISection />

            {/* ═══════════════════════ FEATURES ═══════════════════════ */}
            <section className="w-full bg-gradient-to-b from-[#F8FAFF] to-[#F0F4FF] py-10 sm:py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:max-w-[1400px] 2xl:max-w-[1600px]">
                    <div className="mb-7 text-center sm:mb-8">
                        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-emerald-600 sm:text-xs">
                            <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
                            Why Kiddo?
                        </p>
                        <h2
                            className="font-black text-slate-900"
                            style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                        >
                            Why Kids Love Kiddo
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((f) => (
                            <FeatureCard key={f.title} {...f} />
                        ))}
                    </div>
                </div>
            </section>
        </AppLayout>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Local LessonCard — a marketing-only card. The real "play this
   lesson" cards on /map use a richer component (LessonHero).
═══════════════════════════════════════════════════════════════ */

const LESSON_TINT = {
    purple: { bg: "bg-purple-100", badge: "bg-purple-700", ring: "hover:ring-purple-300", star: "text-purple-700" },
    green:  { bg: "bg-emerald-100", badge: "bg-emerald-600", ring: "hover:ring-emerald-300", star: "text-emerald-600" },
    blue:   { bg: "bg-sky-100",     badge: "bg-sky-600",     ring: "hover:ring-sky-300",     star: "text-sky-600" },
    pink:   { bg: "bg-rose-100",    badge: "bg-rose-600",    ring: "hover:ring-rose-300",    star: "text-rose-600" },
    amber:  { bg: "bg-amber-100",   badge: "bg-amber-600",   ring: "hover:ring-amber-300",   star: "text-amber-600" },
};

function LessonCard({ number, title, imagePath, colorKey = "purple", isLocked = false, onClick }) {
    const tint = LESSON_TINT[colorKey] ?? LESSON_TINT.purple;

    return (
        <button
            type="button"
            onClick={!isLocked ? onClick : undefined}
            aria-disabled={isLocked}
            className={cn(
                "group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border-2 border-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out",
                tint.bg,
                isLocked
                    ? "cursor-not-allowed opacity-60 grayscale-[40%]"
                    : `cursor-pointer ring-2 ring-transparent hover:-translate-y-1.5 hover:shadow-xl ${tint.ring}`,
            )}
        >
            <span
                className={cn(
                    "absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-black text-white shadow-md",
                    tint.badge,
                )}
                aria-hidden="true"
            >
                {number}
            </span>

            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 shadow-sm backdrop-blur-[2px]">
                        <span aria-label="Locked" className="text-2xl">
                            🔒
                        </span>
                    </div>
                </div>
            )}

            <div className="flex flex-1 items-center justify-center overflow-hidden p-3 pt-10">
                <img
                    src={imagePath}
                    alt={title}
                    loading="lazy"
                    className="h-full w-full object-contain drop-shadow-md"
                    style={{ maxHeight: "8rem" }}
                    onError={(e) => {
                        e.currentTarget.style.opacity = "0.3";
                    }}
                />
            </div>

            <div className="px-3 pb-3 text-center">
                <p className="line-clamp-2 text-[11px] font-black leading-tight text-slate-900 sm:text-xs">
                    {title}
                </p>
            </div>

            {!isLocked && (
                <span
                    className={cn(
                        "absolute bottom-2 right-2.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100",
                        tint.star,
                    )}
                    aria-hidden="true"
                >
                    ⭐
                </span>
            )}
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Local FeatureCard
═══════════════════════════════════════════════════════════════ */

const FEATURE_TINT = {
    purple: { wrap: "bg-purple-100", icon: "bg-purple-700/10 text-purple-700" },
    green:  { wrap: "bg-emerald-100", icon: "bg-emerald-600/10 text-emerald-600" },
    amber:  { wrap: "bg-amber-100", icon: "bg-amber-600/10 text-amber-700" },
    pink:   { wrap: "bg-rose-100", icon: "bg-rose-600/10 text-rose-700" },
};

function FeatureCard({ colorKey = "purple", Icon, title, desc }) {
    const tint = FEATURE_TINT[colorKey] ?? FEATURE_TINT.purple;
    return (
        <div
            className={cn(
                "flex items-start gap-4 rounded-3xl border border-white/60 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                tint.wrap,
            )}
        >
            <div
                className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                    tint.icon,
                )}
            >
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
                <h3 className="mb-1 text-sm font-black leading-tight text-slate-900">
                    {title}
                </h3>
                <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
                    {desc}
                </p>
            </div>
        </div>
    );
}
