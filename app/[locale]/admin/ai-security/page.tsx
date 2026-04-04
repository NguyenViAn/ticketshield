"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminMetricCard, AdminPanel, AdminPanelHeader } from "@/components/admin/admin-primitives";
import { SecuritySessionDetail } from "@/components/admin/security-session-detail";
import { SecuritySessionList } from "@/components/admin/security-session-list";
import { useAdminSecuritySessions } from "@/hooks/use-admin";
import type { SecurityDecision } from "@/lib/admin-security";

type FilterValue = "all" | SecurityDecision;

export default function AISecurityPage() {
  const locale = useLocale();
  const t = useTranslations("AdminAISecurity");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useAdminSecuritySessions();

  const filteredSessions = useMemo(
    () => data.sessions.filter((session) => filter === "all" || session.decision === filter),
    [data.sessions, filter],
  );
  const activeSessionId = filteredSessions.some((session) => session.id === selectedSessionId)
    ? selectedSessionId
    : filteredSessions[0]?.id ?? null;
  const selectedSession = filteredSessions.find((session) => session.id === activeSessionId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={t("metric_monitored")}
          value={isLoading ? "..." : data.summary.monitored.toString()}
          hint={t("metric_monitored_hint")}
          icon={ShieldCheck}
          accent="cyan"
        />
        <AdminMetricCard
          label={t("metric_warned")}
          value={isLoading ? "..." : data.summary.warned.toString()}
          hint={t("metric_warned_hint")}
          icon={AlertTriangle}
          accent="amber"
        />
        <AdminMetricCard
          label={t("metric_blocked")}
          value={isLoading ? "..." : data.summary.blocked.toString()}
          hint={t("metric_blocked_hint")}
          icon={ShieldX}
          accent="red"
        />
        <AdminMetricCard
          label={t("metric_avg_risk")}
          value={isLoading ? "..." : `${data.summary.avgRisk}%`}
          hint={t("metric_avg_risk_hint")}
          icon={ShieldAlert}
          accent="emerald"
        />
      </div>

      {error ? (
        <AdminPanel>
          <AdminPanelHeader
            title="Security monitor unavailable"
            description={error}
            action={
              <button
                type="button"
                onClick={() => void refetch()}
                className="admin-button-muted inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            }
          />
        </AdminPanel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <AdminPanel className="overflow-hidden">
          <AdminPanelHeader
            title="Security Session List"
            description="Grouped booking sessions sorted by higher risk first, then newest activity."
            action={
              <div className="flex flex-wrap gap-2">
                {(["all", "allow", "warn", "block"] as FilterValue[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`admin-focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                      filter === item
                        ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                        : "admin-button-muted text-slate-300"
                    }`}
                    onClick={() => setFilter(item)}
                  >
                    {t(`filter_${item}`)}
                  </button>
                ))}
              </div>
            }
          />
          <SecuritySessionList
            sessions={filteredSessions}
            selectedSessionId={activeSessionId}
            onSelect={setSelectedSessionId}
            locale={locale}
            isLoading={isLoading}
            emptyLabel={t("empty")}
          />
        </AdminPanel>

        <SecuritySessionDetail session={selectedSession} locale={locale} isLoading={isLoading} />
      </div>
    </div>
  );
}
