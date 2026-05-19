/**
 * `cn()` — the standard className helper used across Kiddo's UI.
 *
 * Combines `clsx` (boolean-friendly conditional classNames) with
 * `tailwind-merge` (so later utilities win over earlier ones, e.g.
 *   cn("p-2", "p-4")  -> "p-4"
 *   cn("text-red-500", error && "text-emerald-500") -> "text-emerald-500"
 * ).
 *
 * Why this matters for Kiddo specifically: the codebase has dozens
 * of components that accept a `className` prop and pass it into
 * Tailwind utility-rich elements. Without `twMerge`, conflicting
 * utilities silently stack and the actual rendered class is the
 * one that lost the cascade — a nightmare to debug at 11pm.
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default cn;
