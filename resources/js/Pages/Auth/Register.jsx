import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";

const Register = () => {
    const { errors } = usePage().props;
    const [values, setValues] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const handleChange = (e) =>
        setValues({ ...values, [e.target.id]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post("/register", values);
    };

    return (
        <div className="min-h-screen bg-[#F0F4FF] relative flex items-center justify-center p-4">
            {/* ── زر الرجوع الأخضر ── */}
            <button
                onClick={() => router.visit("/")}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 px-5 py-2 sm:px-6 sm:py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-xl shadow-[0_4px_0_#059669] active:translate-y-[4px] active:shadow-none transition-all text-xs sm:text-sm z-50"
            >
                ← Back to Home
            </button>

            {/* ── الفورم (مضغوط ومرتب) ── */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-xl border-2 border-white mt-12 sm:mt-0">
                <div className="text-center mb-5">
                    <span
                        className="font-black text-2xl sm:text-3xl cursor-pointer select-none"
                        onClick={() => router.visit("/")}
                    >
                        <span className="text-[#0EA5E9]">Kid</span>
                        <span className="text-[#FF4B63]">d</span>
                        <span className="text-[#F59E0B]">o</span>
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1E293B] mt-2">
                        Join Kiddo! 🚀
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">
                        Start the learning adventure
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <div>
                        <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
                            Child's Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={values.name}
                            onChange={handleChange}
                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1E293B] outline-none focus:border-[#7C3AED] focus:bg-white transition-colors"
                            placeholder="e.g. Alex"
                            required
                        />
                        {errors.name && (
                            <div className="text-red-500 text-[10px] font-bold mt-1 ml-1">
                                {errors.name}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
                            Parent Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={values.email}
                            onChange={handleChange}
                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1E293B] outline-none focus:border-[#7C3AED] focus:bg-white transition-colors"
                            placeholder="parent@kiddo.com"
                            required
                        />
                        {errors.email && (
                            <div className="text-red-500 text-[10px] font-bold mt-1 ml-1">
                                {errors.email}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={values.password}
                            onChange={handleChange}
                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1E293B] outline-none focus:border-[#7C3AED] focus:bg-white transition-colors"
                            placeholder="••••••••"
                            required
                        />
                        {errors.password && (
                            <div className="text-red-500 text-[10px] font-bold mt-1 ml-1">
                                {errors.password}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest mb-1 ml-1">
                            Confirm Password
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            value={values.password_confirmation}
                            onChange={handleChange}
                            className="w-full bg-[#F8FAFC] border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-[#1E293B] outline-none focus:border-[#7C3AED] focus:bg-white transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black rounded-xl py-3 shadow-[0_4px_0_#5B21B6] active:translate-y-[4px] active:shadow-none transition-all text-sm"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center mt-5 text-xs sm:text-sm font-bold text-gray-500">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.visit("/login")}
                        className="text-[#10B981] font-black hover:underline"
                    >
                        Log in here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;
