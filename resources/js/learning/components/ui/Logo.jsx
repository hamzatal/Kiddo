/**
 * Logo — the playful "Kiddo" wordmark used in the navbar, footer,
 * loading screens, and admin sidebar.
 *
 * Was previously inlined as a <span> with hardcoded gradients in 4+
 * different files. Centralised so a brand refresh is a one-file edit.
 */

import React from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/cn";

const SIZES = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl md:text-6xl",
};

export default function Logo({
    as = "link",
    to = "/",
    size = "md",
    className,
    showMascot = false,
}) {
    const Wrapper = as === "link" ? Link : "span";
    const wrapperProps = as === "link" ? { href: to } : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={cn(
                "inline-flex select-none items-center gap-2 font-extrabold tracking-tight",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 rounded-lg",
                SIZES[size] ?? SIZES.md,
                className,
            )}
            aria-label="Kiddo home"
        >
            {showMascot && (
                <span aria-hidden="true" className="text-2xl">
                    🦊
                </span>
            )}
            <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-sky-500 bg-clip-text text-transparent">
                Kiddo
            </span>
        </Wrapper>
    );
}
