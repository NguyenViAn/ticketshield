"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  RefreshCcw,
  Siren,
} from "lucide-react";
import { useLocale } from "next-intl";

import {
  AdminMetricCardCompact,
  AdminPanel,
  AdminPanelHeader,
  StatusPill,
} from "@/components/admin/admin-primitives";
import { SecuritySessionDetail } from "@/components/admin/security-session-detail";
import { SecuritySessionList } from "@/components/admin/security-session-list";
import { useAdminSecurityContext } from "@/hooks/use-admin";
import type { AiRiskCheckStatus, AiRiskLevel, SecurityDecision } from "@/lib/admin-security";

type FilterValue = "all" | SecurityDecision;
type AiRiskFilterValue = "all" | AiRiskLevel;
type StepFilterValue = "all" | "seat_page" | "payment_pre_checkout";
type RiskStatusFilterValue = "all" | AiRiskCheckStatus;
type QuickFilterValue = "all" | "blocked_now" | "ai_warning" | "failed_open" | "resolved" | "no_ai_check";

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

const quickFilters: [QuickFilterValue, string][] = [
  ["all", "All"],
  ["blocked_now", "Blocked now"],
  ["ai_warning", "AI warning"],
  ["failed_open", "Failed-open"],
  ["resolved", "Resolved normal"],
  ["no_ai_check", "No AI check"],
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

function AISecurityContent() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("sessionId");

  const [filter, setFilter] = useState<FilterValue>("all");
  const [aiRiskFilter, setAiRiskFilter] = useState<AiRiskFilterValue>("all");
  const [stepFilter, setStepFilter] = useState<StepFilterValue>("all");
  const [riskStatusFilter, setRiskStatusFilter] = useState<RiskStatusFilterValue>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilterValue>("all");
  const [manualSelectedSessionId, setManualSelectedSessionId] = useState<string | null>(null);

  const { data, error, isLoading, refetch } = useAdminSecurityContext();

  const filteredSessions = useMemo(
    () =>
      data.sessions.filter((session) => {
        if (quickFilter !== "all") {
          switch (quickFilter) {
            case "blocked_now":
              if (session.decision !== "block") return false;
              break;
            case "ai_warning":
              if (session.ai.latestAiRiskLevel !== "warning" && session.ai.latestAiRiskLevel !== "high") return false;
              break;
            case "failed_open":
              if (session.ai.latestRiskCheckStatus !== "failed_open") return false;
              break;
            case "resolved":
              if (session.isSuspicious || session.decision !== "allow") return false;
              break;
            case "no_ai_check":
              if (session.ai.aiCheckCount > 0) return false;
              break;
          }
        }

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
    [aiRiskFilter, data.sessions, filter, quickFilter, riskStatusFilter, stepFilter],
  );

  const effectiveSelectedId = urlSessionId ?? manualSelectedSessionId;
  const activeSessionId = filteredSessions.some((session) => session.id === effectiveSelectedId)
    ? effectiveSelectedId
    : filteredSessions[0]?.id ?? null;
  const selectedSession = filteredSessions.find((session) => session.id === activeSessionId) ?? null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] 2xl:items-start">
        <AdminPanel className="p-4 sm:p-5 xl:p-6">
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Investigation center</div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl xl:text-[2rem] 2xl:text-3xl">
                AI, rule-based, and fallback signals in one review flow
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Scan sessions on the left, then inspect AI verdict, rule-based decision, and system enforcement on the right.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:max-w-[720px]">
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Monitored</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">{isLoading ? "..." : data.summary.monitored.toString()}</div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Blocked</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">{isLoading ? "..." : data.summary.blocked.toString()}</div>
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Avg risk</div>
                <div className="mt-2 text-3xl font-black leading-none text-white">{isLoading ? "..." : `${data.summary.avgRisk}%`}</div>
              </div>
            </div>
          </div>
        </AdminPanel>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminPanel className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">AI warnings</div>
                <div className="mt-2 text-4xl font-black leading-none text-white">
                  {isLoading ? "..." : data.summary.aiWarning.toString()}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Sessions where AI asked for user confirmation or analyst review.</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/18 bg-amber-400/10 text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </span>
            </div>
          </AdminPanel>
          <AdminPanel className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Failed-open</div>
                <div className="mt-2 text-4xl font-black leading-none text-white">
                  {isLoading ? "..." : data.summary.failedOpenSessions.toString()}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">Sessions where AI service was unavailable, checkout continued.</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/18 bg-rose-500/10 text-rose-300">
                <Siren className="h-5 w-5" />
              </span>
            </div>
          </AdminPanel>
        </div>
      </div>

      <AdminPanel className="p-4 sm:p-5 xl:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Signal summary</div>
            <p className="mt-1 text-sm text-slate-400">Compact AI and fallback counters kept above the session review workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="neutral">{data.summary.aiChecks} total checks</StatusPill>
            <StatusPill tone="amber">{data.summary.failedOpenRate}% failed-open</StatusPill>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3 xl:grid-cols-3 2xl:grid-cols-6">
          <AdminMetricCardCompact label="Seat page checks" value={isLoading ? "..." : data.summary.seatPageChecks.toString()} tone="cyan" />
          <AdminMetricCardCompact label="Payment pre-checkout checks" value={isLoading ? "..." : data.summary.paymentChecks.toString()} tone="emerald" />
          <AdminMetricCardCompact label="AI high verdicts" value={isLoading ? "..." : data.summary.aiHigh.toString()} tone="red" />
          <AdminMetricCardCompact label="Sessions with AI high" value={isLoading ? "..." : data.summary.sessionsWithAiHigh.toString()} tone="amber" />
          <AdminMetricCardCompact label="AI coverage" value={isLoading ? "..." : `${data.summary.aiCoverageRate}%`} tone="cyan" />
          <AdminMetricCardCompact label="AI vs System" value={isLoading ? "..." : data.summary.aiBlockedMismatchCount.toString()} tone="amber" />
          <AdminMetricCardCompact label="Failed-open rate" value={isLoading ? "..." : `${data.summary.failedOpenRate}%`} tone="amber" />
          <AdminMetricCardCompact label="Decision mix" value={isLoading ? "..." : `${data.summary.allowed}/${data.summary.warned}/${data.summary.blocked}`} tone="neutral" />
        </div>
      </AdminPanel>

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

      <div className="grid gap-4 sm:gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <AdminPanel className="overflow-hidden">
          <AdminPanelHeader
            title="Session List"
            description="Grouped sessions with latest decision, AI verdict, and enforcement source."
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
          <div className="border-b border-white/6 px-4 py-4 sm:px-5">
            <FilterGroup label="Quick filter" value={quickFilter} items={quickFilters} onChange={setQuickFilter} />
          </div>
          <div className="grid gap-3 border-b border-white/6 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
            <FilterGroup label="Decision" value={filter} items={decisionFilters} onChange={setFilter} />
            <FilterGroup label="AI verdict" value={aiRiskFilter} items={aiFilters} onChange={setAiRiskFilter} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FilterGroup label="Step" value={stepFilter} items={stepFilters} onChange={setStepFilter} />
              <FilterGroup label="Risk status" value={riskStatusFilter} items={statusFilters} onChange={setRiskStatusFilter} />
            </div>
          </div>
          <SecuritySessionList
            sessions={filteredSessions}
            selectedSessionId={activeSessionId}
            onSelect={setManualSelectedSessionId}
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

export default function AISecurityPage() {
  return (
    <Suspense>
      <AISecurityContent />
    </Suspense>
  );
}
