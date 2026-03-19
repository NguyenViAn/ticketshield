"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";

export function AIBadge() {
    const { isLoggedIn } = useAuth();
    const t = useTranslations("AIBadge");

    if (!isLoggedIn) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="fixed bottom-5 right-5 z-50 hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,31,0.92),rgba(7,13,24,0.96))] p-3 shadow-[0_24px_54px_-34px_rgba(2,6,23,0.72)] backdrop-blur-xl sm:block"
        >
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">TicketShield</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
                        <Activity className="h-3.5 w-3.5 text-emerald-300" />
                        {t("label")}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{t("subtitle")}</div>
                </div>
            </div>
        </motion.div>
    );
}
