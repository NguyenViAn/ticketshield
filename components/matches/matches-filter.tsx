"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, Filter, Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";

export function MatchesFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations("MatchesFilter");

    // Local state for debouncing the text input
    const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
    const [availableTeams, setAvailableTeams] = useState<string[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(false);
    const supabase = createClient();

    // Update URL parameters
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
        [searchParams]
    );

    const handleFilterChange = (key: string, value: string) => {
        router.push(pathname + "?" + createQueryString(key, value), { scroll: false });
    };

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange("q", searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const activeLeague = searchParams.get("league") || "All";
    const activeStadium = searchParams.get("stadium") || "All";
    const activeSecurity = searchParams.get("securityLevel") || "All";
    const activeTeam = searchParams.get("team") || "All";

    // Fetch dynamic teams based on activeLeague
    useEffect(() => {
        let isMounted = true;
        const fetchTeams = async () => {
            setIsLoadingTeams(true);
            try {
                let query = supabase.from('matches').select('home_team, away_team, tournaments!inner(name)');

                if (activeLeague !== "All") {
                    query = query.eq('tournaments.name', activeLeague);
                }

                const { data, error } = await query;
                if (error) throw error;

                if (isMounted && data) {
                    const teams = new Set<string>();
                    data.forEach(match => {
                        teams.add(match.home_team);
                        teams.add(match.away_team);
                    });
                    setAvailableTeams(Array.from(teams).sort());
                }
            } catch (error) {
                console.error("Error fetching teams for filter:", error);
            } finally {
                if (isMounted) setIsLoadingTeams(false);
            }
        };

        fetchTeams();

        return () => { isMounted = false; };
    }, [activeLeague, supabase]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full flex flex-col gap-6 shadow-sm h-fit sticky top-24">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <Filter className="w-5 h-5 text-brand-green" />
                <h3 className="font-heading font-bold text-slate-900 tracking-widest uppercase">{t("title")}</h3>
            </div>

            {/* Search Input */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-sans font-bold uppercase text-slate-500">{t("keywordLabel")}</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                        placeholder={t("keywordPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* League Filter */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-sans font-bold uppercase text-slate-500">{t("leagueLabel")}</label>
                <select
                    value={activeLeague}
                    onChange={(e) => handleFilterChange("league", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all appearance-none cursor-pointer"
                >
                    <option value="All">{t("allLeagues")}</option>
                    <option value="Premier League 24/25">Premier League</option>
                    <option value="Champions League">Champions League</option>
                    <option value="La Liga">La Liga</option>
                    <option value="Serie A">Serie A</option>
                    <option value="V-League 2024/25">V-League 2024/25</option>
                </select>
            </div>

            {/* Team Filter */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-sans font-bold uppercase text-slate-500 flex items-center justify-between">
                    <span>{t("teamLabel") || "Đội Bóng"}</span>
                    {isLoadingTeams && <span className="text-[10px] text-brand-green animate-pulse">Loading...</span>}
                </label>
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                        value={activeTeam}
                        onChange={(e) => handleFilterChange("team", e.target.value)}
                        disabled={isLoadingTeams}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="All">{t("allTeams") || "Tất cả các đội"}</option>
                        {availableTeams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stadium Filter */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-sans font-bold uppercase text-slate-500">{t("stadiumLabel")}</label>
                <select
                    value={activeStadium}
                    onChange={(e) => handleFilterChange("stadium", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all appearance-none cursor-pointer"
                >
                    <option value="All">{t("allStadiums")}</option>
                    <option value="Emirates Stadium">Emirates Stadium</option>
                    <option value="Santiago Bernabéu">Santiago Bernabéu</option>
                    <option value="Old Trafford">Old Trafford</option>
                    <option value="Camp Nou">Camp Nou</option>
                    <option value="Sân vận động Hàng Đẫy">Sân Hàng Đẫy</option>
                    <option value="Sân vận động Pleiku">Sân Pleiku</option>
                </select>
            </div>

            {/* Security Level Filter */}
            <div className="flex flex-col gap-3">
                <label className="text-xs font-sans font-bold uppercase text-slate-500 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-blue" />
                    {t("securityLabel")}
                </label>
                <div className="flex flex-col gap-3 mt-1">
                    {["All", "Ultra", "Maximum", "High", "Standard"].map((level) => {
                        const isActive = activeSecurity === level;
                        return (
                            <label key={level} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="security-level"
                                    value={level}
                                    checked={isActive}
                                    onChange={() => handleFilterChange("securityLevel", level)}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isActive ? "border-brand-green bg-brand-green/10" : "border-slate-300 group-hover:border-brand-green/50"}`}>
                                    {isActive && <div className="w-2.5 h-2.5 bg-brand-green rounded-sm"></div>}
                                </div>
                                <span className={`text-sm ${isActive ? "text-slate-900 font-bold" : "text-slate-500 group-hover:text-slate-700"}`}>
                                    {level === "All" ? t("allLevels") : `${t("levelPrefix")} ${level}`}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
