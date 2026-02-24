import { motion } from "framer-motion";
import { GlassCard } from "./ui/glass-card";
import { NeonButton } from "./ui/neon-button";
import { ShieldAlert, Calendar } from "lucide-react";
import Link from "next/link";

interface MatchCardProps {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    stadium: string;
    securityLevel: "Max" | "High";
}

export function MatchCard({ id, homeTeam, awayTeam, date, time, stadium, securityLevel }: MatchCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <GlassCard className="flex flex-col relative overflow-hidden group border-white/5 hover:border-neon-cyan/50">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{date} • {time}</span>
                        <span className="text-sm text-gray-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {stadium}</span>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded border flex items-center gap-1.5 ${securityLevel === 'Max' ? 'border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10' : 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                        }`}>
                        <ShieldAlert className="w-3 h-3" />
                        AI {securityLevel}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4 my-2">
                    <h2 className="text-2xl font-heading font-bold text-white text-center">
                        {homeTeam}
                        <span className="block text-sm text-gray-500 my-2 font-sans font-normal">VS</span>
                        {awayTeam}
                    </h2>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                    <Link href={`/seats/${id}`} className="w-full">
                        <NeonButton className="w-full">Buy Tickets</NeonButton>
                    </Link>
                </div>
            </GlassCard>
        </motion.div>
    );
}
