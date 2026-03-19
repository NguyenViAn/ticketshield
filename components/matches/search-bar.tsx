"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { fetchMatchSuggestions } from "@/lib/services/matches";
import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";

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
  const t = useTranslations("Search");
  const locale = useLocale();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
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
        const data = await fetchMatchSuggestions(supabase, query);

        if (data) {
          const nextSuggestions: Suggestion[] = data.map((match) => {
            const isVenue = match.stadium.toLowerCase().includes(query.toLowerCase());

            return {
              type: isVenue ? "venue" : "match",
              title: isVenue ? match.stadium : `${match.home_team} vs ${match.away_team}`,
              desc: isVenue
                ? t("venue")
                : new Date(match.date).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
            };
          });

          const uniqueSuggestions = nextSuggestions.filter(
            (value, index, collection) => collection.findIndex((item) => item.title === value.title) === index,
          );

          setSuggestions(uniqueSuggestions);
        }
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [locale, query, supabase, t]);

  return (
    <div className="relative z-40 mx-auto w-full">
      <form
        onSubmit={handleSearch}
        className={`relative overflow-hidden rounded-[28px] border bg-slate-900/60 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 ${
          isFocused ? "border-emerald-500 ring-4 ring-emerald-500/15" : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex flex-col gap-3 p-2.5 sm:p-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center rounded-[22px] border border-white/10 bg-white/5 px-3.5 py-3 shadow-none sm:px-4">
            <motion.div animate={{ scale: isFocused ? [1, 1.08, 1] : 1 }} transition={{ duration: 0.3 }}>
              <Search className={`mr-3 h-5 w-5 ${isFocused ? "text-emerald-400" : "text-slate-400"}`} />
            </motion.div>
            <input
              type="text"
              className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none sm:text-base"
              placeholder={t("placeholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            />
          </div>
          <NeonButton
            type="submit"
            className="h-12 w-full rounded-full border-0 bg-[linear-gradient(135deg,#22c55e_0%,#14b8a6_42%,#2563eb_100%)] px-6 text-sm text-white shadow-[0_20px_45px_-24px_rgba(34,197,94,0.45)] md:w-auto md:px-8"
          >
            {t("search_tickets")}
          </NeonButton>
        </div>
      </form>

      <AnimatePresence>
        {isFocused && query.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 top-full mt-3 w-full overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/90 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            <div className="p-2.5">
              <div className="mb-2 flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs font-bold uppercase text-emerald-400">
                <span>{t("suggestions_title")}</span>
                {isLoading ? <span className="animate-pulse text-[10px] text-slate-400">{t("searching")}</span> : null}
              </div>
              {suggestions.length === 0 && !isLoading ? (
                <div className="p-4 text-center text-sm text-slate-400">{t("no_results")}</div>
              ) : (
                suggestions.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="group flex cursor-pointer items-center gap-3 rounded-[20px] p-3 transition-colors hover:bg-emerald-500/10 sm:gap-4"
                    onClick={() => {
                      setQuery(item.title);
                      router.push(`/${locale}/matches?q=${encodeURIComponent(item.title)}`);
                      setIsFocused(false);
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition-colors group-hover:border-emerald-500/20 group-hover:bg-emerald-500/10 group-hover:text-emerald-400">
                      {item.type === "match" ? <CalendarDays className="h-5 w-5" /> : null}
                      {item.type === "team" ? <Search className="h-5 w-5" /> : null}
                      {item.type === "venue" ? <MapPin className="h-5 w-5" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold text-white transition-colors group-hover:text-emerald-400">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
