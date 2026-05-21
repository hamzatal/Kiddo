import React from "react";
import SmartImage from "@/learning/components/ui/SmartImage";

const STATE_STYLES = {
    idle: "border-white hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5",
    selected: "border-purple-500 ring-4 ring-purple-200 shadow-lg",
    correct: "border-emerald-400 bg-emerald-50 shadow-xl ring-4 ring-emerald-200 z-10",
    wrong: "border-red-400 bg-red-50/70 opacity-70",
    disabled: "border-white opacity-60",
};

const GameChoiceCard = ({
    variant = "image", // image | word | image-word
    state = "idle", // idle | selected | correct | wrong | disabled
    imagePath,
    label,
    onClick,
    disabled = false,
    showLabel = false,
    audioButton = null,
    className = "",
}) => {
    const isImage = variant === "image" || variant === "image-word";
    const isWord = variant === "word" || variant === "image-word";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || state === "disabled"}
            className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border-4 bg-white shadow-sm transition-all duration-200 ${STATE_STYLES[state] || STATE_STYLES.idle} ${className}`}
            aria-label={label || "option"}
        >
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2 sm:p-3">
                {audioButton ? <div className="shrink-0">{audioButton}</div> : null}

                {isImage ? (
                    <SmartImage
                        src={imagePath}
                        label={label}
                        className="flex min-h-0 w-full flex-1 items-center justify-center"
                        imgClassName="max-h-full max-w-full object-contain drop-shadow-md"
                    />
                ) : null}

                {isWord || showLabel ? (
                    <span className="max-w-full truncate text-[11px] font-black uppercase tracking-tight text-slate-800 sm:text-sm">
                        {label}
                    </span>
                ) : null}
            </div>

            {state === "correct" ? (
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-black text-white shadow-md">
                    ✓
                </span>
            ) : null}

            {state === "wrong" ? (
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 text-sm font-black text-white shadow-md">
                    ✕
                </span>
            ) : null}
        </button>
    );
};

export default GameChoiceCard;
