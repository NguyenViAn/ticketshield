"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, ShieldAlert, ShieldCheck, ShieldX, Siren } from "lucide-react";
import { useLocale } from "next-intl";

import { AdminMetricCard, AdminPanel, AdminPanelHeader } from "@/components/admin/admin-primitives";
import { SecuritySessionDetail } from "@/components/admin/security-session-detail";
import { SecuritySessionList } from "@/components/admin/security-session-list";
import { useAdminSecuritySessions } from "@/hooks/use-admin";
import type { AiRiskCheckStatus, AiRiskLevel, SecurityDecision } from "@/lib/admin-security";

type FilterValue = "all" | SecurityDecision;
type AiRiskFilterValue = "all" | AiRiskLevel;
type StepFilterValue = "all" | "seat_page" | "payment_pre_checkout";
type RiskStatusFilterValue = "all" | AiRiskCheckStatus;

const decisionFilters: [FilterValue, string][] = [
  ["all", "All sessions"],
  ["allow", "Allow"],
  ["warn", "Warn"],
  ["block", "Block"],
];

const aiFilters: [AiRiskFilterValue, string][] = [
  ["all", "All AI"],
  ["low", "Low"],
  ["warning", "Warning"],
  ["high", "High"],
];

const stepFilters: [StepFilterValue, string][] = [
  ["all", "All steps"],
  ["seat_page", "Seat page"],
  ["payment_pre_checkout", "Payment"],
];

const statusFilters: [RiskStatusFilterValue, string][] = [
  ["all", "All statuses"],
  ["passed", "Passed"],
  ["failed_open", "Failed open"],
];

function FilterGroup<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map(([item, itemLabel]) => (
          <button
            key={item}
            type="button"
            className={`admin-focus-ring rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
              value === item ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300" : "admin-button-muted text-slate-300"
            }`}
            onClick={() => onChange(item)}
          >
            {itemLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AISecurityPage() {
  const locale = useLocale();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [aiRiskFilter, setAiRiskFilter] = useState<AiRiskFilterValue>("all");
  const [stepFilter, setStepFilter] = useState<StepFilterValue>("all");
  const [riskStatusFilter, setRiskStatusFilter] = useState<RiskStatusFilterValue>("all");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useAdminSecuritySessions();

  const allowedSessions = Math.max(data.summary.monitored - data.summary.warned - data.summary.blocked, 0);

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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AdminPanel className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Monitor overview</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white xl:text-[2rem] 2xl:text-3xl">AI, rule-based, and fallback signals in one review flow</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Scan sessions on the left, then inspect the latest AI verdict, rule-based decision, and checkout outcome on the right.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[320px] 2xl:min-w-[360px]">
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Monitored</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">
                  {isLoading ? "..." : data.summary.monitored.toString()}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Blocked</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">
                  {isLoading ? "..." : data.summary.blocked.toString()}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Avg risk</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">
                  {isLoading ? "..." : `${data.summary.avgRisk}%`}
                </div>
              </div>
            </div>
          </div>
        </AdminPanel>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminMetricCard
            label="AI warnings"
            value={isLoading ? "..." : data.summary.aiWarning.toString()}
            hint="Sessions where AI asked for user confirmation or analyst review."
            icon={AlertTriangle}
            accent="amber"
          />
          <AdminMetricCard
            label="Failed-open"
            value={isLoading ? "..." : data.summary.aiFailedOpen.toString()}
            hint="Checks that continued because the AI service was unavailable."
            icon={Siren}
            accent="emerald"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        <AdminMetricCard
          label="AI checks"
          value={isLoading ? "..." : data.summary.aiChecks.toString()}
          hint="Total ai_risk_checked events captured across seat and payment flow."
          icon={ShieldCheck}
          accent="cyan"
        />
        <AdminMetricCard
          label="AI high verdicts"
          value={isLoading ? "..." : data.summary.aiHigh.toString()}
          hint="High-risk AI checks that should be reviewed first."
          icon={ShieldX}
          accent="red"
        />
        <AdminMetricCard
          label="Sessions with AI high"
          value={isLoading ? "..." : data.summary.sessionsWithAiHigh.toString()}
          hint="Sessions containing at least one high AI verdict in their timeline."
          icon={ShieldAlert}
          accent="amber"
        />
        <AdminMetricCard
          label="Decision mix"
          value={isLoading ? "..." : `${allowedSessions}/${data.summary.warned}/${data.summary.blocked}`}
          hint="Allow, warn, and block counts across grouped security sessions."
          icon={ShieldCheck}
          accent="cyan"
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

      <div className="grid gap-6 xl:grid-cols-[312px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <AdminPanel className="overflow-hidden">
          <AdminPanelHeader
            title="Security Session List"
            description="Grouped sessions with latest decision, AI verdict, and recent activity."
            action={
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{filteredSessions.length} sessions</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="admin-button-muted inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            }
          />
          <div className="grid gap-4 border-b border-white/6 px-4 py-4 sm:px-5 xl:grid-cols-1 2xl:grid-cols-2">
            <FilterGroup label="Decision" value={filter} items={decisionFilters} onChange={setFilter} />
            <FilterGroup label="AI verdict" value={aiRiskFilter} items={aiFilters} onChange={setAiRiskFilter} />
            <FilterGroup label="Step" value={stepFilter} items={stepFilters} onChange={setStepFilter} />
            <FilterGroup label="Risk status" value={riskStatusFilter} items={statusFilters} onChange={setRiskStatusFilter} />
          </div>
          <SecuritySessionList
            sessions={filteredSessions}
            selectedSessionId={activeSessionId}
            onSelect={setSelectedSessionId}
            locale={locale}
            isLoading={isLoading}
            emptyLabel="No sessions match the current filters."
          />
        </AdminPanel>

        <SecuritySessionDetail session={selectedSession} locale={locale} isLoading={isLoading} />
      </div>
    </div>
  );
}
