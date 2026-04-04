"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function AdminPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_54px_-30px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminPanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent?: "emerald" | "cyan" | "amber" | "red";
}) {
  const tone = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[accent];

  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", tone)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </AdminPanel>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "cyan" | "amber" | "red";
}) {
  const styles = {
    neutral: "border-slate-200 bg-slate-100 text-slate-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", styles)}>
      {children}
    </span>
  );
}

export function SparkBars({
  values,
  tone = "emerald",
}: {
  values: number[];
  tone?: "emerald" | "cyan";
}) {
  const max = Math.max(...values, 1);
  const bg = tone === "emerald" ? "from-emerald-400 to-emerald-500" : "from-cyan-400 to-cyan-500";

  return (
    <div className="flex h-36 items-end gap-2 rounded-[22px] border border-slate-200 bg-slate-50/80 p-3">
      {values.map((value, index) => (
        <div key={`${tone}-${index}`} className="flex flex-1 items-end">
          <div
            className={cn("w-full rounded-t-2xl bg-gradient-to-t opacity-95", bg)}
            style={{ height: `${Math.max((value / max) * 100, 10)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
