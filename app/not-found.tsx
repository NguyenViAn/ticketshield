"use client";

import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/neon-button";
import { ShieldAlert, Terminal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
    const [glitchText, setGlitchText] = useState("ACCESS DENIED");

    useEffect(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
        const original = "ACCESS DENIED";
        let iterations = 0;

        const interval = setInterval(() => {
            setGlitchText(
                original
                    .split("")
                    .map((letter, index) => {
                        if (index < iterations) return original[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );

            if (iterations >= original.length) {
                clearInterval(interval);
            }

            iterations += 1 / 3;
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050000]">
            {/* Glitch Overlay */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,0,0.05)_2px,rgba(255,0,0,0.05)_4px)] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg glass border-red-500/30 p-10 flex flex-col items-center text-center relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
                <motion.div
                    animate={{ x: [-2, 2, -2, 2, 0], y: [1, -1, 1, -1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
                    className="w-20 h-20 bg-red-500/10 rounded-full border-2 border-red-500 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                >
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </motion.div>

                <h1 className="text-4xl md:text-5xl font-heading font-black text-red-500 mb-4 tracking-widest text-shadow-red uppercase">
                    {glitchText}
                </h1>

                <div className="bg-red-950/50 border border-red-500/20 text-red-400 p-4 rounded text-sm font-mono mb-8 w-full text-left flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs">
                        <Terminal className="w-3 h-3" />
                        <span>AI NEURAL GATEWAY</span>
                    </div>
                    <p>ERROR 404: SECTOR NOT FOUND.</p>
                    <p>WARNING: Navigation protocol violated. Unrecognized endpoint detected. Logging IP entity.</p>
                </div>

                <Link href="/">
                    <NeonButton className="bg-gradient-to-r from-red-600 to-red-900 border-none shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] focus-visible:ring-red-500">
                        Return to Safe Zone
                    </NeonButton>
                </Link>
            </motion.div>
        </main>
    );
}
