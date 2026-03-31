"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowRight, Shield, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";

interface IntroScreenProps {
  onComplete: () => void;
}

type IntroCopy = {
  badge: string;
  title: string;
  description: string;
  tags: string[];
  primary: string;
  secondary: string;
  previewTitle: string;
  metrics: { label: string; value: string; tone?: string }[];
  signalsTitle: string;
  signals: string[];
};

const EN_COPY: IntroCopy = {
  badge: "ASM Project Demo",
  title: "AI-Assisted Football Ticket Security",
  description:
    "TicketShield detects suspicious seat-selection and checkout behaviour in online football ticketing. A lightweight AI model assigns a risk score to support warning and blocking decisions.",
  tags: ["Seat spam detection", "Checkout monitoring", "Admin risk review"],
  primary: "Start Demo",
  secondary: "Enter Platform",
  previewTitle: "Security Monitoring Preview",
  metrics: [
    { label: "Risk Engine", value: "Active", tone: "text-emerald-300" },
    { label: "Risk Score", value: "0.82", tone: "text-amber-300" },
    { label: "Decision", value: "Warn", tone: "text-amber-300" },
  ],
  signalsTitle: "Signals",
  signals: ["Rapid seat switching", "Repeated checkout attempts", "Session anomaly"],
};

const VI_COPY: IntroCopy = {
  badge: "ASM Project Demo",
  title: "AI-Assisted Football Ticket Security",
  description:
    "TicketShield phat hien hanh vi chon ghe va checkout dang nghi trong he thong dat ve bong da truc tuyen. Mot mo hinh AI nhe gan diem rui ro de ho tro canh bao va chan cac phien dang nghi.",
  tags: ["Seat spam detection", "Checkout monitoring", "Admin risk review"],
  primary: "Start Demo",
  secondary: "Enter Platform",
  previewTitle: "Security Monitoring Preview",
  metrics: [
    { label: "Risk Engine", value: "Active", tone: "text-emerald-300" },
    { label: "Risk Score", value: "0.82", tone: "text-amber-300" },
    { label: "Decision", value: "Warn", tone: "text-amber-300" },
  ],
  signalsTitle: "Signals",
  signals: ["Rapid seat switching", "Repeated checkout attempts", "Session anomaly"],
};

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const locale = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const copy = locale.startsWith("vi") ? VI_COPY : EN_COPY;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[linear-gradient(180deg,#020617_0%,#061018_58%,#07131d_100%)]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.3, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.72),transparent_36%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,#020617)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.9fr)] lg:items-center xl:gap-14">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {copy.badge}
            </div>

            <h1 className="mt-8 max-w-3xl text-balance text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.7rem]">
              {copy.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              {copy.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {copy.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onComplete}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(16,185,129,0.48)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {copy.primary}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onComplete}
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
              >
                {copy.secondary}
              </button>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.44, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl lg:block" />
            <div className="absolute right-2 top-2 hidden h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl lg:block" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {copy.previewTitle}
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-tight text-white">
                    TicketShield
                  </div>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/10 text-emerald-300">
                  <Shield className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(2,6,23,0.88))] p-5">
                <div className="space-y-3">
                  {copy.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="text-sm text-slate-400">{metric.label}</span>
                      <span className={`text-sm font-semibold ${metric.tone ?? "text-white"}`}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Activity className="h-4 w-4 text-emerald-300" />
                    {copy.signalsTitle}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {copy.signals.map((signal) => (
                      <span
                        key={signal}
                        className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
}
