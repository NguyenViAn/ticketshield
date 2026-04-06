"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert, ShieldCheck, ShieldX, Siren } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminMetricCard, AdminPanel, AdminPanelHeader } from "@/components/admin/admin-primitives";
import { SecuritySessionDetail } from "@/components/admin/security-session-detail";
import { SecuritySessionList } from "@/components/admin/security-session-list";
import { useAdminSecuritySessions } from "@/hooks/use-admin";
import type { AiRiskCheckStatus, AiRiskLevel, SecurityDecision } from "@/lib/admin-security";

type FilterValue = "all" | SecurityDecision;
type AiRiskFilterValue = "all" | AiRiskLevel;
type StepFilterValue = "all" | "seat_page" | "payment_pre_checkout";
type RiskStatusFilterValue = "all" | AiRiskCheckStatus;

export default function AISecurityPage() {
  const locale = useLocale();
  const t = useTranslations("AdminAISecurity");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [aiRiskFilter, setAiRiskFilter] = useState<AiRiskFilterValue>("all");
  const [stepFilter, setStepFilter] = useState<StepFilterValue>("all");
  const [riskStatusFilter, setRiskStatusFilter] = useState<RiskStatusFilterValue>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useAdminSecuritySessions();

  const filteredSessions = useMemo(
    () =>
      data.sessions.filter((session) => {
        if (filter !== "all" && session.decision !== filter) {
          return false;
        }

        if (aiRiskFilter !== "all" && session.ai.latestAiRiskLevel !== aiRiskFilter) {
          return false;
        }

        if (stepFilter !== "all" && session.ai.latestAiStep !== stepFilter) {
          return false;
        }

        if (riskStatusFilter !== "all" && session.ai.latestRiskCheckStatus !== riskStatusFilter) {
          return false;
        }

        return true;
      }),
    [aiRiskFilter, data.sessions, filter, riskStatusFilter, stepFilter],
  );
  const activeSessionId = filteredSessions.some((session) => session.id === selectedSessionId)
    ? selectedSessionId
    : filteredSessions[0]?.id ?? null;
  const selectedSession = filteredSessions.find((session) => session.id === activeSessionId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="AI checks"
          value={isLoading ? "..." : data.summary.aiChecks.toString()}
          hint="Total ai_risk_checked events captured across seat and payment flow."
          icon={ShieldCheck}
          accent="cyan"
        />
        <AdminMetricCard
          label="AI warnings"
          value={isLoading ? "..." : data.summary.aiWarning.toString()}
          hint="Warning verdicts requiring analyst review or user confirmation."
          icon={AlertTriangle}
          accent="amber"
        />
        <AdminMetricCard
          label="AI high verdicts"
          value={isLoading ? "..." : data.summary.aiHigh.toString()}
          hint="High-risk AI checks that should be investigated first."
          icon={ShieldX}
          accent="red"
        />
        <AdminMetricCard
          label="Failed-open checks"
          value={isLoading ? "..." : data.summary.aiFailedOpen.toString()}
          hint="Checks where AI was unavailable and checkout followed fallback policy."
          icon={Siren}
          accent="emerald"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={t("metric_monitored")}
          value={isLoading ? "..." : data.summary.monitored.toString()}
          hint={t("metric_monitored_hint")}
          icon={ShieldCheck}
          accent="cyan"
        />
        <AdminMetricCard
          label="Sessions with AI high"
          value={isLoading ? "..." : data.summary.sessionsWithAiHigh.toString()}
          hint="Sessions containing at least one high AI verdict in their timeline."
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
            description="Grouped booking sessions with rule-based and AI verdict context side by side."
            action={
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{filteredSessions.length} sessions</span>
              </div>
            }
          />
          <div className="space-y-3 border-b border-white/6 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", t("filter_all")],
                ["allow", t("filter_allow")],
                ["warn", t("filter_warn")],
                ["block", t("filter_block")],
              ] as [FilterValue, string][]).map(([item, label]) => (
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
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All AI"],
                ["low", "AI low"],
                ["warning", "AI warning"],
                ["high", "AI high"],
              ] as [AiRiskFilterValue, string][]).map(([item, label]) => (
                <button
                  key={item}
                  type="button"
                  className={`admin-focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    aiRiskFilter === item
                      ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                      : "admin-button-muted text-slate-300"
                  }`}
                  onClick={() => setAiRiskFilter(item)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All steps"],
                ["seat_page", "Seat page"],
                ["payment_pre_checkout", "Payment pre-check"],
              ] as [StepFilterValue, string][]).map(([item, label]) => (
                <button
                  key={item}
                  type="button"
                  className={`admin-focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    stepFilter === item
                      ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                      : "admin-button-muted text-slate-300"
                  }`}
                  onClick={() => setStepFilter(item)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "All statuses"],
                ["passed", "Passed"],
                ["failed_open", "Failed open"],
              ] as [RiskStatusFilterValue, string][]).map(([item, label]) => (
                <button
                  key={item}
                  type="button"
                  className={`admin-focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    riskStatusFilter === item
                      ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                      : "admin-button-muted text-slate-300"
                  }`}
                  onClick={() => setRiskStatusFilter(item)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
