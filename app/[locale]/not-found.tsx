"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#111b31_0%,#101a2d_100%)] px-4 py-12 text-slate-200  ">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/10 bg-slate-900/80 shadow-[0_32px_84px_-48px_rgba(0,0,0,0.5)]   "
      >
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[30px] border border-rose-500/20 bg-rose-500/10 text-rose-400 lg:mx-0   ">
            <ShieldAlert className="h-16 w-16" />
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
              TicketShield routing
            </div>
            <h1 className="mt-4 text-5xl font-heading font-black uppercase tracking-[-0.05em] text-white sm:text-6xl ">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 ">{t("description")}</p>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-5 py-5  ">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {t("system_feedback")}
              </div>
              <p className="mt-3 text-lg font-semibold text-white ">{t("error_404")}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300 ">
                {t("description")}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/">
                <NeonButton className="h-12 rounded-[18px] px-6 text-xs uppercase tracking-[0.18em]">
                  {t("btn_home")}
                </NeonButton>
              </Link>
              <button
                type="button"
                onClick={() => history.back()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white     "
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
