import type { SupabaseClient } from "@supabase/supabase-js";

import type { BlockedUser, BookingEvent, BookingEventType, Match } from "@/types";

export const SECURITY_REASON_COPY = {
  stable: "Stable selection pattern",
  rapidSwitch: "Rapid seat switching detected",
  repeatedCheckout: "Repeated checkout attempts",
  restrictedCheckout: "Checkout restricted by security rule",
} as const;

export type SecurityReason = (typeof SECURITY_REASON_COPY)[keyof typeof SECURITY_REASON_COPY];
export type SecurityDecision = "allow" | "warn" | "block";
export type SecurityStatus = "Normal" | "Warning" | "Blocked";
export type SecurityScoreLabel = "Low" | "Medium" | "High";

export interface SecurityTimelineEvent {
  id: string;
  type: BookingEventType;
  createdAt: string;
  seatCount: number;
  selectedCount: number;
  retryCount: number;
  seatIds: string[];
}

export interface SecuritySessionMetrics {
  totalSeatChanges: number;
  selectedSeatsPeak: number;
  retryCount: number;
  currentDecision: SecurityStatus;
}

export interface SecuritySession {
  id: string;
  rawSessionId: string;
  sessionId: string;
  userId: string | null;
  user: string;
  matchId: string | null;
  match: string;
  score: number;
  scoreLabel: SecurityScoreLabel;
  decision: SecurityDecision;
  status: SecurityStatus;
  reason: SecurityReason;
  reasons: SecurityReason[];
  timestamp: string;
  totalEvents: number;
  checkoutRetries: number;
  seatsTouched: number;
  metrics: SecuritySessionMetrics;
  events: SecurityTimelineEvent[];
}

const SEAT_CHANGE_TYPES = new Set<BookingEventType>(["seat_select", "seat_deselect"]);
const WARNING_SCORE = 56;
const BLOCKED_SCORE = 90;
const RAPID_SWITCH_WINDOW_MS = 2500;
const REASON_PRIORITY: SecurityReason[] = [
  SECURITY_REASON_COPY.restrictedCheckout,
  SECURITY_REASON_COPY.rapidSwitch,
  SECURITY_REASON_COPY.repeatedCheckout,
  SECURITY_REASON_COPY.stable,
];

