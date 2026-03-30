import { useEffect, useLayoutEffect, useState } from "react";
import { Match } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { fetchFeaturedMatches, fetchMatches } from "@/lib/services/matches";

const FEATURED_MATCHES_CACHE_KEY = "ticketshield:featured-matches";
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface MatchFilters {
    query?: string;
    league?: string;
    stadium?: string;
    securityLevel?: string | "All";
    team?: string;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Failed to fetch matches connection.";
}

export function useMatches(filters: MatchFilters = {}) {
    const [data, setData] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();
    const { league, query, securityLevel, stadium, team } = filters;

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const loadMatches = async () => {
            try {
                const formattedData = await fetchMatches(supabase, {
                    league,
                    query,
                    securityLevel,
                    stadium,
                    team,
                });

                if (isMounted) {
                    setData(formattedData || []);
                    setError(null);
                }

            } catch (err: unknown) {
                if (isMounted) {
                    const message = getErrorMessage(err);
                    console.warn("Supabase matches fetch error:", message);
                    setError(message);
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadMatches();

        return () => {
            isMounted = false;
        };
    }, [league, query, securityLevel, stadium, team, supabase]);

    return { data, isLoading, error };
}

export function useFeaturedMatches(initialData?: Match[]) {
    const [data, setData] = useState<Match[]>(initialData ?? []);
    const [isLoading, setIsLoading] = useState(() => initialData === undefined);
    const supabase = createClient();

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const cachedMatches = window.sessionStorage.getItem(FEATURED_MATCHES_CACHE_KEY);

        if (!cachedMatches) {
            return;
        }

        try {
            const parsedMatches = JSON.parse(cachedMatches) as Match[];
            setData(parsedMatches);
            setIsLoading(false);
        } catch {
            window.sessionStorage.removeItem(FEATURED_MATCHES_CACHE_KEY);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchFeatured = async () => {
            try {
                const result = await fetchFeaturedMatches(supabase);

                if (isMounted) {
                    setData(result || []);
                    if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                            FEATURED_MATCHES_CACHE_KEY,
                            JSON.stringify(result || []),
                        );
                    }
                    setIsLoading(false);
                }
            } catch (err: unknown) {
                console.warn("Featured matches error:", getErrorMessage(err));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchFeatured();

        return () => {
            isMounted = false;
        };
    }, [supabase]);

    return { data, isLoading };
}
