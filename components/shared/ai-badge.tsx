"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export function AIBadge() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3 rounded-full border border-green-500/50 bg-black/80 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] cursor-default"
        >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span className="absolute inset-0 rounded-full border border-green-500 animate-ping opacity-75"></span>
            </div>
            <div className="flex flex-col pr-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Security Panel</span>
                <div className="flex items-center gap-1.5 font-heading text-xs font-semibold text-green-500" style={{ textShadow: "0 0 10px rgba(34,197,94,0.8)" }}>
                    <Activity className="w-3 h-3 animate-pulse" />
                    AI Monitor Active
                </div>
            </div>
        </motion.div>
    );
}