function hashString(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getMetadataNumber(event: BookingEvent, key: keyof NonNullable<BookingEvent["metadata"]>) {
  const value = event.metadata?.[key];
  return typeof value === "number" ? value : null;
}

function getMetadataSeatIds(event: BookingEvent) {
  return Array.isArray(event.metadata?.seatIds)
    ? event.metadata.seatIds.filter((seatId): seatId is string => typeof seatId === "string" && seatId.trim().length > 0)
    : [];
}

function getSelectedCount(event: BookingEvent) {
  return getMetadataNumber(event, "selectedCount") ?? event.seat_count;
}

function getRetryCount(event: BookingEvent) {
  return getMetadataNumber(event, "retryCount") ?? 0;
}

function shortenIdentifier(value: string, head = 8, tail = 4) {
  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function getPublicSessionId(sessionId: string) {
  return `TS-SEC-${hashString(sessionId).toString(16).slice(0, 8).toUpperCase()}`;
}

function inferDecision(
  checkoutRestricted: boolean,
  repeatedCheckoutAttempts: boolean,
  rapidSeatSwitchDetected: boolean,
  totalSeatChanges: number,
  checkoutRetries: number,
  checkoutFailures: number,
) {
  if (checkoutRestricted) {
    return {
      decision: "block" as const,
      status: "Blocked" as const,
      scoreLabel: "High" as const,
      score: Math.min(100, BLOCKED_SCORE + checkoutFailures * 4 + checkoutRetries * 2),
    };
  }

  if (repeatedCheckoutAttempts || rapidSeatSwitchDetected) {
    const riskScore = WARNING_SCORE
      + (rapidSeatSwitchDetected ? 12 : 0)
      + (repeatedCheckoutAttempts ? 10 : 0)
      + Math.min(totalSeatChanges, 6);

    return {
      decision: "warn" as const,
      status: "Warning" as const,
      scoreLabel: "Medium" as const,
      score: Math.min(79, riskScore),
    };
  }

  return {
    decision: "allow" as const,
    status: "Normal" as const,
    scoreLabel: "Low" as const,
    score: 18,
  };
}

function getPrimaryReason(reasons: SecurityReason[]) {
  return REASON_PRIORITY.find((reason) => reasons.includes(reason)) ?? SECURITY_REASON_COPY.stable;
}

function getDecisionRank(decision: SecurityDecision) {
  if (decision === "block") return 3;
  if (decision === "warn") return 2;
  return 1;
}

export async function fetchSecurityBookingEvents(supabase: SupabaseClient, limit = 1000): Promise<BookingEvent[]> {
  const { data, error } = await supabase
    .from("booking_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as BookingEvent[];
}

export function buildSecuritySessions(events: BookingEvent[], matches: Match[], blockedUsers: BlockedUser[]): SecuritySession[] {
  const blockedSet = new Set(blockedUsers.map((item) => item.user_id));
  const matchMap = new Map(matches.map((match) => [match.id, `${match.home_team} vs ${match.away_team}`]));
  const groupedEvents = new Map<string, BookingEvent[]>();

  events.forEach((event) => {
    const sessionEvents = groupedEvents.get(event.session_id) ?? [];
    sessionEvents.push(event);
    groupedEvents.set(event.session_id, sessionEvents);
  });

  return Array.from(groupedEvents.entries())
    .map(([rawSessionId, sessionEvents]) => {
      const orderedEvents = sessionEvents
        .slice()
        .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
      const latestEvent = orderedEvents[orderedEvents.length - 1]!;
      const totalSeatChanges = orderedEvents.filter((event) => SEAT_CHANGE_TYPES.has(event.event_type)).length;
      const checkoutAttempts = orderedEvents.filter((event) => event.event_type === "checkout_attempt").length;
      const checkoutFailures = orderedEvents.filter((event) => event.event_type === "checkout_failed").length;
      const seatIdsTouched = new Set<string>();
      const recordedRetryCount = orderedEvents.reduce((max, event) => Math.max(max, getRetryCount(event)), 0);
      const retryCount = Math.max(recordedRetryCount, checkoutAttempts);
      const checkoutRetries = Math.max(0, Math.max(checkoutAttempts - 1, recordedRetryCount > 0 ? recordedRetryCount - 1 : 0));

      let selectedSeatsPeak = 0;
      let rapidSeatSwitchBursts = 0;
      let previousSeatChangeTimestamp: number | null = null;

      orderedEvents.forEach((event) => {
        const seatIds = getMetadataSeatIds(event);

        seatIds.forEach((seatId) => seatIdsTouched.add(seatId));
        selectedSeatsPeak = Math.max(selectedSeatsPeak, getSelectedCount(event), event.seat_count);

        if (!SEAT_CHANGE_TYPES.has(event.event_type)) {
          return;
        }

        const currentTimestamp = new Date(event.created_at).getTime();
        if (
          previousSeatChangeTimestamp !== null &&
          currentTimestamp - previousSeatChangeTimestamp <= RAPID_SWITCH_WINDOW_MS
        ) {
          rapidSeatSwitchBursts += 1;
        }

        previousSeatChangeTimestamp = currentTimestamp;
      });

      const userId = latestEvent.user_id ?? null;
      const rapidSeatSwitchDetected = totalSeatChanges >= 4 || (totalSeatChanges >= 2 && rapidSeatSwitchBursts >= 1);
      const repeatedCheckoutAttempts = checkoutAttempts >= 2 || recordedRetryCount >= 2;
      const checkoutRestricted = (userId ? blockedSet.has(userId) : false) || checkoutFailures >= 2;
      const reasonSet = new Set<SecurityReason>();

      if (checkoutRestricted) {
        reasonSet.add(SECURITY_REASON_COPY.restrictedCheckout);
      }

      if (rapidSeatSwitchDetected) {
        reasonSet.add(SECURITY_REASON_COPY.rapidSwitch);
      }

      if (repeatedCheckoutAttempts) {
        reasonSet.add(SECURITY_REASON_COPY.repeatedCheckout);
      }

      if (reasonSet.size === 0) {
        reasonSet.add(SECURITY_REASON_COPY.stable);
      }

      const reasons = Array.from(reasonSet);
      const { decision, score, scoreLabel, status } = inferDecision(
        checkoutRestricted,
        repeatedCheckoutAttempts,
        rapidSeatSwitchDetected,
        totalSeatChanges,
        checkoutRetries,
        checkoutFailures,
      );
      const primaryReason = getPrimaryReason(reasons);
      const matchId = latestEvent.match_id ? latestEvent.match_id : null;

      return {
        id: rawSessionId,
        rawSessionId,
        sessionId: getPublicSessionId(rawSessionId),
        userId,
        user: userId ? shortenIdentifier(userId) : "Guest session",
        matchId,
        match: matchId ? matchMap.get(matchId) ?? `Match ${shortenIdentifier(matchId, 6, 4)}` : "Unknown match",
        score,
        scoreLabel,
        decision,
        status,
        reason: primaryReason,
        reasons,
        timestamp: latestEvent.created_at,
        totalEvents: orderedEvents.length,
        checkoutRetries,
        seatsTouched: seatIdsTouched.size || selectedSeatsPeak,
        metrics: {
          totalSeatChanges,
          selectedSeatsPeak,
          retryCount,
          currentDecision: status,
        },
        events: orderedEvents.map((event) => ({
          id: event.id,
          type: event.event_type,
          createdAt: event.created_at,
          seatCount: event.seat_count,
          selectedCount: getSelectedCount(event),
          retryCount: getRetryCount(event),
          seatIds: getMetadataSeatIds(event),
        })),
      } satisfies SecuritySession;
    })
    .sort((left, right) => {
      const riskRankDiff = getDecisionRank(right.decision) - getDecisionRank(left.decision);
      if (riskRankDiff !== 0) {
        return riskRankDiff;
      }

      const scoreDiff = right.score - left.score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
    });
}

export function buildDailyTrend(values: string[], days = 7) {
  const today = new Date();
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      count: 0,
    };
  });

  const map = new Map(buckets.map((item) => [item.key, item]));

  values.forEach((value) => {
    const key = new Date(value).toISOString().slice(0, 10);
    const bucket = map.get(key);
    if (bucket) bucket.count += 1;
  });

  return buckets;
}

export function summarizeSecurity(sessions: SecuritySession[]) {
  const warned = sessions.filter((item) => item.decision === "warn").length;
  const blocked = sessions.filter((item) => item.decision === "block").length;
  const monitored = sessions.length;
  const avgRisk = monitored
    ? Math.round(sessions.reduce((sum, item) => sum + item.score, 0) / monitored)
    : 0;

  return { monitored, warned, blocked, avgRisk };
}
