"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, ShieldCheck, Ticket, Waves } from "lucide-react";
import { useTranslations } from "next-intl";

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("IntroScreen");

  const badges = [t("badge_1"), t("badge_2"), t("badge_3")];
  const metrics = [
    { label: t("metric_1_label"), value: t("metric_1_value") },
    { label: t("metric_2_label"), value: t("metric_2_value") },
    { label: t("metric_3_label"), value: t("metric_3_value") },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#040907_58%,#06100d_100%)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.35, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_26%),radial-gradient(circle_at_78%_22%,rgba(34,211,238,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.12),transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,#020617)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("eyebrow")}
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.8rem]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t("subtitle")}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">{t("description")}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onComplete}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(16,185,129,0.48)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {t("primary")}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onComplete}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
              >
                {t("secondary")}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -left-8 top-12 hidden h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl lg:block" />
            <div className="absolute right-4 top-0 hidden h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl lg:block" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/60 p-5 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.5)] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{t("panel_title")}</div>
                    <div className="mt-1 text-sm text-slate-400">{t("panel_desc")}</div>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  {t("panel_status")}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{metric.label}</div>
                    <div className="mt-3 text-2xl font-black tracking-tight text-white">{metric.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(2,6,23,0.6))] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{t("flow_title")}</div>
                    <div className="mt-1 text-sm text-slate-400">{t("flow_desc")}</div>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-300">
                    <Waves className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{t("session_label")}</div>
                      <div className="mt-1 text-sm font-semibold text-white">TS-AI-2048B7</div>
                    </div>
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      {t("session_status")}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Ticket className="h-4 w-4 text-emerald-300" />
                        <span className="text-sm">{t("qr_title")}</span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-400">{t("qr_desc")}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white">{t("bot_snapshot_title")}</div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-[28%] rounded-full bg-[linear-gradient(90deg,#34d399,#22d3ee)]" />
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">28 / 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
