import React from "react";

/**
 * "Powered by Kiddo AI" section for the homepage. Decorative only —
 * no API calls. Designed to sit below the hero.
 */
const HomeAISection = () => (
    <section className="relative z-10 max-w-5xl mx-auto my-10 sm:my-16 px-4">
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-[2rem] border border-purple-100 shadow-xl p-6 sm:p-10 flex flex-col lg:flex-row items-center gap-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center shrink-0 shadow-inner border-4 border-white">
                <span className="text-6xl sm:text-7xl">🦊</span>
            </div>
            <div className="flex-1 text-center lg:text-left">
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
    </section>
);

export default HomeAISection;
