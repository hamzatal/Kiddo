/**
 * Kiddo SPA entry point.
 *
 * Responsibilities:
 *   - Wire Inertia + React 19 (createRoot) together.
 *   - Provide a global ErrorBoundary so a crash in any single page
 *     surfaces a friendly recovery screen instead of a white screen.
 *   - Mount the toast container once, at the root, so any page can
 *     `import { toast } from "@/lib/toast"` and show a notification.
 *   - Drive Inertia's progress bar with the brand colour.
 *   - Set a `<title>` template so every page gets "<page> · Kiddo"
 *     unless it provides its own <Head title>.
 */

import "./bootstrap";
import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp, Head } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";

import GlobalErrorFallback from "@/learning/components/ui/GlobalErrorFallback";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Kiddo";

createInertiaApp({
    title: (title) => (title ? `${title} · ${APP_NAME}` : APP_NAME),

    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ErrorBoundary
                FallbackComponent={GlobalErrorFallback}
                onReset={() => {
                    // Soft reload — Inertia preserves history.
                    if (typeof window !== "undefined") {
                        window.location.reload();
                    }
                }}
                onError={(error, info) => {
                    // In production this is where you'd hand the
                    // exception to Sentry/PostHog/etc.
                    if (import.meta.env.DEV) {
                        console.error("[Kiddo] Uncaught render error", error, info);
                    }
                }}
            >
                <>
                    {/* Default <title> until a page <Head> overrides it. */}
                    <Head title="" />
                    <App {...props} />
                    <Toaster
                        position="top-center"
                        richColors
                        closeButton
                        toastOptions={{
                            classNames: {
                                toast: "rounded-2xl border border-slate-200 shadow-soft",
                            },
                        }}
                    />
                </>
            </ErrorBoundary>,
        );
    },

    progress: {
        color: "#7C3AED", // brand purple
        delay: 200,
        showSpinner: false,
        includeCSS: true,
    },
});
