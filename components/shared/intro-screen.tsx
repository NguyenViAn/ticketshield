"use client";

import {
    motion,
    Variants,
    useMotionValue,
    useTransform,
    useSpring,
} from "framer-motion";
import {
    Shield,
    Zap,
    BarChart2,
    QrCode,
    ChevronRight,
    Play,
    ChevronDown,
    CheckCircle,
    AlertTriangle,
} from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";

interface IntroScreenProps {
    onComplete: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1.5,
    duration: Math.random() * 14 + 8,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? "bg-cyan-400" : i % 3 === 1 ? "bg-emerald-400" : "bg-teal-300",
}));

// Bot detection cycle phases (ms from cycle start)
const CYCLE_MS = 10000;
const PHASE = {
    IDLE: 0,
    SCANNING: 2000,
    ALERT: 4000,
    VERIFIED: 6500,
    RESET: 9000,
} as const;

type DetectionPhase = "idle" | "scanning" | "alert" | "verified";

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.25 } },
};

const slideUp: Variants = {
    hidden: { opacity: 0, y: 52 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
};

const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

const ticketFly: Variants = {
    hidden: { opacity: 0, scale: 0.65, rotateY: -30, rotateX: 8 },
    visible: (custom: { rotate: number; delay: number }) => ({
        opacity: 1,
        scale: 1,
        rotateY: 0,
        rotateX: 0,
        rotate: custom.rotate,
        transition: {
            type: "spring",
            stiffness: 70,
            damping: 16,
            delay: custom.delay,
        },
    }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadarRing({ delay, diameter }: { delay: number; diameter: number }) {
    return (
        <motion.div
            className="absolute rounded-full border border-emerald-400/20"
            style={{ width: diameter, height: diameter }}
            initial={{ opacity: 0.7, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay }}
        />
    );
}

function TrustChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <motion.div
            variants={fadeIn}
            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
        >
            <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                {label}
            </span>
        </motion.div>
    );
}

function FakeQR({ size = 42, phase }: { size?: number; phase: DetectionPhase }) {
    const pattern = [
        [1, 1, 1, 0, 1, 0, 1, 1, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 0, 1, 0],
        [1, 1, 0, 0, 1, 0, 1, 0, 1],
        [0, 1, 0, 0, 1, 1, 0, 0, 1],
        [1, 1, 1, 0, 1, 0, 1, 1, 1],
        [0, 0, 1, 1, 0, 1, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 0, 1, 1],
    ];
    const cell = Math.floor(size / 9);

    const glowColor =
        phase === "alert"
            ? "shadow-[0_0_16px_rgba(239,68,68,0.6)]"
            : phase === "verified"
                ? "shadow-[0_0_16px_rgba(52,211,153,0.6)]"
                : phase === "scanning"
                    ? "shadow-[0_0_12px_rgba(250,204,21,0.4)]"
                    : "";

    return (
        <div className={`relative rounded-md overflow-visible transition-shadow duration-700 ${glowColor}`} style={{ width: size, height: size }} aria-hidden="true">
            <div className="grid" style={{ gridTemplateRows: `repeat(9,${cell}px)` }}>
                {pattern.map((row, ri) => (
                    <div key={ri} className="flex">
                        {row.map((on, ci) => (
                            <div key={ci} style={{ width: cell, height: cell }} className={on ? "bg-current" : ""} />
                        ))}
                    </div>
                ))}
            </div>
            {/* Verification badge */}
            {phase === "verified" && (
                <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <CheckCircle className="w-4 h-4 text-emerald-400 fill-slate-900 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </motion.div>
            )}
            {/* Alert badge */}
            {phase === "alert" && (
                <motion.div
                    className="absolute -top-2 -right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.4, 1], rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <AlertTriangle className="w-4 h-4 text-red-400 fill-slate-900 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                </motion.div>
            )}
        </div>
    );
}

function Particle({ x, y, size, duration, delay, color }: typeof PARTICLES[number]) {
    return (
        <motion.div
            className={`absolute rounded-full ${color} blur-sm pointer-events-none`}
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, opacity: 0 }}
            animate={{
                y: [0, -35, 0, 18, 0],
                x: [0, 12, -8, 5, 0],
                opacity: [0, 0.3, 0.5, 0.2, 0],
                scale: [0.8, 1.2, 0.9, 1.1, 0.8],
            }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
        />
    );
}

// ─── Radar System ─────────────────────────────────────────────────────────────

