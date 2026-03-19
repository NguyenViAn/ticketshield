"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SheetClose } from "@/components/ui/sheet";
import { resolveLeagueLogo, resolveTeamLogo } from "@/lib/logo-resolver";
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
type Translator = ReturnType<typeof useTranslations>;

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
  shortLabel?: string;
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

interface BannerHighlight {
  description: string;
  eyebrow: string;
}

const MENU_CLOSE_DELAY_MS = 140;

export function MegaMenu({ featuredMatches, navHeight }: MegaMenuProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const tMenu = useTranslations("MegaMenu");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const closeTimerRef = React.useRef<number | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<MenuKey | null>(null);

  const copy = React.useMemo(() => getMenuCopy(tMenu), [tMenu]);
  const leagues = React.useMemo(() => getLeagueItems(locale, tMenu), [locale, tMenu]);
  const matches = React.useMemo(() => getMenuMatches(featuredMatches, locale, tMenu), [featuredMatches, locale, tMenu]);
  const navLabels = React.useMemo(() => getNavLabels(locale), [locale]);

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
      setActiveMenu((currentMenu) => (currentMenu === menu ? currentMenu : menu));
    },
    [clearCloseTimer],
  );

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMenu((currentMenu) => (currentMenu === null ? currentMenu : null));
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
        className="theme-shell inline-flex items-center gap-1 p-1 xl:gap-1.5 xl:p-1.5"
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
          shortLabel={navLabels.matches}
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
          shortLabel={navLabels.leagues}
        />
        <NavItem href="/#promotions" icon={Sparkles} label={t("special_offers")} shortLabel={navLabels.offers} />
      </div>

      <AnimatePresence initial={false}>
        {activeMenu ? (
          <>
            <motion.div
              key="mega-overlay"
              aria-hidden="true"
              className="fixed inset-x-0 bottom-0 z-[105] bg-[linear-gradient(180deg,rgba(2,6,23,0.26),rgba(2,6,23,0.48)_30%,rgba(2,6,23,0.68)_100%)]"
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
              className="absolute left-1/2 top-[calc(100%+0.85rem)] z-[130] w-[min(100vw-2rem,70rem)] -translate-x-1/2"
              id={activeMenu === "matches" ? "matches-mega-menu" : "leagues-mega-menu"}
              initial={{ opacity: 0, y: -8, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.994 }}
              role="region"
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/96 shadow-[0_22px_56px_-32px_rgba(0,0,0,0.48)] ring-1 ring-white/10">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-cyan-400/4" />
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
                    bannerHighlights={copy.bannerHighlights}
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
  shortLabel,
}: NavItemProps) {
  const itemClassName = cn(
    "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 2xl:h-11 2xl:gap-2.5 2xl:px-4 2xl:text-sm",
    isActive || isOpen
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_10px_22px_-18px_rgba(16,185,129,0.28)]   "
      : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white    ",
  );
  const labelNode = (
    <>
      {shortLabel ? <span className="inline min-[1480px]:hidden">{shortLabel}</span> : null}
      <span className={cn(shortLabel ? "hidden min-[1480px]:inline" : "inline")}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link className={itemClassName} href={href}>
        <Icon className="h-3.5 w-3.5 text-emerald-300 2xl:h-4 2xl:w-4" />
        {labelNode}
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
      <Icon className="h-3.5 w-3.5 text-emerald-300 2xl:h-4 2xl:w-4" />
      {labelNode}
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ",
          isOpen ? "rotate-180 text-emerald-300" : "",
        )}
      />
    </button>
  );
}
interface LeagueMenuProps {
  bannerBadge: string;
  bannerDescription: string;
  bannerHighlights: BannerHighlight[];
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
  bannerHighlights,
  bannerTitle,
  bannerUrl,
  ctaLabel,
  leagues,
  onNavigate,
  subtitle,
  title,
}: LeagueMenuProps) {
  return (
    <section className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,20rem)] lg:p-6">
      <div className="space-y-4">
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
              className="group flex min-h-[124px] flex-col rounded-[22px] border border-white/10 bg-white/5 p-4 shadow-none transition-colors duration-150 hover:border-emerald-500/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              href={league.href}
              onClick={onNavigate}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/5 shadow-none  ",
                    league.tone,
                  )}
                >
                  <Image alt={league.label} fill sizes="48px" src={league.logo} className="object-contain p-2" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold theme-title">{league.label}</h3>
                  <p className="mt-1 text-sm leading-5 theme-copy-muted">{league.description}</p>
                </div>
                <span className="theme-chip shrink-0 px-2.5 py-1 normal-case tracking-normal text-[11px]">
                  {league.metric}
                </span>
              </div>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center gap-1 text-sm font-semibold theme-copy transition-colors group-hover:text-emerald-200 ">
                  {ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <aside className="relative overflow-hidden rounded-[24px] border border-emerald-100/70 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.16),transparent_32%),linear-gradient(160deg,#081725_0%,#0c1d31_48%,#104b57_100%)] p-5 text-white shadow-[0_22px_52px_-32px_rgba(15,23,42,0.46)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_45%)]" />
        <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-white/8 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-emerald-300/8 blur-2xl" />
        <div className="relative flex h-full flex-col">
          <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            {bannerBadge}
          </span>
          <div className="mt-4 space-y-3">
            <h3 className="max-w-xs text-[1.6rem] font-semibold leading-tight">{bannerTitle}</h3>
            <p className="max-w-sm text-sm leading-6 text-slate-200/92">{bannerDescription}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {bannerHighlights.map((highlight) => (
              <div key={highlight.eyebrow} className="rounded-[18px] border border-white/10 bg-white/[0.07] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">
                  {highlight.eyebrow}
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{highlight.description}</div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              href={bannerUrl}
              onClick={onNavigate}
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 text-white" />
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
    <section className="space-y-4 p-5 lg:p-6">
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
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {matches.map((match) => (
              <Link
                key={match.id}
                className="group flex min-h-[208px] flex-col rounded-[22px] border border-white/10 bg-white/5 p-4 text-white shadow-none transition-colors duration-150 hover:border-emerald-500/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                href={match.href}
                onClick={onNavigate}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 shadow-none   ">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    {match.badge}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300  ">
                    {match.league}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <TeamMark logo={match.homeLogo} teamName={match.homeTeam} />
                  <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300   ">
                    VS
                  </span>
                  <TeamMark logo={match.awayLogo} teamName={match.awayTeam} />
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-base font-semibold leading-snug theme-title">
                    {match.homeTeam} vs {match.awayTeam}
                  </h3>
                  <div className="flex items-center gap-2 text-sm theme-copy-muted">
                    <Clock3 className="h-4 w-4 text-cyan-300" />
                    <span>{match.dateLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm theme-copy-muted">
                    <MapPin className="h-4 w-4 text-emerald-300" />
                    <span className="truncate">{match.stadium}</span>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold theme-copy transition-colors group-hover:text-emerald-200 ">
                    {eyebrow}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm theme-copy-muted  ">
          {emptyLabel}
        </div>
      )}
    </section>
  );
}
export function MobileNav({ className, featuredMatches, onNavigate }: MobileNavProps) {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const tMenu = useTranslations("MegaMenu");
  const copy = getMenuCopy(tMenu);
  const leagues = getLeagueItems(locale, tMenu);
  const matches = getMenuMatches(featuredMatches, locale, tMenu).slice(0, 4);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="theme-shell rounded-[28px] p-3">
        <Accordion collapsible className="w-full" type="single">
          <AccordionItem className="border-b border-border/70" value="matches">
            <AccordionTrigger className="rounded-2xl px-3 py-3 text-left text-sm font-semibold theme-title hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="theme-icon-chip h-10 w-10">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span>
                  <span className="block">{t("upcoming_matches")}</span>
                  <span className="block text-xs font-normal theme-copy-muted">{copy.matchesSubtitle}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3">
                {matches.map((match) => (
                  <SheetClose asChild key={match.id}>
                    <Link
                      className="theme-shell-muted flex items-center gap-3 rounded-[22px] p-3 transition-colors hover:border-emerald-400/20 hover:bg-emerald-500/10 "
                      href={match.href}
                      onClick={onNavigate}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex items-center gap-2">
                          <TeamMark compact logo={match.homeLogo} teamName={match.homeTeam} />
                          <TeamMark compact logo={match.awayLogo} teamName={match.awayTeam} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold theme-title">
                            {match.homeTeam} vs {match.awayTeam}
                          </div>
                          <div className="mt-1 truncate text-xs theme-copy-muted">
                            {match.dateLabel} · {match.stadium}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-300" />
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    className="theme-link-accent inline-flex items-center gap-2 text-sm font-semibold"
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
            <AccordionTrigger className="rounded-2xl px-3 py-3 text-left text-sm font-semibold theme-title hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="theme-icon-chip h-10 w-10">
                  <Trophy className="h-4 w-4" />
                </span>
                <span>
                  <span className="block">{t("top_leagues")}</span>
                  <span className="block text-xs font-normal theme-copy-muted">{copy.leaguesSubtitle}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="grid gap-3">
                {leagues.map((league) => (
                  <SheetClose asChild key={league.label}>
                    <Link
                      className="theme-shell-strong flex items-center gap-3 rounded-[22px] p-3 transition-colors hover:border-emerald-400/20 hover:bg-emerald-500/10 "
                      href={league.href}
                      onClick={onNavigate}
                    >
                      <div
                        className={cn(
                          "theme-shell-strong relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-white/70",
                          league.tone,
                        )}
                      >
                        <Image alt={league.label} fill sizes="44px" src={league.logo} className="object-contain p-2" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold theme-title">{league.label}</div>
                        <div className="mt-1 truncate text-xs theme-copy-muted">{league.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-300" />
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
            className="theme-shell flex items-center justify-between rounded-[24px] px-4 py-4 transition-colors hover:border-emerald-400/20 hover:bg-emerald-500/10 "
            href="/#promotions"
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <span className="theme-icon-chip h-10 w-10">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold theme-title">{t("special_offers")}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-300" />
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Link
            className="theme-shell flex items-center justify-between rounded-[24px] px-4 py-4 transition-colors hover:border-emerald-400/20 hover:bg-emerald-500/10 "
            href="/history"
            onClick={onNavigate}
          >
            <span className="flex items-center gap-3">
              <span className="theme-icon-chip h-10 w-10">
                <Ticket className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold theme-title">{t("my_tickets")}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-emerald-300" />
          </Link>
        </SheetClose>
      </div>

      <div className="rounded-[28px] border border-emerald-100/70 bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(14,165,233,0.08))] p-4">
        <div className="flex items-start gap-3">
          <span className="theme-icon-chip h-10 w-10 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold theme-title">{copy.mobileBadgeTitle}</div>
            <div className="mt-1 text-sm leading-6 theme-copy-muted">{copy.mobileBadgeDescription}</div>
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
    <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="theme-chip bg-transparent ">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </div>
        <div>
          <p className="text-[1.15rem] font-semibold tracking-tight theme-title">{title}</p>
          <p className="mt-1 text-sm leading-6 theme-copy-muted">{subtitle}</p>
        </div>
      </div>
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold theme-copy transition-colors hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 "
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
  const sizeClassName = compact ? "h-9 w-9 rounded-xl text-[10px]" : "h-14 w-14 rounded-[18px] text-xs";

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div
        className={cn(
          "theme-shell-strong relative flex shrink-0 items-center justify-center overflow-hidden",
          sizeClassName,
        )}
      >
        {logo ? (
          <Image alt={teamName} fill sizes={compact ? "36px" : "56px"} src={logo} className="object-contain p-1.5" />
        ) : (
          <span className="font-black uppercase tracking-[0.18em] text-emerald-300">{getInitials(teamName)}</span>
        )}
      </div>
      {!compact ? <span className="line-clamp-2 text-xs font-semibold leading-4 theme-copy">{teamName}</span> : null}
    </div>
  );
}
function getLeagueItems(locale: string, t: Translator): LeagueItem[] {
  return [
    {
      description: t("league_items.premier_league.description"),
      href: "/matches?league=Premier%20League%2024%2F25",
      label: "Premier League",
      logo: resolveLeagueLogo("Premier League"),
      metric: t("league_items.premier_league.metric"),
      tone: "bg-[linear-gradient(135deg,#ecfeff,#ffffff)]",
    },
    {
      description: t("league_items.vleague.description"),
      href: "/matches?league=V-League%201",
      label: "V-League 1",
      logo: resolveLeagueLogo("V-League 1"),
      metric: t("league_items.vleague.metric"),
      tone: "bg-[linear-gradient(135deg,#f0fdf4,#ffffff)]",
    },
    {
      description: t("league_items.champions_league.description"),
      href: "/matches?league=Champions%20League",
      label: "Champions League",
      logo: resolveLeagueLogo("Champions League"),
      metric: t("league_items.champions_league.metric"),
      tone: "bg-[linear-gradient(135deg,#eff6ff,#ffffff)]",
    },
    {
      description: t("league_items.la_liga.description"),
      href: "/matches?league=La%20Liga",
      label: "La Liga",
      logo: resolveLeagueLogo("La Liga"),
      metric: t("league_items.la_liga.metric"),
      tone: "bg-[linear-gradient(135deg,#fff7ed,#ffffff)]",
    },
  ];
}

function getMenuMatches(featuredMatches: Match[] | null | undefined, locale: string, t: Translator): MatchCardData[] {
  const baseMatches: MatchCardData[] = (featuredMatches ?? []).map((match) => ({
    awayLogo: resolveTeamLogo(match.away_team, match.away_logo || undefined),
    awayTeam: match.away_team,
    badge: t("match_badge.on_sale"),
    dateLabel: formatMatchDate(match.date, locale, t("schedule_updating")),
    href: `/matches?q=${encodeURIComponent(match.home_team)}`,
    homeLogo: resolveTeamLogo(match.home_team, match.home_logo || undefined),
    homeTeam: match.home_team,
    id: match.id,
    league: match.tournaments?.name ?? t("featured_league"),
    stadium: match.stadium,
  }));

  const fallbackMatches = getFallbackMatches(locale, t);
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

function getFallbackMatches(locale: string, t: Translator): MatchCardData[] {
  const isVietnamese = locale.startsWith("vi");

  return [
    {
      awayTeam: "Arsenal",
      badge: t("match_badge.fast_moving"),
      dateLabel: isVietnamese ? "CN, 19:30 · 16 Thg 3" : "Sun, 7:30 PM · Mar 16",
      href: "/matches?q=Manchester%20City",
      homeTeam: "Manchester City",
      id: "sample-match-city-arsenal",
      league: "Premier League",
      stadium: "Etihad Stadium",
    },
    {
      awayTeam: "Hải Phòng FC",
      badge: t("match_badge.top_pick_today"),
      dateLabel: isVietnamese ? "T7, 18:00 · 22 Thg 3" : "Sat, 6:00 PM · Mar 22",
      href: "/matches?q=C%C3%B4ng%20An%20H%C3%A0%20N%E1%BB%99i",
      homeTeam: "Công An Hà Nội",
      id: "sample-match-cahn-haiphong",
      league: "V-League 1",
      stadium: "Sân vận động Hàng Đẫy",
    },
    {
      awayTeam: "Inter Milan",
      badge: t("match_badge.limited_prime_seats"),
      dateLabel: isVietnamese ? "T4, 02:00 · 2 Thg 4" : "Wed, 2:00 AM · Apr 2",
      href: "/matches?q=Barcelona",
      homeTeam: "Barcelona",
      id: "sample-match-barca-inter",
      league: "Champions League",
      stadium: "Estadi Olimpic Lluis Companys",
    },
    {
      awayTeam: "Atletico Madrid",
      badge: t("match_badge.fresh_release"),
      dateLabel: isVietnamese ? "T2, 03:00 · 7 Thg 4" : "Mon, 3:00 AM · Apr 7",
      href: "/matches?q=Real%20Madrid",
      homeTeam: "Real Madrid",
      id: "sample-match-real-atleti",
      league: "La Liga",
      stadium: "Santiago Bernabeu",
    },
  ];
}

function formatMatchDate(date: string, locale: string, fallbackLabel: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallbackLabel;
  }

  return new Intl.DateTimeFormat(locale.startsWith("vi") ? "vi-VN" : "en-US", {
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

function getMenuCopy(t: Translator) {
  return {
    bannerBadge: t("banner_badge"),
    bannerDescription: t("banner_description"),
    bannerHighlights: [
      {
        description: t("banner_highlights.verified_access.description"),
        eyebrow: t("banner_highlights.verified_access.eyebrow"),
      },
      {
        description: t("banner_highlights.fast_booking.description"),
        eyebrow: t("banner_highlights.fast_booking.eyebrow"),
      },
    ],
    bannerTitle: t("banner_title"),
    emptyMatches: t("empty_matches"),
    exploreTickets: t("explore_tickets"),
    leaguesSubtitle: t("leagues_subtitle"),
    leaguesTitle: t("leagues_title"),
    matchesEyebrow: t("matches_eyebrow"),
    matchesSubtitle: t("matches_subtitle"),
    matchesTitle: t("matches_title"),
    mobileBadgeDescription: t("mobile_badge_description"),
    mobileBadgeTitle: t("mobile_badge_title"),
    scheduleUpdating: t("schedule_updating"),
    viewAllMatches: t("view_all_matches"),
  };
}

function getNavLabels(locale: string) {
  if (locale.startsWith("vi")) {
    return {
      leagues: "Giải đấu",
      matches: "Trận hot",
      offers: "Ưu đãi",
    };
  }

  return {
    leagues: "Leagues",
    matches: "Matches",
    offers: "Offers",
  };
}
