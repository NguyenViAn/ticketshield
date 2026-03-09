"use client";

import * as React from "react";
import Image from "next/image";
import { motion, type Variants, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Lock,
  MapPin,
  Percent,
  QrCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SearchBar } from "@/components/matches/search-bar";
import { MatchCard } from "@/components/matches/match-card";
import { PromoCard } from "@/components/shared/promo-card";
import { useFeaturedMatches } from "@/hooks/use-matches";
import { usePromotions } from "@/hooks/use-promotions";
import { useAuth } from "@/components/providers/auth-provider";
import { IntroScreen } from "@/components/shared/intro-screen";
import { createClient } from "@/utils/supabase/client";
import type { Match } from "@/types";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

const HERO_STADIUM_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1800&q=80";

const DEFAULT_TEAM_BADGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/8e/Football_pictogram.svg";

type DisplayMatch = {
  id: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  date: string;
  stadium: string;
  stadium_image: string;
  security_level: string;
  league: string;
  league_logo: string;
  badge: string;
};

type InfoCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type LeagueLink = {
  href: string;
  label: string;
  note: string;
  logo: string;
};

type SectionIcon = React.ComponentType<{ className?: string }>;

type StatItem = {
  label: string;
  value: number | string;
  suffix?: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function Home() {
  const locale = useLocale();
  const { data: featuredMatches, isLoading: matchesLoading } = useFeaturedMatches();
  const { data: promotions, isLoading: promosLoading } = usePromotions();
  const { isLoggedIn } = useAuth();
  const tPromos = useTranslations("Promotions");
  const [showIntro, setShowIntro] = React.useState(false);
  const [matchCount, setMatchCount] = React.useState(0);
  const [ticketCount, setTicketCount] = React.useState(0);
  const supabase = createClient();

  const copy = getHomeCopy(locale);
  const displayMatches = getDisplayMatches(featuredMatches, locale);
  const hasFeaturedMatches = (featuredMatches?.length ?? 0) > 0;

  React.useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("has_seen_intro");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const [matchRes, ticketRes] = await Promise.all([
          supabase.from("matches").select("id", { count: "exact", head: true }),
          supabase.from("tickets").select("id", { count: "exact", head: true }),
        ]);

        if (!isMounted) {
          return;
        }

        setMatchCount(matchRes.count || 0);
        setTicketCount(ticketRes.count || 0);
      } catch (error) {
        console.warn("Homepage stats error:", error);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const trustStats: StatItem[] = [
    {
      label: copy.trustLabels[0],
      value: matchCount || 24,
      suffix: "+",
      detail: copy.trustDetails[0],
      icon: CalendarRange,
    },
    {
      label: copy.trustLabels[1],
      value: ticketCount || 1200,
      suffix: "+",
      detail: copy.trustDetails[1],
      icon: Ticket,
    },
    {
      label: copy.trustLabels[2],
      value: 99.2,
      suffix: "%",
      detail: copy.trustDetails[2],
      icon: ShieldCheck,
    },
    {
      label: copy.trustLabels[3],
      value: isLoggedIn ? copy.memberValue : copy.guestValue,
      detail: copy.trustDetails[3],
      icon: Wallet,
    },
  ];

  const trendingMatches = displayMatches.slice(0, 3);
  const featuredGridMatches = displayMatches.slice(0, 3);

  const handleCompleteIntro = () => {
    sessionStorage.setItem("has_seen_intro", "true");
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence>{showIntro ? <IntroScreen onComplete={handleCompleteIntro} /> : null}</AnimatePresence>

      <main className="relative overflow-hidden pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_62%,#edf7f2_100%)]" />

        <section className="pt-8 sm:pt-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[40px] px-6 py-8 shadow-[0_50px_130px_-60px_rgba(15,23,42,0.68)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_STADIUM_IMAGE})` }}
                animate={{ scale: [1, 1.035, 1], x: [0, -6, 0], y: [0, -4, 0] }}
                transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(2,6,23,0.64),rgba(2,6,23,0.38)_36%,rgba(8,47,73,0.42)_68%,rgba(15,118,110,0.34)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.2)_28%,rgba(2,6,23,0.5)_62%,rgba(2,6,23,0.82)_100%)]" />
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_24%)]"
                animate={{ opacity: [0.45, 0.8, 0.55], scale: [1, 1.06, 1] }}
                transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-emerald-400/18 blur-3xl"
                animate={{ x: [0, 12, -6, 0], y: [0, -10, 6, 0], scale: [1, 1.08, 0.98, 1] }}
                transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute right-[8%] top-[12%] h-28 w-28 rounded-full bg-cyan-300/14 blur-3xl"
                animate={{ x: [0, -10, 10, 0], y: [0, 10, -6, 0], opacity: [0.45, 0.82, 0.45] }}
                transition={{ duration: 11, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.5))]"
                animate={{ opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-end">
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                  }}
                  className="max-w-3xl"
                >
                  <motion.div variants={sectionVariants} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.heroEyebrow}
                  </motion.div>
                  <motion.h1
                    variants={sectionVariants}
                    className="mt-5 max-w-3xl text-balance text-4xl font-heading font-black leading-[0.96] tracking-[-0.02em] text-white drop-shadow-[0_10px_36px_rgba(2,6,23,0.62)] sm:text-6xl lg:text-7xl"
                  >
                    {copy.heroTitle}
                  </motion.h1>
                  <motion.p variants={sectionVariants} className="mt-4 max-w-2xl text-sm leading-7 text-white/90 drop-shadow-[0_6px_18px_rgba(2,6,23,0.4)] sm:text-base">
                    {copy.heroDescription}
                  </motion.p>

                  <motion.div variants={sectionVariants} className="mt-6 flex flex-wrap gap-3">
                    {copy.heroHighlights.map((highlight) => (
                      <motion.span
                        key={highlight}
                        whileHover={{ y: -2, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-2 text-sm text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {highlight}
                      </motion.span>
                    ))}
                  </motion.div>

                  <motion.div variants={sectionVariants} className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/matches"
                      className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-6 text-sm font-semibold text-white shadow-[0_20px_50px_-24px_rgba(16,185,129,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      {copy.primaryCta}
                    </Link>
                    {!isLoggedIn ? (
                      <Link
                        href="/login"
                        className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/12 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/18"
                      >
                        {copy.secondaryCta}
                      </Link>
                    ) : (
                      <Link
                        href="/history"
                        className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/12 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/18"
                      >
                        {copy.loggedInCta}
                      </Link>
                    )}
                  </motion.div>
                </motion.div>

                <motion.aside
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                  className="rounded-[32px] border border-white/20 bg-white/80 p-5 shadow-[0_36px_90px_-46px_rgba(15,23,42,0.65)] backdrop-blur-2xl sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold tracking-wide text-slate-950">{copy.heroPanelTitle}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{copy.heroPanelDescription}</div>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <Shield className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5">
                    <SearchBar />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {copy.heroQuickLinks.map((link) => (
                      <motion.div key={link.label} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.2 }}>
                        <Link
                          href={link.href}
                          className="block rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.4)] transition-all duration-300 hover:border-emerald-200 hover:bg-white/85 hover:shadow-[0_24px_60px_-40px_rgba(16,185,129,0.2)]"
                        >
                          <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                          <div className="mt-1 text-sm text-slate-600">{link.note}</div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-6 sm:-mt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {trustStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  whileHover={{ y: -4, scale: 1.015 }}
                  className="rounded-[28px] border border-white/75 bg-white/94 p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-300 hover:border-emerald-200 hover:shadow-[0_28px_75px_-42px_rgba(16,185,129,0.2)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                        <CountUpValue suffix={stat.suffix} value={stat.value} />
                      </div>
                    </div>
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-md" />
                      <stat.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-500">{stat.detail}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-7xl space-y-0 px-4 sm:px-6 lg:px-8 [&>section]:py-16">
          <motion.section
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,19rem)]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <div>
              <SectionHeader
                eyebrow={copy.trendingEyebrow}
                icon={CalendarClock}
                title={copy.trendingTitle}
                description={copy.trendingDescription}
                actionHref="/matches"
                actionLabel={copy.viewAll}
              />
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {matchesLoading ? (
                  [...Array(3)].map((_, index) => <MatchCardSkeleton key={`trending-skeleton-${index}`} compact />)
                ) : trendingMatches.length > 0 ? (
                  trendingMatches.map((match) => (
                    <motion.div key={match.id} variants={sectionVariants} whileHover={{ y: -2 }}>
                      <TrendingMatchCard locale={locale} match={match} />
                    </motion.div>
                  ))
                ) : (
                  <div className="lg:col-span-3">
                    <EmptyMatchesState
                      actionHref="/matches"
                      actionLabel={copy.viewAll}
                      description={copy.emptyMatchesDescription}
                      title={copy.emptyMatchesTitle}
                    />
                  </div>
                )}
              </div>
            </div>

            <motion.aside variants={sectionVariants} className="rounded-[32px] border border-emerald-200/20 bg-[linear-gradient(160deg,#06202c_0%,#0f172a_35%,#0f766e_100%)] p-6 text-white shadow-[0_32px_80px_-46px_rgba(15,23,42,0.6)]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                <Clock3 className="h-3.5 w-3.5" />
                {copy.trendingSidebarEyebrow}
              </div>
              <div className="mt-5 text-2xl font-semibold leading-tight">{copy.trendingSidebarTitle}</div>
              <div className="mt-3 text-sm leading-6 text-slate-200">{copy.trendingSidebarDescription}</div>
              <div className="mt-6 space-y-3">
                {copy.trendingSidebarPoints.map((point) => (
                  <div key={point} className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    {point}
                  </div>
                ))}
              </div>
            </motion.aside>
          </motion.section>

          <motion.section
            className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <motion.div variants={sectionVariants} className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <SectionHeader eyebrow={copy.howEyebrow} icon={QrCode} title={copy.howTitle} description={copy.howDescription} />
              <div className="mt-6 space-y-4">
                {copy.howSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    variants={sectionVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-[0_20px_50px_-36px_rgba(16,185,129,0.18)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                        <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-md" />
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {copy.stepLabel} {index + 1}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{step.title}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-500">{step.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className="rounded-[32px] border border-emerald-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.88))] p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <SectionHeader eyebrow={copy.securityEyebrow} icon={ShieldCheck} title={copy.securityTitle} description={copy.securityDescription} />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {copy.securityCards.map((card) => (
                  <motion.div
                    key={card.title}
                    variants={sectionVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="rounded-[24px] border border-emerald-100/70 bg-white p-5 transition-all duration-300 hover:border-emerald-200 hover:shadow-[0_20px_50px_-36px_rgba(16,185,129,0.18)]"
                  >
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-md" />
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-slate-900">{card.title}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-500">{card.description}</div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-[26px] border border-slate-200/80 bg-slate-900 p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{copy.securityFootnoteEyebrow}</div>
                <div className="mt-2 text-xl font-semibold">{copy.securityFootnoteTitle}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{copy.securityFootnoteDescription}</div>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <motion.div variants={sectionVariants} className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <SectionHeader eyebrow={copy.cityEyebrow} icon={MapPin} title={copy.cityTitle} description={copy.cityDescription} />
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {copy.popularCities.map((city) => (
                  <motion.div key={city.label} variants={sectionVariants} whileHover={{ y: -3, scale: 1.01 }}>
                    <Link
                      href={city.href}
                      className="group block rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-[0_20px_50px_-36px_rgba(16,185,129,0.18)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-slate-900">{city.label}</div>
                          <div className="mt-2 text-sm leading-6 text-slate-500">{city.note}</div>
                        </div>
                        <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                          <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-md" />
                          <MapPin className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                        {copy.cityCta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]">
              <SectionHeader eyebrow={copy.leagueEyebrow} icon={BadgeCheck} title={copy.leagueTitle} description={copy.leagueDescription} />
              <div className="mt-6 space-y-3">
                {copy.featuredLeagues.map((league) => (
                  <motion.div key={league.label} variants={sectionVariants} whileHover={{ y: -3, scale: 1.01 }}>
                    <Link
                      href={league.href}
                      className="group flex items-center gap-4 rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-[0_20px_50px_-36px_rgba(16,185,129,0.18)]"
                    >
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)]">
                        <span className="absolute inset-0 rounded-2xl bg-emerald-400/12 blur-md" />
                        <Image src={league.logo} alt={league.label} width={34} height={34} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{league.label}</div>
                        <div className="mt-1 text-sm text-slate-500">{league.note}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-700" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader
              eyebrow={copy.featuredEyebrow}
              icon={Ticket}
              title={copy.featuredTitle}
              description={copy.featuredDescription}
              actionHref="/matches"
              actionLabel={copy.viewAll}
            />
            {matchesLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                  <MatchCardSkeleton key={`featured-skeleton-${index}`} />
                ))}
              </div>
            ) : featuredGridMatches.length > 0 || hasFeaturedMatches ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredGridMatches.map((match) => (
                  <motion.div key={match.id} variants={sectionVariants}>
                    <MatchCard
                      id={match.id}
                      away_logo={match.away_logo}
                      away_team={match.away_team}
                      date={match.date}
                      home_logo={match.home_logo}
                      home_team={match.home_team}
                      security_level={match.security_level}
                      stadium={match.stadium}
                      stadium_image={match.stadium_image}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyMatchesState
                  actionHref="/matches"
                  actionLabel={copy.primaryCta}
                  description={copy.emptyMatchesDescription}
                  title={copy.emptyMatchesTitle}
                />
              </div>
            )}
          </motion.section>

          <motion.section
            id="promotions"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader eyebrow={copy.promoEyebrow} icon={Percent} title={copy.promoTitle} description={tPromos("description")} />
            {promosLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-56 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#ecfdf5)] animate-pulse" />
                ))}
              </div>
            ) : promotions.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {promotions.map((promo, index) => (
                  <motion.div key={promo.id} variants={sectionVariants}>
                    <PromoCard
                      delay={index * 0.05}
                      description={promo.description}
                      discount={promo.discount}
                      gradientCode={promo.gradientCode}
                      title={promo.title}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f0fdf4)] px-6 py-10 text-center text-sm text-slate-500">
                {copy.promoEmpty}
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </>
  );
}

function SectionHeader({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  icon: Icon = Sparkles,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow: string;
  icon?: SectionIcon;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,1),rgba(240,249,255,1))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-[0_8px_24px_-18px_rgba(16,185,129,0.35)]">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-4 text-3xl font-heading font-black tracking-[0.01em] text-slate-900 sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function MatchCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] ${
        compact ? "min-h-[18rem]" : "min-h-[24rem]"
      }`}
    >
      <div className={`animate-pulse ${compact ? "h-full" : "h-full"}`}>
        <div className="h-28 bg-[linear-gradient(90deg,#dcfce7,#f8fafc,#dbeafe)]" />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-28 rounded-full bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-center gap-4 pt-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-200" />
            <div className="h-8 w-10 rounded-full bg-slate-200" />
            <div className="h-16 w-16 rounded-2xl bg-slate-200" />
          </div>
          <div className="space-y-3 pt-3">
            <div className="h-5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-4 w-2/3 rounded-full bg-slate-200" />
            <div className="h-4 w-1/2 rounded-full bg-slate-200" />
          </div>
          <div className="h-11 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function EmptyMatchesState({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/95 px-6 py-12 text-center shadow-[0_24px_60px_-44px_rgba(15,23,42,0.25)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Ticket className="h-6 w-6" />
      </div>
      <div className="mt-4 text-xl font-semibold text-slate-900">{title}</div>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{description}</div>
      <Link
        href={actionHref}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 px-5 text-sm font-semibold text-white shadow-[0_20px_50px_-28px_rgba(16,185,129,0.45)] transition-transform duration-200 hover:-translate-y-0.5"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function CountUpValue({ suffix = "", value }: { suffix?: string; value: number | string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [displayValue, setDisplayValue] = React.useState(typeof value === "number" ? 0 : value);

  React.useEffect(() => {
    if (!isInView) {
      return;
    }

    if (typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const duration = 900;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = value % 1 !== 0 ? (value * eased).toFixed(1) : Math.round(value * eased);
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

function TrendingMatchCard({ locale, match }: { locale: string; match: DisplayMatch }) {
  const actionLabel = locale === "vi" ? "Xem vé" : "Explore tickets";
  return (
    <Link
      href={`/matches?q=${encodeURIComponent(match.home_team)}`}
      className="group flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_28px_64px_-40px_rgba(16,185,129,0.18)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Ticket className="h-3.5 w-3.5" />
          {match.badge}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          <Image src={match.league_logo} alt={match.league} width={14} height={14} className="h-3.5 w-3.5 object-contain" />
          {match.league}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamChip logo={match.home_logo} team={match.home_team} />
        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-500">
          VS
        </span>
        <TeamChip logo={match.away_logo} team={match.away_team} />
      </div>
      <div className="mt-5 space-y-2">
        <div className="text-lg font-semibold text-slate-900">
          {match.home_team} vs {match.away_team}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarClock className="h-4 w-4 text-cyan-700" />
          {formatMatchLabel(match.date, locale)}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4 text-emerald-700" />
          <span className="truncate">{match.stadium}</span>
        </div>
      </div>
      <div className="mt-auto pt-6 text-sm font-semibold text-slate-700 transition-colors group-hover:text-emerald-700">
        {actionLabel}
      </div>
    </Link>
  );
}

function TeamChip({ logo, team }: { logo?: string; team: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#ecfdf5)] text-sm font-black text-emerald-700 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)]">
        {logo ? (
          <Image src={logo} alt={team} width={40} height={40} className="h-10 w-10 object-contain" />
        ) : (
          getInitials(team)
        )}
      </div>
      <div className="line-clamp-2 text-xs font-semibold text-slate-700">{team}</div>
    </div>
  );
}

function getDisplayMatches(featuredMatches: Match[] | null | undefined, locale: string): DisplayMatch[] {
  return (featuredMatches ?? [])
    .map((match) => ({
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      home_logo: resolveTeamLogo(match.home_team, match.home_logo || ""),
      away_logo: resolveTeamLogo(match.away_team, match.away_logo || ""),
      date: match.date,
      stadium: match.stadium,
      stadium_image: resolveStadiumImage(match.stadium, match.home_team, match.away_team),
      security_level: match.security_level || "High",
      league: match.tournaments?.name ?? (locale === "vi" ? "Giải nổi bật" : "Featured league"),
      league_logo: resolveLeagueLogo(match.tournaments?.name ?? ""),
      badge: locale === "vi" ? "Mở bán" : "On sale",
    }))
    .slice(0, 4);
}

function formatMatchLabel(date: string, locale: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return locale === "vi" ? "Lịch đang cập nhật" : "Schedule updating";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(parsedDate);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function resolveLeagueLogo(leagueName: string) {
  const normalized = leagueName.toLowerCase();

  if (normalized.includes("premier league")) {
    return "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg";
  }

  if (normalized.includes("champions league")) {
    return "https://upload.wikimedia.org/wikipedia/commons/0/08/UEFA_Champions_League_logo_2.svg";
  }

  if (normalized.includes("la liga")) {
    return "https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg";
  }

  if (normalized.includes("v-league")) {
    return "https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg";
  }

  return "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg";
}

function resolveTeamLogo(teamName: string, fallbackLogo?: string) {
  if (fallbackLogo) {
    return fallbackLogo;
  }

  const normalized = teamName.toLowerCase();
  const teamLogos: Record<string, string> = {
    "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    "bayern munich": "https://upload.wikimedia.org/wikipedia/en/7/79/FC_Bayern_Munich_logo_%282024%29.svg",
    "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    "inter milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
    "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    "atletico madrid": "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
    "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
    "tottenham hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
    "paris saint-germain": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
    "juventus": "https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg",
    "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
    "ac milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
    "napoli": "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg",
  };

  return teamLogos[normalized] ?? DEFAULT_TEAM_BADGE;
}

function resolveStadiumImage(stadium: string, homeTeam: string, awayTeam: string) {
  const normalizedStadium = stadium.toLowerCase();
  const normalizedMatch = `${homeTeam} ${awayTeam}`.toLowerCase();

  const stadiumImages: Record<string, string> = {
    "etihad stadium": "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    "anfield": "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1200&q=80",
    "santiago bernabeu": "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
    "camp nou": "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
    "old trafford": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    "estadí olimpic lluís companys": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
  };

  for (const [key, value] of Object.entries(stadiumImages)) {
    if (normalizedStadium.includes(key)) {
      return value;
    }
  }

  if (normalizedMatch.includes("manchester city") || normalizedMatch.includes("arsenal")) {
    return stadiumImages["etihad stadium"];
  }

  if (normalizedMatch.includes("liverpool") || normalizedMatch.includes("bayern")) {
    return stadiumImages["anfield"];
  }

  if (normalizedMatch.includes("real madrid") || normalizedMatch.includes("atletico")) {
    return stadiumImages["santiago bernabeu"];
  }

  return "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80";
}

function getHomeCopy(locale: string) {
  if (locale === "vi") {
    return {
      cityCta: "Xem trận tại khu vực này",
      cityDescription: "Tìm các trận đang mở bán tại những điểm đến được quan tâm nhất.",
      cityEyebrow: "Sân đấu nổi bật",
      cityTitle: "Khám phá theo sân và thành phố",
      featuredDescription: "Chọn nhanh các trận lớn với vé đã xác thực và thông tin rõ ràng.",
      featuredEyebrow: "Trận đấu nổi bật",
      featuredLeagues: [
        { href: "/matches?league=Premier%20League%2024%2F25", label: "Premier League", note: "Derby cuối tuần và đại chiến Big Six.", logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" },
        { href: "/matches?league=V-League%201", label: "V-League 1", note: "Các trận trong nước đang có nhu cầu cao.", logo: "https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg" },
        { href: "/matches?league=Champions%20League", label: "Champions League", note: "Đêm knock-out với lượng đặt vé lớn.", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/UEFA_Champions_League_logo_2.svg" },
      ] satisfies LeagueLink[],
      emptyMatchesDescription: "Danh sách trận sẽ xuất hiện ngay khi hệ thống mở bán hoặc cập nhật lịch mới.",
      emptyMatchesTitle: "Chưa có trận đấu",
      featuredTitle: "Trận đấu nổi bật đang mở bán",
      guestValue: "Khách",
      heroDescription:
        "Khám phá trận cầu lớn với vé xác thực, ghế đẹp và giao dịch được bảo vệ trong từng bước.",
      heroEyebrow: "Vé bóng đá · AI bảo vệ",
      heroHighlights: [
        "QR động chống sao chép",
        "Kiểm duyệt gian lận theo thời gian thực",
        "Luồng mua vé rõ ràng trên mobile",
      ],
      heroPanelDescription: "Tìm theo trận đấu, giải đấu hoặc thành phố chỉ trong vài thao tác.",
      heroPanelTitle: "Bắt đầu từ nhu cầu thật của bạn",
      heroQuickLinks: [
        { href: "/matches", label: "Tất cả trận đấu", note: "Duyệt toàn bộ lịch mở bán hiện tại." },
        { href: "/matches?league=V-League%201", label: "V-League 1", note: "Tập trung vào các trận hot trong nước." },
        { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: "Hà Nội", note: "Tìm nhanh theo địa điểm tổ chức." },
        { href: "/history", label: "Ví vé của tôi", note: "Theo dõi trạng thái vé và lịch sử mua." },
      ],
      heroTitle: "Mua Vé Bóng Đá An Toàn & Hấp Dẫn",
      howDescription: "Mua vé trong ba bước gọn, rõ ràng và dễ theo dõi.",
      howEyebrow: "Cách hoạt động",
      howTitle: "Cách TicketShield đưa bạn từ khám phá đến mua vé",
      howSteps: [
        { title: "Chọn trận hoặc giải đấu đang quan tâm", description: "Bắt đầu từ trận hot, giải đấu lớn hoặc thành phố bạn muốn đến.", icon: CalendarRange },
        { title: "Chọn ghế và hoàn tất thanh toán nhanh", description: "Xem thông tin rõ ràng, chọn ghế phù hợp và thanh toán trong ít bước.", icon: Ticket },
        { title: "Nhận vé QR động và theo dõi trong ví vé", description: "Nhận vé ngay sau thanh toán và kiểm tra lại bất cứ lúc nào trong ví vé.", icon: QrCode },
      ],
      leagueDescription: "Vào thẳng giải đấu yêu thích và xem ngay những trận đang mở bán.",
      leagueEyebrow: "Lối vào giải đấu",
      leagueTitle: "Đi nhanh vào giải đấu bạn muốn xem",
      loggedInCta: "Mở ví vé của tôi",
      memberValue: "Thành viên",
      popularCities: [
        { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: "Hà Nội", note: "Nhiều trận V-League, sân dễ tiếp cận và lịch mở bán dày." },
        { href: "/matches?location=H%E1%BB%93%20Ch%C3%AD%20Minh", label: "TP. Hồ Chí Minh", note: "Phù hợp cho các trận cầu lớn với nhu cầu mua vé cao." },
        { href: "/matches?location=%C4%90%C3%A0%20N%E1%BA%B5ng", label: "Đà Nẵng", note: "Lựa chọn tốt cho người muốn theo dõi trận cuối tuần." },
      ],
      primaryCta: "Khám phá trận đấu",
      promoEmpty: "Ưu đãi mới sẽ được cập nhật sớm.",
      promoEyebrow: "Ưu đãi hội viên",
      promoTitle: "Ưu đãi dành cho hội viên",
      secondaryCta: "Đăng nhập để lưu vé",
      securityCards: [
        { title: "Lá chắn AI chống gian lận", description: "Hệ thống phát hiện hành vi bất thường trước và sau khi vé được phát hành.", icon: ShieldCheck },
        { title: "Vé QR động", description: "Mã vé thay đổi theo thời gian để giảm nguy cơ chụp lén hoặc sao chép.", icon: QrCode },
        { title: "Thanh toán an toàn", description: "Thông tin thanh toán và trạng thái giao dịch được trình bày rõ ràng, nhất quán.", icon: Lock },
        { title: "Nguồn vé xác thực", description: "Nguồn vé và trạng thái mở bán được đồng bộ để giảm mơ hồ cho người mua.", icon: CheckCircle2 },
      ] satisfies InfoCard[],
      securityDescription: "Vé xác thực, QR động và thanh toán an toàn trong một trải nghiệm gọn gàng.",
      securityEyebrow: "Lớp bảo mật",
      securityFootnoteDescription: "Theo dõi trạng thái vé, kiểm tra giao dịch và vào trận với trải nghiệm rõ ràng từ đầu đến cuối.",
      securityFootnoteEyebrow: "Trải nghiệm cao cấp",
      securityFootnoteTitle: "Bảo mật và tính dễ dùng phải đi cùng nhau",
      securityTitle: "Bằng chứng bảo mật ở ngay mặt tiền sản phẩm",
      stepLabel: "Bước",
      trendingDescription: "Những trận đang được tìm kiếm và đặt vé nhiều nhất trong tuần này.",
      trendingEyebrow: "Nổi bật tuần này",
      trendingSidebarDescription: "Cập nhật nhanh các trận hot, sự kiện sắp hết vé và lối vào đặt vé trực tiếp.",
      trendingSidebarEyebrow: "Xu hướng thời gian thực",
      trendingSidebarPoints: [
        "Trận hot đang mở bán",
        "Cập nhật số lượng vé theo thời gian thực",
        "Đặt vé nhanh từ thẻ trận",
      ],
      trendingSidebarTitle: "Chọn ngay trận đang được săn đón nhiều nhất",
      trendingTitle: "Những trận được quan tâm nhất tuần này",
      trustDetails: [
        "Lịch mở bán được cập nhật liên tục cho những trận sắp diễn ra.",
        "Vé đã xác thực và sẵn sàng trong ví vé của bạn.",
        "Giao dịch được bảo vệ bởi lớp chống gian lận theo thời gian thực.",
        "Trải nghiệm được tối ưu cho cả khách mới và thành viên.",
      ],
      trustLabels: ["Trận sắp diễn ra", "Vé xác thực", "Chống gian lận", "Chế độ người dùng"],
      viewAll: "Xem tất cả",
    };
  }

  return {
    cityCta: "Explore matches here",
    cityDescription: "Find verified tickets in the cities and venues fans check most often.",
    cityEyebrow: "Popular stadiums",
    cityTitle: "Browse by city and venue",
    featuredDescription: "Browse headline fixtures with verified inventory and clearer match details.",
    featuredEyebrow: "Featured fixtures",
    featuredLeagues: [
      { href: "/matches?league=Premier%20League%2024%2F25", label: "Premier League", note: "Weekend derbies and big-six fixtures.", logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg" },
      { href: "/matches?league=V-League%201", label: "V-League 1", note: "Domestic fixtures with strong fan demand.", logo: "https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg" },
      { href: "/matches?league=Champions%20League", label: "Champions League", note: "Knockout nights with premium inventory.", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/UEFA_Champions_League_logo_2.svg" },
    ] satisfies LeagueLink[],
    emptyMatchesDescription: "New fixtures will appear here as soon as sales open or schedules are confirmed.",
    emptyMatchesTitle: "No matches yet",
    featuredTitle: "Featured matches on sale now",
    guestValue: "Guest",
    heroDescription:
      "Book standout football nights with verified inventory, premium seats and protected checkout.",
    heroEyebrow: "Sports ticketing · AI secured",
    heroHighlights: [
      "Dynamic QR ticket protection",
      "Realtime anti-fraud monitoring",
      "Cleaner mobile buying flow",
    ],
    heroPanelDescription: "Search by match, competition or city and jump straight into available tickets.",
    heroPanelTitle: "Find the right path faster",
    heroQuickLinks: [
      { href: "/matches", label: "All matches", note: "Browse the full on-sale schedule." },
      { href: "/matches?league=V-League%201", label: "V-League 1", note: "Go directly to domestic demand." },
      { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: "Hanoi", note: "Filter the experience by venue area." },
      { href: "/history", label: "My ticket wallet", note: "Track owned tickets and status." },
    ],
    heroTitle: "Buy Football Tickets Safely & Instantly",
    howDescription: "Go from discovery to checkout in a flow that stays quick and easy to follow.",
    howEyebrow: "How it works",
    howTitle: "How TicketShield moves users from discovery to purchase",
    howSteps: [
      { title: "Pick a match or competition", description: "Start from trending fixtures, top leagues or the city you plan to attend.", icon: CalendarRange },
      { title: "Choose seats and complete checkout", description: "Review clear match details, choose seats and pay in a few quick steps.", icon: Ticket },
      { title: "Receive a secured dynamic QR ticket", description: "Get your ticket instantly and manage it anytime from your ticket wallet.", icon: QrCode },
    ],
    leagueDescription: "Open your favorite competition and go straight to verified on-sale fixtures.",
    leagueEyebrow: "Competition gateway",
    leagueTitle: "Jump into the league you care about",
    loggedInCta: "Open my ticket wallet",
    memberValue: "Member",
    popularCities: [
      { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: "Hanoi", note: "Strong domestic schedule and easy city-based discovery." },
      { href: "/matches?location=H%E1%BB%93%20Ch%C3%AD%20Minh", label: "Ho Chi Minh City", note: "High-demand fixtures and premium matchday traffic." },
      { href: "/matches?location=%C4%90%C3%A0%20N%E1%BA%B5ng", label: "Da Nang", note: "Weekend fixtures with a lighter browsing path." },
    ],
    primaryCta: "Explore matches",
    promoEmpty: "New member offers will appear here soon.",
    promoEyebrow: "Member benefits",
    promoTitle: "Offers that make the product feel alive",
    secondaryCta: "Sign in to save tickets",
    securityCards: [
      { title: "AI fraud shield", description: "Risk signals are checked before and after ticket issuance to reduce bad inventory flow.", icon: ShieldCheck },
      { title: "Dynamic QR ticket", description: "Ticket codes refresh over time to reduce screenshotting and copying risks.", icon: QrCode },
      { title: "Secure checkout", description: "Payment information and transaction state stay readable and consistent.", icon: Lock },
      { title: "Verified inventory", description: "Inventory and availability are surfaced more clearly so users trust what they see.", icon: CheckCircle2 },
    ] satisfies InfoCard[],
    securityDescription: "Verified tickets, dynamic QR access and secure checkout in one clear flow.",
    securityEyebrow: "Security proof",
    securityFootnoteDescription: "Track ticket status, confirm payments and access matchday entry with confidence.",
    securityFootnoteEyebrow: "Premium UX",
    securityFootnoteTitle: "Security only works when the product stays usable",
    securityTitle: "Visible protection at the front of the experience",
    stepLabel: "Step",
    trendingDescription: "See the fixtures attracting the most attention and buy before demand spikes.",
    trendingEyebrow: "Trending this week",
    trendingSidebarDescription: "Stay close to the hottest fixtures, limited inventory and the fastest path to checkout.",
    trendingSidebarEyebrow: "Realtime intent",
    trendingSidebarPoints: [
      "Most searched fixtures right now",
      "Fast path from hero to checkout",
      "Live ticket availability",
    ],
    trendingSidebarTitle: "Book the matches fans are watching most",
    trendingTitle: "Most watched fixtures this week",
    trustDetails: [
      "Upcoming fixtures ready to browse and book now.",
      "Verified tickets delivered through a protected wallet flow.",
      "Realtime fraud monitoring behind every transaction.",
      "A smoother experience for guests and signed-in members.",
    ],
    trustLabels: ["Upcoming fixtures", "Verified tickets", "Fraud protection", "User mode"],
    viewAll: "View all",
  };
}
