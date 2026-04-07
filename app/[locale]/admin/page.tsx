"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  DollarSign,
  RefreshCcw,
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
      <p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const t = useTranslations("AdminDashboard");
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: tickets, isLoading: ticketsLoading } = useAdminTickets();
  const { data: bookingEvents, isLoading: bookingEventsLoading, refetch: refetchBookingEvents } = useAdminBookingEvents();
  const { data: matches, isLoading: matchesLoading } = useAdminMatches();
  const { data: blockedUsers } = useBlockedUsers();

  const sessions = useMemo(
    () => buildSecuritySessions(bookingEvents, matches, blockedUsers),
    [bookingEvents, matches, blockedUsers],
  );
  const securitySummary = useMemo(() => summarizeSecurity(sessions), [sessions]);
  const allowedSessions = Math.max(securitySummary.monitored - securitySummary.warned - securitySummary.blocked, 0);
  const securityTrend = useMemo(
    () =>
      buildDailyTrend(
        sessions
          .filter(
            (session) =>
              session.decision !== "allow" ||
              session.ai.latestAiRiskLevel === "warning" ||
              session.ai.latestAiRiskLevel === "high",
          )
          .map((session) => session.timestamp),
      ),
    [sessions],
  );
  const suspiciousSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.decision !== "allow" ||
          session.ai.latestAiRiskLevel === "warning" ||
          session.ai.latestAiRiskLevel === "high" ||
          session.ai.latestRiskCheckStatus === "failed_open",
      ),
    [sessions],
  );
  const recentOrders = tickets.slice(0, 3);
  const topSuspiciousSessions = suspiciousSessions.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <AdminPanel className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Security snapshot</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white xl:text-[2rem] 2xl:text-3xl">
                Review suspicious sessions before business summaries
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                This dashboard keeps anti-bot investigation first, then surfaces orders and revenue as secondary operational context.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <OverviewStat
                label="Monitored"
                value={String(securitySummary.monitored)}
                hint="Grouped sessions"
              />
              <OverviewStat
                label="Suspicious"
                value={String(suspiciousSessions.length)}
                hint="Needs review"
              />
              <OverviewStat
                label="Avg risk"
                value={`${securitySummary.avgRisk}%`}
                hint="Session score"
              />
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="Security Focus"
            description="The signals that matter first in triage."
            action={<StatusPill tone="amber">{topSuspiciousSessions.length} listed</StatusPill>}
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <OverviewStat
              label="Warnings"
              value={String(securitySummary.warned)}
              hint="Analyst review needed."
            />
            <OverviewStat
              label="Blocked"
              value={String(securitySummary.blocked)}
              hint="Restricted by system rules."
            />
            <OverviewStat
              label="AI high"
              value={String(securitySummary.aiHigh)}
              hint="High AI verdicts seen."
            />
            <OverviewStat
              label="Failed-open"
              value={String(securitySummary.aiFailedOpen)}
              hint="Fallback checkout cases."
            />
          </div>
        </AdminPanel>
      </div>

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
          value={String(suspiciousSessions.length)}
          hint="Sessions flagged by heuristic rules or the latest AI verdict."
          icon={AlertTriangle}
          accent="amber"
        />
        <AdminMetricCard
          label="AI High Verdicts"
          value={String(securitySummary.aiHigh)}
          hint="High-risk AI checks recorded across monitored sessions."
          icon={Ban}
          accent="red"
        />
        <AdminMetricCard
          label="AI Checks Logged"
          value={String(securitySummary.aiChecks)}
          hint="Seat-page and payment pre-check verdicts stored in booking_events."
          icon={Activity}
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px] 2xl:grid-cols-[minmax(0,1.5fr)_360px]">
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
                value={String(allowedSessions)}
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
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title="Operations Context"
            description="Compact business context kept visible during security review."
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <AdminPanel>
          <AdminPanelHeader
            title="Recent Suspicious Sessions"
            description="Only sessions with warning, block, AI risk, or failed-open status are shown."
            action={
              <div className="flex items-center gap-2">
                <StatusPill tone="amber">{topSuspiciousSessions.length} listed</StatusPill>
                <button
                  type="button"
                  onClick={() => void refetchBookingEvents()}
                  className="admin-button-muted inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-5 py-4 sm:px-6">Session</th>
                  <th className="px-5 py-4 sm:px-6">User</th>
                  <th className="px-5 py-4 sm:px-6">Risk</th>
                  <th className="px-5 py-4 sm:px-6">Decision</th>
                  <th className="px-5 py-4 sm:px-6">AI Risk</th>
                  <th className="px-5 py-4 sm:px-6">Confidence</th>
                  <th className="px-5 py-4 sm:px-6">Last checked</th>
                  <th className="px-5 py-4 sm:px-6">Reason</th>
                </tr>
              </thead>
              <tbody>
                {bookingEventsLoading || matchesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-white/6">
                      <td className="px-5 py-4 sm:px-6" colSpan={8}>
                        <div className="admin-skeleton h-12" />
                      </td>
                    </tr>
                  ))
                ) : topSuspiciousSessions.length ? (
                  topSuspiciousSessions.map((session) => (
                    <tr key={session.id} className="admin-table-row">
                      <td className="px-5 py-4 font-mono text-xs text-slate-200 sm:px-6">{session.sessionId}</td>
                      <td className="px-5 py-4 text-slate-300 sm:px-6">{session.user}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="font-semibold text-white">{session.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusPill tone={session.decision === "block" ? "red" : "amber"}>{session.status}</StatusPill>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusPill
                          tone={
                            session.ai.latestAiRiskLevel === "high"
                              ? "red"
                              : session.ai.latestAiRiskLevel === "warning"
                                ? "amber"
                                : session.ai.latestAiRiskLevel === "low"
                                  ? "emerald"
                                  : "neutral"
                          }
                        >
                          {session.ai.latestAiRiskLevel ?? "No AI check"}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-slate-300 sm:px-6">
                        {typeof session.ai.latestAiConfidence === "number"
                          ? `${(session.ai.latestAiConfidence * 100).toFixed(1)}%`
                          : "--"}
                      </td>
                      <td className="px-5 py-4 text-slate-500 sm:px-6">
                        {session.ai.latestAiCheckedAt ? formatDate(session.ai.latestAiCheckedAt) : "--"}
                      </td>
                      <td className="px-5 py-4 text-slate-500 sm:px-6">{session.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-12 text-center text-slate-500 sm:px-6" colSpan={8}>
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
            description="Short business snapshot kept visible for operational context."
            action={<StatusPill tone="cyan"><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />Context</StatusPill>}
          />
          <div className="space-y-3 p-5 sm:p-6">
            {ticketsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="admin-skeleton h-20 rounded-[22px]" />
              ))
            ) : recentOrders.length ? (
              recentOrders.map((ticket) => (
                <div key={ticket.id} className="admin-surface-muted p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <Ticket className="h-4 w-4 text-cyan-300" />
                        <span>
                          {ticket.matches?.home_team} vs {ticket.matches?.away_team}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">Seat {ticket.seat}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(ticket.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(ticket.price_paid)}</div>
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
              <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-5 py-10 text-center text-sm text-slate-400">
                {t("empty_orders")}
              </div>
            )}

            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-slate-300">
                <DollarSign className="h-4 w-4 text-cyan-300" />
                <span className="text-sm font-medium">Revenue context remains available for reporting and screenshots.</span>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
