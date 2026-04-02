"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search, Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { fetchTeamsByLeague } from "@/lib/services/matches";
import { createClient } from "@/utils/supabase/client";

const LEAGUE_OPTIONS = [
  { value: "Premier League 24/25", label: "Premier League" },
  { value: "Champions League", label: "Champions League" },
  { value: "La Liga", label: "La Liga" },
  { value: "Serie A", label: "Serie A" },
  { value: "V-League 2024/25", label: "V-League 2024/25" },
];

const STADIUM_OPTIONS = [
  { value: "Emirates Stadium", label: "Emirates Stadium" },
  { value: "Santiago Bernabeu", label: "Santiago Bernabeu" },
  { value: "Old Trafford", label: "Old Trafford" },
  { value: "Camp Nou", label: "Camp Nou" },
  { value: "Sân vận động Hàng Đẫy", label: "Sân Hàng Đẫy" },
  { value: "Sân vận động Pleiku", label: "Sân Pleiku" },
];

const SECURITY_LEVELS = ["All", "Ultra", "Maximum", "High", "Standard"] as const;

export function MatchesFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("MatchesFilter");

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const supabase = createClient();

  const activeLeague = searchParams.get("league") || "All";
  const activeStadium = searchParams.get("stadium") || "All";
  const activeSecurity = searchParams.get("securityLevel") || "All";
  const activeTeam = searchParams.get("team") || "All";
  const hasActiveFilters =
    Boolean(searchParams.get("q")) ||
    activeLeague !== "All" ||
    activeStadium !== "All" ||
    activeSecurity !== "All" ||
    activeTeam !== "All";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== "All") {
        params.set(name, value);
      } else {
        params.delete(name);
      }

      return params.toString();
    },
    [searchParams],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const next = createQueryString(key, value);
      router.push(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [createQueryString, pathname, router],
  );

  const handleReset = () => {
    setSearchTerm("");
    router.push(pathname, { scroll: false });
  };

  useEffect(() => {
    const timer = setTimeout(() => handleFilterChange("q", searchTerm), 450);
    return () => clearTimeout(timer);
  }, [handleFilterChange, searchTerm]);

  useEffect(() => {
    let isMounted = true;

    const loadTeams = async () => {
      setIsLoadingTeams(true);

      try {
        const teams = await fetchTeamsByLeague(supabase, activeLeague);
        if (isMounted) {
          setAvailableTeams(teams);
        }
      } catch (error) {
        console.error("Error fetching teams for filter:", error);
      } finally {
        if (isMounted) {
          setIsLoadingTeams(false);
        }
      }
    };

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, [activeLeague, supabase]);

  const fieldClassName =
    "w-full rounded-[18px] border border-white/12 bg-white/[0.07] px-4 py-3 text-sm text-slate-100 outline-none transition-all focus:border-emerald-400/40 focus:bg-white/[0.1] focus:ring-4 focus:ring-emerald-500/10";

  return (
    <div className="overflow-hidden rounded-[30px] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(30,41,59,0.82),rgba(15,23,42,0.92))] shadow-[0_28px_72px_-46px_rgba(0,0,0,0.58)]">
      <div className="border-b border-white/8 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/14 bg-emerald-400/10 text-emerald-300">
            <Filter className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-heading font-bold uppercase tracking-[0.2em] text-white">{t("title")}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {hasActiveFilters ? t("status_filtered") : t("status_full")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {t("keywordLabel")}
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              className={`${fieldClassName} pl-10`}
              placeholder={t("keywordPlaceholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {t("leagueLabel")}
          </label>
          <select
            value={activeLeague}
            onChange={(event) => handleFilterChange("league", event.target.value)}
            className={fieldClassName}
          >
            <option value="All">{t("allLeagues")}</option>
            {LEAGUE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span>{t("teamLabel")}</span>
            {isLoadingTeams ? (
              <span className="text-[10px] tracking-[0.12em] text-emerald-300">{t("loading_teams")}</span>
            ) : null}
          </label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={activeTeam}
              onChange={(event) => handleFilterChange("team", event.target.value)}
              disabled={isLoadingTeams}
              className={`${fieldClassName} pl-10 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="All">{t("allTeams")}</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {t("stadiumLabel")}
          </label>
          <select
            value={activeStadium}
            onChange={(event) => handleFilterChange("stadium", event.target.value)}
            className={fieldClassName}
          >
            <option value="All">{t("allStadiums")}</option>
            {STADIUM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <Shield className="h-4 w-4 text-emerald-300" />
            {t("securityLabel")}
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SECURITY_LEVELS.map((level) => {
              const isActive = activeSecurity === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleFilterChange("securityLevel", level)}
                  className={`rounded-[18px] border px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] transition-all ${
                    isActive
                      ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
                      : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-emerald-400/18 hover:text-slate-100"
                  }`}
                >
                  {level === "All" ? t("allLevels") : `${t("levelPrefix")} ${level}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="theme-inset-accent rounded-[24px] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
            {t("quick_reset_title")}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{t("quick_reset_desc")}</p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[18px] border border-emerald-400/18 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/14"
          >
            <RotateCcw className="h-4 w-4" />
            {t("clear_filters")}
          </button>
        </div>
      </div>
    </div>
  );
}
