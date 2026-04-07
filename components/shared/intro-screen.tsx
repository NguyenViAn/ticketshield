"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bolt,
  Shield,
  ShieldCheck,
  Ticket,
} from "lucide-react";

interface IntroScreenProps {
  onComplete: () => void;
}

type IntroCopy = {
  brand: string;
  nav: string[];
  topAction: string;
  eyebrow: string;
  titleStart: string;
  titleAccent: string;
  titleEnd: string;
  description: string;
  primary: string;
  secondary: string;
  supportCards: { title: string; description: string; icon: "shield" | "security" }[];
  previewEyebrow: string;
  previewTitle: string;
  liveLabel: string;
  sectionLabel: string;
  sectionValue: string;
  priceValue: string;
  priceLabel: string;
  match: string;
  venue: string;
  date: string;
  featureLeft: string;
  featureRight: string;
  purchase: string;
  ticketMetaTitle: string;
  leagues: string[];
  footerLinks: string[];
  footerNote: string;
};

const INTRO_COPY: IntroCopy = {
  brand: "TicketShield",
  nav: ["Explore", "Security", "Support"],
  topAction: "Enter Platform",
  eyebrow: "Secure football ticketing",
  titleStart: "Buy football tickets",
  titleAccent: "with safe and fast",
  titleEnd: "access",
  description:
    "TicketShield helps people buy tickets with more trust. The platform checks bot activity, protects checkout, and gives secure QR access after a clean session.",
  primary: "Explore Matches",
  secondary: "See Security",
  supportCards: [
    {
      title: "Trusted purchase flow",
      description: "Every order is checked before the ticket is issued to the buyer.",
      icon: "shield",
    },
    {
      title: "Quiet security layer",
      description: "Built-in protection watches risk without breaking the buying flow.",
      icon: "security",
    },
  ],
  previewEyebrow: "Secure ticket preview",
  previewTitle: "Verified Match Access",
  liveLabel: "Protected",
  sectionLabel: "Seat",
  sectionValue: "Lower East - G42",
  priceValue: "300,000",
  priceLabel: "Ticket price",
  match: "City FC vs United FC",
  venue: "Etihad Stadium",
  date: "15 Oct, 20:00",
  featureLeft: "Secure QR Ticket",
  featureRight: "Verified Checkout",
  purchase: "View Ticket Flow",
  ticketMetaTitle: "Match ticket",
  leagues: ["Premier League", "Champions League", "Bundesliga", "La Liga"],
  footerLinks: ["Privacy Policy", "Terms Of Service", "Support Center"],
  footerNote: "2026 TicketShield. All rights reserved.",
};

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const shouldReduceMotion = useReducedMotion();
  const copy = INTRO_COPY;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-[#081020] text-slate-50"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.28, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(16,185,129,0.18),transparent_0_28%),radial-gradient(circle_at_18%_20%,rgba(14,165,233,0.08),transparent_0_20%),linear-gradient(180deg,#081020_0%,#0d1828_46%,#0b1523_100%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:96px_96px]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col">
        <header className="border-b border-white/6 bg-[#060c19]/88 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 px-6 py-5 sm:px-8 lg:px-12">
            <BrandMark />

            <nav className="hidden items-center gap-10 md:flex">
              {copy.nav.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`border-b-2 pb-1 text-sm font-medium transition-colors ${
                    index === 0
                      ? "border-emerald-300 text-emerald-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={onComplete}
              className="inline-flex h-11 items-center justify-center rounded-[16px] bg-emerald-500 px-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-emerald-400"
            >
              {copy.topAction}
            </button>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto grid w-full max-w-[1360px] gap-12 px-6 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:px-12 lg:py-16 xl:gap-16">
            <motion.section
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[760px] pt-4"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.65)]" />
                {copy.eyebrow}
              </div>

              <h1 className="mt-8 max-w-[680px] text-balance font-heading text-[3.6rem] font-black leading-[0.94] tracking-[-0.07em] text-slate-100 sm:text-[4.3rem] lg:text-[5.3rem]">
                {copy.titleStart}
                <br />
                <span className="text-emerald-300">{copy.titleAccent}</span>
                <br />
                {copy.titleEnd}
              </h1>

              <p className="mt-8 max-w-[720px] text-lg leading-[1.75] text-slate-300 sm:text-[1.18rem]">
                {copy.description}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={onComplete}
                  className="inline-flex h-15 items-center justify-center gap-3 rounded-[18px] bg-emerald-500 px-9 text-base font-semibold uppercase tracking-[0.08em] text-slate-950 shadow-[0_22px_50px_-28px_rgba(16,185,129,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  {copy.primary}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-15 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.08] px-9 text-base font-semibold uppercase tracking-[0.08em] text-slate-100 transition-colors hover:bg-white/[0.12]"
                >
                  {copy.secondary}
                </button>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {copy.supportCards.map((card) => (
                  <SupportCard key={card.title} card={card} />
                ))}
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.48, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -right-10 top-12 h-44 w-44 rounded-full bg-emerald-500/12 blur-3xl" />

              <div className="relative overflow-hidden rounded-[34px] border border-white/7 bg-[linear-gradient(180deg,#1b2333_0%,#181f2d_100%)] p-6 shadow-[0_36px_90px_-48px_rgba(0,0,0,0.65)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                      {copy.previewEyebrow}
                    </div>
                    <h2 className="mt-3 text-5xl font-heading font-black tracking-[-0.06em] text-slate-100">
                      {copy.previewTitle}
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/18 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    {copy.liveLabel}
                  </span>
                </div>

                <div className="mt-8">
                  <StadiumVisual
                    sectionLabel={copy.sectionLabel}
                    sectionValue={copy.sectionValue}
                    priceLabel={copy.priceLabel}
                    priceValue={copy.priceValue}
                  />
                </div>

                <div className="mt-8 flex items-center gap-4 rounded-[24px] border border-white/7 bg-white/[0.03] px-5 py-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-200">
                    <Ticket className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {copy.ticketMetaTitle}
                    </div>
                    <div className="mt-1 truncate text-2xl font-heading font-black tracking-[-0.04em] text-slate-100">
                      {copy.match}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                      <span>{copy.venue}</span>
                      <span className="text-slate-600">-</span>
                      <span>{copy.date}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-white/7 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <FeatureTag icon={<ShieldCheck className="h-4 w-4" />} label={copy.featureLeft} />
                  <FeatureTag icon={<Bolt className="h-4 w-4" />} label={copy.featureRight} />
                </div>

                <button
                  type="button"
                  onClick={onComplete}
                  className="mt-8 inline-flex h-15 w-full items-center justify-center rounded-[18px] bg-emerald-500 px-6 text-base font-semibold uppercase tracking-[0.14em] text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  {copy.purchase}
                </button>
              </div>
            </motion.aside>
          </div>

          <section className="mx-auto mt-2 w-full max-w-[1360px] px-6 pb-12 sm:px-8 lg:px-12">
            <div className="grid gap-6 border-t border-white/6 pt-10 text-center text-[1.65rem] font-heading font-black uppercase tracking-[-0.05em] text-white/16 sm:grid-cols-2 xl:grid-cols-4">
              {copy.leagues.map((league) => (
                <div key={league}>{league}</div>
              ))}
            </div>
          </section>
        </main>

        <footer className="border-t border-white/6 bg-[#050b18]">
          <div className="mx-auto flex w-full max-w-[1360px] flex-col items-center px-6 py-14 text-center sm:px-8 lg:px-12">
            <BrandMark compact centered />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm uppercase tracking-[0.18em] text-slate-500">
              {copy.footerLinks.map((link) => (
                <span key={link}>{link}</span>
              ))}
            </div>

            <div className="mt-8 text-sm uppercase tracking-[0.18em] text-slate-600">{copy.footerNote}</div>
          </div>
        </footer>
      </div>
    </motion.div>
  );
}

function SupportCard({
  card,
}: {
  card: IntroCopy["supportCards"][number];
}) {
  return (
    <div className="rounded-[22px] border border-white/7 bg-[#161d2c]/92 px-7 py-7 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.42)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-emerald-500/10 text-emerald-300">
        {card.icon === "shield" ? <ShieldCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
      </span>
      <div className="mt-6 text-[1.55rem] font-heading font-black uppercase leading-tight tracking-[-0.04em] text-slate-100">
        {card.title}
      </div>
      <p className="mt-4 text-base leading-8 text-slate-300">{card.description}</p>
    </div>
  );
}

function BrandMark({
  centered = false,
  compact = false,
}: {
  centered?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`group inline-flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
      <span
        className={`relative flex items-center justify-center rounded-[16px] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(8,19,33,0.72))] text-emerald-200 shadow-[0_14px_32px_-18px_rgba(16,185,129,0.5)] ${
          compact ? "h-12 w-12" : "h-11 w-11"
        }`}
      >
        <span className="absolute inset-0 rounded-[16px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_52%)]" />
        <ShieldCheck className={`${compact ? "h-5.5 w-5.5" : "h-5 w-5"}`} />
      </span>

      <div className="flex flex-col items-start leading-none">
        <span
          className={`font-heading font-black tracking-[-0.06em] text-slate-50 ${
            compact ? "text-[2rem]" : "text-[2rem] sm:text-[2.15rem]"
          }`}
        >
          Ticket
          <span className="ml-0.5 bg-[linear-gradient(90deg,#34d399_0%,#67e8f9_100%)] bg-clip-text text-transparent">
            Shield
          </span>
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
          Secure Match Access
        </span>
      </div>
    </div>
  );
}

