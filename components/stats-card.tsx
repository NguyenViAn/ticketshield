import { motion } from "framer-motion";
import { GlassCard } from "./ui/glass-card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    delay?: number;
}

export function StatsCard({ title, value, icon: Icon, delay = 0 }: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
        >
            <GlassCard className="flex items-center gap-4 group hover:bg-black/50 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-3 bg-neon-cyan/10 rounded-lg group-hover:bg-neon-cyan/20 transition-colors">
                    <Icon className="w-8 h-8 text-neon-cyan group-hover:animate-pulse" />
                </div>
                <div>
                    <h3 className="text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        {value}
                    </h3>
                    <p className="text-gray-400 text-sm tracking-widest uppercase mt-1">{title}</p>
                </div>
            </GlassCard>
        </motion.div>
    );
}
