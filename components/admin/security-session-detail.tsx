"use client";

import { Activity, AlertTriangle, Flag, ShieldAlert } from "lucide-react";

import { AdminPanel, AdminPanelHeader, EnforcementBadge, StatusPill } from "@/components/admin/admin-primitives";
import { SecurityEventTimeline } from "@/components/admin/security-event-timeline";
import type { SecurityDecision, SecurityScoreLabel, SecuritySession } from "@/lib/admin-security";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function decisionTone(decision: SecurityDecision) {
  if (decision === "allow") return "emerald" as const;
  if (decision === "warn") return "amber" as const;
  return "red" as const;
}

function scoreTone(scoreLabel: SecurityScoreLabel) {
  if (scoreLabel === "Low") return "emerald" as const;
  if (scoreLabel === "Medium") return "amber" as const;
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
    checkout_success: "Checkout success",
    checkout_failed: "Checkout failed",
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

function eventTypeLabel(type: SecuritySession["latestEventType"]) {
  const labels: Record<SecuritySession["latestEventType"], string> = {
    seat_select: "Seat select",
    seat_deselect: "Seat deselect",
    checkout_attempt: "Checkout attempt",
    checkout_success: "Checkout success",
    checkout_failed: "Checkout failed",
    ai_risk_checked: "AI risk checked",
  };
  return labels[type];
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(24,30,39,0.98),rgba(20,25,34,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold leading-7 text-white">{value}</div>
    </div>
  );
}

export function SecuritySessionDetail({
  session,
  locale,
  isLoading,
}: {
  session: SecuritySession | null;
  locale: string;
  isLoading: boolean;
}) {
  if (isLoading && !session) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <AdminPanel key={index}>
            <div className="admin-skeleton h-64 rounded-[28px]" />
          </AdminPanel>
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <AdminPanel className="p-8 sm:p-10">
        <div className="admin-empty-state flex min-h-[320px] flex-col items-center justify-center xl:min-h-[420px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-cyan-500/14 bg-cyan-500/[0.08] text-cyan-300">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-white">No session selected</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            Pick a session from the monitor list to inspect its risk summary, timeline, and activity metrics.
          </p>
        </div>
      </AdminPanel>
    );
  }

  const hasMismatch =
    session.ai.latestAiRiskLevel === "low" &&
    session.enforcementSource !== "none" &&
    session.enforcementSource !== "ai";

  return (
    <div className="space-y-6">
      {hasMismatch ? (
        <AdminPanel className="border-amber-400/18 bg-amber-400/[0.04] p-3.5 sm:p-4 lg:p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <div className="text-sm font-semibold text-amber-200">AI verdict mismatch</div>
              <div className="mt-1 text-sm leading-6 text-amber-300/80">
                AI assessed this session as <strong className="text-amber-100">low risk</strong>, but the session was{" "}
                <strong className="text-amber-100">{session.decision === "block" ? "blocked" : "warned"}</strong> by{" "}
                <strong className="text-amber-100">
                  {session.enforcementSource === "system_rule"
                    ? "a system rule"
                    : session.enforcementSource === "heuristic"
                      ? "heuristic detection"
                      : "mixed sources"}
                </strong>
                . The enforcement was not triggered by AI.
              </div>
            </div>
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader
          title="Session Overview"
          description="Three independent layers: AI verdict, rule-based decision, and system enforcement."
          action={
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={decisionTone(session.decision)}>{session.status}</StatusPill>
              <StatusPill tone={scoreTone(session.scoreLabel)}>{session.scoreLabel}</StatusPill>
            </div>
          }
        />
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5 xl:p-6">
          <div className="flex flex-col items-start justify-between gap-3 rounded-[22px] border border-cyan-500/12 bg-[linear-gradient(180deg,rgba(17,30,38,0.98),rgba(18,25,34,0.98))] p-4 sm:flex-row sm:flex-wrap sm:gap-4 sm:rounded-[28px] sm:p-5">
            <div>
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{session.sessionId}</div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:mt-3 sm:text-2xl xl:text-3xl">{session.reason}</h2>
              <div className="mt-3 text-sm text-slate-300">{session.match}</div>
              <div className="mt-1 text-sm text-slate-500">
                {session.userId ? `User ${session.user}` : session.user} | Last activity {formatDate(session.timestamp, locale)}
              </div>
            </div>
            <div className="rounded-[22px] border border-cyan-500/14 bg-cyan-500/[0.06] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Risk score</div>
              <div className="mt-2 text-4xl font-black leading-none text-white">{session.score}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 xl:grid-cols-3">
            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">AI Verdict</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={aiTone(session.ai.latestAiRiskLevel, session.ai.latestRiskCheckStatus)}>
                  {aiLabel(session.ai.latestAiRiskLevel, session.ai.latestRiskCheckStatus)}
                </StatusPill>
                {session.ai.latestAiStep ? (
                  <StatusPill tone="neutral">{session.ai.latestAiStep === "seat_page" ? "Seat page" : "Payment pre-check"}</StatusPill>
                ) : null}
              </div>
              <div className="mt-3 grid gap-1.5 text-sm text-slate-300">
                <div>
                  Confidence:{" "}
                  {typeof session.ai.latestAiConfidence === "number"
                    ? `${(session.ai.latestAiConfidence * 100).toFixed(1)}%`
                    : "--"}
                </div>
                <div>Status: {session.ai.latestRiskCheckStatus ?? "--"}</div>
                <div>Checked: {session.ai.latestAiCheckedAt ? formatDate(session.ai.latestAiCheckedAt, locale) : "--"}</div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Rule-based Decision</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={decisionTone(session.decision)}>{session.status}</StatusPill>
                <StatusPill tone={scoreTone(session.scoreLabel)}>{session.scoreLabel}</StatusPill>
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{session.reason}</div>
              {session.reasons.length > 1 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {session.reasons.slice(1).map((reason) => (
                    <StatusPill key={reason} tone="neutral">
                      {reason}
                    </StatusPill>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">System Enforcement</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EnforcementBadge source={session.enforcementSource} />
                <StatusPill tone={finalOutcomeTone(session.finalOutcome)}>
                  {finalOutcomeLabel(session.finalOutcome)}
                </StatusPill>
              </div>
              <div className="mt-3 grid gap-1.5 text-sm text-slate-300">
                <div>Source: {session.enforcementSource === "none" ? "No enforcement" : session.enforcementSource.replace("_", " ")}</div>
                <div>Final outcome: {finalOutcomeLabel(session.finalOutcome)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Latest Event</div>
              <div className="mt-3 text-lg font-semibold text-white">{eventTypeLabel(session.latestEventType)}</div>
              <div className="mt-1.5 text-sm text-slate-400">{formatDate(session.timestamp, locale)}</div>
            </div>
            <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Final Outcome</div>
              <div className="mt-3 flex items-center gap-3">
                <StatusPill tone={finalOutcomeTone(session.finalOutcome)}>
                  {finalOutcomeLabel(session.finalOutcome)}
                </StatusPill>
                <EnforcementBadge source={session.enforcementSource} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <DetailMetric label="Status" value={session.status} />
            <DetailMetric label="AI risk" value={session.ai.latestAiRiskLevel ?? "No AI check"} />
            <DetailMetric label="Enforcement" value={session.enforcementSource.replace("_", " ")} />
            <DetailMetric label="Total events" value={session.totalEvents} />
          </div>
        </div>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          title="Event Timeline"
          description="Chronological session activity from seat changes through checkout."
          action={
            <StatusPill tone="neutral">
              <Flag className="mr-1.5 h-3.5 w-3.5" />
              {session.events.length} events
            </StatusPill>
          }
        />
        <SecurityEventTimeline events={session.events} locale={locale} />
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          title="Session Metrics"
          description="Operational counters used to explain the current session outcome."
          action={
            <StatusPill tone={decisionTone(session.decision)}>
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              {session.metrics.currentDecision}
            </StatusPill>
          }
        />
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5 2xl:grid-cols-4 xl:p-6">
          <DetailMetric label="Total seat changes" value={session.metrics.totalSeatChanges} />
          <DetailMetric label="Selected seats peak" value={session.metrics.selectedSeatsPeak} />
          <DetailMetric label="Retry count" value={session.metrics.retryCount} />
          <DetailMetric label="Current decision" value={session.metrics.currentDecision} />
          <DetailMetric label="Seats touched" value={session.seatsTouched} />
          <DetailMetric label="AI checks" value={session.metrics.aiCheckCount} />
          <DetailMetric label="Latest risk status" value={session.metrics.latestRiskCheckStatus ?? "--"} />
          <DetailMetric label="Enforcement source" value={session.enforcementSource.replace("_", " ")} />
        </div>
      </AdminPanel>
    </div>
  );
}
