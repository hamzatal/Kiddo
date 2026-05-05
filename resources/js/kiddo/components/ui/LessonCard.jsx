import React from "react";

const LessonCard = ({
    number,
    title,
    imagePath,
    colorClass,
    isLocked,
    onClick,
}) => {
    return (
        <div
            onClick={!isLocked ? onClick : undefined}
            className={`relative bg-white rounded-[2.5vh] p-[1.5vh] flex flex-col items-center justify-between h-full transition-all duration-300 ${isLocked ? "opacity-60 grayscale-[50%]" : "hover:-translate-y-[0.5vh] cursor-pointer hover:shadow-xl shadow-md"} border-[2px] border-transparent hover:border-${colorClass}-200`}
        >
            <div
                className={`absolute -top-[1.5vh] -left-[1vw] w-[4vh] h-[4vh] rounded-full flex items-center justify-center text-white font-black text-[2vh] shadow-md ${colorClass} border-[3px] border-white z-10`}
            >
                {number}
            </div>

            <h3 className="font-bold text-[#2D3748] text-[1.8vh] text-center w-full truncate mt-[1vh]">
                {title}
            </h3>

            <div className="flex-1 flex items-center justify-center w-full py-[1vh]">
                <img
                    src={imagePath}
                    alt={title}
                    className="max-h-[8vh] w-auto object-contain drop-shadow-md"
                    onError={(e) => {
                        e.target.style.display = "none";
                    }}
                />
            </div>

            {!isLocked && (
                <span className="absolute bottom-[1vh] right-[1vw] text-[2vh] opacity-50">
                    ⭐
                </span>
            )}
        </div>
    );
};

export default LessonCard;
