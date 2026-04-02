import { useCallback, useEffect, useState } from "react";

import {
  fetchAdminStats,
  fetchAllBookingEvents,
  fetchAllMatches,
  fetchAllPromotions,
  fetchAllTickets,
  fetchBlockedUsers,
} from "@/lib/services/admin";
import type { AdminPromotion, AdminStats, AdminTicket, BlockedUser, BookingEvent, Match } from "@/types";
import { createClient } from "@/utils/supabase/client";

function useAdminData<T>(fetcher: (supabase: ReturnType<typeof createClient>) => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const refetch = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetcher(supabase);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch data";
      console.warn("Admin fetch error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, supabase]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

const defaultStats: AdminStats = { matchCount: 0, ticketCount: 0, totalRevenue: 0, blockedUserCount: 0 };

export function useAdminStats() {
  return useAdminData<AdminStats>((supabase) => fetchAdminStats(supabase), defaultStats);
}

export function useAdminMatches() {
  return useAdminData<Match[]>((supabase) => fetchAllMatches(supabase), []);
}

export function useAdminTickets() {
  return useAdminData<AdminTicket[]>((supabase) => fetchAllTickets(supabase), []);
}

export function useAdminBookingEvents() {
  return useAdminData<BookingEvent[]>((supabase) => fetchAllBookingEvents(supabase), []);
}

export function useAdminPromotions() {
  return useAdminData<AdminPromotion[]>((supabase) => fetchAllPromotions(supabase), []);
}

export function useBlockedUsers() {
  return useAdminData<BlockedUser[]>((supabase) => fetchBlockedUsers(supabase), []);
}
