/**
 * PolicyModal — shared modal for Privacy Policy / Terms of Use /
 * Cookie Notice. Previously inlined as `PolicyModal` inside
 * HomeScreen.jsx; the AppLayout footer rendered the same buttons but
 * silently did nothing because the modal lived in a different file.
 *
 * Behaviour notes:
 *   - Closes on ESC, on backdrop click, and via the close button.
 *   - Uses `<dialog>` semantics (role="dialog", aria-modal) so screen
 *     readers announce it correctly.
 *   - Locks body scroll while open (the previous version did this in
 *     HomeScreen — we now centralise it).
 */

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export default function PolicyModal({ open, onClose, title, children }) {
    const closeBtnRef = useRef(null);

    // Lock body scroll while open + focus the close button so ESC works
    // even before the user moves focus.
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeBtnRef.current?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition"
            />

            {/* Card */}
            <div
                className={cn(
                    "relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl",
                    "animate-fadeInScale",
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-sky-50 px-6 py-4">
                    <h2
                        id="policy-modal-title"
                        className="text-xl font-extrabold text-slate-900"
                    >
                        {title}
                    </h2>
                    <button
                        ref={closeBtnRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="custom-scroll max-h-[70vh] overflow-y-auto px-6 py-5 text-slate-700">
                    {children}
                </div>

                <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-purple-600 px-5 py-2 text-sm font-bold text-white shadow-juicy active:translate-y-0.5 active:shadow-juicy-press"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Default content blocks the AppLayout footer + Home footer can
 *    drop in. Keeping the copy here means there's a single source of
 *    truth for the legal text. */

export function PrivacyPolicyContent() {
    return (
        <div className="space-y-3 text-sm leading-relaxed">
            <p>
                Kiddo is built for first-grade English learners and the
                grown-ups who care about them. We collect only the
                information needed to track learning progress and
                personalise the experience.
            </p>
            <p>
                <strong>What we store:</strong> the parent's email and
                password (hashed with bcrypt), the child's display name,
                and per-lesson progress (stars, attempts, weak words).
            </p>
            <p>
                <strong>What we don't:</strong> we never sell, share, or
                publish a child's progress. AI helpers receive
                vocabulary and progress metadata only — never the
                child's name.
            </p>
            <p>
                <strong>Your rights:</strong> sign in and use Settings →
                Delete Account to permanently remove all data, or email
                <a className="ml-1 text-purple-700 underline" href="mailto:privacy@kiddo.app">
                    privacy@kiddo.app
                </a>
                .
            </p>
        </div>
    );
}

export function TermsOfUseContent() {
    return (
        <div className="space-y-3 text-sm leading-relaxed">
            <p>
                By using Kiddo you agree to use it for personal, family
                or classroom learning. Don't try to break into the
                service, scrape content, or impersonate other users.
            </p>
            <p>
                The curriculum (Team Together 1A) and audio tracks are
                licensed from Pearson / NCCD. Lesson images and the
                Kiddo characters belong to us — please don't reuse them
                outside Kiddo without asking.
            </p>
            <p>
                Kiddo is free during early access. We'll let parents
                know in advance before any pricing changes.
            </p>
        </div>
    );
}
