"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  ShieldBan,
  ShoppingCart,
  Swords,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useAdminMatches, useAdminStats, useAdminTickets, useBlockedUsers } from "@/hooks/use-admin";
import { buildDailyTrend, buildSecuritySessions, summarizeSecurity } from "@/lib/admin-security";
import {
  AdminMetricCard,
  AdminPanel,
  AdminPanelHeader,
  SparkBars,
  StatusPill,
} from "@/components/admin/admin-primitives";
import { useTranslations } from "next-intl";

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

export default function AdminDashboard() {
  const t = useTranslations("AdminDashboard");
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: tickets, isLoading: ticketsLoading } = useAdminTickets();
  const { data: matches, isLoading: matchesLoading } = useAdminMatches();
  const { data: blockedUsers } = useBlockedUsers();

  const sessions = useMemo(
    () => buildSecuritySessions(tickets, matches, blockedUsers),
    [tickets, matches, blockedUsers]
  );
  const securitySummary = useMemo(() => summarizeSecurity(sessions), [sessions]);
  const salesTrend = useMemo(() => buildDailyTrend(tickets.map((ticket) => ticket.created_at)), [tickets]);
  const securityTrend = useMemo(
    () =>
      buildDailyTrend(
        sessions
          .filter((session) => session.decision !== "allow")
          .map((session) => session.timestamp)
      ),
    [sessions]
  );

  const recentOrders = tickets.slice(0, 6);
  const suspiciousSessions = sessions.filter((session) => session.decision !== "allow").slice(0, 6);
  const peakSalesDay = salesTrend.reduce(
    (best, current) => (current.count > best.count ? current : best),
    salesTrend[0] ?? { key: "", label: "--", count: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <AdminMetricCard
          label={t("metric_matches")}
          value={statsLoading ? "..." : String(stats.matchCount)}
          hint={t("metric_matches_hint")}
          icon={Swords}
          accent="emerald"
        />
        <AdminMetricCard
          label={t("metric_tickets")}
          value={statsLoading ? "..." : String(stats.ticketCount)}
          hint={t("metric_tickets_hint")}
          icon={Ticket}
          accent="cyan"
        />
        <AdminMetricCard
          label={t("metric_revenue")}
          value={statsLoading ? "..." : formatCurrency(stats.totalRevenue)}
          hint={t("metric_revenue_hint")}
          icon={DollarSign}
          accent="emerald"
        />
        <AdminMetricCard
          label={t("metric_blocked")}
          value={statsLoading ? "..." : String(stats.blockedUserCount)}
          hint={t("metric_blocked_hint")}
          icon={ShieldBan}
          accent="red"
        />
        <AdminMetricCard
          label={t("metric_alerts")}
          value={String(securitySummary.warned + securitySummary.blocked)}
          hint={t("metric_alerts_hint")}
          icon={ShieldAlert}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_1fr]">
        <AdminPanel>
          <AdminPanelHeader
            title={t("sales_title")}
            description={t("sales_desc")}
            action={<StatusPill tone="emerald">{t("sales_badge")}</StatusPill>}
          />
          <div className="p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <SparkBars values={salesTrend.map((item) => item.count)} tone="emerald" />
                <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
                  {salesTrend.map((item) => (
                    <span key={item.key}>{item.label}</span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="admin-surface-muted p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                    <span className="text-sm">{t("peak_day")}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">{peakSalesDay.label}</div>
                </div>
                <div className="admin-surface-muted p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShoppingCart className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm">{t("recent_orders_count")}</span>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">{tickets.length}</div>
                </div>
                <div className="admin-surface-muted p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Activity className="h-4 w-4 text-amber-300" />
                    <span className="text-sm">{t("conversion_watch")}</span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-slate-300">{t("conversion_desc")}</div>
                </div>
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            title={t("risk_title")}
            description={t("risk_desc")}
            action={<StatusPill tone="amber">{t("risk_badge", { risk: securitySummary.avgRisk })}</StatusPill>}
          />
          <div className="p-5 sm:p-6">
            <SparkBars values={securityTrend.map((item) => item.count)} tone="cyan" />
            <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
              {securityTrend.map((item) => (
                <span key={item.key}>{item.label}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="admin-surface-muted p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t("allow")}</p>
                <p className="mt-2 text-xl font-bold text-white">{securitySummary.monitored - securitySummary.warned - securitySummary.blocked}</p>
              </div>
              <div className="admin-surface-muted p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t("warn")}</p>
                <p className="mt-2 text-xl font-bold text-amber-300">{securitySummary.warned}</p>
              </div>
              <div className="admin-surface-muted p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t("block")}</p>
                <p className="mt-2 text-xl font-bold text-red-300">{securitySummary.blocked}</p>
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <AdminPanel>
          <AdminPanelHeader title={t("recent_orders_title")} description={t("recent_orders_desc")} />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-5 py-4 sm:px-6">{t("col_match")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_seat")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_price")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_status")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_time")}</th>
                </tr>
              </thead>
              <tbody>
                {ticketsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="px-5 py-4 sm:px-6" colSpan={5}>
                        <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
                      </td>
                    </tr>
                  ))
                ) : recentOrders.length ? (
                  recentOrders.map((ticket) => (
                    <tr key={ticket.id} className="admin-table-row">
                      <td className="px-5 py-4 font-medium text-white sm:px-6">
                        {ticket.matches?.home_team} vs {ticket.matches?.away_team}
                      </td>
                      <td className="px-5 py-4 sm:px-6">{ticket.seat}</td>
                      <td className="px-5 py-4 sm:px-6">{formatCurrency(ticket.price_paid)}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusPill tone={ticket.status === "Cancelled" ? "red" : ticket.status === "Suspended" ? "amber" : "emerald"}>
                          {ticket.status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-4 text-slate-400 sm:px-6">{formatDate(ticket.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-12 text-center text-slate-400 sm:px-6" colSpan={5}>
                      {t("empty_orders")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader title={t("recent_suspicious_title")} description={t("recent_suspicious_desc")} />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-5 py-4 sm:px-6">{t("col_session")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_user")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_risk")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_decision")}</th>
                  <th className="px-5 py-4 sm:px-6">{t("col_reasons")}</th>
                </tr>
              </thead>
              <tbody>
                {matchesLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="px-5 py-4 sm:px-6" colSpan={5}>
                        <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
                      </td>
                    </tr>
                  ))
                ) : suspiciousSessions.length ? (
                  suspiciousSessions.map((session) => (
                    <tr key={session.id} className="admin-table-row">
                      <td className="px-5 py-4 font-mono text-xs text-white sm:px-6">{session.sessionId}</td>
                      <td className="px-5 py-4 sm:px-6">{session.user}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-300" />
                          <span className="font-semibold text-white">{session.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusPill tone={session.decision === "block" ? "red" : "amber"}>{session.decision}</StatusPill>
                      </td>
                      <td className="px-5 py-4 text-slate-400 sm:px-6">{session.reasons.join(", ")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-5 py-12 text-center text-slate-400 sm:px-6" colSpan={5}>
                      {t("empty_sessions")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
