"use client";

import { motion, Variants } from "framer-motion";
import { NeonButton } from "@/components/ui/neon-button";
import { StatsCard } from "@/components/stats-card";
import { Terminal, Shield, Ticket, Activity } from "lucide-react";
import Link from "next/link";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <motion.div
        className="w-full max-w-7xl mx-auto flex flex-col items-center text-center z-10"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariant} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan mb-8">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase">AI Defense Level Max</span>
        </motion.div>

        <motion.h1 variants={itemVariant} className="text-5xl md:text-7xl font-heading font-black tracking-tight mb-6 leading-tight">
          <span className="text-white block">TICKETSHIELD</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink animate-gradient-x neon-text-cyan pb-2">
            BÁN VÉ BÓNG ĐÁ AI-PROTECTED
          </span>
        </motion.h1>

        <motion.p variants={itemVariant} className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 font-sans">
          The most secure platform for purchasing premium football tickets. Backed by neural-network fraud prevention and real-time biometric analysis.
        </motion.p>

        <motion.div variants={itemVariant} className="flex flex-col sm:flex-row gap-6 mb-16">
          <Link href="/matches">
            <NeonButton className="h-14 px-10 text-lg">Mua Vé Ngay</NeonButton>
          </Link>
          <Link href="/login">
            <NeonButton variant="outline" className="h-14 px-10 text-lg">Khởi Tạo Tài Khoản</NeonButton>
          </Link>
        </motion.div>

        {/* Command Line Hype Snippet */}
        <motion.div variants={itemVariant} className="glass rounded-lg py-3 px-6 flex items-center gap-3 font-mono text-sm text-gray-300 border-neon-purple/30 shadow-[0_0_15px_rgba(176,38,255,0.2)] mb-20 cursor-text">
          <Terminal className="w-4 h-4 text-neon-purple" />
          <span className="text-neon-cyan">~</span> $ npx ticket-shield@latest <span className="animate-pulse">_</span>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
          variants={staggerContainer}
        >
          <StatsCard title="Real-time Defense" value="AI Level Max" icon={Shield} delay={0.8} />
          <StatsCard title="Verified Events" value="500+ Matches" icon={Ticket} delay={1.0} />
          <StatsCard title="Secure Transactions" value="100K+ Safe" icon={Activity} delay={1.2} />
        </motion.div>
      </motion.div>

      {/* Subtle bottom gradient sweep */}
      <div className="fixed bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none -z-10" />
    </main>
  );
}