function RadarSystem({ phase }: { phase: DetectionPhase }) {
    const sweepColor =
        phase === "alert"
            ? "rgba(239,68,68,0.5)"
            : phase === "scanning"
                ? "rgba(250,204,21,0.4)"
                : "rgba(52,211,153,0.5)";

    const coreGlowColor =
        phase === "alert"
            ? "0 0 50px rgba(239,68,68,0.5)"
            : phase === "verified"
                ? "0 0 50px rgba(52,211,153,0.6)"
                : "0 0 30px rgba(52,211,153,0.25)";

    const ringBorder =
        phase === "alert"
            ? "border-red-400/25"
            : "border-emerald-400/20";

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <RadarRing delay={0} diameter={220} />
            <RadarRing delay={1.1} diameter={340} />
            <RadarRing delay={2.2} diameter={460} />
            <RadarRing delay={3.3} diameter={580} />

            {/* Rotating dashed ring */}
            <motion.div
                className={`absolute w-48 h-48 rounded-full border border-dashed ${ringBorder} transition-colors duration-500`}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />

            {/* Sweep cone */}
            <motion.div
                className="absolute w-40 h-40"
                animate={{ rotate: 360 }}
                transition={{ duration: phase === "scanning" || phase === "alert" ? 3 : 6, repeat: Infinity, ease: "linear" }}
            >
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 origin-bottom transition-colors duration-500"
                    style={{ background: `linear-gradient(to top, ${sweepColor} 0%, transparent 100%)` }}
                />
                <div
                    className="absolute top-0 left-1/2"
                    style={{
                        width: 80, height: 80,
                        marginLeft: -40, marginTop: -80,
                        background: `conic-gradient(from -30deg, transparent 0deg, ${sweepColor.replace("0.5", "0.08").replace("0.4", "0.08")} 60deg, transparent 90deg)`,
                        transformOrigin: "50% 100%",
                    }}
                />
            </motion.div>

            {/* Center Shield Core */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.5 }}
                className="relative w-20 h-20 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 flex items-center justify-center transition-shadow duration-500"
                style={{ boxShadow: coreGlowColor }}
            >
                <motion.div
                    className="absolute top-0 left-0 right-0 h-0.5 rounded bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
                    animate={{ y: [0, 80, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
                <Shield
                    className={`w-9 h-9 transition-colors duration-500 ${phase === "alert" ? "text-red-400" : "text-emerald-400"
                        } drop-shadow-[0_0_12px_currentColor]`}
                />
            </motion.div>
        </div>
    );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

interface TicketCardProps {
    size?: "lg" | "sm";
    initialRotate?: number;
    delay?: number;
    floatY?: number[];
    floatDuration?: number;
    className?: string;
    matchLabel?: string;
    seatLabel?: string;
    idLabel?: string;
    showQr?: boolean;
    phase?: DetectionPhase;
    opacityVal?: number;
    isTarget?: boolean;
}

function TicketCard({
    size = "lg",
    initialRotate = -6,
    delay = 0.7,
    floatY = [0, -14, 0],
    floatDuration = 4.5,
    className = "",
    matchLabel = "MATCH PASS",
    seatLabel = "A · 12",
    idLabel = "TS-2024",
    showQr = true,
    phase = "idle",
    opacityVal = 1,
    isTarget = false,
}: TicketCardProps) {
    const isLg = size === "lg";
    const cardRef = useRef<HTMLDivElement>(null);
    const rotX = useMotionValue(0);
    const rotY = useMotionValue(0);
    const sRotX = useSpring(rotX, { stiffness: 180, damping: 20 });
    const sRotY = useSpring(rotY, { stiffness: 180, damping: 20 });

    const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current;
        if (!el) return;
        const { left, top, width, height } = el.getBoundingClientRect();
        rotX.set(-((e.clientY - top) / height - 0.5) * 14);
        rotY.set(((e.clientX - left) / width - 0.5) * 12);
    }, [rotX, rotY]);

    const resetMouse = useCallback(() => { rotX.set(0); rotY.set(0); }, [rotX, rotY]);

    const w = isLg ? "w-64" : "w-44";
    const px = isLg ? "px-4" : "px-3";
    const py = isLg ? "py-4" : "py-3";
    const tSz = isLg ? "text-[10px]" : "text-[8px]";
    const nSz = isLg ? "text-sm" : "text-xs";
    const qSize = isLg ? 48 : 32;

    // Border & glow colour for detection phases
    const borderClass =
        isTarget && phase === "alert"
            ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
            : isTarget && phase === "verified"
                ? "border-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                : isTarget && phase === "scanning"
                    ? "border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                    : "border-white/10";

    // Status badge text
    const statusText =
        isTarget && phase === "alert"
            ? "⚠ SUSPICIOUS ACTIVITY"
            : isTarget && phase === "verified"
                ? "AI VERIFIED • SECURE"
                : isTarget && phase === "scanning"
                    ? "SCANNING…"
                    : "AI Verified · Secure";

    const statusColor =
        phase === "alert" ? "text-red-400/90" : phase === "scanning" ? "text-yellow-400/80" : "text-emerald-400/70";

    return (
        <motion.div
            className={`${w} relative select-none ${className}`}
            style={{ opacity: opacityVal, perspective: 800 }}
            custom={{ rotate: initialRotate, delay }}
            variants={ticketFly}
            initial="hidden"
            animate={{ opacity: opacityVal, rotate: initialRotate, y: floatY }}
            transition={{
                opacity: { delay, duration: 0.7 },
                rotate: { delay, type: "spring", stiffness: 70, damping: 18 },
                y: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: delay + 1 },
            }}
        >
            {/* Outer glow */}
            <motion.div
                className={`absolute inset-0 rounded-2xl blur-xl scale-110 pointer-events-none transition-colors duration-500 ${isTarget && phase === "alert" ? "bg-red-500/15" : "bg-emerald-400/10"
                    }`}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
            />

            {/* 3D tilt wrapper */}
            <motion.div
                ref={cardRef}
                style={{ rotateX: sRotX, rotateY: sRotY }}
                onMouseMove={handleMouse}
                onMouseLeave={resetMouse}
                className="relative rounded-2xl cursor-default"
            >
                {/* Holographic shine sweep */}
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden z-20"
                    aria-hidden="true"
                >
                    <motion.div
                        className="absolute w-24 h-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -skew-x-12"
                        animate={{ x: ["-100%", "400%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 2 }}
                    />
                </motion.div>

                <div
                    className={`relative rounded-2xl ${px} ${py} backdrop-blur-md
                        bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950/90
                        ${borderClass} border shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]
                        transition-all duration-500`}
                >
                    {/* Notch cutouts */}
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-950 ring-1 ring-white/[0.06]" />
                    <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-950 ring-1 ring-white/[0.06]" />

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className={`${tSz} font-bold uppercase tracking-[0.15em] text-emerald-400 mb-0.5`}>TicketShield</p>
                            <p className={`${nSz} font-black uppercase tracking-tight text-white leading-tight`}>{matchLabel}</p>
                        </div>
                        <motion.div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-500 ${isTarget && phase === "alert"
                                ? "bg-red-500/15 border border-red-400/30"
                                : "bg-emerald-500/10 border border-emerald-400/20"
                                }`}
                            animate={{
                                boxShadow: isTarget && phase === "alert"
                                    ? ["0 0 0 rgba(239,68,68,0.2)", "0 0 14px rgba(239,68,68,0.5)", "0 0 0 rgba(239,68,68,0.2)"]
                                    : ["0 0 0 rgba(52,211,153,0.2)", "0 0 12px rgba(52,211,153,0.5)", "0 0 0 rgba(52,211,153,0.2)"],
                            }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                        >
                            <Shield className={`w-4 h-4 transition-colors duration-500 ${isTarget && phase === "alert" ? "text-red-400" : "text-emerald-400"
                                }`} />
                        </motion.div>
                    </div>

                    {/* Separator */}
                    <div className="relative my-3 border-t border-dashed border-white/15" />

                    {/* Footer */}
                    <div className="flex items-end justify-between gap-2">
                        <div className="space-y-1.5">
                            <div>
                                <p className={`${tSz} text-slate-500 uppercase tracking-widest`}>Seat</p>
                                <p className={`${isLg ? "text-xs" : "text-[9px]"} font-bold text-slate-200 tracking-wider`}>{seatLabel}</p>
                            </div>
                            <div>
                                <p className={`${tSz} text-slate-500 uppercase tracking-widest`}>ID</p>
                                <p className={`${isLg ? "text-xs" : "text-[9px]"} font-mono font-semibold text-emerald-300`}>{idLabel}</p>
                            </div>
                        </div>
                        {showQr && (
                            <div className="flex-shrink-0 text-emerald-300/60 rounded-md">
                                <FakeQR size={qSize} phase={isTarget ? phase : "idle"} />
                            </div>
                        )}
                    </div>

                    {/* Status badge */}
                    {isLg && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center gap-1.5 overflow-hidden">
                            <motion.div
                                className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${phase === "alert" ? "bg-red-400" : phase === "scanning" ? "bg-yellow-400" : "bg-emerald-400"
                                    }`}
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: phase === "alert" ? 0.4 : 1.4, repeat: Infinity }}
                            />
                            <span
                                className={`text-[8px] uppercase tracking-[0.18em] font-bold transition-colors duration-500 ${statusColor}`}
                            >
                                {statusText}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const heroRef = useRef<HTMLDivElement>(null);

    // Mouse parallax for ticket stack
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 28, damping: 18 });
    const springY = useSpring(mouseY, { stiffness: 28, damping: 18 });
    const ticketX = useTransform(springX, [-1, 1], [-18, 18]);
    const ticketY = useTransform(springY, [-1, 1], [-12, 12]);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
        mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }
    function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

    // ── Bot detection demo loop ────────────────────────────────────
    const [phase, setPhase] = useState<DetectionPhase>("idle");

    useEffect(() => {
        let mounted = true;
        const startDelay = 4000; // Let entrance animations finish first

        const runCycle = () => {
            if (!mounted) return;
            setPhase("idle");

            setTimeout(() => mounted && setPhase("scanning"), PHASE.SCANNING);
            setTimeout(() => mounted && setPhase("alert"), PHASE.ALERT);
            setTimeout(() => mounted && setPhase("verified"), PHASE.VERIFIED);
            setTimeout(() => mounted && setPhase("idle"), PHASE.RESET);
        };

        const initialTimer = setTimeout(() => {
            runCycle();
            const interval = setInterval(runCycle, CYCLE_MS);
            if (!mounted) clearInterval(interval);
            // Store cleanup
            cleanupRef.current = () => clearInterval(interval);
        }, startDelay);

        const cleanupRef = { current: () => { } };

        return () => {
            mounted = false;
            clearTimeout(initialTimer);
            cleanupRef.current();
        };
    }, []);

    return (
        <motion.div
            ref={heroRef}
            className="fixed inset-0 z-[9999] overflow-hidden bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── Stadium Background ─────────────────────────────────────── */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
                style={{ backgroundImage: "url('/images/stadium.jpg')" }}
            />
            <div className="absolute inset-0 bg-slate-950/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-slate-950/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />

            {/* ── Animated grid ───────────────────────────────────────────── */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#34d399_1px,transparent_1px),linear-gradient(to_bottom,#34d399_1px,transparent_1px)] bg-[size:56px_56px]" />

            {/* ── Pitch lines ──────────────────────────────────────────────── */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-2 border-white" />
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white" />
                <div className="absolute left-1/4 right-1/4 top-0 h-28 border-b-2 border-x-2 border-white" />
                <div className="absolute left-1/4 right-1/4 bottom-0 h-28 border-t-2 border-x-2 border-white" />
            </div>

            {/* ── Radial glows ─────────────────────────────────────────────── */}
            <motion.div
                className="absolute left-[-5%] top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.85, 0.4] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute -bottom-40 -left-32 w-[550px] h-[550px] rounded-full bg-emerald-700/[0.06] blur-[120px] pointer-events-none"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
                className="absolute -top-32 right-10 w-[380px] h-[380px] rounded-full bg-teal-600/5 blur-[100px] pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* ── Particles ────────────────────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {PARTICLES.map((p) => <Particle key={p.id} {...p} />)}
            </div>

            {/* ── Scanning line ─────────────────────────────────────────────── */}
            <motion.div
                className="absolute left-0 right-0 h-px pointer-events-none"
                style={{
                    background: "linear-gradient(to right, transparent, rgba(52,211,153,0.45) 30%, rgba(52,211,153,0.45) 70%, transparent)",
                    filter: "blur(0.5px)",
                }}
                animate={{ y: ["0vh", "100vh"] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* ── Radar System (desktop, right side) ────────────────────────── */}
            <div className="hidden lg:block absolute right-[18%] top-1/2 -translate-y-1/2 pointer-events-none opacity-70">
                <RadarSystem phase={phase} />
            </div>

            {/* ── Ticket Stack (desktop, parallax) ──────────────────────────── */}
            <motion.div
                className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ x: ticketX, y: ticketY }}
            >
                {/* Small back-top */}
                <div className="absolute -top-36 -left-4">
                    <TicketCard
                        size="sm"
                        initialRotate={14}
                        delay={1.4}
                        floatY={[0, -7, 0]}
                        floatDuration={5.5}
                        matchLabel="VIP PASS"
                        seatLabel="VIP-01"
                        idLabel="TS-0891"
                        showQr={false}
                        opacityVal={0.45}
                    />
                </div>
                {/* Small back-bottom */}
                <div className="absolute top-28 -right-2">
                    <TicketCard
                        size="sm"
                        initialRotate={-15}
                        delay={1.2}
                        floatY={[0, 9, 0]}
                        floatDuration={6}
                        matchLabel="EARLY BIRD"
                        seatLabel="SEC C9"
                        idLabel="TS-3302"
                        showQr={false}
                        opacityVal={0.5}
                    />
                </div>
                {/* Main ticket (detection target) */}
                <TicketCard
                    size="lg"
                    initialRotate={-6}
                    delay={0.9}
                    floatY={[0, -15, 0]}
                    floatDuration={4.5}
                    matchLabel="MATCH PASS"
                    seatLabel="A · 12"
                    idLabel="TS-2024"
                    showQr={true}
                    phase={phase}
                    isTarget={true}
                />
            </motion.div>

            {/* ── Mobile ticket ──────────────────────────────────────────────── */}
            <div className="lg:hidden absolute bottom-24 right-4 pointer-events-none">
                <TicketCard
                    size="sm"
                    initialRotate={-4}
                    delay={1.6}
                    floatY={[0, -7, 0]}
                    floatDuration={5}
                    matchLabel="MATCH PASS"
                    seatLabel="A · 12"
                    idLabel="TS-2024"
                    showQr={true}
                    phase={phase}
                    isTarget={true}
                    opacityVal={0.6}
                />
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="relative z-10 h-full flex items-center">
                <motion.div
                    className="w-full max-w-2xl px-6 sm:px-10 lg:px-20 xl:px-28"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={slideUp} className="inline-flex items-center gap-2 mb-6">
                        <span className="block w-6 h-px bg-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em]">
                            AI-Powered Ticketing Platform
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={slideUp}
                        className="text-[clamp(2.8rem,8vw,6rem)] font-black uppercase leading-[0.9] tracking-tight text-white italic mb-6"
                    >
                        TICKET
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                            SHIELD
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p variants={slideUp} className="text-lg sm:text-xl font-semibold text-slate-200 mb-3 max-w-md leading-snug">
                        Bảo vệ vé bóng đá với AI chống bot thế hệ mới.
                    </motion.p>

                    {/* Description */}
                    <motion.p variants={slideUp} className="text-sm sm:text-base text-slate-400 mb-10 max-w-sm leading-relaxed">
                        Phát hiện bot, ngăn chặn gian lận và đảm bảo vé đến tay người hâm mộ thật sự — nhờ phân tích hành vi thông minh theo thời gian thực.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={slideUp} className="flex flex-wrap gap-4 mb-10">
                        <button
                            onClick={onComplete}
                            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base uppercase tracking-wide text-white overflow-hidden shadow-[0_0_30px_rgba(52,211,153,0.3)] hover:shadow-[0_0_50px_rgba(52,211,153,0.55)] transition-shadow duration-300 cursor-pointer"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300 transition-all duration-300" />
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            <span className="relative flex items-center gap-2">
                                Vào nền tảng
                                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                                    <ChevronRight className="w-5 h-5" />
                                </motion.span>
                            </span>
                        </button>
                        <button className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-base uppercase tracking-wide text-slate-200 border border-slate-600 hover:border-emerald-400/50 hover:text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 cursor-pointer">
                            <Play className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                            Chưa Tày Đâu

                        </button>
                    </motion.div>

                    {/* Trust Chips */}
                    <motion.div variants={containerVariants} className="flex flex-wrap gap-3">
                        <TrustChip icon={Zap} label="Real-time Bot Detection" />
                        <TrustChip icon={BarChart2} label="Risk Scoring" />
                        <TrustChip icon={QrCode} label="Secure Ticket QR" />
                    </motion.div>

                    {/* Micro product detail */}
                    <motion.p
                        variants={fadeIn}
                        className="mt-5 text-[10px] uppercase tracking-[0.22em] text-slate-600 font-semibold"
                    >
                        Powered by behavioral anomaly detection
                    </motion.p>
                </motion.div>
            </div>

            {/* ── Scroll Hint ───────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-600 pointer-events-none"
            >
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">
                    Scroll to explore matches
                </span>
                <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </motion.div>

            {/* ── Bottom brand ───────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-6 right-6 flex items-center gap-1.5 text-slate-700 text-[10px] uppercase tracking-widest pointer-events-none"
            >
                <Shield className="w-3 h-3" />
                <span>TicketShield · AI</span>
            </motion.div>
        </motion.div>
    );
}
