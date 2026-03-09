"use client";

import { motion, Variants } from "framer-motion";
import { MatchCard } from "@/components/matches/match-card";
import { MatchesFilter } from "@/components/matches/matches-filter";
import { useMatches, MatchFilters } from "@/hooks/use-matches";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { NeonButton } from "@/components/ui/neon-button";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariant: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } },
};

export default function MatchesPage() {
    const t = useTranslations("MatchesPage");
    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto bg-slate-50">
            <Suspense fallback={
                <div className="text-center py-20 text-brand-green font-sans font-bold animate-pulse uppercase tracking-widest">
                    {t("loading")}
                </div>
            }>
                <MatchesContent />
            </Suspense>
        </main>
    );
}

function MatchesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("MatchesPage");

    // Construct filters object from URL Params
    const filters: MatchFilters = {
        query: searchParams.get('q') || '',
        league: searchParams.get('league') || 'All',
        stadium: searchParams.get('stadium') || 'All',
        securityLevel: (searchParams.get('securityLevel') as any) || 'All',
    };

    const { data: matches, isLoading, error } = useMatches(filters);
    const hasError = Boolean(error);

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Sidebar Filter - taking roughly 25% on large screens */}
            <aside className="w-full lg:w-1/4 flex-shrink-0 z-20">
                <MatchesFilter />
            </aside>

            {/* Main Content Area - taking roughly 75% on large screens */}
            <section className="flex-1 w-full flex flex-col pt-2 lg:pt-0">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-emerald-500 rounded-full" />
                        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-wide text-slate-900 uppercase">
                            {t("search_results")} <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-green to-emerald-500">{t("search_results_highlight")}</span>
                        </h1>
                    </div>

                    {filters.query || filters.league !== 'All' || filters.stadium !== 'All' || filters.securityLevel !== 'All' ? (
                        <p className="text-slate-500 font-sans tracking-wide text-sm flex gap-4 truncate">
                            <span>{t("found_matches_part1")} <strong className="text-brand-red">{matches.length}</strong> {t("found_matches_part2")}</span>
                        </p>
                    ) : (
                        <p className="text-slate-500 font-sans tracking-wide text-sm uppercase">
                            {t("showing_all")}
                        </p>
                    )}
                </motion.div>

                {hasError ? (
                    <div className="text-center py-20 w-full border border-dashed border-red-200 rounded-2xl bg-white shadow-sm">
                        <p className="text-lg font-heading font-bold text-brand-red mb-2">{t("error_title")}</p>
                        <p className="text-sm text-slate-500 mb-6">{t("error_desc")}</p>
                        <NeonButton onClick={() => router.refresh()}>{t("error_retry")}</NeonButton>
                    </div>
                ) : isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full relative z-10">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-52 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                        ))}
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 w-full border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
                        <p className="text-slate-500 font-sans mb-4 text-lg font-bold">{t("no_results_title")}</p>
                        <p className="text-sm text-slate-400">{t("no_results_desc")}</p>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full relative z-10 pb-20"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {matches.map((match) => (
                            <motion.div variants={itemVariant} key={match.id}>
                                <MatchCard
                                    id={match.id}
                                    home_team={match.home_team}
                                    away_team={match.away_team}
                                    home_logo={match.home_logo}
                                    away_logo={match.away_logo}
                                    date={match.date}
                                    stadium={match.stadium}
                                    security_level={match.security_level as any}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </section>
        </div>
    );
}
