import React, { useState } from "react";
import axios from "axios";

/**
 * Parent Dashboard card: "Kiddo AI Insight".
 * Click "Generate report" → POST /ai/parent-report → render reply.
 */
const ParentAIInsight = ({ childName = "your child", aiEnabled = true }) => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post("/ai/parent-report", {});
            setReport(res.data?.report);
        } catch (e) {
            setError("Couldn't generate right now. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-[1.5rem] border border-purple-100 shadow-md p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🦊</span>
                <h3 className="font-black text-[#1E293B]">
                    Kiddo AI Insight
                </h3>
                {!aiEnabled ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-auto">
                        offline
                    </span>
                ) : null}
            </div>

            {report ? (
                <p className="text-sm text-[#1E293B] bg-white/80 rounded-xl p-4 whitespace-pre-line leading-relaxed border border-purple-50">
                    {report}
                </p>
            ) : (
                <p className="text-sm text-gray-500 mb-4">
                    Get a short, friendly report about {childName}'s progress — what
                    they're mastering and one tiny activity to try at home.
                </p>
            )}

            {error ? (
                <p className="text-sm text-rose-500 bg-rose-50 rounded-xl p-3 mt-3">
                    {error}
                </p>
            ) : null}

            <button
                onClick={generate}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#7C3AED] text-white text-sm font-black shadow-[0_4px_0_#5B21B6] hover:translate-y-[1px] disabled:opacity-50 transition-all"
            >
                {loading ? "Thinking..." : report ? "✨ Regenerate" : "✨ Ask Kiddo about " + childName}
            </button>
        </div>
    );
};

export default ParentAIInsight;
