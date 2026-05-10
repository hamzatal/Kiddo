import React from "react";

const PrimaryButton = ({
    children,
    onClick,
    variant = "purple",
    icon,
    className = "",
}) => {
    const baseStyle =
        "flex items-center justify-center gap-[0.5vw] rounded-full font-black text-white transition-all duration-200 active:translate-y-[2px] active:border-b-0";

    const variants = {
        purple: "bg-gradient-to-b from-[#A020F0] to-[#8A2BE2] border-b-[4px] border-[#6A1CB0] hover:from-[#B13AFA] hover:to-[#9D3FFA]",
        green: "bg-gradient-to-b from-[#34A853] to-[#2E8B47] border-b-[4px] border-[#1F6030] hover:from-[#3DBB5D] hover:to-[#349D50]",
        blue: "bg-[#2B50D8] border-b-[4px] border-[#1E3A8A] hover:bg-[#3B5FE0]",
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default PrimaryButton;
