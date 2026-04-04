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
    <div className="flex flex-col gap-3 border-b border-white/6 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
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
    <AdminPanel className="group p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
          <p className="mt-2 text-[2rem] font-black leading-none tracking-tight text-white">{value}</p>
          <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-400">{hint}</p>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-transform duration-150 group-hover:scale-[1.02]", tone)}>
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
    <div className="flex h-36 items-end gap-2 rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(19,24,32,0.98),rgba(17,21,29,0.98))] p-3">
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
