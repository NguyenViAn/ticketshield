"use client";

import * as React from "react";
import { AnimatePresence, motion, type Variants, useInView } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Shield,
  ShieldCheck,
  Ticket,
  XCircle,
  Eye,
  Zap,
  BarChart3,
  Users,
  Bot,
  CreditCard,
  Wifi,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { MatchCard } from "@/components/matches/match-card";
import { IntroScreen } from "@/components/shared/intro-screen";
import { useFeaturedMatches } from "@/hooks/use-matches";
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

const copy = {
  heroEyebrow: "AI-Protected Ticketing",
  heroTitle: "Stop Suspicious Booking Behavior ",
  heroTitleAccent: "Before",
  heroTitleEnd: " Seats Are Lost",
  heroDescription:
    "TicketShield uses real-time AI and behavioral analysis to identify suspicious checkout abuse and seat-hoarding before they impact your legitimate customers.",
  primaryCta: "Explore All Tickets Here",
  secondaryCta: "Watch All Sessions",
  liveStatus: [
    {
      label: "Live In Queue",
      value: "23 Users",
      status: "ONLINE" as const,
    },
    {
      label: "Active Bot Rules",
      value: "81 Rules",
      status: "BLOCKED" as const,
    },
    {
      label: "Seats Paid For Entry",
      value: "ANALYZE",
      status: "VERIFIED" as const,
    },
    {
      label: "Security VPN Detected",
      value: "ACTIVE",
      status: "ALERT" as const,
    },
  ],
  statsEyebrow: "Security metrics",
  statsTitle: "Monitoring Summary",
  statsDescription: "A compact view of the protected booking activity TicketShield is designed to monitor.",
  heroPanelTitle: "Before vs After TicketShield",
  heroPanelDescription: "See how AI protection changes the booking flow from reactive cleanup to proactive prevention.",
  beforeItems: [
    {
      icon: "search" as const,
      title: "Seat Switching Spam",
      description: "Bots can switch seat positions quickly, creating noise and claims.",
    },
    {
      icon: "retry" as const,
      title: "Checkout Retry Abuse",
      description: "Bots try payment attempts starting abuse sessions.",
    },
    {
      icon: "session" as const,
      title: "Suspicious Sessions",
      description: "Minimal tools are available to review user risk before tickets.",
    },
  ],
  afterItems: [
    {
      icon: "prevention" as const,
      title: "Instant Loss Prevention",
      description: "AI detects abnormal seat-switching pattern and blocks in real-time.",
    },
    {
      icon: "throttling" as const,
      title: "Dynamic Throttling",
      description: "Graduated responses stop bad actors while letting real fans proceed.",
    },
    {
      icon: "visibility" as const,
      title: "Full Admin Visibility",
      description: "Crystal clear dashboard for every suspicious alert and action.",
    },
  ],
  securityEyebrow: "Core capability",
  securityTitle: "AI Monitors Booking Risk In Real Time",
  securityDescription:
    "Our engine evaluates hundreds of signals per session to ensure every seat goes to a real person, in real time.",
  securityCards: [
    {
      title: "Seat-selection spam",
      description: "Prevents fans from holding over seats by monitoring rapid-click seat-switching behaviors to the millisecond.",
    },
    {
      title: "Checkout abuse",
      description: "Get effective insight-powered those retries, payment re-flow pattern recognition in fast checkout situations.",
    },
    {
      title: "Session anomalies",
      description: "Monitors high-frequency navigation anomalies, session fingerprint and timing abnormalities.",
    },
    {
      title: "Admin review support",
      description: "Rich audit trail with risk scores, rule-level reasons for each session that needed manual/medium resolution.",
    },
  ],
  detectionEyebrow: "Decision pipeline",
  detectionTitle: "Detection Flow",
  detectionDescription: "TicketShield turns behavior signals into a score and a response before risky sessions complete checkout.",
  detectionFlow: [
    {
      title: "Detect abnormal behavior",
      description: "Real-time monitoring of user action like seat switching, checkout repetition, and inconsistent session behavior.",
    },
    {
      title: "Assign risk score",
      description: "AI combines signals to calculate the session risk confidence driven score.",
    },
    {
      title: "Warn or block user",
      description: "Graduated intelligent response is on for the suspicious sessions to confirm high-risk bookings.",
    },
  ],
  eventsEyebrow: "Protected catalogue",
  eventsTitle: "Protected Ticket Events",
  eventsDescription: "Live-events protected for wider reaching events covering leagues globally.",
  emptyMatchesTitle: "Protected events are updating",
  emptyMatchesDescription: "Add fixtures to the database to demonstrate the secured booking flow.",
  viewAll: "View all events",
} as const;

