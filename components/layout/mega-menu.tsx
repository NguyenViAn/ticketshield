"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Match } from "@/types";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
} from "lucide-react";

type MenuKey = "matches" | "leagues";

interface MegaMenuProps {
  featuredMatches?: Match[] | null;
  navHeight: number;
}

interface NavItemProps {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  isOpen?: boolean;
  label: string;
  onClick?: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  panelId?: string;
}

interface MobileNavProps {
  className?: string;
  featuredMatches?: Match[] | null;
  onNavigate?: () => void;
}

interface LeagueItem {
  description: string;
  href: string;
  label: string;
  logo: string;
  metric: string;
  tone: string;
}

interface MatchCardData {
  awayLogo?: string;
  awayTeam: string;
  badge: string;
  dateLabel: string;
  href: string;
  homeLogo?: string;
  homeTeam: string;
  id: string;
  league: string;
  stadium: string;
}

const MENU_CLOSE_DELAY_MS = 140;

export function MegaMenu({ featuredMatches, navHeight }: MegaMenuProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimerRef = React.useRef<number | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<MenuKey | null>(null);

  const copy = getMenuCopy(locale);
  const leagues = getLeagueItems(locale);
  const matches = getMenuMatches(featuredMatches, locale);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = React.useCallback(() => {
    clearCloseTimer();
    setActiveMenu(null);
  }, [clearCloseTimer]);

  const openMenu = React.useCallback(
    (menu: MenuKey) => {
      clearCloseTimer();
      setActiveMenu(menu);
    },
    [clearCloseTimer],
  );

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMenu(null);
    }, MENU_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  React.useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu]);

  React.useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  return (
    <div
      ref={rootRef}
      className="relative hidden xl:flex items-center justify-center"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !rootRef.current?.contains(nextTarget)) {
          scheduleClose();
        }
      }}
      onMouseLeave={scheduleClose}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/82 p-1.5 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl"
        onMouseEnter={clearCloseTimer}
      >
        <NavItem
          icon={CalendarDays}
          isActive={pathname.startsWith("/matches")}
          isOpen={activeMenu === "matches"}
          label={t("upcoming_matches")}
          onClick={() => {
            setActiveMenu((currentMenu) => (currentMenu === "matches" ? null : "matches"));
          }}
          onFocus={() => openMenu("matches")}
          onMouseEnter={() => openMenu("matches")}
          panelId="matches-mega-menu"
        />
        <NavItem
          icon={Trophy}
          isActive={pathname.startsWith("/matches")}
          isOpen={activeMenu === "leagues"}
          label={t("top_leagues")}
          onClick={() => {
            setActiveMenu((currentMenu) => (currentMenu === "leagues" ? null : "leagues"));
          }}
          onFocus={() => openMenu("leagues")}
          onMouseEnter={() => openMenu("leagues")}
          panelId="leagues-mega-menu"
        />
        <NavItem href="/#promotions" icon={Sparkles} label={t("special_offers")} />
      </div>

      <AnimatePresence initial={false}>
        {activeMenu ? (
          <>
            <motion.div
              key="mega-overlay"
              aria-hidden="true"
              className="fixed inset-x-0 bottom-0 z-[105] bg-[linear-gradient(180deg,rgba(248,250,252,0.06),rgba(15,23,42,0.12)_38%,rgba(16,185,129,0.08)_100%)] backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ top: navHeight + 10 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              onMouseDown={closeMenu}
            />
            <motion.div
              key={activeMenu}
              aria-labelledby={activeMenu === "matches" ? "matches-trigger" : "leagues-trigger"}
              className="absolute left-1/2 top-[calc(100%+1rem)] z-[110] w-[min(100vw-2rem,72rem)] -translate-x-1/2"
              id={activeMenu === "matches" ? "matches-mega-menu" : "leagues-mega-menu"}
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              role="region"
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/92 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70 backdrop-blur-2xl">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-cyan-400/55" />
                {activeMenu === "matches" ? (
                  <MatchMenu
                    ctaLabel={copy.viewAllMatches}
                    emptyLabel={copy.emptyMatches}
                    eyebrow={copy.matchesEyebrow}
                    matches={matches}
                    onNavigate={closeMenu}
                    subtitle={copy.matchesSubtitle}
                    title={copy.matchesTitle}
                  />
                ) : (
                  <LeagueMenu
                    bannerBadge={copy.bannerBadge}
                    bannerDescription={copy.bannerDescription}
                    bannerTitle={copy.bannerTitle}
                    bannerUrl="/matches"
                    ctaLabel={copy.exploreTickets}
                    leagues={leagues}
                    onNavigate={closeMenu}
                    subtitle={copy.leaguesSubtitle}
                    title={copy.leaguesTitle}
                  />
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function NavItem({
  href,
  icon: Icon,
  isActive,
  isOpen,
  label,
  onClick,
  onFocus,
  onMouseEnter,
  panelId,
}: NavItemProps) {
  const itemClassName = cn(
    "inline-flex h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
    isActive || isOpen
      ? "border-emerald-200 bg-emerald-50/90 text-slate-900 shadow-[0_10px_24px_-20px_rgba(5,150,105,0.38)]"
      : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
  );

  if (href) {
    return (
      <Link className={itemClassName} href={href}>
        <Icon className="h-4 w-4 text-emerald-700" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      aria-controls={panelId}
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={itemClassName}
      id={panelId === "matches-mega-menu" ? "matches-trigger" : "leagues-trigger"}
      type="button"
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
    >
      <Icon className="h-4 w-4 text-emerald-700" />
      <span>{label}</span>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
          isOpen ? "rotate-180 text-emerald-700" : "",
        )}
      />
    </button>
  );
}

interface LeagueMenuProps {
  bannerBadge: string;
  bannerDescription: string;
  bannerTitle: string;
  bannerUrl: string;
  ctaLabel: string;
  leagues: LeagueItem[];
  onNavigate: () => void;
  subtitle: string;
  title: string;
}

export function LeagueMenu({
  bannerBadge,
  bannerDescription,
  bannerTitle,
  bannerUrl,
  ctaLabel,
  leagues,
  onNavigate,
  subtitle,
  title,
}: LeagueMenuProps) {
  return (
    <section className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,22rem)]">
      <div className="space-y-5">
        <PanelHeader
          actionHref="/matches"
          actionLabel={ctaLabel}
          icon={Trophy}
          subtitle={subtitle}
          title={title}
          onNavigate={onNavigate}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {leagues.map((league) => (
            <Link
              key={league.label}
              className="group flex min-h-[132px] flex-col rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_16px_42px_-34px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_28px_60px_-34px_rgba(16,185,129,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              href={league.href}
              onClick={onNavigate}
            >
              <div className="flex items-start gap-3">
                <div className={cn("relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)]", league.tone)}>
                  <Image alt={league.label} fill sizes="48px" src={league.logo} className="object-contain p-2" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">{league.label}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{league.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  {league.metric}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors group-hover:text-emerald-700">
                  {ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <aside className="relative overflow-hidden rounded-[28px] border border-emerald-100/60 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.22),transparent_38%),linear-gradient(160deg,#071d2b_0%,#0f172a_42%,#0f766e_100%)] p-6 text-white shadow-[0_32px_70px_-34px_rgba(15,23,42,0.65)]">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/12 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex h-full flex-col">
          <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            {bannerBadge}
          </span>
          <div className="mt-5 space-y-3">
            <h3 className="max-w-xs text-[1.75rem] font-semibold leading-tight">{bannerTitle}</h3>
            <p className="max-w-sm text-sm leading-6 text-slate-200">{bannerDescription}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">Verified access</div>
              <div className="mt-1 text-sm font-semibold text-white">Real ticket inventory for headline fixtures</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">Fast booking</div>
              <div className="mt-1 text-sm font-semibold text-white">Go from discovery to checkout in a few taps</div>
            </div>
          </div>
          <div className="mt-auto pt-6">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              href={bannerUrl}
              onClick={onNavigate}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 text-emerald-700" />
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}

interface MatchMenuProps {
  ctaLabel: string;
  emptyLabel: string;
  eyebrow: string;
  matches: MatchCardData[];
  onNavigate: () => void;
  subtitle: string;
  title: string;
}

export function MatchMenu({
  ctaLabel,
  emptyLabel,
  eyebrow,
  matches,
  onNavigate,
  subtitle,
  title,
}: MatchMenuProps) {
  return (
    <section className="space-y-5 p-6">
      <PanelHeader
        actionHref="/matches"
        actionLabel={ctaLabel}
        icon={CalendarDays}
        subtitle={subtitle}
        title={title}
        onNavigate={onNavigate}
      />
      {matches.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {matches.map((match) => (
              <Link
                key={match.id}
                className="group flex min-h-[220px] flex-col rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.82))] p-4 shadow-[0_18px_52px_-36px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_30px_60px_-34px_rgba(16,185,129,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                href={match.href}
                onClick={onNavigate}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <Sparkles className="h-3 w-3 text-emerald-700" />
                    {match.badge}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {match.league}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <TeamMark logo={match.homeLogo} teamName={match.homeTeam} />
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    VS
                  </span>
                  <TeamMark logo={match.awayLogo} teamName={match.awayTeam} />
                </div>
                <div className="mt-5 space-y-2">
                  <h3 className="text-base font-semibold leading-snug text-slate-900">
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock3 className="h-4 w-4 text-cyan-700" />
                    <span>{match.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    <span className="truncate">{match.stadium}</span>
                  </div>
                </div>
                <div className="mt-auto pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition-colors group-hover:text-emerald-700">
                    {eyebrow}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f0fdf4)] px-6 py-10 text-center text-sm text-slate-500">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}

export function MobileNav({ className, featuredMatches, onNavigate }: MobileNavProps) {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const copy = getMenuCopy(locale);
  const leagues = getLeagueItems(locale);
  const matches = getMenuMatches(featuredMatches, locale).slice(0, 4);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.45)]">
        <Accordion collapsible className="w-full" type="single">
          <AccordionItem className="border-b border-slate-100" value="matches">
            <AccordionTrigger className="rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-900 hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span>
                  <span className="block">{t("upcoming_matches")}</span>
                  <span className="block text-xs font-normal text-slate-500">{copy.matchesSubtitle}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3">
                {matches.map((match) => (
                  <SheetClose asChild key={match.id}>
                    <Link
                      className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
                      href={match.href}
                      onClick={onNavigate}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex items-center gap-2">
                          <TeamMark compact logo={match.homeLogo} teamName={match.homeTeam} />
                          <TeamMark compact logo={match.awayLogo} teamName={match.awayTeam} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {match.homeTeam} vs {match.awayTeam}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            {match.dateLabel} · {match.stadium}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-700" />
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
                    href="/matches"
                    onClick={onNavigate}
                  >
                    {copy.viewAllMatches}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </SheetClose>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem className="border-b-0" value="leagues">
            <AccordionTrigger className="rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-900 hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Trophy className="h-4 w-4" />
                </span>
                <span>
                  <span className="block">{t("top_leagues")}</span>
                  <span className="block text-xs font-normal text-slate-500">{copy.leaguesSubtitle}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="grid gap-3">
                {leagues.map((league) => (
                  <SheetClose asChild key={league.label}>
                    <Link
                      className="flex items-center gap-3 rounded-[22px] border border-slate-200/80 bg-white p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/35"
                      href={league.href}
                      onClick={onNavigate}
                    >
                      <div className={cn("relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)]", league.tone)}>
                        <Image alt={league.label} fill sizes="44px" src={league.logo} className="object-contain p-2" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{league.label}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">{league.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-700" />
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SheetClose asChild>
          <Link
            className="flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.45)] transition-colors hover:border-emerald-200 hover:bg-emerald-50/35"
            href="/#promotions"
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{t("special_offers")}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-700" />
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            className="flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.45)] transition-colors hover:border-emerald-200 hover:bg-emerald-50/35"
            href="/history"
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Ticket className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{t("my_tickets")}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-700" />
          </Link>
        </SheetClose>
      </div>

      <div className="rounded-[28px] border border-emerald-100/70 bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(14,165,233,0.08))] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">{copy.mobileBadgeTitle}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{copy.mobileBadgeDescription}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  actionHref: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate: () => void;
  subtitle: string;
  title: string;
}

function PanelHeader({
  actionHref,
  actionLabel,
  icon: Icon,
  onNavigate,
  subtitle,
  title,
}: PanelHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <div>
          <p className="text-xl font-semibold tracking-tight text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
        href={actionHref}
        onClick={onNavigate}
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function TeamMark({
  compact = false,
  logo,
  teamName,
}: {
  compact?: boolean;
  logo?: string;
  teamName: string;
}) {
  const sizeClassName = compact ? "h-9 w-9 rounded-xl text-[10px]" : "h-14 w-14 rounded-2xl text-xs";

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.55)]",
          sizeClassName,
        )}
      >
        {logo ? (
          <Image alt={teamName} fill sizes={compact ? "36px" : "56px"} src={logo} className="object-contain p-1.5" />
        ) : (
          <span className="font-black uppercase tracking-[0.18em] text-emerald-700">{getInitials(teamName)}</span>
        )}
      </div>
      {!compact ? <span className="line-clamp-2 text-xs font-semibold leading-4 text-slate-700">{teamName}</span> : null}
    </div>
  );
}

function getLeagueItems(locale: string): LeagueItem[] {
  const isVietnamese = locale === "vi";

  return [
    {
      description: isVietnamese ? "Lịch đấu lớn cuối tuần, nhu cầu vé cao." : "Weekend blockbusters with high ticket demand.",
      href: "/matches?league=Premier%20League%2024%2F25",
      label: "Premier League",
      logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
      metric: isVietnamese ? "Hot trong tuần" : "Hot this week",
      tone: "bg-[linear-gradient(135deg,#ecfeff,#ffffff)]",
    },
    {
      description: isVietnamese ? "Các trận tâm điểm trong nước, mở bán liên tục." : "Domestic headline fixtures with rolling ticket drops.",
      href: "/matches?league=V-League%201",
      label: "V-League 1",
      logo: "https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg",
      metric: isVietnamese ? "Sân đầy nhanh" : "Fast sellout",
      tone: "bg-[linear-gradient(135deg,#f0fdf4,#ffffff)]",
    },
    {
      description: isVietnamese ? "Không khí châu Âu đỉnh cao cho các trận knock-out." : "Peak European nights for knockout fixtures.",
      href: "/matches?league=Champions%20League",
      label: "Champions League",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/UEFA_Champions_League_logo_2.svg",
      metric: isVietnamese ? "Premium access" : "Premium access",
      tone: "bg-[linear-gradient(135deg,#eff6ff,#ffffff)]",
    },
    {
      description: isVietnamese ? "Nhịp độ Tây Ban Nha, ghế đẹp cập nhật theo thời gian thực." : "Spanish fixtures with realtime seat updates.",
      href: "/matches?league=La%20Liga",
      label: "La Liga",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg",
      metric: isVietnamese ? "Ghế đẹp mới" : "New best seats",
      tone: "bg-[linear-gradient(135deg,#fff7ed,#ffffff)]",
    },
  ];
}

function getMenuMatches(featuredMatches: Match[] | null | undefined, locale: string): MatchCardData[] {
  const baseMatches: MatchCardData[] = (featuredMatches ?? []).map((match) => ({
    awayLogo: match.away_logo || undefined,
    awayTeam: match.away_team,
    badge: locale === "vi" ? "Đang mở bán" : "On sale",
    dateLabel: formatMatchDate(match.date, locale),
    href: `/matches?q=${encodeURIComponent(match.home_team)}`,
    homeLogo: match.home_logo || undefined,
    homeTeam: match.home_team,
    id: match.id,
    league: match.tournaments?.name ?? (locale === "vi" ? "Giải nổi bật" : "Featured league"),
    stadium: match.stadium,
  }));

  const fallbackMatches = getFallbackMatches(locale);
  const combinedMatches = [...baseMatches];

  for (const fallbackMatch of fallbackMatches) {
    if (combinedMatches.length >= 6) {
      break;
    }

    if (!combinedMatches.some((match) => match.id === fallbackMatch.id)) {
      combinedMatches.push(fallbackMatch);
    }
  }

  return combinedMatches.slice(0, 6);
}

function getFallbackMatches(locale: string): MatchCardData[] {
  const isVietnamese = locale === "vi";

  return [
    {
      awayTeam: "Arsenal",
      badge: isVietnamese ? "Bán nhanh" : "Fast moving",
      dateLabel: isVietnamese ? "CN, 19:30 · 16 Thg 3" : "Sun, 7:30 PM · Mar 16",
      href: "/matches?q=Manchester%20City",
      homeTeam: "Manchester City",
      id: "sample-match-city-arsenal",
      league: "Premier League",
      stadium: "Etihad Stadium",
    },
    {
      awayTeam: "Hải Phòng FC",
      badge: isVietnamese ? "Nổi bật hôm nay" : "Top pick today",
      dateLabel: isVietnamese ? "T7, 18:00 · 22 Thg 3" : "Sat, 6:00 PM · Mar 22",
      href: "/matches?q=C%C3%B4ng%20An%20H%C3%A0%20N%E1%BB%99i",
      homeTeam: "Công An Hà Nội",
      id: "sample-match-cahn-haiphong",
      league: "V-League 1",
      stadium: "Hàng Đẫy Stadium",
    },
    {
      awayTeam: "Inter Milan",
      badge: isVietnamese ? "Ghế đẹp còn ít" : "Limited prime seats",
      dateLabel: isVietnamese ? "T4, 02:00 · 2 Thg 4" : "Wed, 2:00 AM · Apr 2",
      href: "/matches?q=Barcelona",
      homeTeam: "Barcelona",
      id: "sample-match-barca-inter",
      league: "Champions League",
      stadium: "Estadi Olimpic Lluis Companys",
    },
    {
      awayTeam: "Atletico Madrid",
      badge: isVietnamese ? "Mở bán mới" : "Fresh release",
      dateLabel: isVietnamese ? "T2, 03:00 · 7 Thg 4" : "Mon, 3:00 AM · Apr 7",
      href: "/matches?q=Real%20Madrid",
      homeTeam: "Real Madrid",
      id: "sample-match-real-atleti",
      league: "La Liga",
      stadium: "Santiago Bernabeu",
    },
  ];
}

function formatMatchDate(date: string, locale: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return locale === "vi" ? "Lịch sẽ cập nhật" : "Schedule updating";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(parsedDate);
}

function getInitials(teamName: string) {
  return teamName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function getMenuCopy(locale: string) {
  if (locale === "vi") {
    return {
      bannerBadge: "Vé xác thực",
      bannerDescription:
        "Theo dõi các giải đấu lớn với thông tin mở bán rõ ràng, vé thật và lối vào đặt vé nhanh.",
      bannerTitle: "Khám phá những giải đấu đáng xem nhất",
      emptyMatches: "Danh sách trận đang được cập nhật.",
      exploreTickets: "Khám phá vé",
      leaguesSubtitle: "Đi thẳng vào giải đấu nổi bật và xem ngay các trận đang được săn đón.",
      leaguesTitle: "Giải đấu nổi bật",
      matchesEyebrow: "Xem chi tiết",
      matchesSubtitle: "Những trận đáng chú ý nhất với giờ đấu, sân và vé đang mở bán.",
      matchesTitle: "Trận đấu sắp tới",
      mobileBadgeDescription:
        "Xem nhanh trận hot, ưu đãi nổi bật và ví vé của bạn trên mọi kích thước màn hình.",
      mobileBadgeTitle: "Luôn sẵn sàng trên mobile",
      viewAllMatches: "Xem tất cả",
    };
  }

  return {
    bannerBadge: "Verified tickets",
    bannerDescription:
      "Follow headline competitions with clearer on-sale status, real inventory and faster paths to checkout.",
    bannerTitle: "Discover the competitions worth watching next",
    emptyMatches: "Featured matches are updating.",
    exploreTickets: "Explore tickets",
    leaguesSubtitle: "Jump into featured competitions and see the fixtures fans are booking now.",
    leaguesTitle: "Top leagues",
    matchesEyebrow: "View details",
    matchesSubtitle: "Headline fixtures with cleaner timing, venue details and live ticket access.",
    matchesTitle: "Upcoming matches",
    mobileBadgeDescription:
      "Browse hot fixtures, featured offers and your wallet quickly on every screen size.",
    mobileBadgeTitle: "Ready on mobile",
    viewAllMatches: "View all",
  };
}
