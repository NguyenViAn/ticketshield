"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./ui/glass-card";
import { NeonButton } from "./ui/neon-button";
import { ShieldAlert, Crosshair } from "lucide-react";

export function SeatMapRadial() {
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

    // Generate 3 rings of seats (Inner, Middle, Outer)
    const rings = [
        { radius: 60, id: "VIP", count: 8, price: 500, glowColor: "#b026ff" },
        { radius: 120, id: "Premium", count: 16, price: 250, glowColor: "#00f0ff" },
        { radius: 180, id: "Standard", count: 24, price: 100, glowColor: "#ffffff" },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Radial SVG Map */}
            <GlassCard className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] flex items-center justify-center bg-black/40 border-neon-cyan/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.05),transparent_70%)] rounded-full animate-pulse pointer-events-none" />

                {/* Center Pitch */}
                <div className="absolute w-16 h-16 md:w-20 md:h-20 bg-neon-cyan/20 rounded-full border border-neon-cyan/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] z-10">
                    <Crosshair className="w-8 h-8 text-neon-cyan" />
                </div>

                <svg viewBox="-200 -200 400 400" className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] origin-center rotate-[-90deg]">
                    {rings.map((ring, ringIdx) => {
                        const seats = Array.from({ length: ring.count }).map((_, i) => {
                            const angle = (i * 360) / ring.count;
                            const rad = (angle * Math.PI) / 180;
                            const x = Math.cos(rad) * ring.radius;
                            const y = Math.sin(rad) * ring.radius;
                            const seatId = `${ring.id}-${i + 1}`;
                            const isSelected = selectedSeat === seatId;

                            return (
                                <motion.circle
                                    key={seatId}
                                    id={seatId}
                                    cx={x}
                                    cy={y}
                                    r={isSelected ? 10 : 6}
                                    fill={isSelected ? ring.glowColor : "rgba(255,255,255,0.1)"}
                                    stroke={isSelected ? ring.glowColor : "rgba(255,255,255,0.3)"}
                                    strokeWidth="2"
                                    className="cursor-pointer transition-colors hover:fill-neon-cyan hover:stroke-neon-cyan"
                                    onClick={() => setSelectedSeat(seatId)}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: ringIdx * 0.2 + i * 0.05, type: "spring" }}
                                    whileHover={{ scale: 1.5 }}
                                />
                            );
                        });

                        // Draw ring connecting lines
                        return (
                            <g key={ring.id}>
                                <motion.circle
                                    cx="0" cy="0" r={ring.radius}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                                {seats}
                            </g>
                        );
                    })}
                </svg>

                {/* Selected Seat Glow Effect Overlay */}
                <AnimatePresence>
                    {selectedSeat && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 border-2 border-neon-cyan rounded-full pointer-events-none"
                            style={{ boxShadow: 'inset 0 0 50px rgba(0,240,255,0.2)' }}
                        />
                    )}
                </AnimatePresence>
            </GlassCard>

            {/* Sidebar Summary */}
            <GlassCard className="w-full lg:w-80 flex flex-col gap-6">
                <div>
                    <h3 className="text-xl font-heading font-semibold text-white mb-2 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-neon-cyan" />
                        AI Selection
                    </h3>
                    <p className="text-sm text-gray-400">Interactive radar monitoring seat availability natively.</p>
                </div>

                <div className="flex-grow">
                    {selectedSeat ? (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-300">Seat</span>
                                <span className="font-heading font-bold text-neon-cyan">{selectedSeat}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Price</span>
                                <span className="font-bold text-white">
                                    ${rings.find(r => selectedSeat.startsWith(r.id))?.price}
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[90px] rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-sm">
                            Select a seat on the radar
                        </div>
                    )}
                </div>

                <NeonButton
                    disabled={!selectedSeat}
                    className="w-full"
                >
                    Secure Ticket
                </NeonButton>
            </GlassCard>
        </div>
    );
}
