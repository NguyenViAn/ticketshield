"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  DollarSign,
  RefreshCcw,
  ShieldCheck,
  Siren,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useAdminSecurityContext } from "@/hooks/use-admin";
import { useAdminStats, useAdminTickets } from "@/hooks/use-admin";
import { buildDailyTrend } from "@/lib/admin-security";
import {
  AdminMetricCard,
  AdminMetricCardCompact,
  AdminPanel,
  AdminPanelHeader,
  EnforcementBadge,
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
    <div className="admin-surface-muted p-3 sm:p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-400 sm:mt-2 sm:text-sm">{hint}</p>
    </div>
  );
}

function aiTone(level: string | null) {
  if (level === "high") return "red" as const;
  if (level === "warning") return "amber" as const;
  if (level === "low") return "emerald" as const;
  return "neutral" as const;
}

function finalOutcomeLabel(outcome: "checkout_success" | "checkout_failed" | "blocked" | "in_progress" | "warning_acknowledged") {
  const labels = {
    checkout_success: "Success",
    checkout_failed: "Failed",
    blocked: "Blocked",
    in_progress: "In progress",
    warning_acknowledged: "Warning acknowledged",
  } as const;

  return labels[outcome];
}

export default function AdminDashboard() {
  const t = useTranslations("AdminDashboard");
  const locale = useLocale();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: tickets, isLoading: ticketsLoading } = useAdminTickets();
  const {
    data: securityCtx,
    isLoading: securityLoading,
    refetch: refetchSecurity,
  } = useAdminSecurityContext();

  const { summary, suspiciousSessions, topSuspiciousSessions } = securityCtx;

  const securityTrend = useMemo(
    () =>
      buildDailyTrend(
        suspiciousSessions.map((session) => session.timestamp),
      ),
    [suspiciousSessions],
  );
  const recentOrders = tickets.slice(0, 3);

  function handleSessionClick(rawSessionId: string) {
    router.push(`/${locale}/admin/ai-security?sessionId=${encodeURIComponent(rawSessionId)}`);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Row 1: Security Snapshot */}
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] 2xl:items-start">
        <AdminPanel className="p-4 sm:p-5 xl:p-6">
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Security snapshot</div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl xl:text-[2rem] 2xl:text-3xl">
                Review suspicious sessions before business summaries
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                This dashboard keeps anti-bot investigation first, then surfaces orders and revenue as secondary operational context.
              </p>
              {securityCtx.lastUpdatedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Last refreshed: {formatDate(securityCtx.lastUpdatedAt)}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:max-w-[720px]">
              <OverviewStat
                label="Monitored"
                value={String(summary.monitored)}
                hint="Grouped sessions"
              />
              <OverviewStat
                label="Suspicious"
                value={String(suspiciousSessions.length)}
                hint="Needs review"
              />
              <OverviewStat
                label="Avg risk"
                value={`${summary.avgRisk}%`}
                hint="Session score"
              />
            </div>
          </div>
        </AdminPanel>

        {/* Security Focus */}
        <AdminPanel>
          <AdminPanelHeader
            title="Security Focus"
            description="The signals that matter first in triage."
            action={<StatusPill tone="amber">{topSuspiciousSessions.length} listed</StatusPill>}
          />
          <div className="grid grid-cols-2 gap-2 p-4 sm:gap-3 sm:p-5 xl:p-6">
            <OverviewStat
              label="Warnings"
              value={String(summary.warned)}
              hint="Analyst review needed."
            />
            <OverviewStat
              label="Blocked"
              value={String(summary.blocked)}
              hint="Restricted by system rules."
            />
            <OverviewStat
              label="AI coverage"
              value={`${summary.aiCoverageRate}%`}
              hint={`${summary.noAiCheckSessions} without AI check.`}
            />
            <OverviewStat
              label="AI vs System"
              value={String(summary.aiBlockedMismatchCount)}
              hint="AI low but system blocked."
            />
          </div>
        </AdminPanel>
      </div>

      {/* Row 2: Recent Suspicious Sessions + Risk Monitoring */}
      <div className="grid gap-4 sm:gap-6 min-[1440px]:grid-cols-[minmax(0,1.4fr)_340px] min-[1680px]:grid-cols-[minmax(0,1.45fr)_360px] min-[1440px]:items-start">
        <AdminPanel className="self-start">
          <AdminPanelHeader
            title="Recent Suspicious Sessions"
            description="Only sessions with warning, block, AI risk, or failed-open status. Click to investigate."
            action={
              <div className="flex items-center gap-2">
                <StatusPill tone="amber">{topSuspiciousSessions.length} listed</StatusPill>
                <button
                  type="button"
                  onClick={() => void refetchSecurity()}
                  className="admin-button-muted inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            }
          />
          <div className="-mx-px overflow-x-auto">
            <table className="min-w-[680px] text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-5 py-4 sm:px-6">Session</th>
                  <th className="px-3 py-3 sm:px-5 sm:py-4">User</th>
                  <th className="px-3 py-3 sm:px-5 sm:py-4">AI Verdict</th>
                  <th className="px-3 py-3 sm:px-5 sm:py-4">Rule Decision</th>
                  <th className="hidden px-3 py-3 2xl:table-cell sm:px-5 sm:py-4">Enforcement</th>
                  <th className="px-3 py-3 sm:px-5 sm:py-4">Score</th>
                  <th className="hidden px-3 py-3 2xl:table-cell sm:px-5 sm:py-4">Outcome</th>
                  <th className="hidden px-3 py-3 xl:table-cell sm:px-5 sm:py-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {securityLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-white/6">
                      <td className="px-5 py-4 sm:px-6" colSpan={8}>
                        <div className="admin-skeleton h-12" />
                      </td>
                    </tr>
                  ))
                ) : topSuspiciousSessions.length ? (
                  topSuspiciousSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="admin-table-row cursor-pointer"
                      onClick={() => handleSessionClick(session.rawSessionId)}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-slate-200 sm:px-5 sm:py-4">{session.sessionId}</td>
                      <td className="px-3 py-3 text-slate-300 sm:px-5 sm:py-4">{session.user}</td>
                      <td className="px-3 py-3 sm:px-5 sm:py-4">
                        <StatusPill
                          tone={aiTone(
                            session.ai.latestRiskCheckStatus === "failed_open"
                              ? null
                              : session.ai.latestAiRiskLevel,
                          )}
                        >
                          {session.ai.latestRiskCheckStatus === "failed_open"
                            ? "Failed open"
                            : session.ai.latestAiRiskLevel ?? "No AI"}
                        </StatusPill>
                      </td>
                      <td className="px-3 py-3 sm:px-5 sm:py-4">
                        <StatusPill tone={session.decision === "block" ? "red" : session.decision === "warn" ? "amber" : "emerald"}>
                          {session.status}
                        </StatusPill>
                      </td>
                      <td className="hidden px-3 py-3 2xl:table-cell sm:px-5 sm:py-4">
                        <EnforcementBadge source={session.enforcementSource} />
                      </td>
                      <td className="px-3 py-3 sm:px-5 sm:py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 sm:h-4 sm:w-4" />
                          <span className="font-semibold text-white">{session.score}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 2xl:table-cell sm:px-5 sm:py-4">
                        <StatusPill
                          tone={
                            session.finalOutcome === "checkout_success"
                              ? "emerald"
                              : session.finalOutcome === "blocked" || session.finalOutcome === "checkout_failed"
                                ? "red"
                                : session.finalOutcome === "warning_acknowledged"
                                  ? "amber"
                                  : "neutral"
                          }
                        >
                          {finalOutcomeLabel(session.finalOutcome)}
                        </StatusPill>
                      </td>
                      <td className="hidden px-3 py-3 text-slate-500 xl:table-cell sm:px-5 sm:py-4">{session.reason}</td>
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

        <AdminPanel className="self-start">
          <AdminPanelHeader
            title="Risk Monitoring"
            description="Suspicious session trend over the last 7 days, plus decision breakdown."
            action={<StatusPill tone="amber">{summary.avgRisk}% avg risk</StatusPill>}
          />
          <div className="space-y-4 p-4 sm:space-y-5 sm:p-5 xl:p-6">
            <SparkBars values={securityTrend.map((item) => item.count)} tone="cyan" />
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 sm:gap-2 sm:text-xs">
              {securityTrend.map((item) => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <AdminMetricCardCompact label="Allow" value={String(summary.allowed)} tone="emerald" />
              <AdminMetricCardCompact label="Warn" value={String(summary.warned)} tone="amber" />
              <AdminMetricCardCompact label="Block" value={String(summary.blocked)} tone="red" />
              <AdminMetricCardCompact label="Failed-open" value={`${summary.failedOpenSessions} (${summary.failedOpenRate}%)`} tone="neutral" />
            </div>
          </div>
        </AdminPanel>
      </div>

      {/* Row 3: Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">
        <AdminMetricCard
          label="Monitored Sessions"
          value={String(summary.monitored)}
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
          label="Failed-open Sessions"
          value={String(summary.failedOpenSessions)}
          hint="Sessions where AI service was unavailable, checkout continued."
          icon={Siren}
          accent="red"
        />
        <AdminMetricCard
          label="AI High Verdicts"
          value={String(summary.aiHigh)}
          hint="High-risk AI checks recorded across monitored sessions."
          icon={Ban}
          accent="red"
        />
      </div>

      {/* Row 4: Recent Orders + Operations Context */}
      <div className="grid gap-4 sm:gap-6 min-[1440px]:grid-cols-[minmax(0,1.4fr)_340px] min-[1680px]:grid-cols-[minmax(0,1.45fr)_360px] min-[1440px]:items-start">
        <AdminPanel className="self-start">
          <AdminPanelHeader
            title="Recent Orders"
            description="Short business snapshot kept visible for operational context."
            action={<StatusPill tone="cyan"><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />Context</StatusPill>}
          />
          <div className="space-y-3 p-4 sm:p-5 xl:p-6">
            {ticketsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="admin-skeleton h-20 rounded-[22px]" />
              ))
            ) : recentOrders.length ? (
              recentOrders.map((ticket) => (
                <div key={ticket.id} className="admin-surface-muted p-4 opacity-85">
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

        <AdminPanel className="self-start">
          <AdminPanelHeader
            title="Operations Context"
            description="Compact business context kept visible during security review."
            action={<StatusPill tone="neutral">Secondary</StatusPill>}
          />
          <div className="grid gap-3 p-4 sm:gap-4 sm:p-5 xl:p-6">
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
    </div>
  );
}
