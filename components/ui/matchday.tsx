import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type AccentTone = "amber" | "cyan" | "emerald" | "slate";

const accentBorderMap: Record<AccentTone, string> = {
  amber: "border-amber-500/20 text-amber-400  ",
  cyan: "border-cyan-500/20 text-cyan-400  ",
  emerald: "border-emerald-500/20 text-emerald-400  ",
  slate: "border-white/10 text-slate-300  ",
};

const statusToneMap: Record<AccentTone, string> = {
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-400   ",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400   ",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400   ",
  slate: "border-white/10 bg-white/10 text-slate-300   ",
};

export function MatchdayPanel({
  children,
  className,
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(30,41,59,0.72),rgba(15,23,42,0.86))] shadow-[0_24px_64px_-42px_rgba(0,0,0,0.42)]   ",
        padding,
        className
      )}
    >
      {children}
    </section>
  );
}

export function MatchdayPanelHeader({
  icon,
  title,
  className,
  titleClassName,
}: {
  icon: ReactNode;
  title: string;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-center gap-3", className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400   ">
        {icon}
      </span>
      <h2
        className={cn(
          "text-2xl font-heading font-black uppercase tracking-[-0.03em] text-white ",
          titleClassName
        )}
      >
        {title}
      </h2>
    </div>
  );
}

export function MatchdayStatCard({
  accent = "emerald",
  footer,
  icon,
  label,
  trailing,
  value,
  className,
}: {
  accent?: AccentTone;
  footer?: ReactNode;
  icon: ReactNode;
  label: string;
  trailing?: string;
  value: string;
  className?: string;
}) {
  return (
    <MatchdayPanel className={className} padding="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 ">{label}</div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-5xl font-heading font-black tracking-[-0.04em] text-white ">{value}</span>
            {trailing ? <span className="pb-1 text-xl font-semibold text-slate-400 ">{trailing}</span> : null}
          </div>
        </div>
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ",
            accentBorderMap[accent]
          )}
        >
          {icon}
        </span>
      </div>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </MatchdayPanel>
  );
}

export function MatchdaySummaryBlock({
  label,
  value,
  mono = false,
  emphasis = false,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[20px] border border-white/10 bg-white/5 px-4 py-4  ", className)}>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div
        className={cn(
          "mt-2",
          mono ? "font-mono text-sm" : "text-lg",
          emphasis ? "font-bold text-emerald-400 " : "font-semibold text-white "
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function MatchdayInfoField({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="theme-inset-surface rounded-[22px] px-4 py-4  ">{children}</div>
    </div>
  );
}

export function MatchdayStatusCard({
  description,
  title,
  className,
}: {
  description: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[22px] border border-white/10 bg-white/5 px-4 py-4  ", className)}>
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400 ">{description}</div>
    </div>
  );
}

export function MatchdayActionTile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 transition-colors hover:border-emerald-500/20 hover:bg-emerald-500/10    ",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MatchdayMetaPill({
  children,
  icon: Icon,
  toneClassName,
  className,
}: {
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
  toneClassName: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-slate-300  ", className)}>
      <Icon className={cn("h-4 w-4", toneClassName)} />
      {children}
    </span>
  );
}

export function MatchdayStatusPill({
  icon: Icon,
  label,
  tone,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone: AccentTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        statusToneMap[tone],
        className
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export function MatchdayDetailBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white ">{value}</div>
    </div>
  );
}

export function MatchdaySummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0 ", className)}>
      <span className="text-base text-slate-400 ">{label}</span>
      <span className="text-xl font-semibold text-white ">{value}</span>
    </div>
  );
}
