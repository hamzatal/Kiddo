import React from "react";

/**
 * "Powered by Kiddo AI" section for the homepage. Decorative only —
 * no API calls. FIX 6 — replaces the emoji with the real mascot
 * fox-main.png floated on the right side of the card.
 */
const HomeAISection = () => (
    <section className="relative z-10 max-w-5xl mx-auto my-10 sm:my-16 px-4">
        <div className="relative bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-[2rem] border border-purple-100 shadow-xl p-6 sm:p-10 overflow-visible">
            <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
                <div className="flex-1 text-center lg:text-left lg:pr-32 xl:pr-40">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 mb-2">
                        ✨ Powered by Kiddo AI
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#1E293B] mb-3">
                        Smart learning that grows with your child
                    </h3>
                    <ul className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600 font-semibold">
                        <li className="flex items-start gap-2 flex-1">
                            <span className="text-lg">💡</span>
                            Explains each word in a fun, simple way.
                        </li>
                        <li className="flex items-start gap-2 flex-1">
                            <span className="text-lg">📊</span>
                            Turns progress into a friendly parent report.
                        </li>
                        <li className="flex items-start gap-2 flex-1">
                            <span className="text-lg">🏡</span>
                            Suggests short home activities from the same book.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Floating mascot illustration on the right side. Hidden
                on small screens so the copy stays readable, full size
                from lg+ and bumped up slightly so it visibly "floats". */}
            <img
                src="/assets/ui/mascot/fox-main.png"
                alt="Kiddo Fox mascot"
                className="hidden md:block absolute right-2 sm:right-4 lg:right-8 xl:right-10 -top-6 lg:-top-10 w-32 sm:w-40 lg:w-52 xl:w-60 h-auto object-contain pointer-events-none drop-shadow-2xl select-none"
                style={{ animation: "kiddo-float 4s ease-in-out infinite" }}
                onError={(e) => (e.currentTarget.style.display = "none")}
            />

            <style>{`
                @keyframes kiddo-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    </section>
);

export default HomeAISection;
