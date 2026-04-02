import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminPromotion, AdminStats, AdminTicket, BlockedUser, BookingEvent, Match } from "@/types";

export async function fetchAdminStats(supabase: SupabaseClient): Promise<AdminStats> {
  const [matchRes, ticketRes, revenueRes, blockedRes] = await Promise.all([
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("price_paid"),
    supabase.from("blocked_users").select("id", { count: "exact", head: true }),
  ]);

  const totalRevenue = (revenueRes.data ?? []).reduce(
    (sum: number, ticket: { price_paid: number }) => sum + (ticket.price_paid || 0),
    0,
  );

  return {
    matchCount: matchRes.count ?? 0,
    ticketCount: ticketRes.count ?? 0,
    totalRevenue,
    blockedUserCount: blockedRes.count ?? 0,
  };
}

export async function fetchAllMatches(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("matches")
    .select("*, tournaments(name)")
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Match[];
}

export async function createMatch(
  supabase: SupabaseClient,
  match: {
    tournament_id: string;
    home_team: string;
    away_team: string;
    home_logo: string;
    away_logo: string;
    date: string;
    stadium: string;
    base_price: number;
    security_level: string;
    total_seats: number;
    available_seats: number;
  },
) {
  const { data, error } = await supabase.from("matches").insert(match).select().single();
  if (error) throw error;
  return data;
}

export async function updateMatch(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    home_team: string;
    away_team: string;
    date: string;
    stadium: string;
    base_price: number;
    security_level: string;
    total_seats: number;
    available_seats: number;
  }>,
) {
  const { data, error } = await supabase.from("matches").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMatch(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAllTickets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, matches(home_team, away_team, stadium, date)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminTicket[];
}

export async function fetchAllBookingEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("booking_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as BookingEvent[];
}

export async function updateTicketStatus(supabase: SupabaseClient, id: string, status: string) {
  const { data, error } = await supabase.from("tickets").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchAllPromotions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminPromotion[];
}

export async function togglePromotionActive(supabase: SupabaseClient, id: string, active: boolean) {
  const { data, error } = await supabase.from("promotions").update({ active }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchBlockedUsers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("*")
    .order("blocked_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlockedUser[];
}

export async function blockUser(supabase: SupabaseClient, userId: string, reason: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("blocked_users")
    .insert({
      user_id: userId,
      reason,
      blocked_by: userData.user?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unblockUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("blocked_users").delete().eq("user_id", userId);
  if (error) throw error;
}
