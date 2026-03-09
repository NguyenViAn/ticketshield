"use client";

import { motion, Variants } from "framer-motion";
import { Copy, CheckCircle2, XCircle, Clock, ShieldCheck, Ticket } from "lucide-react";

import { useState, useEffect } from "react";
import { useTickets } from "@/hooks/use-tickets";
import { TicketWithMatch } from "@/types";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function HistoryPage() {
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const t = useTranslations("HistoryPage");
    const locale = useLocale();

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            const historyPath = `/${locale}/history`;
            router.push(`/${locale}/login?redirect=${encodeURIComponent(historyPath)}`);
        }
    }, [isLoggedIn, authLoading, router, locale]);

    const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useTickets();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const isLoading = authLoading || ticketsLoading;
    const showError = Boolean(ticketsError) && !isLoading;

    // Prevent flash of content before redirect kicks in
    if (!isLoggedIn && !authLoading) return null;

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-emerald-500 rounded-full" />
                    <h1 className="text-3xl font-heading font-black text-slate-900 uppercase tracking-wide">{t("title")}</h1>
                </div>
                <p className="text-slate-500 font-sans ml-[19px]">
                    {t("subtitle")}
                </p>
            </motion.div>

            {showError ? (
                <div className="text-center py-20 w-full border border-dashed border-red-200 rounded-2xl bg-white shadow-sm">
                    <p className="text-lg font-heading font-bold text-brand-red mb-2">{t("error_title")}</p>
                    <p className="text-sm text-slate-500 mb-6">{t("error_desc")}</p>
                    <NeonButton onClick={() => router.refresh()}>{t("error_retry")}</NeonButton>
                </div>
            ) : isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-36 w-full rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20 w-full border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-green/15 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-green/20">
                        <Ticket className="w-8 h-8 text-brand-green" />
                    </div>
                    <p className="text-slate-500 font-sans mb-2 text-lg font-bold">{t("empty_title")}</p>
                    <p className="text-sm text-slate-400 mb-6">{t("empty_desc")}</p>
                    <Link href="/matches">
                        <NeonButton>{t("empty_cta")}</NeonButton>
                    </Link>
                </div>
            ) : (
                <motion.div
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                >
                    {tickets.map((ticket) => (
                        <motion.div key={ticket.id} variants={itemVariant}>
                            <div className={`flex flex-col md:flex-row gap-4 p-5 md:p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg hover:shadow-brand-green/5 border border-slate-200/80 hover:border-brand-green/20 transition-all duration-300 ${ticket.status === 'Valid' ? 'border-l-4 border-l-brand-green' : 'border-l-4 border-l-brand-red'
                                }`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-sm text-slate-400">{t("id_prefix")}{ticket.id.split('-')[0]}</span>
                                        {ticket.status === 'Valid' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-brand-green/10 text-brand-green border border-brand-green/20">
                                                <CheckCircle2 className="w-3 h-3" /> {t("status_valid")}
                                            </span>
                                        ) : ticket.status === 'Used' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                                                <Clock className="w-3 h-3" /> {t("status_used")}
                                            </span>
                                        ) : ticket.status === 'Cancelled' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                                <XCircle className="w-3 h-3" /> {t("status_cancelled")}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-brand-red/10 text-brand-red border border-brand-red/20">
                                                <XCircle className="w-3 h-3" /> {ticket.status}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-heading font-bold text-slate-900 mb-1">
                                        {ticket.matches ? `${ticket.matches.home_team} vs ${ticket.matches.away_team}` : t("unknown_match")}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" /> {new Date(ticket.created_at).toLocaleString(locale)}
                                    </p>
                                </div>

                                <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                    <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end mb-4 md:mb-0">
                                        <span className="text-xs text-slate-400 font-mono uppercase">{t("value")}</span>
                                        <span className="text-lg font-bold text-brand-green">{ticket.price_paid.toLocaleString(locale)} VND</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-brand-blue opacity-70" />
                                            <span className="font-mono text-xs text-slate-500 truncate w-24" title={ticket.ai_validation_hash}>
                                                {ticket.ai_validation_hash.substring(0, 12)}...
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(ticket.ai_validation_hash, ticket.id)}
                                            className="p-1.5 rounded-lg hover:bg-brand-green/10 text-slate-400 hover:text-brand-green transition-colors"
                                            title="Copy AI Hash"
                                        >
                                            {copiedId === ticket.id ? <CheckCircle2 className="w-4 h-4 text-brand-green" /> : <Copy className="w-4 h-4" />}
                                        </button>

                                        <Link href={`/history/${ticket.id}` as any} className="ml-1 bg-slate-50 hover:bg-brand-green/10 text-slate-700 hover:text-brand-green border border-slate-200 hover:border-brand-green/30 rounded-lg px-4 py-1.5 text-sm font-medium transition-all flex items-center gap-2">
                                            <Ticket className="w-4 h-4" /> {t("btn_manage")}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </main>
    );
}
