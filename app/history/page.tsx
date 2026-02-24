"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { QrCode, ShieldCheck, ShieldAlert } from "lucide-react";

const MOCK_TICKETS = [
    { id: "TXN-994A2", event: "NEO TOKYO FC vs CYBER LIONS", seat: "Premium-12", date: "Oct 24, 2042", status: "VERIFIED" },
    { id: "TXN-882B1", event: "PARIS ROYALS vs MADRID KINGS", seat: "VIP-3", date: "Nov 05, 2042", status: "VERIFIED" },
    { id: "TXN-001X9", event: "LONDON MECHS vs BERLIN HAWKS", seat: "Standard-18", date: "Oct 27, 2042", status: "BLOCKED" },
];

export default function HistoryPage() {
    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">TICKET WALLET REGISTRY</h1>
                <p className="text-gray-400 font-sans">Blockchain authenticated ticket history.</p>
            </div>

            <div className="flex flex-col gap-6">
                {MOCK_TICKETS.map((ticket, i) => (
                    <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <GlassCard className="flex flex-col md:flex-row items-center justify-between p-6 gap-6 hover:border-neon-cyan/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-64 bg-gradient-to-l from-white/5 to-transparent skew-x-12 translate-x-10 -translate-y-10 group-hover:-translate-x-full transition-transform duration-1000"></div>

                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className={`p-4 rounded-lg bg-black/50 border ${ticket.status === 'VERIFIED' ? 'border-neon-cyan/30 text-neon-cyan' : 'border-red-500/30 text-red-500'}`}>
                                    <QrCode className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-heading font-bold text-white mb-1">{ticket.event}</h3>
                                    <div className="text-sm font-mono text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>SEAT: {ticket.seat}</span>
                                        <span>DATE: {ticket.date}</span>
                                        <span>ID: {ticket.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-shrink-0 w-full md:w-auto flex justify-end">
                                {ticket.status === 'VERIFIED' ? (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan font-semibold text-sm tracking-wider uppercase">
                                        <ShieldCheck className="w-4 h-4" />
                                        Security Cleared
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded border border-red-500/50 bg-red-500/10 text-red-500 font-semibold text-sm tracking-wider uppercase shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                        <ShieldAlert className="w-4 h-4" />
                                        Fraud Detected
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </main>
    );
}
