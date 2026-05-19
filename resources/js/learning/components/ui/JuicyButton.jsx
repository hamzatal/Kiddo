/**
 * JuicyButton — Kiddo's signature 3D-extruded press button.
 *
 * Previously this exact component lived (with copy-paste drift) inside
 * HomeScreen.jsx, AboutScreen.jsx, and a handful of other pages. We've
 * extracted it once so:
 *   1. Visual design is consistent (the 'tactile' tap-down depends on
 *      the shadow + translate-y combo being IDENTICAL everywhere).
 *   2. Accessibility lives in one place: aria-disabled, focus-visible
 *      ring, keyboard support, an optional `as="link"` mode that
 *      renders an Inertia <Link> for prefetching.
 *   3. The Tailwind shadow tokens (shadow-juicy / shadow-juicy-press)
 *      come from the central Tailwind config — no more
 *      `shadow-[0_5px_0_0_#5B0F99]` strewn across the codebase.
 *
 * Variants: purple (default), white, green, sky.
 * Sizes: sm, md, lg, xl.
 */

import React from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/cn";

const VARIANTS = {
    purple: cn(
        "bg-gradient-to-b from-purple-500 to-purple-700 text-white",
        "shadow-juicy active:shadow-juicy-press",
    ),
    white: cn(
        "bg-white text-purple-700 border-2 border-purple-200",
        "shadow-juicy active:shadow-juicy-press",
    ),
    green: cn(
        "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white",
        "shadow-juicy active:shadow-juicy-press",
    ),
    sky: cn(
        "bg-gradient-to-b from-sky-400 to-sky-600 text-white",
        "shadow-juicy active:shadow-juicy-press",
    ),
    amber: cn(
        "bg-gradient-to-b from-amber-400 to-amber-600 text-white",
        "shadow-juicy active:shadow-juicy-press",
    ),
    danger: cn(
        "bg-gradient-to-b from-rose-400 to-rose-600 text-white",
        "shadow-juicy active:shadow-juicy-press",
    ),
};

const SIZES = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-5 py-3 text-base rounded-2xl",
    lg: "px-7 py-4 text-lg rounded-2xl",
    xl: "px-8 py-5 text-xl rounded-3xl",
};

const JuicyButton = React.forwardRef(function JuicyButton(
    {
        as = "button",
        href,
        type = "button",
        variant = "purple",
        size = "md",
        disabled = false,
        loading = false,
        leftIcon,
        rightIcon,
        className,
        children,
        ...rest
    },
    ref,
) {
    const baseClass = cn(
        "inline-flex items-center justify-center gap-2 font-extrabold tracking-tight",
        "transition-transform duration-100 ease-out select-none",
        "active:translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/70",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0",
        SIZES[size] ?? SIZES.md,
        VARIANTS[variant] ?? VARIANTS.purple,
        className,
    );

    const inner = (
        <>
            {loading ? (
                <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
            ) : (
                leftIcon
            )}
            <span>{children}</span>
            {rightIcon}
        </>
    );

    if (as === "link") {
        // Inertia <Link> gives us prefetch + scroll preservation.
        return (
            <Link
                ref={ref}
                href={href ?? "#"}
                className={baseClass}
                aria-disabled={disabled || loading}
                {...rest}
            >
                {inner}
            </Link>
        );
    }

    if (as === "a") {
        return (
            <a
                ref={ref}
                href={href ?? "#"}
                className={baseClass}
                aria-disabled={disabled || loading}
                {...rest}
            >
                {inner}
            </a>
        );
    }

    return (
        <button
            ref={ref}
            type={type}
            className={baseClass}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...rest}
        >
            {inner}
        </button>
    );
});

export default JuicyButton;
