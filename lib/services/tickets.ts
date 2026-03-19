import type { SupabaseClient } from "@supabase/supabase-js";

import type { TicketWithMatch } from "@/types";

export async function fetchUserTickets(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required to view tickets.");
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("*, matches(*, tournaments(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TicketWithMatch[];
}