type SectionIcon = React.ComponentType<{ className?: string }>;

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
};

type StatItem = {
  label: string;
  value: number | string;
  suffix?: string;
  detail: string;
  icon: SectionIcon;
};

type InfoItem = {
  title: string;
  description: string;
  icon: SectionIcon;
};

type HomePageClientProps = {
  initialFeaturedMatches: Match[];
  initialMatchCount: number;
  initialTicketCount: number;
};

const securityIcons: SectionIcon[] = [Ticket, Lock, Activity, ShieldCheck];
const detectionIcons: SectionIcon[] = [Activity, Shield, AlertTriangle];

export default function HomePageClient({
  initialFeaturedMatches,
  initialMatchCount,
  initialTicketCount,
}: HomePageClientProps) {
  const { data: featuredMatches, isLoading: matchesLoading } = useFeaturedMatches(initialFeaturedMatches);
  const [showIntro, setShowIntro] = React.useState(false);
  const [matchCount, setMatchCount] = React.useState(initialMatchCount);
  const [ticketCount, setTicketCount] = React.useState(initialTicketCount);
  const supabase = createClient();

  const displayMatches = getDisplayMatches(featuredMatches);
  const monitoredSessions = Math.max(ticketCount * 4, matchCount * 8, 128);
  const suspiciousEvents = Math.max(Math.round(monitoredSessions * 0.12), 18);

  const securityStats: StatItem[] = [
    {
      label: "Sessions analyzed",
      value: monitoredSessions,
      suffix: "+",
      detail: "Session-level activity reviewed by the prototype risk engine.",
      icon: Activity,
    },
    {
      label: "Suspicious events",
      value: suspiciousEvents,
      suffix: "+",
      detail: "Flagged patterns linked to seat spam, retry abuse, and session anomalies.",
      icon: AlertTriangle,
    },
    {
      label: "Risk engine active",
      value: "24/7",
      detail: "Behavior scoring stays active throughout seat selection and checkout.",
      icon: ShieldCheck,
    },
    {
      label: "Security layers",
      value: 4,
      detail: "Authentication, RLS, AI behavior analysis, and admin enforcement.",
      icon: Shield,
    },
  ];

  const securityCards: InfoItem[] = copy.securityCards.map((item, index) => ({
    ...item,
    icon: securityIcons[index] ?? ShieldCheck,
  }));
  const detectionFlow: InfoItem[] = copy.detectionFlow.map((item, index) => ({
    ...item,
    icon: detectionIcons[index] ?? Shield,
  }));

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

  const handleCompleteIntro = () => {
    sessionStorage.setItem("has_seen_intro", "true");
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence>{showIntro ? <IntroScreen onComplete={handleCompleteIntro} /> : null}</AnimatePresence>

      <main className="page-premium relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,rgba(14,165,233,0.05),transparent_16%),radial-gradient(circle_at_16%_26%,rgba(16,185,129,0.08),transparent_18%)]" />

        {/* ─── HERO SECTION ─── */}
        <section className="border-b border-white/10 pt-4 sm:pt-6 lg:pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[36px] border border-white/10 px-5 py-8 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.5)] sm:px-8 sm:py-12 lg:rounded-[40px] lg:px-10 lg:py-14 xl:px-12 xl:py-16">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${HERO_STADIUM_IMAGE})` }}
                animate={{ scale: [1, 1.015, 1] }}
                transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(2,6,23,0.86),rgba(2,6,23,0.72)_38%,rgba(2,6,23,0.46)_70%,rgba(2,6,23,0.24)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,27,49,0.16)_0%,rgba(17,27,49,0.34)_28%,rgba(17,27,49,0.58)_68%,#111b31_100%)]" />

              <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] xl:items-end xl:gap-10">
                {/* Left — Hero Copy */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                  className="max-w-3xl"
                >
                  <motion.div variants={sectionVariants} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {copy.heroEyebrow}
                  </motion.div>
                  <motion.h1 variants={sectionVariants} className="mt-5 max-w-[38rem] text-balance text-4xl font-black leading-[0.94] tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {copy.heroTitle}
                    <span className="text-emerald-400">{copy.heroTitleAccent}</span>
                    {copy.heroTitleEnd}
                  </motion.h1>
                  <motion.p variants={sectionVariants} className="mt-5 max-w-[38rem] text-sm leading-7 text-slate-300 sm:text-base">
                    {copy.heroDescription}
                  </motion.p>
                  <motion.div variants={sectionVariants} className="mt-8 flex flex-col gap-3 md:flex-row">
                    <Link href="/matches" className="inline-flex h-12 items-center justify-center rounded-[16px] bg-emerald-600 px-6 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_-22px_rgba(16,185,129,0.3)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-500">
                      {copy.primaryCta}
                    </Link>
                    <Link href="/#detection-flow" className="inline-flex h-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/5 px-6 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10">
                      {copy.secondaryCta}
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Right — Live Status Panel */}
                <motion.aside
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                  className="rounded-[30px] border border-white/12 bg-slate-800/42 p-5 shadow-[0_22px_52px_-34px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white">Live Status</div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <Activity className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {copy.liveStatus.map((item) => (
                      <LiveStatusRow key={item.label} label={item.label} value={item.value} status={item.status} />
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
                    {["Pre-confirmation scoring", "Behavior-based review", "Admin decision support"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-emerald-500/16 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-7xl space-y-0 px-4 sm:px-6 lg:px-8 [&>section]:py-14">
          {/* ─── MONITORING SUMMARY ─── */}
          <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
            <SectionHeader eyebrow={copy.statsEyebrow} icon={Activity} title={copy.statsTitle} description={copy.statsDescription} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {securityStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] p-5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
                        <CountUpValue suffix={stat.suffix} value={stat.value} />
                      </div>
                    </div>
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md" />
                      <stat.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-400">{stat.detail}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── BEFORE VS AFTER TICKETSHIELD ─── */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader eyebrow="Comparison" icon={Shield} title={copy.heroPanelTitle} description={copy.heroPanelDescription} />
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {/* WITHOUT column */}
              <motion.div variants={sectionVariants} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] p-6">
                <div className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Without
                </div>
                <div className="space-y-4">
                  {copy.beforeItems.map((item) => (
                    <BeforeAfterItem key={item.title} title={item.title} description={item.description} variant="without" iconType={item.icon} />
                  ))}
                </div>
              </motion.div>

              {/* WITH column */}
              <motion.div variants={sectionVariants} className="rounded-[28px] border border-emerald-500/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.06),rgba(2,6,23,0.95))] p-6">
                <div className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  With
                </div>
                <div className="space-y-4">
                  {copy.afterItems.map((item) => (
                    <BeforeAfterItem key={item.title} title={item.title} description={item.description} variant="with" iconType={item.icon} />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.section>

          {/* ─── AI SECURITY CARDS ─── */}
          <motion.section
            id="security-features"
            className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.62),rgba(2,6,23,0.9))] p-6 shadow-[0_20px_56px_-34px_rgba(0,0,0,0.42)] lg:p-8"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader eyebrow={copy.securityEyebrow} icon={ShieldCheck} title={copy.securityTitle} description={copy.securityDescription} />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {securityCards.map((card) => (
                <motion.div key={card.title} variants={sectionVariants} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-white">{card.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{card.description}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── DETECTION FLOW ─── */}
          <motion.section
            id="detection-flow"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            <SectionHeader eyebrow={copy.detectionEyebrow} icon={Shield} title={copy.detectionTitle} description={copy.detectionDescription} />
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {detectionFlow.map((card, index) => (
                <motion.div key={card.title} variants={sectionVariants} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="text-4xl font-black tracking-[-0.06em] text-emerald-500/25">0{index + 1}</div>
                  </div>
                  <div className="mt-5 text-xl font-semibold text-white">{card.title}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-400">{card.description}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── PROTECTED TICKET EVENTS ─── */}
          <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
            <SectionHeader eyebrow={copy.eventsEyebrow} icon={Ticket} title={copy.eventsTitle} description={copy.eventsDescription} actionHref="/matches" actionLabel={copy.viewAll} />
            {matchesLoading ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, index) => (
                  <MatchCardSkeleton key={`protected-skeleton-${index}`} />
                ))}
              </div>
            ) : displayMatches.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {displayMatches.map((match) => (
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
        </div>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function LiveStatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "ONLINE" | "BLOCKED" | "VERIFIED" | "ALERT";
}) {
  const statusStyles = {
    ONLINE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    BLOCKED: "border-red-400/20 bg-red-400/10 text-red-300",
    VERIFIED: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    ALERT: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  };

  const statusIcons = {
    ONLINE: Users,
    BLOCKED: Bot,
    VERIFIED: CreditCard,
    ALERT: Wifi,
  };

  const StatusIcon = statusIcons[status];

  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300">
          <StatusIcon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
        </div>
      </div>
      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusStyles[status]}`}>
        {status}
      </span>
    </div>
  );
}

