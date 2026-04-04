"use client";

import {
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
    return <div className="px-5 py-8 text-sm text-slate-500 sm:px-6">No booking events recorded for this session.</div>;
  }

  return (
    <div className="space-y-4 p-5 sm:p-6">
      {events.map((event, index) => {
        const meta = getEventMeta(event);
        const Icon = meta.icon;

        return (
          <div key={event.id} className="relative pl-16">
            {index < events.length - 1 ? (
              <span className="absolute left-[22px] top-12 h-[calc(100%-1rem)] w-px bg-slate-200" />
            ) : null}

            <div className={`absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border ${
              meta.tone === "emerald"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : meta.tone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : meta.tone === "red"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : meta.tone === "cyan"
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
            }`}>
              <Icon className="h-4 w-4" />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950">{meta.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt, locale)}</div>
                </div>
                <StatusPill tone={meta.tone}>{event.selectedCount} selected</StatusPill>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Seat count</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{event.seatCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Retry count</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">{event.retryCount}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Seats</div>
                  <div className="mt-2 truncate text-base font-semibold text-slate-950">
                    {event.seatIds.length ? event.seatIds.join(", ") : "--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
