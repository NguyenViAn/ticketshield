import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildSecuritySessions,
  buildSuspiciousSessions,
  buildTopSuspiciousSessions,
  summarizeSecurity,
  type SecuritySession,
} from "@/lib/admin-security";
import {
  fetchAdminSecurityContext,
  fetchAdminStats,
  fetchAllBookingEvents,
  fetchAllMatches,
  fetchAllPromotions,
  fetchAllTickets,
  fetchBlockedUsers,
} from "@/lib/services/admin";
import type { AdminPromotion, AdminStats, AdminTicket, BlockedUser, BookingEvent, Match } from "@/types";
import { createClient } from "@/utils/supabase/client";

function useAdminData<T>(
  fetcher: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  initial: T,
) {
  const [data, setData] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

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
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}

const defaultStats: AdminStats = { matchCount: 0, ticketCount: 0, totalRevenue: 0, blockedUserCount: 0 };

const defaultSecuritySummary = {
  monitored: 0,
  warned: 0,
  blocked: 0,
  allowed: 0,
  avgRisk: 0,
  aiChecks: 0,
  aiLow: 0,
  aiWarning: 0,
  aiHigh: 0,
  aiFailedOpen: 0,
  sessionsWithAiHigh: 0,
  noAiCheckSessions: 0,
  aiCoverageRate: 0,
  aiBlockedMismatchCount: 0,
  failedOpenSessions: 0,
  failedOpenRate: 0,
  ruleWarnAiLowCount: 0,
  seatPageChecks: 0,
  paymentChecks: 0,
};

export type SecuritySummary = typeof defaultSecuritySummary;

const fetchAdminStatsData = (supabase: ReturnType<typeof createClient>) => fetchAdminStats(supabase);
const fetchAdminMatchesData = (supabase: ReturnType<typeof createClient>) => fetchAllMatches(supabase);
const fetchAdminTicketsData = (supabase: ReturnType<typeof createClient>) => fetchAllTickets(supabase);
const fetchAdminBookingEventsData = (supabase: ReturnType<typeof createClient>) => fetchAllBookingEvents(supabase);
const fetchAdminPromotionsData = (supabase: ReturnType<typeof createClient>) => fetchAllPromotions(supabase);
const fetchBlockedUsersData = (supabase: ReturnType<typeof createClient>) => fetchBlockedUsers(supabase);

interface SecurityContextData {
  sessions: SecuritySession[];
  summary: SecuritySummary;
  suspiciousSessions: SecuritySession[];
  topSuspiciousSessions: SecuritySession[];
  lastUpdatedAt: string | null;
}

const defaultSecurityContext: SecurityContextData = {
  sessions: [],
  summary: defaultSecuritySummary,
  suspiciousSessions: [],
  topSuspiciousSessions: [],
  lastUpdatedAt: null,
};

async function fetchSecurityContextData(supabase: ReturnType<typeof createClient>): Promise<SecurityContextData> {
  const { blockedUsers, bookingEvents, matches } = await fetchAdminSecurityContext(supabase);
  const sessions = buildSecuritySessions(bookingEvents, matches, blockedUsers);
  const summary = summarizeSecurity(sessions);
  const suspiciousSessions = buildSuspiciousSessions(sessions);
  const topSuspiciousSessions = buildTopSuspiciousSessions(sessions, 6);

  return {
    sessions,
    summary,
    suspiciousSessions,
    topSuspiciousSessions,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function useAdminStats() {
  return useAdminData<AdminStats>(fetchAdminStatsData, defaultStats);
}

export function useAdminMatches() {
  return useAdminData<Match[]>(fetchAdminMatchesData, []);
}

export function useAdminTickets() {
  return useAdminData<AdminTicket[]>(fetchAdminTicketsData, []);
}

export function useAdminBookingEvents() {
  return useAdminData<BookingEvent[]>(fetchAdminBookingEventsData, []);
}

export function useAdminPromotions() {
  return useAdminData<AdminPromotion[]>(fetchAdminPromotionsData, []);
}

export function useBlockedUsers() {
  return useAdminData<BlockedUser[]>(fetchBlockedUsersData, []);
}

export function useAdminSecurityContext() {
  return useAdminData<SecurityContextData>(fetchSecurityContextData, defaultSecurityContext);
}

/** @deprecated Use useAdminSecurityContext instead */
export function useAdminSecuritySessions() {
  return useAdminSecurityContext();
}
