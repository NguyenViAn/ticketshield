"use client";

import { Clock3 } from "lucide-react";

import { StatusPill } from "@/components/admin/admin-primitives";
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
          <div key={index} className="h-28 animate-pulse rounded-[26px] border border-slate-200 bg-slate-50" />
        ))}
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-6 py-12 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto p-4 sm:p-5">
      {sessions.map((session) => {
        const selected = selectedSessionId === session.id;

        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={`w-full rounded-[26px] border p-4 text-left transition-all ${
              selected
                ? "border-cyan-200 bg-cyan-50 shadow-[0_16px_40px_-30px_rgba(14,165,233,0.5)]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {session.sessionId}
                </div>
                <div className="mt-2 truncate text-sm font-semibold text-slate-950">{session.user}</div>
                <div className="mt-1 truncate text-xs text-slate-500">{session.match}</div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <StatusPill tone={decisionTone(session.decision)}>{session.status}</StatusPill>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatDate(session.timestamp, locale)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Short reason
                </div>
                <div className="mt-1 text-sm text-slate-700">{session.reason}</div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{session.scoreLabel}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{session.totalEvents} events</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