function StadiumVisual({
  priceLabel,
  priceValue,
  sectionLabel,
  sectionValue,
}: {
  priceLabel: string;
  priceValue: string;
  sectionLabel: string;
  sectionValue: string;
}) {
  return (
    <div className="relative aspect-[1.28/1] overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,#09111d_0%,#0a1622_35%,#112334_70%,#07111d_100%)]">
      <div className="absolute inset-x-[10%] top-0 h-28 rounded-full bg-cyan-100/50 blur-[72px]" />
      <div className="absolute left-0 top-0 h-44 w-44 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.25)_14%,transparent_42%)]" />
      <div className="absolute right-0 top-0 h-44 w-44 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.25)_14%,transparent_42%)]" />

      <div className="absolute left-[-14%] top-[7%] h-[56%] w-[68%] rounded-[50%] border-t border-white/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_62%)] opacity-85" />
      <div className="absolute right-[-14%] top-[7%] h-[56%] w-[68%] rounded-[50%] border-t border-white/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_62%)] opacity-85" />

      <div className="absolute inset-x-[18%] bottom-[7%] h-[30%] rounded-t-[48%] bg-[linear-gradient(180deg,#1d7258_0%,#0b332c_100%)] shadow-[0_-12px_40px_rgba(16,185,129,0.16)]">
        <div className="absolute inset-x-[49%] top-0 h-full w-px bg-white/15" />
        <div className="absolute left-[24%] top-0 h-full w-px bg-white/10" />
        <div className="absolute right-[24%] top-0 h-full w-px bg-white/10" />
        <div className="absolute inset-x-[10%] top-[38%] h-px bg-white/10" />
      </div>

      <div className="absolute inset-x-[5%] bottom-0 h-[42%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_70%)]" />

      <div className="absolute left-5 bottom-5 rounded-[18px] border border-white/10 bg-[#343b4d]/88 px-4 py-4 shadow-[0_16px_30px_-22px_rgba(0,0,0,0.58)] backdrop-blur-xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{sectionLabel}</div>
        <div className="mt-2 text-2xl font-heading font-black tracking-[-0.04em] text-slate-100">{sectionValue}</div>
      </div>

      <div className="absolute right-5 bottom-5 text-right">
        <div className="text-5xl font-heading font-black tracking-[-0.06em] text-emerald-300">{priceValue}</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">{priceLabel}</div>
        <div className="mt-1 text-xs text-slate-500">VND</div>
      </div>
    </div>
  );
}

function FeatureTag({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 text-lg text-slate-200">
      <span className="text-emerald-300">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
