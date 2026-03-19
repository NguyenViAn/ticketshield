"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { AdminMetricCard, AdminPanel, AdminPanelHeader, StatusPill } from "@/components/admin/admin-primitives";
import { useAdminMatches, useAdminTickets, useBlockedUsers } from "@/hooks/use-admin";
import { buildSecuritySessions, summarizeSecurity } from "@/lib/admin-security";

type FilterValue = "all" | "allow" | "warn" | "block";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function decisionTone(decision: "allow" | "warn" | "block") {
  if (decision === "allow") return "emerald";
  if (decision === "warn") return "amber";
  return "red";
}

export default function AISecurityPage() {
  const locale = useLocale();
  const t = useTranslations("AdminAISecurity");
  const [filter, setFilter] = useState<FilterValue>("all");
  const { data: tickets, isLoading: ticketsLoading } = useAdminTickets();
  const { data: matches } = useAdminMatches();
  const { data: blockedUsers } = useBlockedUsers();

  const sessions = useMemo(
    () => buildSecuritySessions(tickets, matches, blockedUsers),
    [tickets, matches, blockedUsers]
  );
  const summary = useMemo(() => summarizeSecurity(sessions), [sessions]);
  const filteredSessions = sessions.filter((session) => filter === "all" || session.decision === filter);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label={t("metric_monitored")} value={summary.monitored.toString()} hint={t("metric_monitored_hint")} icon={ShieldCheck} accent="cyan" />
        <AdminMetricCard label={t("metric_warned")} value={summary.warned.toString()} hint={t("metric_warned_hint")} icon={AlertTriangle} accent="amber" />
        <AdminMetricCard label={t("metric_blocked")} value={summary.blocked.toString()} hint={t("metric_blocked_hint")} icon={ShieldX} accent="red" />
        <AdminMetricCard label={t("metric_avg_risk")} value={`${summary.avgRisk}%`} hint={t("metric_avg_risk_hint")} icon={ShieldAlert} accent="emerald" />
      </div>

      <AdminPanel>
        <AdminPanelHeader
          title={t("panel_title")}
          description={t("panel_desc")}
          action={
            <div className="flex flex-wrap gap-2">
              {(["all", "allow", "warn", "block"] as FilterValue[]).map((item) => (
                <button
                  key={item}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    filter === item
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {t(`filter_${item}`)}
                </button>
              ))}
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-5 py-4 sm:px-6">{t("col_session_id")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_user")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_match")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_score")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_decision")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_reasons")}</th>
                <th className="px-5 py-4 sm:px-6">{t("col_timestamp")}</th>
              </tr>
            </thead>
            <tbody>
              {ticketsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td className="px-5 py-4 sm:px-6" colSpan={7}>
                      <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : filteredSessions.length ? (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="admin-table-row">
                    <td className="px-5 py-4 font-mono text-xs text-white sm:px-6">{session.sessionId}</td>
                    <td className="px-5 py-4 sm:px-6">{session.user}</td>
                    <td className="px-5 py-4 sm:px-6">{session.match}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <span className="font-semibold text-white">{session.score}</span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <StatusPill tone={decisionTone(session.decision)}>{t(`filter_${session.decision}`)}</StatusPill>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        {session.reasons.map((reason) => (
                          <span key={reason} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 sm:px-6">{formatDate(session.timestamp, locale)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12 text-center text-slate-400 sm:px-6" colSpan={7}>
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </div>
  );
}
