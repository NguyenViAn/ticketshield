"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  ShieldCheck,
  Ticket,
  Wallet,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/providers/auth-provider";
import { useTickets } from "@/hooks/use-tickets";
import { NeonButton } from "@/components/ui/neon-button";
import {
  MatchdayActionTile,
  MatchdayMetaPill,
  MatchdayPanel,
  MatchdayPanelHeader,
  MatchdayStatCard,
  MatchdayStatusPill,
} from "@/components/ui/matchday";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 280, damping: 24 },
  },
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
  }, [authLoading, isLoggedIn, locale, router]);

  const { data: tickets, isLoading: ticketsLoading, error: ticketsError, refetch } = useTickets();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const validTickets = tickets.filter((ticket) => ticket.status === "Valid");
    const upcomingTickets = validTickets.filter(
      (ticket) => new Date(ticket.matches?.date ?? ticket.created_at) > new Date()
    );
    const spentTotal = tickets.reduce((sum, ticket) => sum + ticket.price_paid, 0);
    const latestPurchase = tickets[0] ?? null;

    return {
      latestPurchase,
      spentTotal,
      totalTickets: tickets.length,
      upcomingTickets: upcomingTickets.length,
      validTickets: validTickets.length,
    };
  }, [tickets]);

  const isLoading = authLoading || ticketsLoading;
  const showError = Boolean(ticketsError) && !isLoading;

  if (!isLoggedIn && !authLoading) {
    return null;
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="page-shell">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
                <Wallet className="h-3.5 w-3.5" />
                {t("badge")}
              </div>
              <h1 className="mt-5 text-5xl font-heading font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl">
                {t("hero_title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{t("subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <QuickAction
                href="/matches"
                title={t("quick_browse_title")}
                description={t("quick_browse_desc")}
              />
              <QuickAction
                href="/profile"
                title={t("quick_profile_title")}
                description={t("quick_profile_desc")}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-4">
          <MatchdayStatCard
            label={t("stat_total")}
            value={summary.totalTickets.toString()}
            accent="emerald"
            icon={<Ticket className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label={t("stat_valid")}
            value={summary.validTickets.toString()}
            accent="cyan"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label={t("stat_upcoming")}
            value={summary.upcomingTickets.toString()}
            accent="slate"
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label={t("stat_spend")}
            value={`${summary.spentTotal.toLocaleString(locale)} VND`}
            accent="slate"
            icon={<CreditCard className="h-5 w-5" />}
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {showError ? (
              <div className="rounded-[30px] border border-dashed border-rose-400/30 bg-rose-500/10 px-6 py-16 text-center">
                <div className="text-lg font-heading font-bold text-rose-200">{t("error_title")}</div>
                <p className="mt-3 text-sm text-slate-300">{t("error_desc")}</p>
                <div className="mt-6">
                  <NeonButton onClick={refetch} className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                    {t("error_retry")}
                  </NeonButton>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-44 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-[30px] border border-dashed border-white/10 bg-white/5 px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/16 bg-emerald-400/10 text-emerald-300">
                  <Ticket className="h-8 w-8" />
                </div>
                <div className="mt-5 text-xl font-heading font-bold text-white">{t("empty_title")}</div>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">{t("empty_desc")}</p>
                <div className="mt-7">
                  <Link href="/matches">
                    <NeonButton className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                      {t("empty_cta")}
                    </NeonButton>
                  </Link>
                </div>
              </div>
            ) : (
              <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="show">
                {tickets.map((ticket) => {
                  const ticketTitle = ticket.matches
                    ? `${ticket.matches.home_team} vs ${ticket.matches.away_team}`
                    : t("unknown_match");

                  return (
                    <motion.div key={ticket.id} variants={itemVariant}>
                      <MatchdayPanel className="transition-all hover:border-emerald-400/18" padding="p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm text-slate-400">
                                {t("id_prefix")}
                                {ticket.id.split("-")[0]}
                              </span>
                              {ticket.status === "Valid" ? (
                                <MatchdayStatusPill icon={CheckCircle2} label={t("status_valid")} tone="emerald" />
                              ) : ticket.status === "Used" ? (
                                <MatchdayStatusPill icon={Clock} label={t("status_used")} tone="cyan" />
                              ) : (
                                <MatchdayStatusPill icon={XCircle} label={t("status_cancelled")} tone="slate" />
                              )}
                            </div>

                            <h3 className="text-3xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                              {ticketTitle}
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                              <MatchdayMetaPill icon={MapPin} toneClassName="text-rose-300">
                                {ticket.matches?.stadium || t("venue_updating")}
                              </MatchdayMetaPill>
                              <MatchdayMetaPill icon={CalendarClock} toneClassName="text-cyan-300">
                                {ticket.matches?.date
                                  ? new Date(ticket.matches.date).toLocaleString(locale)
                                  : new Date(ticket.created_at).toLocaleString(locale)}
                              </MatchdayMetaPill>
                              <MatchdayMetaPill icon={Ticket} toneClassName="text-emerald-300">
                                {ticket.seat}
                              </MatchdayMetaPill>
                            </div>
                          </div>

                          <div className="page-card-muted p-4 xl:min-w-[280px]">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("value")}</div>
                            <div className="mt-2 text-3xl font-heading font-black tracking-[-0.03em] text-emerald-300">
                              {ticket.price_paid.toLocaleString(locale)} VND
                            </div>

                            <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-white/8 bg-[#04120d] px-3 py-3">
                              <ShieldCheck className="h-4 w-4 text-cyan-300 opacity-90" />
                              <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-300" title={ticket.ai_validation_hash}>
                                {ticket.ai_validation_hash.substring(0, 14)}...
                              </span>
                              <button
                                onClick={() => handleCopy(ticket.ai_validation_hash, ticket.id)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-400/10 hover:text-emerald-300"
                                title={t("copy_hash_title")}
                              >
                                {copiedId === ticket.id ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>

                            <Link href={`/history/${ticket.id}` as never} className="mt-4 block">
                              <NeonButton className="h-12 w-full rounded-[18px] border border-emerald-400/16 bg-emerald-400/10 px-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-400/14">
                                <Ticket className="mr-2 h-4 w-4" />
                                {t("btn_manage")}
                              </NeonButton>
                            </Link>
                          </div>
                        </div>
                      </MatchdayPanel>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          <aside className="space-y-6">
            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("snapshot_title")}
                icon={<ShieldCheck className="h-5 w-5 text-cyan-300" />}
              />
              {summary.latestPurchase ? (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    {t("latest_purchase")}
                  </div>
                  <div className="mt-3 text-2xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                    {summary.latestPurchase.matches
                      ? `${summary.latestPurchase.matches.home_team} vs ${summary.latestPurchase.matches.away_team}`
                      : t("unknown_match")}
                  </div>
                  <div className="mt-3 text-sm text-slate-300">
                    {new Date(summary.latestPurchase.created_at).toLocaleString(locale)}
                  </div>
                </>
              ) : (
                <div className="text-sm leading-6 text-slate-300">
                  {t("snapshot_empty")}
                </div>
              )}
            </MatchdayPanel>

            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("next_actions")}
                icon={<Wallet className="h-5 w-5 text-emerald-300" />}
              />
              <div className="space-y-3">
                <SidebarAction
                  href="/matches"
                  label={t("next_action_matches")}
                />
                <SidebarAction
                  href="/profile"
                  label={t("next_action_profile")}
                />
              </div>
            </MatchdayPanel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function QuickAction({
  description,
  href,
  title,
}: {
  description: string;
  href: string;
  title: string;
}) {
  return (
    <Link href={href} className="block">
      <MatchdayActionTile>
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-300">{description}</div>
      </MatchdayActionTile>
    </Link>
  );
}

function SidebarAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block">
      <MatchdayActionTile className="text-sm text-slate-200">{label}</MatchdayActionTile>
    </Link>
  );
}
