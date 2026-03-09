import { motion } from "framer-motion";
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
            <div className="group relative flex items-center gap-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-brand-green/5 hover:border-brand-green/30 transition-all duration-300 p-6 cursor-default overflow-hidden hover:-translate-y-1">
                {/* Background hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-green/[0.03] via-transparent to-emerald-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon container */}
                <div className="relative p-3.5 bg-gradient-to-br from-brand-green/10 to-emerald-500/5 rounded-2xl group-hover:from-brand-green/15 group-hover:to-emerald-500/10 transition-all duration-300 ring-1 ring-brand-green/10 group-hover:ring-brand-green/20">
                    <Icon className="w-7 h-7 text-brand-green group-hover:scale-110 transition-transform duration-300" />
                </div>

                {/* Content */}
                <div className="relative">
                    <h3 className="text-3xl font-heading font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 group-hover:from-brand-green group-hover:to-emerald-600 transition-all duration-300">
                        {value}
                    </h3>
                    <p className="text-slate-500 text-sm tracking-widest font-semibold uppercase mt-1">{title}</p>
                </div>
            </div>
        </motion.div>
    );
}
