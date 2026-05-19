/**
 * Last-resort fallback UI when an uncaught render error bubbles up
 * to the root ErrorBoundary in app.jsx.
 *
 * Design goals:
 *   - A child-friendly message (no scary stack traces).
 *   - A clear "Try again" button that resets the boundary.
 *   - Stack trace + reset hint shown only in DEV.
 */

import React from "react";
import { router } from "@inertiajs/react";

export default function GlobalErrorFallback({ error, resetErrorBoundary }) {
    const isDev = import.meta.env.DEV;

    const goHome = () => {
        // We use router.visit instead of window.location so we keep
        // the SPA shell warm and avoid a full reload flash.
        router.visit("/", { replace: true });
    };

    return (
        <main
            role="alert"
            className="flex min-h-screen items-center justify-center bg-[#F0F4FF] px-4 py-10"
        >
            <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl">
                    🦊
                </div>
                <h1 className="mb-2 text-2xl font-extrabold text-slate-900">
                    Oops! Fox tripped over a wire.
                </h1>
                <p className="mb-6 text-sm text-slate-600">
                    Something unexpected happened on this page. Tap the
                    button below to try again — your stars and progress are safe.
                </p>

                {isDev && error?.message && (
                    <pre className="mb-4 max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-left text-xs leading-relaxed text-rose-700">
                        {error.message}
                    </pre>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={resetErrorBoundary}
                        className="flex-1 rounded-2xl bg-purple-600 px-5 py-3 text-base font-bold text-white shadow-juicy transition active:translate-y-0.5 active:shadow-juicy-press"
                    >
                        Try again
                    </button>
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        Back to home
                    </button>
                </div>
            </div>
        </main>
    );
}
