"use client";

import { BellRing, Settings2, ShieldCheck, Workflow } from "lucide-react";

import { AdminMetricCard, AdminPanel, AdminPanelHeader, StatusPill } from "@/components/admin/admin-primitives";

const settingsGroups = [
  {
    title: "AI thresholds",
    description: "Dieu chinh moc allow, warn, block cho anti-bot engine.",
    status: "Stable",
  },
  {
    title: "Notification routing",
    description: "Canh bao toi Slack, email va command center.",
    status: "Draft",
  },
  {
    title: "Checkout policy",
    description: "Rate limit, max ticket per user va geo risk handling.",
    status: "Active",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminMetricCard label="Notification channels" value="03" hint="Slack, email, in-app alerts" icon={BellRing} accent="cyan" />
        <AdminMetricCard label="Policy profiles" value="04" hint="Different rules for fixture risk tiers" icon={Workflow} accent="emerald" />
        <AdminMetricCard label="Security templates" value="06" hint="Reusable operational presets" icon={ShieldCheck} accent="amber" />
      </div>

      <AdminPanel>
        <AdminPanelHeader title="Admin workspace settings" description="Placeholder settings page kept consistent with the new light monitoring shell." />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {settingsGroups.map((group) => (
            <div key={group.title} className="admin-surface-muted p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700">
                  <Settings2 className="h-5 w-5" />
                </div>
                <StatusPill tone={group.status === "Active" ? "emerald" : group.status === "Draft" ? "amber" : "cyan"}>
                  {group.status}
                </StatusPill>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">{group.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
