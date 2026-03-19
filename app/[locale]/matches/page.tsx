"use client";

import { Suspense } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, CalendarClock, ShieldCheck, Ticket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { MatchCard } from "@/components/matches/match-card";
import { MatchesFilter } from "@/components/matches/matches-filter";
import { NeonButton } from "@/components/ui/neon-button";
import { useMatches, type MatchFilters } from "@/hooks/use-matches";

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

export default function MatchesPage() {
  const t = useTranslations("MatchesPage");

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-[1460px] px-4 pb-20 pt-22 sm:px-6 sm:pt-24 lg:px-8">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">{t("loading")}</div>
            </div>
          }
        >
          <MatchesContent />
        </Suspense>
      </div>
    </main>
  );
}

function MatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("MatchesPage");

  const filters: MatchFilters = {
    query: searchParams.get("q") || "",
    league: searchParams.get("league") || "All",
    stadium: searchParams.get("stadium") || "All",
    securityLevel: (searchParams.get("securityLevel") as MatchFilters["securityLevel"] | null) || "All",
    team: searchParams.get("team") || "All",
  };

  const { data: matches, isLoading, error } = useMatches(filters);
  const hasError = Boolean(error);
  const hasActiveFilters =
    Boolean(filters.query) ||
    filters.league !== "All" ||
    filters.stadium !== "All" ||
    filters.securityLevel !== "All" ||
    filters.team !== "All";

  const activeFilters = [
    filters.query ? `${t("filter_keyword")}: ${filters.query}` : null,
    filters.league !== "All" ? filters.league : null,
    filters.team !== "All" ? filters.team : null,
    filters.stadium !== "All" ? filters.stadium : null,
    filters.securityLevel !== "All" ? `${t("filter_security")} ${filters.securityLevel}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <section className="page-shell">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
              <CalendarClock className="h-3.5 w-3.5" />
              {t("hero_badge")}
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-heading font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t("hero_description")}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat label={t("stat_showing")} value={isLoading ? "..." : `${matches.length}`} />
              <HeroStat
                label={t("stat_security")}
                value={filters.securityLevel && filters.securityLevel !== "All" ? filters.securityLevel : t("stat_security_all")}
              />
              <HeroStat
                label={t("stat_destination")}
                value={filters.stadium && filters.stadium !== "All" ? filters.stadium : t("stat_destination_all")}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="page-card-muted p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">{t("summary_title")}</div>
              <div className="mt-4 text-3xl font-heading font-black text-white">{isLoading ? "--" : matches.length}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {hasActiveFilters ? t("summary_description_filtered") : t("summary_description_all")}
              </p>
            </div>

            <div className="page-card p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white">{t("protection_title")}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{t("protection_description")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <MatchesFilter />
        </aside>

        <section className="space-y-6">
          <div className="page-card flex flex-col gap-4 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">{t("results_badge")}</div>
                <h2 className="mt-2 text-3xl font-heading font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">
                  {t("results_title")}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  {hasActiveFilters
                    ? t("results_description_filtered", { count: matches.length })
                    : t("results_description_all")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="page-button-secondary rounded-2xl px-4 py-3 text-sm">
                  {t("status_label")}:{" "}
                  <span className="font-semibold text-emerald-300">
                    {hasError ? t("status_error") : isLoading ? t("status_loading") : t("status_ready")}
                  </span>
                </div>
                {hasError ? (
                  <NeonButton onClick={() => router.refresh()} className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                    {t("error_retry")}
                  </NeonButton>
                ) : null}
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-emerald-400/16 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {hasError ? (
            <div className="rounded-[30px] border border-dashed border-rose-400/30 bg-rose-500/5 px-6 py-16 text-center">
              <div className="text-lg font-heading font-bold text-rose-200">{t("error_title")}</div>
              <p className="mt-3 text-sm text-slate-300">{t("error_desc")}</p>
              <div className="mt-6">
                <NeonButton onClick={() => router.refresh()} className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                  {t("error_retry")}
                </NeonButton>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-[420px] animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-[30px] border border-dashed border-white/10 bg-white/5 px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/16 bg-emerald-400/10 text-emerald-300">
                <Ticket className="h-8 w-8" />
              </div>
              <div className="mt-5 text-xl font-heading font-bold text-white">{t("no_results_title")}</div>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">{t("no_results_desc")}</p>
              <div className="mt-7">
                <NeonButton
                  onClick={() => router.push(`/${locale}/matches`)}
                  className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]"
                >
                  {t("view_all_matches")}
                </NeonButton>
              </div>
            </div>
          ) : (
            <motion.div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
              {matches.map((match) => (
                <motion.div key={match.id} variants={itemVariant}>
                  <MatchCard
                    id={match.id}
                    home_team={match.home_team}
                    away_team={match.away_team}
                    home_logo={match.home_logo}
                    away_logo={match.away_logo}
                    date={match.date}
                    stadium={match.stadium}
                    security_level={match.security_level}
                    base_price={match.base_price}
                    available_seats={match.available_seats}
                    total_seats={match.total_seats}
                    tournament_name={match.tournaments?.name}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="page-card-muted flex items-center justify-between px-5 py-4">
            <p className="text-sm text-slate-300">{t("footer_note")}</p>
            <div className="hidden items-center gap-2 text-sm font-semibold text-emerald-300 sm:inline-flex">
              {t("footer_action")}
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="page-card-muted px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-heading font-bold text-white">{value}</div>
    </div>
  );
}
