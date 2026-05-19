import React, { useMemo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";

import PageHead from "@/learning/components/ui/PageHead";
import Logo from "@/learning/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * Register page.
 *
 * Highlights vs the previous version:
 *   - Inertia `useForm` (processing flag, auto error sync).
 *   - Real-time password strength meter (length + variety).
 *   - Show/hide password toggle.
 *   - Required parental-consent checkbox (COPPA hygiene). Kiddo
 *     targets first graders so we make the parent confirm they're
 *     creating the account on the child's behalf.
 *   - Passwords now require min 8 chars + at least 1 letter + 1 digit
 *     (matches the new server-side rule).
 */
export default function Register({ next }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        terms_accepted: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    // Lightweight password strength scoring. Not a substitute for
    // server-side rules — purely for UX feedback.
    const strength = useMemo(() => {
        const pwd = data.password ?? "";
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score; // 0..5
    }, [data.password]);

    const strengthLabel = ["Too short", "Weak", "Okay", "Good", "Strong", "Excellent"][strength];
    const strengthColor = [
        "bg-slate-200",
        "bg-rose-400",
        "bg-amber-400",
        "bg-yellow-400",
        "bg-emerald-400",
        "bg-emerald-600",
    ][strength];

    const submit = (e) => {
        e.preventDefault();
        post("/register", {
            preserveScroll: true,
            onError: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-[#F0F4FF] p-4">
            <PageHead
                title="Create your account"
                description="Join Kiddo and start a friendly English-learning adventure with your child."
            />

            <Link
                href="/"
                className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-black text-white shadow-juicy transition active:translate-y-0.5 active:shadow-juicy-press sm:left-6 sm:top-6 sm:px-6 sm:py-2.5 sm:text-sm"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Home
            </Link>

            <div className="mt-12 w-full max-w-md rounded-3xl border-2 border-white bg-white p-6 shadow-xl sm:mt-0 sm:p-7">
                <header className="mb-5 text-center">
                    <Logo size="md" showMascot className="justify-center" />
                    <h1 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
                        Join Kiddo!
                    </h1>
                    <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
                        Start the learning adventure together.
                    </p>
                </header>

                <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
                    <Field
                        id="name"
                        label="Child's name"
                        type="text"
                        autoComplete="given-name"
                        value={data.name}
                        onChange={(v) => setData("name", v)}
                        placeholder="e.g. Alex"
                        icon={<User className="h-4 w-4" aria-hidden="true" />}
                        error={errors.name}
                        required
                    />

                    <Field
                        id="email"
                        label="Parent email"
                        type="email"
                        autoComplete="email"
                        value={data.email}
                        onChange={(v) => setData("email", v)}
                        placeholder="parent@kiddo.app"
                        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                        error={errors.email}
                        required
                    />

                    <div>
                        <Field
                            id="password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(v) => setData("password", v)}
                            placeholder="At least 8 characters"
                            icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                            rightAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="text-slate-400 transition hover:text-slate-600"
                                    aria-label={
                                        showPassword ? "Hide password" : "Show password"
                                    }
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

                        {/* Strength meter */}
                        {data.password.length > 0 && (
                            <div className="ml-1 mt-1.5">
                                <div
                                    className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={5}
                                    aria-valuenow={strength}
                                >
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-200",
                                            strengthColor,
                                        )}
                                        style={{ width: `${(strength / 5) * 100}%` }}
                                    />
                                </div>
                                <p className="mt-1 text-[10px] font-bold text-slate-500">
                                    Password strength: {strengthLabel}
                                </p>
                            </div>
                        )}
                    </div>

                    <Field
                        id="password_confirmation"
                        label="Confirm password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={data.password_confirmation}
                        onChange={(v) => setData("password_confirmation", v)}
                        placeholder="Type your password again"
                        icon={<Lock className="h-4 w-4" aria-hidden="true" />}
                        error={errors.password_confirmation}
                        required
                    />

                    {/* Parental consent — required by validation. */}
                    <label className="mt-1 flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700">
                        <input
                            type="checkbox"
                            checked={data.terms_accepted}
                            onChange={(e) => setData("terms_accepted", e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            required
                        />
                        <span>
                            I'm a parent or legal guardian and I accept the{" "}
                            <Link
                                href="/help#terms"
                                className="text-purple-700 underline hover:no-underline"
                            >
                                Terms
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/help#privacy"
                                className="text-purple-700 underline hover:no-underline"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </span>
                    </label>
                    {errors.terms_accepted && (
                        <p
                            role="alert"
                            className="ml-1 -mt-2 text-[10px] font-bold text-rose-600"
                        >
                            {errors.terms_accepted}
                        </p>
                    )}

                    {next && <input type="hidden" name="next" value={next} />}

                    <button
                        type="submit"
                        disabled={processing}
                        className={cn(
                            "mt-2 w-full rounded-xl bg-purple-700 py-3 text-sm font-black text-white shadow-juicy transition",
                            "hover:bg-purple-800 active:translate-y-0.5 active:shadow-juicy-press",
                            "disabled:cursor-not-allowed disabled:opacity-70",
                            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300/70",
                        )}
                    >
                        {processing ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs font-bold text-slate-500 sm:text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-black text-emerald-600 hover:underline"
                    >
                        Log in here
                    </Link>
                </p>
            </div>
        </main>
    );
}

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
                className="ml-1 mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-500 sm:text-xs"
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
                        "w-full rounded-xl border-2 border-slate-100 bg-slate-50 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors",
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
