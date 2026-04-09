"use client";

import { Clock3 } from "lucide-react";

import { EnforcementBadge, StatusPill } from "@/components/admin/admin-primitives";
import type { SecurityDecision, SecuritySession } from "@/lib/admin-security";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function decisionTone(decision: SecurityDecision) {
  if (decision === "allow") return "emerald" as const;
  if (decision === "warn") return "amber" as const;
  return "red" as const;
}

function aiTone(level: SecuritySession["ai"]["latestAiRiskLevel"], status: SecuritySession["ai"]["latestRiskCheckStatus"]) {
  if (status === "failed_open") return "amber" as const;
  if (level === "high") return "red" as const;
  if (level === "warning") return "amber" as const;
  if (level === "low") return "emerald" as const;
  return "neutral" as const;
}

function aiLabel(level: SecuritySession["ai"]["latestAiRiskLevel"], status: SecuritySession["ai"]["latestRiskCheckStatus"]) {
  if (status === "failed_open") return "Failed open";
  if (level) return level;
  return "No AI check";
}

function finalOutcomeLabel(outcome: SecuritySession["finalOutcome"]) {
  const labels: Record<SecuritySession["finalOutcome"], string> = {
    checkout_success: "Success",
    checkout_failed: "Failed",
    blocked: "Blocked",
    in_progress: "In progress",
    warning_acknowledged: "Warning acknowledged",
  };
  return labels[outcome];
}

function finalOutcomeTone(outcome: SecuritySession["finalOutcome"]) {
  if (outcome === "checkout_success") return "emerald" as const;
  if (outcome === "blocked" || outcome === "checkout_failed") return "red" as const;
  if (outcome === "warning_acknowledged") return "amber" as const;
  return "neutral" as const;
}

export function SecuritySessionList({
  sessions,
  selectedSessionId,
  onSelect,
  locale,
  isLoading,
  emptyLabel,
}: {
  sessions: SecuritySession[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
  locale: string;
  isLoading: boolean;
  emptyLabel: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="admin-skeleton h-32 rounded-[26px]" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="admin-empty-state flex min-h-[420px] items-center justify-center px-6 py-12">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-cyan-500/14 bg-cyan-500/8 text-cyan-300">
            <Clock3 className="h-6 w-6" />
          </div>
          <div className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">No sessions</div>
          <div className="mt-2 max-w-xs text-sm leading-7 text-slate-400">{emptyLabel}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto p-3 sm:space-y-3 sm:p-4 xl:p-4 2xl:max-h-[calc(100vh-16rem)] 2xl:p-5">
      {sessions.map((session) => {
        const selected = selectedSessionId === session.id;

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={`admin-focus-ring w-full rounded-[20px] border p-3 text-left transition-all sm:rounded-[24px] sm:p-3.5 2xl:rounded-[26px] 2xl:p-4 ${
              selected
                ? "border-cyan-500/18 bg-[linear-gradient(180deg,rgba(18,34,43,0.98),rgba(17,28,36,0.98))] shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_18px_34px_-28px_rgba(0,0,0,0.42)]"
                : "border-white/6 bg-[#181e27] hover:border-cyan-500/10 hover:bg-[#1c232d]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {session.sessionId}
                </div>
                <div className="mt-2 truncate text-sm font-semibold text-white">{session.user}</div>
                <div className="mt-1 truncate text-xs text-slate-400">{session.match}</div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusPill tone={decisionTone(session.decision)}>{session.status}</StatusPill>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatDate(session.timestamp, locale)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{session.reason}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <StatusPill tone={aiTone(session.ai.latestAiRiskLevel, session.ai.latestRiskCheckStatus)}>
                {aiLabel(session.ai.latestAiRiskLevel, session.ai.latestRiskCheckStatus)}
              </StatusPill>
              <span>{session.scoreLabel}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{session.score} score</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{session.checkoutRetries} retries</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <EnforcementBadge source={session.enforcementSource} />
              <StatusPill tone={finalOutcomeTone(session.finalOutcome)}>
                {finalOutcomeLabel(session.finalOutcome)}
              </StatusPill>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{session.totalEvents} events</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{session.seatsTouched} seats</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
