import React from "react";

/**
 * Small "AI Inside" pill for the global Navbar. Clickable if `onClick`
 * is provided (e.g. opens a modal on Home), decorative otherwise.
 */
const NavAIBadge = ({ onClick, enabled = true, className = "" }) => {
    const Tag = onClick ? "button" : "span";
    return (
        <Tag
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${
                enabled
                    ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 hover:shadow-md"
                    : "bg-gray-100 text-gray-500 border-gray-200"
            } ${className}`}
            title={enabled ? "Kiddo AI is helping" : "AI running in offline mode"}
        >
            <span>✨</span>
            <span>Kiddo AI</span>
        </Tag>
    );
};

export default NavAIBadge;
