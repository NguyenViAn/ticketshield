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
        "rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(2,6,23,0.6))] shadow-[0_24px_64px_-34px_rgba(0,0,0,0.5)]   ",
        className
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
    <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg ">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400 ">{description}</p> : null}
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
    emerald: "border-emerald-400/15 bg-emerald-400/10 text-emerald-300",
    cyan: "border-cyan-400/15 bg-cyan-400/10 text-cyan-300",
    amber: "border-amber-400/15 bg-amber-400/10 text-amber-300",
    red: "border-red-400/15 bg-red-400/10 text-red-300",
  }[accent];

  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 ">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white ">{value}</p>
          <p className="mt-2 text-sm text-slate-400 ">{hint}</p>
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
    neutral: "border-white/10 bg-white/10 text-slate-300   ",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400   ",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400   ",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-400   ",
    red: "border-red-500/20 bg-red-500/10 text-red-400   ",
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
    <div className="flex h-36 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${tone}-${index}`} className="flex flex-1 items-end">
          <div
            className={cn("w-full rounded-t-2xl bg-gradient-to-t opacity-90", bg)}
            style={{ height: `${Math.max((value / max) * 100, 10)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
