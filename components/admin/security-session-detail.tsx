"use client";

import { Activity, Flag, ShieldAlert } from "lucide-react";

import { AdminPanel, AdminPanelHeader, StatusPill } from "@/components/admin/admin-primitives";
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

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-3 text-lg font-semibold text-slate-950">{value}</div>
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
            <div className="h-64 animate-pulse bg-slate-50" />
          </AdminPanel>
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <AdminPanel className="p-8 sm:p-10">
        <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 text-slate-500">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">No session selected</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
            Pick a session from the monitor list to inspect its risk summary, timeline, and activity metrics.
          </p>
        </div>
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPanel>
        <AdminPanelHeader
          title="Risk Summary"
          description="Session-level decision derived from grouped booking_events."
          action={
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={decisionTone(session.decision)}>{session.status}</StatusPill>
              <StatusPill tone={scoreTone(session.scoreLabel)}>{session.scoreLabel}</StatusPill>
            </div>
          }
        />
        <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {session.sessionId}
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{session.reason}</h2>
                <div className="mt-3 text-sm text-slate-700">{session.match}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {session.userId ? `User ${session.user}` : session.user} - Last activity {formatDate(session.timestamp, locale)}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-right">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Risk score</div>
                <div className="mt-2 text-3xl font-black text-slate-950">{session.score}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-2">
            <DetailMetric label="Status" value={session.status} />
            <DetailMetric label="Score" value={session.scoreLabel} />
            <DetailMetric label="Reason" value={session.reason} />
            <DetailMetric label="Total events" value={session.totalEvents} />
            <DetailMetric label="Checkout retries" value={session.checkoutRetries} />
            <DetailMetric label="Seats touched" value={session.seatsTouched} />
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
          description="Operational counters for explaining the current decision."
          action={
            <StatusPill tone={decisionTone(session.decision)}>
              <Activity className="mr-1.5 h-3.5 w-3.5" />
              {session.metrics.currentDecision}
            </StatusPill>
          }
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          <DetailMetric label="Total seat changes" value={session.metrics.totalSeatChanges} />
          <DetailMetric label="Selected seats peak" value={session.metrics.selectedSeatsPeak} />
          <DetailMetric label="Retry count" value={session.metrics.retryCount} />
          <DetailMetric label="Current decision" value={session.metrics.currentDecision} />
        </div>
      </AdminPanel>
    </div>
  );
}
