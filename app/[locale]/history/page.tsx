"use client";

import { useEffect, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
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
import { groupTicketsByBooking } from "@/lib/bookings";
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
  const bookingGroups = useMemo(() => groupTicketsByBooking(tickets), [tickets]);

  const summary = useMemo(() => {
    const activeBookings = bookingGroups.filter((group) => group.status === "Active");
    const upcomingBookings = activeBookings.filter(
      (group) => new Date(group.tickets[0]?.matches?.date ?? group.latestCreatedAt) > new Date()
    );
    const spentTotal = bookingGroups.reduce((sum, group) => sum + group.totalPrice, 0);
    const latestBooking = bookingGroups[0] ?? null;

    return {
      latestBooking,
      spentTotal,
      totalBookings: bookingGroups.length,
      upcomingBookings: upcomingBookings.length,
      activeBookings: activeBookings.length,
    };
  }, [bookingGroups]);

  const isLoading = authLoading || ticketsLoading;
  const showError = Boolean(ticketsError) && !isLoading;

  if (!isLoggedIn && !authLoading) {
    return null;
  }

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="page-shell">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
                <Wallet className="h-3.5 w-3.5" />
                Booking wallet
              </div>
              <h1 className="mt-5 text-5xl font-heading font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{t("subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <QuickAction
                href="/matches"
                title="Browse matches"
                description="Start a new booking with up to 4 seats."
              />
              <QuickAction
                href="/profile"
                title="Open profile"
                description="Review your wallet and account summary."
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-4">
          <MatchdayStatCard
            label="Bookings"
            value={summary.totalBookings.toString()}
            accent="emerald"
            icon={<Ticket className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label="Active groups"
            value={summary.activeBookings.toString()}
            accent="cyan"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label="Upcoming"
            value={summary.upcomingBookings.toString()}
            accent="slate"
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <MatchdayStatCard
            label={t("value")}
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
            ) : bookingGroups.length === 0 ? (
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
                {bookingGroups.map((group) => {
                  const referenceTicket = group.tickets[0];
                  const eventDate = referenceTicket?.matches?.date
                    ? new Date(referenceTicket.matches.date).toLocaleString(locale)
                    : new Date(group.latestCreatedAt).toLocaleString(locale);

                  return (
                    <motion.div key={group.bookingGroupId} variants={itemVariant}>
                      <MatchdayPanel className="transition-all hover:border-emerald-400/18" padding="p-5">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm text-slate-400">
                                Group: {group.bookingGroupId.slice(0, 8).toUpperCase()}
                              </span>
                              {group.status === "Active" ? (
                                <MatchdayStatusPill icon={CheckCircle2} label="ACTIVE" tone="emerald" />
                              ) : (
                                <MatchdayStatusPill icon={XCircle} label="CANCELLED" tone="slate" />
                              )}
                            </div>

                            <h3 className="text-3xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                              {group.matchTitle}
                            </h3>
                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                              <MatchdayMetaPill icon={MapPin} toneClassName="text-rose-300">
                                {referenceTicket?.matches?.stadium || t("unknown_match")}
                              </MatchdayMetaPill>
                              <MatchdayMetaPill icon={CalendarClock} toneClassName="text-cyan-300">
                                {eventDate}
                              </MatchdayMetaPill>
                              <MatchdayMetaPill icon={Ticket} toneClassName="text-emerald-300">
                                {group.seatCount} seat{group.seatCount > 1 ? "s" : ""}
                              </MatchdayMetaPill>
                            </div>
                            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                              Seats: {group.seats.join(", ")}
                            </div>
                          </div>

                          <div className="page-card-muted p-4 xl:min-w-[280px]">
                            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Booking total</div>
                            <div className="mt-2 text-3xl font-heading font-black tracking-[-0.03em] text-emerald-300">
                              {group.totalPrice.toLocaleString(locale)} VND
                            </div>

                            <Link href={`/history/${group.primaryTicketId}` as never} className="mt-4 block">
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
                title="Latest booking"
                icon={<ShieldCheck className="h-5 w-5 text-cyan-300" />}
              />
              {summary.latestBooking ? (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Seats in latest group
                  </div>
                  <div className="mt-3 text-2xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                    {summary.latestBooking.matchTitle}
                  </div>
                  <div className="mt-3 text-sm text-slate-300">
                    {summary.latestBooking.seats.join(", ")}
                  </div>
                </>
              ) : (
                <div className="text-sm leading-6 text-slate-300">
                  No booking groups yet.
                </div>
              )}
            </MatchdayPanel>

            <MatchdayPanel>
              <MatchdayPanelHeader
                title="Next actions"
                icon={<Wallet className="h-5 w-5 text-emerald-300" />}
              />
              <div className="space-y-3">
                <SidebarAction
                  href="/matches"
                  label="Start another protected booking"
                />
                <SidebarAction
                  href="/profile"
                  label="Review wallet and profile"
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
