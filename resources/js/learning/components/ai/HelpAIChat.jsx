import React, { useState } from "react";
import axios from "axios";

/**
 * "Ask Kiddo AI" panel for the Help Center / Contact page.
 * Keeps it simple: one textarea, send, render the reply.
 */
const HelpAIChat = ({ aiEnabled = true }) => {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const ask = async (e) => {
        e.preventDefault();
        const q = question.trim();
        if (q.length < 3) return;

        setLoading(true);
        setMessages((m) => [...m, { role: "user", text: q }]);
        setQuestion("");

        try {
            const res = await axios.post("/ai/help-center", { question: q });
            setMessages((m) => [...m, { role: "ai", text: res.data?.answer || "" }]);
        } catch (_) {
            setMessages((m) => [...m, { role: "ai", text: "Sorry, I couldn't reply. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="max-w-2xl mx-auto bg-white rounded-[1.5rem] border border-gray-100 shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🦊</span>
                <h2 className="font-black text-xl text-[#1E293B]">Ask Kiddo AI</h2>
                {!aiEnabled ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-auto">
                        offline
                    </span>
                ) : null}
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Parents & teachers: ask anything about the curriculum, home
                practice, or how a lesson works. Kiddo answers in 2-4 short,
                friendly sentences.
            </p>

            <div className="flex flex-col gap-3 mb-4 max-h-80 overflow-y-auto">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`max-w-[88%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                            m.role === "user"
                                ? "self-end bg-[#7C3AED] text-white"
                                : "self-start bg-purple-50 text-[#1E293B] border border-purple-100"
                        }`}
                    >
                        {m.text}
                    </div>
                ))}
                {loading ? (
                    <div className="self-start bg-purple-50 text-gray-500 px-4 py-2 rounded-2xl text-sm italic">
                        Thinking…
                    </div>
                ) : null}
            </div>

            <form onSubmit={ask} className="flex gap-2">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="e.g. How can I practice colours at home with my daughter?"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:border-purple-300 focus:outline-none resize-none"
                />
                <button
                    type="submit"
                    disabled={loading || question.trim().length < 3}
                    className="shrink-0 px-5 py-2 rounded-xl bg-[#7C3AED] text-white text-sm font-black shadow-[0_4px_0_#5B21B6] hover:translate-y-[1px] disabled:opacity-40"
                >
                    Send
                </button>
            </form>
        </section>
    );
};

export default HelpAIChat;
