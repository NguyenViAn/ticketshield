"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  DollarSign,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { useAdminBookingEvents, useAdminMatches, useAdminStats, useAdminTickets, useBlockedUsers } from "@/hooks/use-admin";
import { buildDailyTrend, buildSecuritySessions, summarizeSecurity } from "@/lib/admin-security";
import {
  AdminMetricCard,
  AdminPanel,
  AdminPanelHeader,
  SparkBars,
  StatusPill,
} from "@/components/admin/admin-primitives";

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OverviewStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="admin-surface-muted p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const t = useTranslations("AdminDashboard");
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: tickets, isLoading: ticketsLoading } = useAdminTickets();
  const { data: bookingEvents, isLoading: bookingEventsLoading } = useAdminBookingEvents();
  const { data: matches, isLoading: matchesLoading } = useAdminMatches();
  const { data: blockedUsers } = useBlockedUsers();

  const sessions = useMemo(
    () => buildSecuritySessions(bookingEvents, matches, blockedUsers),
    [bookingEvents, matches, blockedUsers],
  );
  const securitySummary = useMemo(() => summarizeSecurity(sessions), [sessions]);
  const securityTrend = useMemo(
    () =>
      buildDailyTrend(
        sessions
          .filter((session) => session.decision !== "allow")
          .map((session) => session.timestamp),
      ),
    [sessions],
  );
  const suspiciousSessions = useMemo(
    () => sessions.filter((session) => session.decision !== "allow"),
    [sessions],
  );
  const uniqueSignals = useMemo(
    () =>
      new Set(
        suspiciousSessions.flatMap((session) =>
          session.reasons.filter((reason) => reason !== "Stable selection pattern"),
        ),
      ).size,
    [suspiciousSessions],
  );

  const recentOrders = tickets.slice(0, 5);
  const topSuspiciousSessions = suspiciousSessions.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <AdminMetricCard
          label="Monitored Sessions"
          value={String(securitySummary.monitored)}
          hint="Grouped booking sessions under review."
          icon={ShieldCheck}
          accent="cyan"
        />
        <AdminMetricCard
          label="Suspicious Sessions"
          value={String(securitySummary.warned + securitySummary.blocked)}
          hint="Warnings and blocked sessions in the latest scan."
          icon={AlertTriangle}
          accent="amber"
        />
        <AdminMetricCard
          label="Checkout Restrictions"
          value={String(securitySummary.blocked)}
          hint="Sessions blocked by explicit anti-abuse rules."
          icon={Ban}
          accent="red"
        />
        <AdminMetricCard
          label="Active Security Signals"
          value={String(uniqueSignals)}
          hint="Distinct suspicious patterns observed right now."
          icon={Activity}
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <AdminPanel>
          <AdminPanelHeader
            title="Risk Monitoring"
            description="Security-first overview of suspicious booking behaviour over the last 7 days."
            action={<StatusPill tone="amber">{securitySummary.avgRisk}% avg risk</StatusPill>}
          />
          <div className="space-y-5 p-5 sm:p-6">
            <SparkBars values={securityTrend.map((item) => item.count)} tone="cyan" />
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
              {securityTrend.map((item) => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <OverviewStat
                label={t("allow")}
                value={String(securitySummary.monitored - securitySummary.warned - securitySummary.blocked)}
                hint="Stable sessions with low risk."
              />
              <OverviewStat
                label={t("warn")}
                value={String(securitySummary.warned)}
                hint="Needs analyst review."
              />
              <OverviewStat
                label={t("block")}
                value={String(securitySummary.blocked)}
                hint="Restricted by security rules."
              />
            </div>

            <div className="rounded-[28px] border border-cyan-100 bg-cyan-50/80 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">Investigation focus</p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Suspicious session review takes priority</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    Start with warning and blocked sessions, then inspect event timelines and retry behaviour before moving to business summaries.
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live alerts</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{suspiciousSessions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="Operations Context"
            description="Secondary business signals kept visible for matchday monitoring."
            action={<StatusPill tone="neutral">Secondary</StatusPill>}
          />
          <div className="grid gap-4 p-5 sm:p-6">
            <OverviewStat
              label="Revenue"
              value={statsLoading ? "..." : formatCurrency(stats.totalRevenue)}
              hint="Gross platform revenue."
            />
            <OverviewStat
              label="Tickets Sold"
              value={statsLoading ? "..." : String(stats.ticketCount)}
              hint="Completed ticket orders."
            />
            <OverviewStat
              label="Managed Matches"
              value={statsLoading ? "..." : String(stats.matchCount)}
              hint="Fixtures currently active in admin."
            />
            <OverviewStat
              label="Blocked Accounts"
              value={statsLoading ? "..." : String(stats.blockedUserCount)}
              hint="Accounts flagged for abuse."
            />
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="Recent Suspicious Sessions"
            description="High-risk sessions sorted for fast review."
            action={<StatusPill tone="amber">{topSuspiciousSessions.length} listed</StatusPill>}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-5 py-4 sm:px-6">Session</th>
                  <th className="px-5 py-4 sm:px-6">User</th>
                  <th className="px-5 py-4 sm:px-6">Risk</th>
                  <th className="px-5 py-4 sm:px-6">Decision</th>
                  <th className="px-5 py-4 sm:px-6">Reason</th>
                </tr>
              </thead>
              <tbody>
                {bookingEventsLoading || matchesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-5 py-4 sm:px-6" colSpan={5}>
                        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : topSuspiciousSessions.length ? (
                  topSuspiciousSessions.map((session) => (
                    <tr key={session.id} className="admin-table-row">
                      <td className="px-5 py-4 font-mono text-xs text-slate-950 sm:px-6">{session.sessionId}</td>
                      <td className="px-5 py-4 sm:px-6">{session.user}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold text-slate-950">{session.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusPill tone={session.decision === "block" ? "red" : "amber"}>{session.status}</StatusPill>
                      </td>
                      <td className="px-5 py-4 text-slate-500 sm:px-6">{session.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-12 text-center text-slate-500 sm:px-6" colSpan={5}>
                      {t("empty_sessions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="Recent Orders"
            description="Business activity remains visible, but is secondary to session investigation."
            action={<StatusPill tone="cyan"><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />Context</StatusPill>}
          />
          <div className="space-y-3 p-5 sm:p-6">
            {ticketsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50" />
              ))
            ) : recentOrders.length ? (
              recentOrders.map((ticket) => (
                <div key={ticket.id} className="admin-surface-muted p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                        <Ticket className="h-4 w-4 text-cyan-600" />
                        <span>
                          {ticket.matches?.home_team} vs {ticket.matches?.away_team}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">Seat {ticket.seat}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(ticket.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">{formatCurrency(ticket.price_paid)}</div>
                      <div className="mt-2">
                        <StatusPill tone={ticket.status === "Cancelled" ? "red" : ticket.status === "Suspended" ? "amber" : "emerald"}>
                          {ticket.status}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                {t("empty_orders")}
              </div>
            )}

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Revenue context remains available for reporting and screenshots.</span>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
