"use client";

import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/neon-button";
import { ShieldAlert, Info } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function NotFound() {
    const t = useTranslations("NotFound");
    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-10 flex flex-col items-center text-center relative z-10 shadow-xl shadow-slate-200/30"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-brand-red/15 to-red-500/10 rounded-2xl border border-brand-red/20 flex items-center justify-center mb-8 shadow-sm shadow-brand-red/10">
                    <ShieldAlert className="w-10 h-10 text-brand-red" />
                </div>

                <h1 className="text-4xl md:text-5xl font-heading font-black text-slate-800 mb-4 uppercase">
                    {t("title")}
                </h1>

                <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl text-sm font-sans mb-8 w-full text-left flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
                        <Info className="w-4 h-4 text-brand-blue" />
                        <span>{t("system_feedback")}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{t("error_404")}</p>
                    <p className="text-slate-500">{t("description")}</p>
                </div>

                <Link href="/">
                    <NeonButton className="w-full shadow-lg h-12">
                        {t("btn_home")}
                    </NeonButton>
                </Link>
            </motion.div>
        </main>
    );
}
