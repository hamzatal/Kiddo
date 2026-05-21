import React from "react";

const GameShell = ({
    title,
    subtitle,
    progressCurrent = 0,
    progressTotal = 1,
    accent = "#7C3AED",
    hint,
    children,
    footer,
}) => {
    const pct = progressTotal > 0 ? Math.min(100, (progressCurrent / progressTotal) * 100) : 0;

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-2 sm:gap-4 sm:px-4">
            <div className="flex w-full max-w-md flex-col gap-2 rounded-2xl border border-white bg-white/95 px-4 py-2.5 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${accent}, ${accent}CC)`,
                            }}
                        />
                    </div>
                    <span
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: accent }}
                    >
                        {progressCurrent}/{progressTotal}
                    </span>
                </div>

                <div className="text-center">
                    {subtitle ? (
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {subtitle}
                        </p>
                    ) : null}
                    <h2 className="text-base font-black leading-tight text-slate-800 sm:text-lg">
                        {title}
                    </h2>
                    {hint ? (
                        <p className="mt-0.5 text-[10px] font-bold text-gray-500 sm:text-xs">
                            {hint}
                        </p>
                    ) : null}
                </div>
            </div>

            {children}

            {footer ? <div className="w-full">{footer}</div> : null}
        </div>
    );
};

export default GameShell;