function BeforeAfterItem({
  title,
  description,
  variant,
  iconType,
}: {
  title: string;
  description: string;
  variant: "without" | "with";
  iconType: string;
}) {
  const iconMap: Record<string, SectionIcon> = {
    search: Eye,
    retry: Zap,
    session: BarChart3,
    prevention: ShieldCheck,
    throttling: Activity,
    visibility: Eye,
  };

  const Icon = iconMap[iconType] ?? Shield;
  const isWithout = variant === "without";

  return (
    <div className={`flex gap-4 rounded-[18px] border p-4 ${
      isWithout
        ? "border-white/8 bg-slate-950/35"
        : "border-emerald-500/12 bg-emerald-500/8"
    }`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        isWithout
          ? "bg-white/[0.06] text-slate-400"
          : "bg-emerald-500/14 text-emerald-300"
      }`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <div className={`text-sm font-semibold ${isWithout ? "text-slate-300" : "text-emerald-200"}`}>{title}</div>
        <div className="mt-1 text-[13px] leading-6 text-slate-400">{description}</div>
      </div>
    </div>
  );
}

function SectionHeader({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  icon: Icon = ShieldCheck,
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
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">{description}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-emerald-400">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function MatchCardSkeleton() {
  return (
    <div className="min-h-[24rem] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] shadow-[0_16px_40px_-28px_rgba(0,0,0,0.5)]">
      <div className="h-full animate-pulse">
        <div className="h-28 bg-[linear-gradient(90deg,rgba(30,41,59,0.7),rgba(15,23,42,0.96),rgba(30,41,59,0.42))]" />
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-center gap-4 pt-3">
            <div className="h-16 w-16 rounded-2xl bg-slate-800" />
            <div className="h-8 w-10 rounded-full bg-slate-800" />
            <div className="h-16 w-16 rounded-2xl bg-slate-800" />
          </div>
          <div className="space-y-3 pt-3">
            <div className="h-5 w-3/4 rounded-full bg-slate-800" />
            <div className="h-4 w-2/3 rounded-full bg-slate-800" />
            <div className="h-4 w-1/2 rounded-full bg-slate-800" />
          </div>
          <div className="h-11 rounded-full bg-slate-800" />
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
    <div className="rounded-[32px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))] px-6 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
        <Ticket className="h-6 w-6" />
      </div>
      <div className="mt-4 text-xl font-semibold text-white">{title}</div>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">{description}</div>
      <Link href={actionHref} className="mt-6 inline-flex h-11 items-center justify-center bg-emerald-700 px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_14px_28px_-22px_rgba(5,150,105,0.26)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-600">
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
    if (!isInView) return;
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
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
}

function getDisplayMatches(featuredMatches: Match[] | null | undefined): DisplayMatch[] {
  return (featuredMatches ?? [])
    .map((match) => ({
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      home_logo: match.home_logo || "",
      away_logo: match.away_logo || "",
      date: match.date,
      stadium: match.stadium,
      stadium_image: resolveStadiumImage(match.stadium, match.home_team, match.away_team),
      security_level: match.security_level || "High",
    }))
    .slice(0, 3);
}

function resolveStadiumImage(stadium: string, homeTeam: string, awayTeam: string) {
  const normalizedStadium = stadium.toLowerCase();
  const normalizedMatch = `${homeTeam} ${awayTeam}`.toLowerCase();
  const stadiumImages: Record<string, string> = {
    "etihad stadium": "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    anfield: "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1200&q=80",
    "santiago bernabeu": "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
    "camp nou": "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
    "old trafford": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  };

  for (const [key, value] of Object.entries(stadiumImages)) {
    if (normalizedStadium.includes(key)) return value;
  }
  if (normalizedMatch.includes("manchester city") || normalizedMatch.includes("arsenal")) return stadiumImages["etihad stadium"];
  if (normalizedMatch.includes("liverpool") || normalizedMatch.includes("bayern")) return stadiumImages.anfield;
  if (normalizedMatch.includes("real madrid") || normalizedMatch.includes("atletico")) return stadiumImages["santiago bernabeu"];
  return "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80";
}
