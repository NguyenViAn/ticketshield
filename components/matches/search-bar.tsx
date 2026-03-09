"use client";

import { Search, MapPin, CalendarDays } from "lucide-react";
import { NeonButton } from "@/components/ui/neon-button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTranslations, useLocale } from "next-intl";

interface Suggestion {
    type: "match" | "team" | "venue";
    title: string;
    desc: string;
}

export function SearchBar() {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations('Search');
    const locale = useLocale();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/${locale}/matches?q=${encodeURIComponent(query)}`);
            setIsFocused(false);
        }
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const searchStr = `%${query}%`;
                const { data, error } = await supabase
                    .from('matches')
                    .select('home_team, away_team, stadium, date')
                    .or(`home_team.ilike.${searchStr},away_team.ilike.${searchStr},stadium.ilike.${searchStr}`)
                    .limit(4);

                if (error) throw error;

                if (data) {
                    const newSuggestions: Suggestion[] = data.map(match => {
                        const isVenue = match.stadium.toLowerCase().includes(query.toLowerCase());

                        return {
                            type: isVenue ? "venue" : "match",
                            title: isVenue ? match.stadium : `${match.home_team} vs ${match.away_team}`,
                            desc: isVenue ? t("venue") : new Date(match.date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
                        };
                    });

                    // Deduplicate
                    const uniqueSuggestions = newSuggestions.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
                    setSuggestions(uniqueSuggestions);
                }
            } catch (err) {
                console.error("Autocomplete error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, t, locale]);

    return (
        <div className="relative z-40 mx-auto w-full">
            <form
                onSubmit={handleSearch}
                className={`relative overflow-hidden rounded-[28px] border bg-white/80 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.32)] backdrop-blur-xl transition-all duration-300 ${isFocused
                    ? "border-emerald-300 ring-4 ring-emerald-500/15"
                    : "border-white/70 hover:border-emerald-200"
                    }`}
            >
                <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center rounded-[22px] border border-white/70 bg-white/75 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                        <motion.div animate={{ scale: isFocused ? [1, 1.08, 1] : 1 }} transition={{ duration: 0.3 }}>
                            <Search className={`mr-3 h-5 w-5 ${isFocused ? "text-emerald-700" : "text-slate-400"}`} />
                        </motion.div>
                        <input
                            type="text"
                            className="w-full bg-transparent text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            placeholder={t("placeholder")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        />
                    </div>
                    <NeonButton type="submit" className="h-12 rounded-full border-0 bg-[linear-gradient(135deg,#22c55e_0%,#14b8a6_42%,#2563eb_100%)] px-6 text-sm text-white shadow-[0_20px_45px_-24px_rgba(34,197,94,0.45)] sm:px-8">
                        {t("search_tickets")}
                    </NeonButton>
                </div>
            </form>

            {/* Auto-complete suggestions */}
            <AnimatePresence>
                {isFocused && query.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 top-full mt-3 w-full overflow-hidden rounded-[24px] border border-white/80 bg-white/96 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                    >
                        <div className="p-2.5">
                            <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs font-bold uppercase text-emerald-700">
                                <span>{t("suggestions_title")}</span>
                                {isLoading && <span className="animate-pulse text-slate-400 text-[10px]">{t("searching")}</span>}
                            </div>
                            {suggestions.length === 0 && !isLoading ? (
                                <div className="p-4 text-center text-sm text-slate-500">{t("no_results")}</div>
                            ) : (
                                suggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="group flex cursor-pointer items-center gap-4 rounded-[20px] p-3 transition-colors hover:bg-emerald-50/50"
                                        onClick={() => {
                                            setQuery(item.title);
                                            router.push(`/${locale}/matches?q=${encodeURIComponent(item.title)}`);
                                            setIsFocused(false);
                                        }}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700">
                                            {item.type === "match" && <CalendarDays className="w-5 h-5" />}
                                            {item.type === "team" && <Search className="w-5 h-5" />}
                                            {item.type === "venue" && <MapPin className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800 transition-colors group-hover:text-emerald-700">{item.title}</h4>
                                            <p className="text-sm text-slate-500">{item.desc}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
