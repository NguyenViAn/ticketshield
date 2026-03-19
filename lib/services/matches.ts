import type { SupabaseClient } from "@supabase/supabase-js";

import type { Match } from "@/types";
import type { MatchFilters } from "@/hooks/use-matches";

export interface MatchSuggestionRow {
  away_team: string;
  date: string;
  home_team: string;
  stadium: string;
}

export async function fetchMatches(supabase: SupabaseClient, filters: MatchFilters) {
  let query = supabase.from("matches").select(`
      *,
      tournaments (name)
    `);

  if (filters.query) {
    const searchStr = `%${filters.query}%`;
    query = query.or(`home_team.ilike.${searchStr},away_team.ilike.${searchStr},stadium.ilike.${searchStr}`);
  }

  if (filters.stadium && filters.stadium !== "All") {
    query = query.eq("stadium", filters.stadium);
  }

  if (filters.securityLevel && filters.securityLevel !== "All") {
    query = query.eq("security_level", filters.securityLevel);
  }

  const { data, error } = await query.order("date", { ascending: true });

  if (error) {
    throw error;
  }

  let formattedData = (data ?? []) as Match[];

  if (filters.league && filters.league !== "All") {
    formattedData = formattedData.filter((match) => match.tournaments?.name === filters.league);
  }

  if (filters.team && filters.team !== "All") {
    formattedData = formattedData.filter((match) => match.home_team === filters.team || match.away_team === filters.team);
  }

  return formattedData;
}

export async function fetchFeaturedMatches(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("matches")
    .select("*, tournaments(name)")
    .limit(3);

  if (error) {
    throw error;
  }

  return (data ?? []) as Match[];
}

export async function fetchTeamsByLeague(supabase: SupabaseClient, league: string) {
  let query = supabase
    .from("matches")
    .select("home_team, away_team, tournaments!inner(name)");

  if (league !== "All") {
    query = query.eq("tournaments.name", league);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const teams = new Set<string>();

  (data ?? []).forEach((match) => {
    teams.add(match.home_team);
    teams.add(match.away_team);
  });

  return Array.from(teams).sort();
}

export async function fetchMatchSuggestions(supabase: SupabaseClient, query: string) {
  const searchStr = `%${query}%`;

  const { data, error } = await supabase
    .from("matches")
    .select("home_team, away_team, stadium, date")
    .or(`home_team.ilike.${searchStr},away_team.ilike.${searchStr},stadium.ilike.${searchStr}`)
    .limit(4);

  if (error) {
    throw error;
  }

  return (data ?? []) as MatchSuggestionRow[];
}
