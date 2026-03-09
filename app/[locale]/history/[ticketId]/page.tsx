"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldCheck, MapPin, Copy, AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { TicketWithMatch } from "@/types";

// Simple QR Code SVG generator (data matrix style visual representation)
function QRCodeSVG({ data, size = 160 }: { data: string; size?: number }) {
    // Generate a deterministic pattern from the hash string
    const cells = 21;
    const cellSize = size / cells;
    const pattern: boolean[][] = [];

    // Create seed from data string
    let seed = 0;
    for (let i = 0; i < data.length; i++) {
        seed = ((seed << 5) - seed + data.charCodeAt(i)) | 0;
    }

    // Simple pseudo-random based on seed
    const rng = (s: number) => {
        s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
        s = Math.imul(s ^ (s >>> 13), 0x45d9f3b);
        return (s ^ (s >>> 16)) >>> 0;
    };

    for (let row = 0; row < cells; row++) {
        pattern[row] = [];
        for (let col = 0; col < cells; col++) {
            // Fixed corner patterns (finder patterns)
            const inFinderTL = row < 7 && col < 7;
            const inFinderTR = row < 7 && col >= cells - 7;
            const inFinderBL = row >= cells - 7 && col < 7;

            if (inFinderTL || inFinderTR || inFinderBL) {
                const lr = inFinderTL ? row : inFinderTR ? row : row - (cells - 7);
                const lc = inFinderTL ? col : inFinderTR ? col - (cells - 7) : col;
                // Outer border
                if (lr === 0 || lr === 6 || lc === 0 || lc === 6) {
                    pattern[row][col] = true;
                } else if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) {
                    pattern[row][col] = true;
                } else {
                    pattern[row][col] = false;
                }
            } else {
                seed = rng(seed + row * cells + col);
                pattern[row][col] = (seed % 3) !== 0;
            }
        }
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
            <rect width={size} height={size} fill="white" />
            {pattern.map((row, r) =>
                row.map((cell, c) =>
                    cell ? (
                        <rect
                            key={`${r}-${c}`}
                            x={c * cellSize}
                            y={r * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill="#0f172a"
                        />
                    ) : null
                )
            )}
        </svg>
    );
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bgColor: string; borderColor: string }> = {
    Valid: { icon: CheckCircle2, color: "text-brand-green", bgColor: "bg-brand-green/10", borderColor: "border-brand-green/20" },
    Used: { icon: Clock, color: "text-brand-blue", bgColor: "bg-brand-blue/10", borderColor: "border-brand-blue/20" },
    Cancelled: { icon: XCircle, color: "text-brand-red", bgColor: "bg-brand-red/10", borderColor: "border-brand-red/20" },
    Suspended: { icon: AlertTriangle, color: "text-orange-500", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
};

export default function TicketDetailPage() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const ticketId = params.ticketId as string;
    const supabase = useMemo(() => createClient(), []);
    const t = useTranslations("TicketDetail");
    const locale = useLocale();

    const [ticket, setTicket] = useState<TicketWithMatch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            const historyPath = `/${locale}/history`;
            router.push(`/${locale}/login?redirect=${encodeURIComponent(historyPath)}`);
        }
    }, [isLoggedIn, authLoading, router, locale]);

    useEffect(() => {
        if (!ticketId || !isLoggedIn || !user) return;

        const fetchTicket = async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*, matches(*, tournaments(name))')
                .eq('id', ticketId)
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                console.error("Failed to fetch ticket:", error);
                router.push(`/${locale}/history`);
                return;
            }

            setTicket(data as unknown as TicketWithMatch);
            setIsLoading(false);
        };

        fetchTicket();
    }, [ticketId, isLoggedIn, supabase, router, locale, user]);

    const handleCancelTicket = async () => {
        if (!ticket || !user) return;
        setIsCancelling(true);

        const { error } = await supabase
            .from('tickets')
            .update({ status: 'Cancelled' })
            .eq('id', ticket.id)
            .eq('user_id', user.id);

        if (error) {
            alert(t("cancel_error") + error.message);
        } else {
            const { data: inventoryUpdated, error: inventoryError } = await supabase.rpc('increment_available_seats', { match_uuid: ticket.match_id });

            if (inventoryError || inventoryUpdated === false) {
                await supabase
                    .from('tickets')
                    .update({ status: 'Valid' })
                    .eq('id', ticket.id)
                    .eq('user_id', user.id);

                alert(t("cancel_error") + (inventoryError?.message ?? "Unable to restore seat inventory."));
            } else {
                setTicket({ ...ticket, status: 'Cancelled' });
                setShowCancelConfirm(false);
            }
        }
        setIsCancelling(false);
    };

    const handleCopyHash = () => {
        if (!ticket) return;
        navigator.clipboard.writeText(ticket.ai_validation_hash);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
    };

    if (!isLoggedIn && !authLoading) return null;

    if (isLoading) {
        return (
            <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                    <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                    <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
            </main>
        );
    }

    if (!ticket) return null;

    const status = statusConfig[ticket.status] || statusConfig.Valid;
    const StatusIcon = status.icon;
    const matchTitle = ticket.matches
        ? `${ticket.matches.home_team} vs ${ticket.matches.away_team}`
        : t("unknown_match");

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Back Link */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/history" className="inline-flex items-center text-slate-500 hover:text-brand-green transition-colors text-sm font-bold mb-8 tracking-widest uppercase">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("back_to_history")}
                </Link>
            </motion.div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-emerald-500 rounded-full" />
                    <h1 className="text-3xl font-heading font-black text-slate-900 uppercase tracking-wide">{t("title")}</h1>
                </div>
                <p className="text-slate-500 font-sans ml-[19px]">{t("subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8"
                >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="font-mono text-sm text-slate-400">{t("ticket_id")} {ticket.id.split('-')[0]}</span>
                            <h2 className="text-2xl font-heading font-black text-slate-900 mt-1">{matchTitle}</h2>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${status.bgColor} ${status.color} border ${status.borderColor}`}>
                            <StatusIcon className="w-4 h-4" />
                            {t(`status_${ticket.status.toLowerCase()}`)}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("seat")}</label>
                            <span className="text-lg font-bold text-brand-green">{ticket.seat}</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("price_paid")}</label>
                            <span className="text-lg font-bold text-brand-blue">{ticket.price_paid.toLocaleString(locale)} VND</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("purchase_date")}</label>
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {new Date(ticket.created_at).toLocaleString(locale)}
                            </span>
                        </div>
                        {ticket.matches && (
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{t("stadium")}</label>
                                <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {ticket.matches.stadium}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* AI Hash */}
                    <div className="border-t border-slate-100 pt-6">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">{t("ai_hash")}</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-brand-blue" />
                                <span className="font-mono text-sm text-slate-600 truncate">{ticket.ai_validation_hash}</span>
                            </div>
                            <button
                                onClick={handleCopyHash}
                                className="p-3 rounded-lg hover:bg-brand-green/10 text-slate-400 hover:text-brand-green transition-colors border border-slate-200"
                                title="Copy"
                            >
                                {copiedHash ? <CheckCircle2 className="w-5 h-5 text-brand-green" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Cancel Button */}
                    {ticket.status === 'Valid' && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                            {!showCancelConfirm ? (
                                <button
                                    onClick={() => setShowCancelConfirm(true)}
                                    className="text-brand-red hover:text-red-700 text-sm font-bold uppercase tracking-wider transition-colors"
                                >
                                    {t("btn_cancel_ticket")}
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border border-red-200 rounded-xl p-5"
                                >
                                    <p className="text-sm text-slate-700 mb-4 font-medium">{t("cancel_confirm")}</p>
                                    <div className="flex gap-3">
                                        <NeonButton
                                            onClick={handleCancelTicket}
                                            disabled={isCancelling}
                                            className="!bg-brand-red !border-brand-red hover:!bg-red-700"
                                        >
                                            {isCancelling ? t("cancelling") : t("btn_confirm_cancel")}
                                        </NeonButton>
                                        <button
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4"
                                        >
                                            {t("btn_keep")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* QR Code Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col items-center text-center"
                >
                    <h3 className="text-lg font-heading font-bold text-slate-800 uppercase tracking-wide mb-6">{t("qr_title")}</h3>

                    {ticket.status === 'Valid' ? (
                        <>
                            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm mb-4">
                                <QRCodeSVG data={ticket.ai_validation_hash} size={160} />
                            </div>
                            <p className="text-xs text-slate-400 mb-6">{t("qr_hint")}</p>
                        </>
                    ) : (
                        <div className="w-40 h-40 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
                            <XCircle className="w-12 h-12 text-slate-300" />
                        </div>
                    )}

                    <div className="w-full mt-auto pt-6 border-t border-slate-100">
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{t("match_date")}</div>
                        <div className="text-sm font-medium text-slate-700">
                            {ticket.matches ? new Date(ticket.matches.date).toLocaleString(locale, {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
