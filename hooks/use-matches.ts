import { useState, useEffect } from "react";
import { Match } from "@/types";
import { createClient } from "@/utils/supabase/client";

export interface MatchFilters {
    query?: string;
    league?: string;
    stadium?: string;
    securityLevel?: string | "All";
    team?: string;
}

export function useMatches(filters: MatchFilters = {}) {
    const [data, setData] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const fetchMatches = async () => {
            try {
                // Build query base
                let query = supabase.from('matches').select(`
                    *,
                    tournaments (name)
                `);

                // Apply text search across multiple fields
                if (filters.query) {
                    const searchStr = `%${filters.query}%`;
                    query = query.or(`home_team.ilike.${searchStr},away_team.ilike.${searchStr},stadium.ilike.${searchStr}`);
                }

                // Apply exact matches
                if (filters.stadium && filters.stadium !== "All") {
                    query = query.eq('stadium', filters.stadium);
                }

                if (filters.securityLevel && filters.securityLevel !== "All") {
                    query = query.eq('security_level', filters.securityLevel);
                }

                // Execute
                const { data: fetchResult, error: dbError } = await query.order('date', { ascending: true });

                if (dbError) throw dbError;

                // Client side league filter since it's a joined table column
                let formattedData = fetchResult as unknown as Match[];

                if (filters.league && filters.league !== "All") {
                    formattedData = formattedData.filter(m => m.tournaments?.name === filters.league);
                }

                if (filters.team && filters.team !== "All") {
                    formattedData = formattedData.filter(m => m.home_team === filters.team || m.away_team === filters.team);
                }

                if (isMounted) {
                    setData(formattedData || []);
                    setError(null);
                }

            } catch (err: any) {
                if (isMounted) {
                    console.warn("Supabase matches fetch error:", err?.message || err);
                    setError(err?.message || "Failed to fetch matches connection.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMatches();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.query, filters.league, filters.stadium, filters.securityLevel, filters.team]);

    return { data, isLoading, error };
}

export function useFeaturedMatches() {
    const [data, setData] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;

        const fetchFeatured = async () => {
            try {
                const { data: result, error } = await supabase
                    .from('matches')
                    .select('*, tournaments(name)')
                    .limit(3);

                if (error) throw error;

                if (isMounted) {
                    setData(result || []);
                    setIsLoading(false);
                }
            } catch (err: any) {
                console.warn("Featured matches error:", err?.message || err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchFeatured();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { data, isLoading };
}
