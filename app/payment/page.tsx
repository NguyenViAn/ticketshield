"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { NeonInput } from "@/components/ui/neon-input";
import { ShieldAlert, CreditCard, ScanLine, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentPage() {
    const [step, setStep] = useState(1);
    const [anomalyTriggered, setAnomalyTriggered] = useState(false);
    const [anomalyResolved, setAnomalyResolved] = useState(false);

    const handleNextStep = () => {
        if (step === 2 && !anomalyResolved) {
            setAnomalyTriggered(true);
        } else {
            setStep(s => Math.min(3, s + 1));
        }
    };

    const verifyHuman = () => {
        setAnomalyTriggered(false);
        setAnomalyResolved(true);
        setStep(3); // Proceed to success
    };

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">SECURE PAYMENT NODE</h1>
                <p className="text-gray-400 font-sans">Encrypted transaction gateway enabled.</p>
            </div>

            <div className="flex justify-center gap-4 mb-12">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm border-2 transition-colors ${step >= s ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 neon-shadow-cyan' : 'border-gray-600 text-gray-600'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`w-12 h-1 transition-colors ${step > s ? 'bg-neon-cyan neon-shadow-cyan' : 'bg-gray-800'}`}></div>}
                    </div>
                ))}
            </div>

            <GlassCard className="p-8">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 className="text-xl font-heading font-semibold mb-6 border-b border-white/10 pb-2">REVIEW SELECTION</h2>
                            <div className="bg-black/40 rounded border border-white/5 p-4 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl" />
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Match</span>
                                    <span className="font-heading font-bold text-white">NEO TOKYO FC vs CYBER LIONS</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-400">Seat</span>
                                    <span className="text-neon-cyan neon-text-cyan font-bold">Premium-12</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/10">
                                    <span className="text-gray-300">TOTAL COST (Crypto / FIAT)</span>
                                    <span className="text-xl font-bold font-heading text-white">$250.00</span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <NeonButton onClick={handleNextStep}>Enter Payment Info</NeonButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-neon-cyan" /> PAYMENT CREDENTIALS
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="col-span-1 md:col-span-2">
                                    <NeonInput placeholder="CARD NUMBER OR WALLET HASH" />
                                </div>
                                <div><NeonInput placeholder="EXPIRY (MM/YY)" /></div>
                                <div><NeonInput placeholder="CVC / CVC2" type="password" /></div>
                                <div className="col-span-1 md:col-span-2">
                                    <NeonInput placeholder="CARDHOLDER ALIAS" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <button className="text-gray-400 hover:text-white" onClick={() => setStep(1)}>Back</button>
                                <NeonButton onClick={handleNextStep}>Execute Transaction</NeonButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-heading font-bold text-white mb-2">TRANSACTION APPROVED</h2>
                            <p className="text-gray-400 mb-8 font-mono text-sm">Blockchain receipt generated. T-Shield verified.</p>
                            <Link href="/history">
                                <NeonButton variant="outline">View Ticket Wallet</NeonButton>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>

            {/* AI Anomaly Warning Modal */}
            <AnimatePresence>
                {anomalyTriggered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8 }}
                            className="bg-[#0a0000] border border-red-500 rounded-xl p-8 max-w-md w-full relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.2),transparent_50%)]"></div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500 animate-pulse">
                                    <ShieldAlert className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-xl text-red-500 uppercase tracking-widest text-shadow-red">BEHAVIOR ANOMALY DETECTED</h3>
                                    <p className="text-red-400/80 text-xs font-mono">Possible automated purchasing script.</p>
                                </div>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-6 text-sm text-red-200">
                                <p className="mb-2"><span className="text-gray-400">Trigger:</span> Micro-movement speed exceeds human threshold by 12%.</p>
                                <p><span className="text-gray-400">Defense:</span> Please verify neural patterns.</p>
                            </div>

                            <div className="flex justify-between items-center mt-8">
                                <button
                                    onClick={() => setAnomalyTriggered(false)}
                                    className="text-gray-500 hover:text-white flex items-center gap-2 text-sm"
                                >
                                    <XCircle className="w-4 h-4" /> Cancel
                                </button>
                                <button
                                    onClick={verifyHuman}
                                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-heading font-bold uppercase transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2"
                                >
                                    <ScanLine className="w-4 h-4" /> Verify Human
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
