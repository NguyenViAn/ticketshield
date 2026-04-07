"use client";

import {
  Bot,
  CheckCircle2,
  CreditCard,
  MinusCircle,
  MousePointerClick,
  XCircle,
} from "lucide-react";

import { StatusPill } from "@/components/admin/admin-primitives";
import type { SecurityTimelineEvent } from "@/lib/admin-security";

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventMeta(event: SecurityTimelineEvent) {
  if (event.type === "ai_risk_checked") {
    return {
      icon: Bot,
      label: "AI risk checked",
      tone:
        event.riskCheckStatus === "failed_open"
          ? ("neutral" as const)
          : event.riskLevel === "high"
            ? ("red" as const)
            : event.riskLevel === "warning"
              ? ("amber" as const)
              : event.riskLevel === "low"
                ? ("emerald" as const)
                : ("neutral" as const),
    };
  }

  if (event.type === "seat_select") {
    return {
      icon: MousePointerClick,
      label: "Seat select",
      tone: "cyan" as const,
    };
  }

  if (event.type === "seat_deselect") {
    return {
      icon: MinusCircle,
      label: "Seat deselect",
      tone: "amber" as const,
    };
  }

  if (event.type === "checkout_success") {
    return {
      icon: CheckCircle2,
      label: "Checkout success",
      tone: "emerald" as const,
    };
  }

  if (event.type === "checkout_failed") {
    return {
      icon: XCircle,
      label: "Checkout failed",
      tone: "red" as const,
    };
  }

  return {
    icon: CreditCard,
    label: "Checkout attempt",
    tone: "neutral" as const,
  };
}

export function SecurityEventTimeline({
  events,
  locale,
}: {
  events: SecurityTimelineEvent[];
  locale: string;
}) {
  if (!events.length) {
    return <div className="px-5 py-8 text-sm text-slate-400 sm:px-6">No booking events recorded for this session.</div>;
  }

  return (
    <div className="space-y-4 p-5 sm:p-6">
      {events.map((event, index) => {
        const meta = getEventMeta(event);
        const Icon = meta.icon;

        return (
          <div key={event.id} className="group relative pl-16">
            {index < events.length - 1 ? (
              <span className="absolute left-[22px] top-12 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan-500/20 via-white/6 to-transparent" />
            ) : null}

            <div className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border ${
              meta.tone === "emerald"
                ? "border-emerald-500/18 bg-emerald-500/10 text-emerald-300"
                : meta.tone === "amber"
                  ? "border-amber-400/18 bg-amber-400/10 text-amber-300"
                  : meta.tone === "red"
                    ? "border-rose-500/18 bg-rose-500/10 text-rose-300"
                    : meta.tone === "cyan"
                      ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                      : "border-white/8 bg-white/[0.04] text-slate-300"
            }`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(24,30,39,0.98),rgba(20,25,34,0.98))] p-4 transition-colors group-hover:border-cyan-500/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{meta.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{formatDate(event.createdAt, locale)}</div>
                </div>
                <StatusPill tone={meta.tone}>
                  {event.type === "ai_risk_checked"
                    ? event.riskCheckStatus === "failed_open"
                      ? "Failed open"
                      : event.riskLevel ?? "AI checked"
                    : `${event.selectedCount} selected`}
                </StatusPill>
              </div>

              {event.type === "ai_risk_checked" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill tone="neutral">
                    {event.step === "seat_page"
                      ? "Seat page"
                      : event.step === "payment_pre_checkout"
                        ? "Payment pre-check"
                        : "Unknown step"}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    Confidence: {typeof event.confidence === "number" ? `${(event.confidence * 100).toFixed(1)}%` : "--"}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    Checked: {event.checkedAt ? formatDate(event.checkedAt, locale) : "--"}
                  </StatusPill>
                  <StatusPill tone="neutral">Status: {event.riskCheckStatus ?? "--"}</StatusPill>
                  <StatusPill tone="neutral">Warning accepted: {event.warningAccepted ? "Yes" : "No"}</StatusPill>
                  {event.seatIds.length ? <StatusPill tone="neutral">Seats: {event.seatIds.length}</StatusPill> : null}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill tone="neutral">Seat count: {event.seatCount}</StatusPill>
                  <StatusPill tone="neutral">Retry count: {event.retryCount}</StatusPill>
                  {event.seatIds.length ? <StatusPill tone="neutral">Seats: {event.seatIds.join(", ")}</StatusPill> : null}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
