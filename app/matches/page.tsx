"use client";

import { motion } from "framer-motion";
import { MatchCard } from "@/components/match-card";

const MOCK_MATCHES = [
    { id: "M-001", homeTeam: "NEO TOKYO FC", awayTeam: "CYBER LIONS", date: "Oct 24, 2042", time: "21:00", stadium: "Nexus Arena", securityLevel: "Max" as const },
    { id: "M-002", homeTeam: "LONDON MECHS", awayTeam: "BERLIN HAWKS", date: "Oct 27, 2042", time: "18:00", stadium: "Quantum Dome", securityLevel: "Max" as const },
    { id: "M-003", homeTeam: "SAO PAULO V", awayTeam: "NEW YORK SYNTHS", date: "Nov 02, 2042", time: "20:30", stadium: "Orbit Stadium", securityLevel: "High" as const },
    { id: "M-004", homeTeam: "PARIS ROYALS", awayTeam: "MADRID KINGS", date: "Nov 05, 2042", time: "19:00", stadium: "Eiffel Field", securityLevel: "Max" as const },
    { id: "M-005", homeTeam: "STEEL DRAGONS", awayTeam: "TITAN STRIKERS", date: "Nov 12, 2042", time: "22:00", stadium: "Neon Sector", securityLevel: "High" as const },
    { id: "M-006", homeTeam: "VIPER SQUAD", awayTeam: "NOVA GIANTS", date: "Nov 15, 2042", time: "21:00", stadium: "Astro Park", securityLevel: "Max" as const },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function MatchesPage() {
    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                    AVAILABLE <span className="text-neon-cyan neon-text-cyan">FIXTURES</span>
                </h1>
                <p className="text-gray-400 font-sans max-w-xl">
                    Secure your access to upcoming highest-tier matches. All seats are protected by real-time neural anomaly detection.
                </p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {MOCK_MATCHES.map((match) => (
                    <motion.div key={match.id} variants={itemVariants}>
                        <MatchCard {...match} />
                    </motion.div>
                ))}
            </motion.div>
        </main>
    );
}
