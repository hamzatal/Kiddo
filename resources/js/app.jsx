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
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "sonner";

import GlobalErrorFallback from "@/learning/components/ui/GlobalErrorFallback";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Kiddo";

createInertiaApp({
    /**
     * Default <title> handler. When a page does not render its own
     * <Head title="..."> Inertia falls back to the value returned
     * here, so we do NOT need to render a stand-alone <Head /> at
     * the root — doing that crashes (see note below).
     */
    title: (title) => (title ? `${title} · ${APP_NAME}` : APP_NAME),

    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);

        // CRITICAL: <Head /> from @inertiajs/react MUST be rendered
        // INSIDE <App>, never as a sibling. <App> is the component
        // that mounts <HeadContext.Provider value={headManager} />;
        // anything outside it sees `useContext(HeadContext) === null`
        // and the very first line in @inertiajs/react/Head.ts:
        //
        //     const provider = useMemo(
        //         () => headManager.createProvider(),
        //         [headManager],
        //     );
        //
        // explodes with the cryptic
        //     "Cannot read properties of null (reading 'createProvider')"
        //
        // The previous setup placed <Head title="" /> as a sibling
        // of <App>, which produced exactly that error on every
        // page load. The default title is already covered by the
        // `title:` callback above, so we don't need a root <Head>
        // at all — pages can opt in via PageHead / their own <Head>
        // when they want to override the document title.
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
                        // eslint-disable-next-line no-console
                        console.error("[Kiddo] Uncaught render error", error, info);
                    }
                }}
            >
                <>
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
