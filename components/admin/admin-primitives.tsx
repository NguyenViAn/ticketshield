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
        "rounded-3xl border border-white/6 bg-[linear-gradient(180deg,rgba(28,33,43,0.98),rgba(23,28,37,0.98))] shadow-[0_18px_42px_-28px_rgba(0,0,0,0.44)]",
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
    <div className="flex flex-col gap-2 border-b border-white/6 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4 xl:px-6">
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-white sm:text-lg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
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
    emerald: "border-emerald-500/18 bg-emerald-500/10 text-emerald-300",
    cyan: "border-cyan-500/18 bg-cyan-500/10 text-cyan-300",
    amber: "border-amber-400/18 bg-amber-400/10 text-amber-300",
    red: "border-rose-500/18 bg-rose-500/10 text-rose-300",
  }[accent];

  return (
    <AdminPanel className="group p-4 sm:p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">{label}</p>
          <p className="mt-1.5 text-2xl font-black leading-none tracking-tight text-white sm:mt-2 sm:text-[2rem]">{value}</p>
          <p className="mt-1.5 text-xs leading-6 text-slate-400 sm:mt-2 sm:max-w-[18rem] sm:text-sm">{hint}</p>
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-transform duration-150 group-hover:scale-[1.02] sm:h-11 sm:w-11 sm:rounded-2xl", tone)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
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
    neutral: "border-white/8 bg-white/[0.04] text-slate-300",
    emerald: "border-emerald-500/18 bg-emerald-500/10 text-emerald-300",
    cyan: "border-cyan-500/18 bg-cyan-500/10 text-cyan-300",
    amber: "border-amber-400/18 bg-amber-400/10 text-amber-300",
    red: "border-rose-500/18 bg-rose-500/10 text-rose-300",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]", styles)}>
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
  const bg = tone === "emerald" ? "from-emerald-500/10 to-emerald-500/28" : "from-cyan-500/12 to-cyan-500/32";

  return (
    <div className="flex h-24 items-end gap-1.5 rounded-[18px] border border-white/6 bg-[linear-gradient(180deg,rgba(19,24,32,0.98),rgba(17,21,29,0.98))] p-2.5 sm:h-28 sm:gap-2 sm:rounded-[22px] sm:p-3 xl:h-36">
      {values.map((value, index) => (
        <div key={`${tone}-${index}`} className="flex flex-1 items-end">
          <div
            className={cn("w-full rounded-t-2xl border-t border-cyan-400/70 bg-gradient-to-t opacity-95 shadow-[0_0_24px_-16px_rgba(34,211,238,0.4)]", bg)}
            style={{ height: `${Math.max((value / max) * 100, 10)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function AdminMetricCardCompact({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "cyan" | "amber" | "red";
}) {
  const styles = {
    neutral: "border-white/6 bg-white/[0.03]",
    emerald: "border-emerald-500/12 bg-emerald-500/[0.06]",
    cyan: "border-cyan-500/12 bg-cyan-500/[0.06]",
    amber: "border-amber-400/12 bg-amber-400/[0.06]",
    red: "border-rose-500/12 bg-rose-500/[0.06]",
  }[tone];

  const valueTone = {
    neutral: "text-white",
    emerald: "text-emerald-200",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
    red: "text-rose-200",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-3 py-2.5 sm:rounded-2xl sm:px-3.5 sm:py-3", styles)}>
      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">{label}</div>
      <div className={cn("mt-1 text-lg font-black leading-none tracking-tight sm:mt-1.5 sm:text-xl", valueTone)}>{value}</div>
    </div>
  );
}

export function EnforcementBadge({
  source,
}: {
  source: "ai" | "system_rule" | "heuristic" | "mixed" | "none";
}) {
  const config = {
    ai: { label: "AI", tone: "amber" as const },
    system_rule: { label: "System rule", tone: "red" as const },
    heuristic: { label: "Heuristic", tone: "amber" as const },
    mixed: { label: "Mixed", tone: "red" as const },
    none: { label: "None", tone: "emerald" as const },
  }[source];

  return <StatusPill tone={config.tone}>{config.label}</StatusPill>;
}
