/**
 * Container — page-level horizontal centering with sane max-widths.
 * Use as the immediate child of your <main>, e.g.
 *
 *   <main>
 *     <Container size="lg">
 *       …page content…
 *     </Container>
 *   </main>
 */

import React from "react";
import { cn } from "@/lib/cn";

const SIZES = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[88rem]",
    full: "max-w-none",
};

export default function Container({ size = "lg", as: As = "div", className, children, ...rest }) {
    return (
        <As
            className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", SIZES[size] ?? SIZES.lg, className)}
            {...rest}
        >
            {children}
        </As>
    );
}
