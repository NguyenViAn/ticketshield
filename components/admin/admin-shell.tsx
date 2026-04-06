"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Swords,
  Ticket,
  Users,
  X,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminPanel, StatusPill } from "@/components/admin/admin-primitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  href: string;
  key: "dashboard" | "matches" | "tickets" | "users" | "ai_security" | "promotions" | "settings";
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/matches", key: "matches", icon: Swords },
  { href: "/admin/tickets", key: "tickets", icon: Ticket },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/ai-security", key: "ai_security", icon: ShieldAlert },
  { href: "/admin/promotions", key: "promotions", icon: Percent },
  { href: "/admin/settings", key: "settings", icon: Settings },
];

function normalizeAdminPath(pathname: string) {
  const cleaned = pathname.replace(/^\/(?:vi|en)/, "");
  return cleaned || "/";
}

function getPageKey(pathname: string): NavItem["key"] {
  const normalized = normalizeAdminPath(pathname);

  if (normalized === "/admin") return "dashboard";
  if (normalized.startsWith("/admin/matches")) return "matches";
  if (normalized.startsWith("/admin/tickets")) return "tickets";
  if (normalized.startsWith("/admin/users")) return "users";
  if (normalized.startsWith("/admin/ai-security")) return "ai_security";
  if (normalized.startsWith("/admin/promotions")) return "promotions";
  if (normalized.startsWith("/admin/settings")) return "settings";

  return "dashboard";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useTranslations("AdminShell");
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const pageKey = useMemo(() => getPageKey(pathname), [pathname]);

  const isActive = (item: NavItem) => {
    const current = normalizeAdminPath(pathname);
    return item.exact ? current === item.href : current.startsWith(item.href);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/6 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/16 bg-cyan-500/10 text-cyan-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">{t("sidebar_title")}</div>
            <div className="mt-1 text-xs text-slate-500">{t("sidebar_subtitle")}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {t("navigation_label")}
        </div>
        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                  active
                    ? "border-cyan-500/16 bg-[linear-gradient(90deg,rgba(34,211,238,0.12),rgba(8,12,18,0.08))] text-white shadow-[inset_3px_0_0_rgba(34,211,238,0.9)]"
                    : "border-transparent text-slate-500 hover:border-white/6 hover:bg-white/[0.03] hover:text-slate-200"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    active ? "bg-cyan-500/12 text-cyan-300" : "bg-white/[0.04] text-slate-500"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t(`nav.${item.key}.label`)}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{t(`nav.${item.key}.description`)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/6 p-4">
        <AdminPanel className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{t("ai_status_label")}</p>
              <p className="mt-2 text-sm font-semibold text-white">{t("ai_status_value")}</p>
            </div>
            <StatusPill tone="emerald">{t("ai_status_badge")}</StatusPill>
          </div>
          <p className="mt-3 text-sm text-slate-400">{t("ai_status_desc")}</p>
        </AdminPanel>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f131a] text-slate-300">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.05),transparent_22%),linear-gradient(180deg,#0f131a_0%,#10151d_100%)]" />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] border-r border-white/6 bg-[#0c1118] backdrop-blur-xl xl:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <>
          <button className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] xl:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[300px] border-r border-white/6 bg-[#0c1118] xl:hidden">
            <div className="flex h-16 items-center justify-end px-4">
              <button
                className="admin-focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebar}
          </aside>
        </>
      ) : null}

      <div className="relative xl:ml-[300px]">
        <header className="sticky top-0 z-30 border-b border-white/6 bg-[#121721]/92 backdrop-blur-xl">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:px-8">
            <div className="flex items-center gap-3 xl:hidden">
              <button
                className="admin-focus-ring flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="text-sm font-bold text-white">{t("mobile_title")}</div>
                <div className="text-xs text-slate-500">{t("mobile_subtitle")}</div>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">{t(`page.${pageKey}.title`)}</h1>
                <p className="mt-1 text-sm text-slate-400">{t(`page.${pageKey}.description`)}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[220px] flex-1 sm:w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("search_placeholder")}
                    className="admin-focus-ring h-11 w-full rounded-2xl border border-white/8 bg-[#1b212b] pl-11 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button className="admin-focus-ring relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300 transition-colors hover:border-cyan-400/24 hover:text-white">
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  </button>
                  {hasMounted ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="admin-focus-ring flex h-11 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 text-left transition-colors hover:border-cyan-400/24">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/12 text-sm font-semibold text-cyan-300">
                            {user?.name?.slice(0, 1).toUpperCase() ?? "A"}
                          </span>
                          <span className="hidden sm:block">
                            <span className="block max-w-[120px] truncate text-sm font-semibold text-white">
                              {user?.name ?? t("default_user_name")}
                            </span>
                            <span className="block max-w-[120px] truncate text-xs text-slate-500">
                              {user?.email ?? t("default_user_email")}
                            </span>
                          </span>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="mt-2 w-64 rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(28,33,43,0.99),rgba(22,27,36,0.99))] p-2 text-slate-200 shadow-[0_22px_44px_-30px_rgba(0,0,0,0.5)]">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                          <div className="text-sm font-semibold text-white">{user?.name ?? t("default_user_name")}</div>
                          <div className="mt-1 text-xs text-slate-400">{user?.email ?? t("default_user_email")}</div>
                        </div>
                        <DropdownMenuItem asChild className="mt-2 rounded-2xl px-3 py-3 font-medium text-slate-200 focus:bg-white/[0.05] focus:text-white">
                          <Link href="/admin/settings">{t("workspace_settings")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-2xl px-3 py-3 font-medium text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                          onClick={() => logout()}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {t("sign_out")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <button
                      className="admin-focus-ring flex h-11 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 text-left transition-colors"
                      type="button"
                      disabled
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/12 text-sm font-semibold text-cyan-300">
                        {user?.name?.slice(0, 1).toUpperCase() ?? "A"}
                      </span>
                      <span className="hidden sm:block">
                        <span className="block max-w-[120px] truncate text-sm font-semibold text-white">
                          {user?.name ?? t("default_user_name")}
                        </span>
                        <span className="block max-w-[120px] truncate text-xs text-slate-500">
                          {user?.email ?? t("default_user_email")}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative px-4 py-6 sm:px-6 xl:px-8 xl:py-8">{children}</main>
      </div>
    </div>
  );
}
