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
 *  - We co-locate React + ReactDOM + Inertia in one vendor chunk.
 *    Splitting them into separate chunks (the previous setup) is a
 *    classic foot-gun: `@inertiajs/react` evaluates `React.createContext(...)`
 *    at module-load time, so if the inertia chunk loads before the
 *    react chunk you get the cryptic
 *      "Cannot read properties of null (reading 'createProvider')"
 *    runtime error. Keeping them in one chunk eliminates the race.
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
        // Force a single React copy across the whole graph. Some
        // sub-deps still ship their own React peer reference; without
        // this, Vite can resolve two copies and `useContext` returns
        // null — same root-cause family as the createProvider error.
        dedupe: ["react", "react-dom", "@inertiajs/react"],
    },

    // Pre-bundle React + Inertia together so the dev server serves
    // them as a single ESM module — keeps dev parity with prod.
    optimizeDeps: {
        include: ["react", "react-dom", "react-dom/client", "@inertiajs/react"],
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
                    // Single chunk for React + Inertia. See header
                    // comment for why these can NOT be split.
                    "react-vendor": [
                        "react",
                        "react-dom",
                        "react-dom/client",
                        "@inertiajs/react",
                    ],
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
