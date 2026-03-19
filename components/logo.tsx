import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
    animated?: boolean;
}

export function Logo({
    className = "",
    iconClassName = "w-9 h-9",
    textClassName = "text-xl theme-title",
    showText = true,
    animated = false
}: LogoProps) {
    const iconMarkup = (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
        >
            <defs>
                <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <linearGradient id="shield-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.5" />
                </linearGradient>
            </defs>

            <path
                d="M12 2 L 3 5 v 4.5 a 2.5 2.5 0 0 1 0 5 c 0 4 4.5 6 9 7.5 c 4.5 -1.5 9 -3.5 9 -7.5 a 2.5 2.5 0 0 1 0 -5 V 5 Z"
                fill="url(#shield-glow)"
                className="blur-[4px] scale-[1.05] origin-center opacity-80"
            />

            <path
                d="M12 2 L 3 5 v 4.5 a 2.5 2.5 0 0 1 0 5 c 0 4 4.5 6 9 7.5 c 4.5 -1.5 9 -3.5 9 -7.5 a 2.5 2.5 0 0 1 0 -5 V 5 Z"
                fill="url(#shield-gradient)"
                className="drop-shadow-sm"
            />

            <path
                d="M7 6.5 h10"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2 3"
                strokeLinecap="round"
                className="opacity-60"
            />

            <circle cx="12" cy="13" r="2.5" fill="#ffffff" className="opacity-95 drop-shadow-md" />
            <path
                d="M12 8.5v2M12 15.5v2M8 13h2M14 13h2"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-70"
            />
        </svg>
    );

    const iconClass = `relative flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-green/10 to-cyan-500/10 border border-brand-green/20 shadow-sm shadow-brand-green/10 p-1.5 transition-all group-hover:shadow-md group-hover:shadow-brand-green/20 group-hover:border-brand-green/30 ${iconClassName}`;

    return (
        <div className={`flex items-center gap-2.5 group ${className}`}>
            {animated ? (
                <motion.div
                    whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                    className={iconClass}
                >
                    {iconMarkup}
                </motion.div>
            ) : (
                <div className={iconClass}>
                    {iconMarkup}
                </div>
            )}
 
            {showText && (
                <span className={`font-heading font-black tracking-wider transition-colors ${textClassName}`}>
                    TICKET<span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">SHIELD</span>
                </span>
            )}
        </div>
    );
}
