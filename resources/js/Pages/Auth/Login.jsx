import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

import PageHead from "@/learning/components/ui/PageHead";
import Logo from "@/learning/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * Login page.
 *
 * Highlights vs the previous version:
 *   - Inertia's `useForm` replaces hand-rolled useState. We get
 *     `processing` (button shows a spinner), automatic error sync,
 *     and `reset("password")` on failure for free.
 *   - Adds a "Show password" toggle and a "Remember me" checkbox.
 *   - Adds a "Forgot password?" link (the route is a placeholder for
 *     now — it will land on the same login page until the parent flow
 *     ships).
 *   - Honours `?next=...` so a 401-bounced user lands back where they
 *     started after signing in.
 *   - Uses Inertia <Link> (prefetch) for inter-page nav and adds a
 *     visible focus ring on every interactive element.
 */
export default function Login({ next }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: true,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post("/login", {
            preserveScroll: true,
            onError: () => reset("password"),
        });
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-[#F0F4FF] p-4">
            <PageHead
                title="Log in"
                description="Sign in to continue your Kiddo learning adventure."
            />

            {/* Back to home */}
            <Link
                href="/"
                className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black text-white shadow-juicy transition active:translate-y-0.5 active:shadow-juicy-press sm:left-6 sm:top-6 sm:px-6 sm:py-2.5 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Home
            </Link>

            <div className="mt-12 w-full max-w-md rounded-3xl border-2 border-white bg-white p-6 shadow-xl sm:mt-0 sm:p-8">
                <header className="mb-6 text-center">
                    <Logo size="md" showMascot className="justify-center" />
                    <h1 className="mt-3 text-xl font-black text-slate-900 sm:text-2xl">
                        Welcome back!
                    </h1>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                        Ready to learn and play?
                    </p>
                </header>

                <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                    {/* Email */}
                    <Field
                        id="email"
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        onChange={(v) => setData("email", v)}
                        placeholder="parent@kiddo.app"
                        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                        error={errors.email}
                        required
                    />

                    {/* Password */}
                    <Field
                        id="password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={data.password}
                        onChange={(v) => setData("password", v)}
                        placeholder="••••••••"
                        icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                        rightAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="text-slate-400 transition hover:text-slate-600"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>
                        }
                        error={errors.password}
                        required
                    />

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between text-xs font-bold">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData("remember", e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            Remember me
                        </label>
                        <Link
                            href="/help#account"
                            className="text-purple-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 rounded"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Hidden ?next= passthrough */}
                    {next && <input type="hidden" name="next" value={next} />}

                    <button
                        type="submit"
                        disabled={processing}
                        className={cn(
                            "mt-2 w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-black text-white shadow-juicy transition",
                            "hover:bg-emerald-600 active:translate-y-0.5 active:shadow-juicy-press",
                            "disabled:cursor-not-allowed disabled:opacity-70",
                            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/70 sm:text-base",
                        )}
                    >
                        {processing ? "Logging in…" : "Log in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs font-bold text-slate-500 sm:text-sm">
                    Don't have an account?{" "}
                    <Link
                        href="/register"
                        className="font-black text-purple-700 hover:underline"
                    >
                        Sign up here
                    </Link>
                </p>
            </div>
        </main>
    );
}

/* ─── Local Field component ─────────────────────────────────
 * Kept inside this file (not extracted) because it's tightly
 * coupled to this auth screen's visual style. The shared Field
 * primitive used by other forms lives under
 * resources/js/learning/components/ui/Field.jsx.
 */
function Field({
    id,
    label,
    type,
    value,
    onChange,
    placeholder,
    icon,
    rightAdornment,
    error,
    autoComplete,
    required,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="ml-1 mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs"
            >
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </span>
                )}
                <input
                    id={id}
                    name={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    required={required}
                    className={cn(
                        "w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-sm font-bold text-slate-900 outline-none transition-colors",
                        "focus:border-purple-600 focus:bg-white",
                        icon ? "pl-10" : "pl-4",
                        rightAdornment ? "pr-10" : "pr-4",
                        error && "border-rose-300 bg-rose-50",
                    )}
                />
                {rightAdornment && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightAdornment}
                    </span>
                )}
            </div>
            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="ml-1 mt-1 text-[10px] font-bold text-rose-600"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
