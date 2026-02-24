"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonInput } from "@/components/ui/neon-input";
import { NeonButton } from "@/components/ui/neon-button";
import { ShieldCheck, User, Lock, Chrome } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-full max-w-md relative"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl blur opacity-20 animate-pulse"></div>

                <GlassCard className="relative p-8 flex flex-col gap-6">
                    <div className="text-center mb-4">
                        <h1 className="text-3xl font-heading font-bold text-white mb-2">ACCESS SECTOR</h1>
                        <p className="text-sm text-gray-400">Initialize secure connection to TICKETSHIELD</p>
                    </div>

                    <div className="flex bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3 items-center gap-3 text-sm text-neon-cyan mb-2">
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                        <span>Biometric & IP analysis active</span>
                    </div>

                    <form className="flex flex-col gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <NeonInput type="email" placeholder="OPERATIVE ID (EMAIL)" className="pl-10 uppercase text-xs tracking-wider" />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <NeonInput type="password" placeholder="ACCESS CODE" className="pl-10 uppercase text-xs tracking-wider" />
                        </div>

                        <Link href="/matches" className="w-full mt-2">
                            <NeonButton type="button" className="w-full h-12">INITIALIZE LOGIN</NeonButton>
                        </Link>
                    </form>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-gray-400 z-10 bg-black/50 backdrop-blur-sm rounded">Or External Protocol</span>
                        </div>
                    </div>

                    <Link href="/matches" className="w-full">
                        <NeonButton variant="outline" type="button" className="w-full h-12 flex items-center justify-center gap-2">
                            <Chrome className="w-4 h-4" />
                            Google Connect
                        </NeonButton>
                    </Link>
                </GlassCard>
            </motion.div>
        </main>
    );
}
