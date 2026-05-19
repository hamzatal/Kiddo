import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vite config — explicit aliases + production-friendly defaults.
 *
 * Why this shape:
 *  - The previous config relied on Laravel's plugin to magically
 *    expose `@/...` as `resources/js/...`. That works at runtime
 *    but trips up TypeScript LSPs, ESLint, and Vitest. Declaring
 *    the alias here makes every tool agree on what `@/` means.
 *  - We split React + Inertia + framer-motion into vendor chunks
 *    so the main bundle stays under ~200 KB gzip and pages cache
 *    independently of vendor updates.
 *  - `build.target = es2020` lets us ship modern syntax (no
 *    polyfills) while still working on every browser shipped in
 *    the last ~5 years — well above the "kids on a school tablet"
 *    bar.
 */
export default defineConfig(({ mode }) => ({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/app.jsx"],
            refresh: true,
        }),
        react(),
    ],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "resources/js"),
            "@css": path.resolve(__dirname, "resources/css"),
        },
    },

    build: {
        target: "es2020",
        cssTarget: "chrome87",
        // Keep sourcemaps in dev so React DevTools can map back to
        // .jsx, but skip them in production builds to keep the
        // deploy artifact small.
        sourcemap: mode !== "production",
        // Warn (not fail) when any single chunk exceeds 600 KB.
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    "react-vendor": ["react", "react-dom"],
                    "inertia-vendor": ["@inertiajs/react"],
                    "motion-vendor": ["framer-motion"],
                },
            },
        },
    },

    // Vitest config lives next to Vite to keep one source of truth.
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/js/setup.js"],
        css: false,
        include: ["tests/js/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    },
}));
