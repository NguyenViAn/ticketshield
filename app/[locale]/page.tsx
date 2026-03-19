"use client";

import * as React from "react";
import Image from "next/image";
import { motion, type Variants, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
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
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SearchBar } from "@/components/matches/search-bar";
import { MatchCard } from "@/components/matches/match-card";
import { PromoCard } from "@/components/shared/promo-card";
import { useFeaturedMatches } from "@/hooks/use-matches";
import { usePromotions } from "@/hooks/use-promotions";
import { IntroScreen } from "@/components/shared/intro-screen";
import { resolveLeagueLogo, resolveTeamLogo } from "@/lib/logo-resolver";
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
  schedule_updating: string;
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
type HomeTranslator = ReturnType<typeof useTranslations>;

type StatItem = {
  label: string;
  value: number | string;
  suffix?: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function Home() {
  const locale = useLocale();
  const tHome = useTranslations("HomePage");
  const { data: featuredMatches, isLoading: matchesLoading } = useFeaturedMatches();
  const { data: promotions, isLoading: promosLoading } = usePromotions();
  const tPromos = useTranslations("Promotions");
  const [showIntro, setShowIntro] = React.useState(false);
  const [matchCount, setMatchCount] = React.useState(0);
  const [ticketCount, setTicketCount] = React.useState(0);
  const supabase = createClient();

  const copy = getHomeCopy(tHome);
  const displayMatches = getDisplayMatches(featuredMatches, locale, copy);
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
      value: matchCount || 11,
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
      value: 100,
      suffix: "%",
      detail: copy.trustDetails[2],
      icon: ShieldCheck,
    },
    {
      label: copy.trustLabels[3],
      value: 3,
      detail: copy.trustDetails[3],
      icon: Shield,
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

      <main className="page-premium relative overflow-hidden pb-20 ">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.05),transparent_16%),radial-gradient(circle_at_16%_26%,rgba(16,185,129,0.08),transparent_18%)]" />

        <section className="border-b border-white/10 pt-4  sm:pt-6 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 px-4 py-7 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.5)]   sm:px-6 sm:py-10 lg:rounded-[40px] lg:px-10 lg:py-14 xl:px-12 xl:py-16">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_STADIUM_IMAGE})` }}
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(2,6,23,0.8),rgba(2,6,23,0.6)_36%,rgba(2,6,23,0.4)_68%,rgba(2,6,23,0.2)_100%)] " />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.4)_30%,rgba(2,6,23,0.6)_62%,#020617_100%)] " />
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_30%)] "
                animate={{ opacity: [0.22, 0.34, 0.26], scale: [1, 1.03, 1] }}
                transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl "
                animate={{ x: [0, 6, 0], y: [0, -6, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute right-[8%] top-[12%] h-28 w-28 rounded-full bg-cyan-700/10 blur-3xl "
                animate={{ x: [0, -6, 0], y: [0, 6, 0], opacity: [0.28, 0.42, 0.28] }}
                transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,#020617)] "
                animate={{ opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />

              <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] xl:items-end xl:gap-10">
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                  }}
                  className="max-w-3xl"
                >
                  <motion.div variants={sectionVariants} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300 backdrop-blur   ">
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.heroEyebrow}
                  </motion.div>
                  <motion.h1
                    variants={sectionVariants}
                    className="mt-5 max-w-[42rem] text-balance text-4xl font-heading font-black uppercase leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl  "
                  >
                    {renderAccentText(copy.heroTitle, copy.heroTitleHighlight, "text-emerald-400")}
                  </motion.h1>
                  <motion.p variants={sectionVariants} className="mt-5 max-w-[38rem] text-sm font-normal leading-7 text-slate-300 sm:text-base  ">
                    {copy.heroDescription}
                  </motion.p>

                  <motion.div variants={sectionVariants} className="mt-4">
                    <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300   ">
                      {copy.heroBadge}
                    </span>
                  </motion.div>

                  <motion.div variants={sectionVariants} className="mt-7 flex flex-col gap-3 md:flex-row">
                    <Link href="/matches" className="inline-flex h-12 items-center justify-center rounded-[16px] bg-emerald-600 px-6 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_-22px_rgba(16,185,129,0.3)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-500">
                      {copy.primaryCta}
                    </Link>
                    <Link
                      href="/#security-features"
                      className="inline-flex h-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:bg-white/10"
                    >
                      {copy.secondaryCta}
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.aside
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                  className="rounded-[28px] border border-white/10 bg-black/20 p-4 shadow-[0_22px_52px_-34px_rgba(0,0,0,0.5)] backdrop-blur-2xl    sm:rounded-[32px] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white ">{copy.heroPanelTitle}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-400 ">{copy.heroPanelDescription}</div>
                    </div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300  ">
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
                          className="block rounded-[22px] border border-white/10 bg-white/5 p-4 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 hover:bg-white/10     "
                        >
                          <div className="text-sm font-semibold text-white ">{link.label}</div>
                          <div className="mt-1 text-sm text-slate-400 ">{link.note}</div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {trustStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  whileHover={{ y: -4, scale: 1.015 }}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] p-5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_48px_-32px_rgba(0,0,0,0.6)]     "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight text-white ">
                        <CountUpValue suffix={stat.suffix} value={stat.value} />
                      </div>
                    </div>
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300  ">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md " />
                      <stat.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-400 ">{stat.detail}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-7xl space-y-0 px-4 sm:px-6 lg:px-8 [&>section]:py-14">
          <motion.section
            className="grid gap-6 rounded-[36px] border border-transparent bg-transparent px-0 py-0 shadow-none xl:grid-cols-[minmax(0,1fr)_minmax(18rem,19rem)]     "
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <div>
              <SectionHeader
                eyebrow={copy.trendingEyebrow}
                highlight={copy.sectionHighlights.trending}
                icon={CalendarClock}
                title={copy.trendingTitle}
                description={copy.trendingDescription}
                actionHref="/matches"
                actionLabel={copy.viewAll}
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {matchesLoading ? (
                  [...Array(3)].map((_, index) => <MatchCardSkeleton key={`trending-skeleton-${index}`} compact />)
                ) : trendingMatches.length > 0 ? (
                  trendingMatches.map((match) => (
                    <motion.div key={match.id} variants={sectionVariants} whileHover={{ y: -2 }}>
                      <TrendingMatchCard
                        actionLabel={copy.trendingAction}
                        locale={locale}
                        match={match}
                        protectionLabel={copy.protectionLabel}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="md:col-span-2 xl:col-span-3">
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

            <motion.aside variants={sectionVariants} className="rounded-[32px] border border-slate-900/10 bg-[linear-gradient(160deg,#162234_0%,#111c2c_40%,#17283a_100%)] p-6 text-white shadow-[0_22px_52px_-34px_rgba(15,23,42,0.28)]  ">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <Clock3 className="h-3.5 w-3.5" />
                {copy.trendingSidebarEyebrow}
              </div>
              <div className="mt-5 text-2xl font-semibold leading-tight">{copy.trendingSidebarTitle}</div>
              <div className="mt-3 text-sm leading-6 text-slate-300/92">{copy.trendingSidebarDescription}</div>
              <div className="mt-6 space-y-3">
                {copy.trendingSidebarPoints.map((point) => (
                  <div key={point} className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    {point}
                  </div>
                ))}
              </div>
            </motion.aside>
          </motion.section>

          <motion.section
            id="security-features"
            className="grid gap-6 rounded-[36px] border border-transparent bg-transparent px-0 py-0 shadow-none xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]     "
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <motion.div variants={sectionVariants} className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-none   ">
              <SectionHeader eyebrow={copy.howEyebrow} highlight={copy.sectionHighlights.how} icon={QrCode} title={copy.howTitle} description={copy.howDescription} />
              <div className="mt-6 space-y-4">
                {copy.howSteps.map((step, index) => (
                  <motion.div
                    key={step.title}
                    variants={sectionVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-none   "
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300 shadow-none   ">
                        <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-sm " />
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 ">
                          {copy.stepLabel} {index + 1}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-white ">{step.title}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-400 ">{step.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-none   ">
              <SectionHeader eyebrow={copy.securityEyebrow} highlight={copy.sectionHighlights.security} icon={ShieldCheck} title={copy.securityTitle} description={copy.securityDescription} />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {copy.securityCards.map((card) => (
                  <motion.div
                    key={card.title}
                    variants={sectionVariants}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/10  "
                  >
                    <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300  ">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-sm " />
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-white ">{card.title}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-400 ">{card.description}</div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-5 text-slate-300   ">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400 ">{copy.securityFootnoteEyebrow}</div>
                <div className="mt-2 text-xl font-semibold text-white">{copy.securityFootnoteTitle}</div>
                <div className="mt-2 text-sm leading-6 text-slate-400 ">{copy.securityFootnoteDescription}</div>
              </div>
            </motion.div>
          </motion.section>

          <motion.section
            className="rounded-[36px] border border-transparent bg-transparent px-0 py-0 shadow-none   "
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader
              eyebrow={copy.featuredEyebrow}
              highlight={copy.sectionHighlights.featured}
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
            className="rounded-[36px] border border-transparent bg-transparent px-0 py-0 shadow-none   "
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader eyebrow={copy.promoEyebrow} highlight={copy.sectionHighlights.promo} icon={Percent} title={copy.promoTitle} description={tPromos("description")} />
            {promosLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-[28px] border border-white/10 bg-white/5  " />
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
              <div className="mt-6 rounded-[28px] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-slate-400   ">
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
  highlight,
  icon: Icon = Sparkles,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow: string;
  highlight?: string;
  icon?: SectionIcon;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300 shadow-none    ">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-4 text-3xl font-heading font-black uppercase italic tracking-tight text-white sm:text-4xl ">
          {renderAccentText(title, highlight, "text-emerald-300")}
        </h2>
        <p className="mt-3 text-sm font-normal leading-7 text-slate-400 sm:text-base ">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-emerald-400  "
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
      className={`overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] shadow-[0_16px_40px_-28px_rgba(0,0,0,0.5)]    ${
        compact ? "min-h-[18rem]" : "min-h-[24rem]"
      }`}
    >
      <div className={`animate-pulse ${compact ? "h-full" : "h-full"}`}>
        <div className="h-28 bg-[linear-gradient(90deg,rgba(30,41,59,0.7),rgba(15,23,42,0.96),rgba(30,41,59,0.42))] " />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="h-5 w-28 rounded-full bg-slate-800 " />
            <div className="h-5 w-16 rounded-full bg-slate-800 " />
          </div>
          <div className="flex items-center justify-center gap-4 pt-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 " />
            <div className="h-8 w-10 rounded-full bg-slate-800 " />
            <div className="h-16 w-16 rounded-2xl bg-slate-800 " />
          </div>
          <div className="space-y-3 pt-3">
            <div className="h-5 w-3/4 rounded-full bg-slate-800 " />
            <div className="h-4 w-2/3 rounded-full bg-slate-800 " />
            <div className="h-4 w-1/2 rounded-full bg-slate-800 " />
          </div>
          <div className="h-11 rounded-full bg-slate-800 " />
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
    <div className="rounded-[32px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] px-6 py-12 text-center shadow-none   ">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300  ">
        <Ticket className="h-6 w-6" />
      </div>
      <div className="mt-4 text-xl font-semibold text-white ">{title}</div>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400 ">{description}</div>
      <Link
        href={actionHref}
        className="mt-6 inline-flex h-11 items-center justify-center bg-emerald-700 px-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_-22px_rgba(5,150,105,0.26)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-600"
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

function TrendingMatchCard({
  actionLabel,
  locale,
  match,
  protectionLabel,
}: {
  actionLabel: string;
  locale: string;
  match: DisplayMatch;
  protectionLabel: string;
}) {
  return (
    <Link
      href={`/matches?q=${encodeURIComponent(match.home_team)}`}
      className="group flex h-full flex-col rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(2,6,23,0.98))] p-5 shadow-[0_18px_42px_-28px_rgba(0,0,0,0.38)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300/18 hover:shadow-[0_24px_56px_-30px_rgba(0,0,0,0.5)]"
    >
      <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/12 bg-white/90 shadow-[0_10px_22px_-16px_rgba(255,255,255,0.45)]">
            <Image src={match.league_logo} alt={match.league} width={28} height={28} className="h-7 w-7 object-contain brightness-110 saturate-150" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {locale.startsWith("vi") ? "Giải đấu" : "League"}
            </span>
            <span className="mt-1 line-clamp-2 text-[12px] font-bold uppercase leading-[1.3] tracking-[0.1em] text-slate-100">
              {match.league}
            </span>
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamChip logo={match.home_logo} team={match.home_team} />
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400">
            VS
          </span>
          <TeamChip logo={match.away_logo} team={match.away_team} />
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        <div className="text-[1.65rem] font-heading font-black leading-[1.02] tracking-[-0.04em] text-white">
          {match.home_team} vs {match.away_team}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <CalendarClock className="h-4 w-4 text-cyan-300" />
          {formatMatchLabel(match.date, locale, match.schedule_updating)}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="h-4 w-4 text-emerald-300" />
          <span className="truncate">{match.stadium}</span>
        </div>
        <div className="pt-1">
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
            {protectionLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400 transition-colors group-hover:text-emerald-300">
        <span>{actionLabel}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function TeamChip({ logo, team }: { logo?: string; team: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2.5 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-white/12 bg-white/95 text-sm font-black text-emerald-300 shadow-[0_12px_26px_-18px_rgba(255,255,255,0.45)]">
        {logo ? (
          <Image src={logo} alt={team} width={48} height={48} className="h-12 w-12 object-contain brightness-110 saturate-150" />
        ) : (
          getInitials(team)
        )}
      </div>
      <div className="line-clamp-2 text-[12px] font-semibold leading-[1.25] text-slate-100">{team}</div>
    </div>
  );
}

function renderAccentText(title: string, highlight: string | undefined, accentClassName: string) {
  if (!highlight || !title.includes(highlight)) {
    return title;
  }

  const [before, after] = title.split(highlight);

  return (
    <>
      {before}
      <span className={accentClassName}>{highlight}</span>
      {after}
    </>
  );
}

function getDisplayMatches(
  featuredMatches: Match[] | null | undefined,
  locale: string,
  copy: ReturnType<typeof getHomeCopy>,
): DisplayMatch[] {
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
      league: match.tournaments?.name ?? copy.featuredLeagueFallback,
      league_logo: resolveLeagueLogo(match.tournaments?.name ?? ""),
      badge: copy.saleBadge,
      schedule_updating: copy.scheduleUpdating,
    }))
    .slice(0, 4);
}

function formatMatchLabel(date: string, locale: string, fallbackLabel: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallbackLabel;
  }

  return new Intl.DateTimeFormat(locale.startsWith("vi") ? "vi-VN" : "en-US", {
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

function resolveStadiumImage(stadium: string, homeTeam: string, awayTeam: string) {
  const normalizedStadium = stadium.toLowerCase();
  const normalizedMatch = `${homeTeam} ${awayTeam}`.toLowerCase();

  const stadiumImages: Record<string, string> = {
    "etihad stadium": "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    "anfield": "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1200&q=80",
    "santiago bernabeu": "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
    "camp nou": "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
    "old trafford": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    "estadi olimpic lluis companys": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
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

function getHomeCopy(t: HomeTranslator) {
  return {
    cityCta: t("city_cta"),
    cityDescription: t("city_description"),
    cityEyebrow: t("city_eyebrow"),
    cityTitle: t("city_title"),
    featuredDescription: t("featured_description"),
    featuredEyebrow: t("featured_eyebrow"),
    featuredLeagues: [
      { href: "/matches?league=Premier%20League%2024%2F25", label: "Premier League", note: t("featured_leagues.premier_league.note"), logo: resolveLeagueLogo("Premier League") },
      { href: "/matches?league=V-League%201", label: "V-League 1", note: t("featured_leagues.vleague.note"), logo: resolveLeagueLogo("V-League 1") },
      { href: "/matches?league=Champions%20League", label: "Champions League", note: t("featured_leagues.champions_league.note"), logo: resolveLeagueLogo("Champions League") },
    ] satisfies LeagueLink[],
    emptyMatchesDescription: t("empty_matches_description"),
    emptyMatchesTitle: t("empty_matches_title"),
    featuredTitle: t("featured_title"),
    guestValue: t("guest_value"),
    heroDescription: t("hero_description"),
    heroBadge: t("hero_badge"),
    heroEyebrow: t("hero_eyebrow"),
    heroHighlights: [
      t("hero_highlights.0"),
      t("hero_highlights.1"),
      t("hero_highlights.2"),
    ],
    heroPanelDescription: t("hero_panel_description"),
    heroPanelTitle: t("hero_panel_title"),
    heroQuickLinks: [
      { href: "/matches", label: t("hero_quick_links.all_matches.label"), note: t("hero_quick_links.all_matches.note") },
      { href: "/matches?league=V-League%201", label: t("hero_quick_links.vleague.label"), note: t("hero_quick_links.vleague.note") },
      { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: t("hero_quick_links.hanoi.label"), note: t("hero_quick_links.hanoi.note") },
      { href: "/history", label: t("hero_quick_links.wallet.label"), note: t("hero_quick_links.wallet.note") },
    ],
    heroTitle: t("hero_title"),
    heroTitleHighlight: t("hero_title_highlight"),
    howDescription: t("how_description"),
    howEyebrow: t("how_eyebrow"),
    howTitle: t("how_title"),
    howSteps: [
      { title: t("how_steps.choose_match.title"), description: t("how_steps.choose_match.description"), icon: CalendarRange },
      { title: t("how_steps.choose_seat.title"), description: t("how_steps.choose_seat.description"), icon: Ticket },
      { title: t("how_steps.receive_qr.title"), description: t("how_steps.receive_qr.description"), icon: QrCode },
    ],
    leagueDescription: t("league_description"),
    leagueEyebrow: t("league_eyebrow"),
    leagueTitle: t("league_title"),
    loggedInCta: t("logged_in_cta"),
    memberValue: t("member_value"),
    popularCities: [
      { href: "/matches?location=H%C3%A0%20N%E1%BB%99i", label: t("popular_cities.hanoi.label"), note: t("popular_cities.hanoi.note") },
      { href: "/matches?location=H%E1%BB%93%20Ch%C3%AD%20Minh", label: t("popular_cities.hcm.label"), note: t("popular_cities.hcm.note") },
      { href: "/matches?location=%C4%90%C3%A0%20N%E1%BA%B5ng", label: t("popular_cities.danang.label"), note: t("popular_cities.danang.note") },
    ],
    primaryCta: t("primary_cta"),
    promoEmpty: t("promo_empty"),
    promoEyebrow: t("promo_eyebrow"),
    promoTitle: t("promo_title"),
    secondaryCta: t("secondary_cta"),
    securityCards: [
      { title: t("security_cards.bot_detection.title"), description: t("security_cards.bot_detection.description"), icon: ShieldCheck },
      { title: t("security_cards.verified_qr.title"), description: t("security_cards.verified_qr.description"), icon: QrCode },
      { title: t("security_cards.checked_transactions.title"), description: t("security_cards.checked_transactions.description"), icon: Lock },
      { title: t("security_cards.seat_monitoring.title"), description: t("security_cards.seat_monitoring.description"), icon: CheckCircle2 },
    ] satisfies InfoCard[],
    securityDescription: t("security_description"),
    securityEyebrow: t("security_eyebrow"),
    securityFootnoteDescription: t("security_footnote_description"),
    securityFootnoteEyebrow: t("security_footnote_eyebrow"),
    securityFootnoteTitle: t("security_footnote_title"),
    securityTitle: t("security_title"),
    sectionHighlights: {
      city: t("section_highlights.city"),
      featured: t("section_highlights.featured"),
      how: t("section_highlights.how"),
      league: t("section_highlights.league"),
      promo: t("section_highlights.promo"),
      security: t("section_highlights.security"),
      trending: t("section_highlights.trending"),
    },
    scheduleUpdating: t("schedule_updating"),
    saleBadge: t("sale_badge"),
    stepLabel: t("step_label"),
    trendingDescription: t("trending_description"),
    trendingAction: t("trending_action"),
    trendingEyebrow: t("trending_eyebrow"),
    trendingSidebarDescription: t("trending_sidebar_description"),
    trendingSidebarEyebrow: t("trending_sidebar_eyebrow"),
    trendingSidebarPoints: [
      t("trending_sidebar_points.0"),
      t("trending_sidebar_points.1"),
      t("trending_sidebar_points.2"),
    ],
    trendingSidebarTitle: t("trending_sidebar_title"),
    trendingTitle: t("trending_title"),
    protectionLabel: t("protection_label"),
    trustDetails: [
      t("trust_details.0"),
      t("trust_details.1"),
      t("trust_details.2"),
      t("trust_details.3"),
    ],
    trustLabels: [
      t("trust_labels.0"),
      t("trust_labels.1"),
      t("trust_labels.2"),
      t("trust_labels.3"),
    ],
    featuredLeagueFallback: t("featured_league_fallback"),
    viewAll: t("view_all"),
  };
}
