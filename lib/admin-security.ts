import type { BlockedUser, BookingEvent, Match } from "@/types";

export type SecurityDecision = "allow" | "warn" | "block";

export interface SecuritySession {
  id: string;
  sessionId: string;
  user: string;
  match: string;
  score: number;
  decision: SecurityDecision;
  reasons: string[];
  timestamp: string;
}

const REASON_SETS = [
  "Rapid seat switching",
  "Repeated checkout attempts",
  "Seat selection spike",
  "Suspicious session activity",
  "Blocked account signal",
  "Seat limit violation",
];

function hashString(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function inferDecision(score: number): SecurityDecision {
  if (score >= 85) return "block";
  if (score >= 50) return "warn";
  return "allow";
}

function getMetadataNumber(event: BookingEvent, key: keyof NonNullable<BookingEvent["metadata"]>) {
  const value = event.metadata?.[key];
  return typeof value === "number" ? value : null;
}

export function buildSecuritySessions(events: BookingEvent[], matches: Match[], blockedUsers: BlockedUser[]): SecuritySession[] {
  const blockedSet = new Set(blockedUsers.map((item) => item.user_id));
  const matchMap = new Map(matches.map((match) => [match.id, `${match.home_team} vs ${match.away_team}`]));
  const groupedEvents = new Map<string, BookingEvent[]>();

  events.forEach((event) => {
    const existingEvents = groupedEvents.get(event.session_id) ?? [];
    existingEvents.push(event);
    groupedEvents.set(event.session_id, existingEvents);
  });

  return Array.from(groupedEvents.entries())
    .map(([sessionId, sessionEvents]) => {
      const orderedEvents = sessionEvents
        .slice()
        .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime());
      const latestEvent = orderedEvents[orderedEvents.length - 1];
      const seatSelectCount = orderedEvents.filter((event) => event.event_type === "seat_select").length;
      const seatDeselectCount = orderedEvents.filter((event) => event.event_type === "seat_deselect").length;
      const checkoutAttempts = orderedEvents.filter((event) => event.event_type === "checkout_attempt").length;
      const checkoutFailures = orderedEvents.filter((event) => event.event_type === "checkout_failed").length;
      const maxSeatCount = orderedEvents.reduce((max, event) => Math.max(max, event.seat_count, getMetadataNumber(event, "selectedCount") ?? 0), 0);
      const minInteractionGap = orderedEvents.reduce<number | null>((currentMin, event) => {
        const currentGap = getMetadataNumber(event, "timeSinceLastActionMs");
        if (currentGap === null) return currentMin;
        if (currentMin === null) return currentGap;
        return Math.min(currentMin, currentGap);
      }, null);
      const retryCount = orderedEvents.reduce((max, event) => Math.max(max, getMetadataNumber(event, "retryCount") ?? 0), 0);
      const userId = latestEvent?.user_id ?? null;
      const reasons: string[] = [];
      let score = 10;

      if (maxSeatCount >= 4) {
        score += 20;
        reasons.push(REASON_SETS[2]);
      }

      if (maxSeatCount > 4) {
        score += 40;
        reasons.push(REASON_SETS[5]);
      }

      if (seatDeselectCount >= 2 || (seatSelectCount + seatDeselectCount >= 5 && minInteractionGap !== null && minInteractionGap < 1500)) {
        score += 25;
        reasons.push(REASON_SETS[0]);
      }

      if (checkoutAttempts >= 2 || retryCount >= 2) {
        score += 20;
        reasons.push(REASON_SETS[1]);
      }

      if (checkoutFailures >= 2 || retryCount >= 3) {
        score += 20;
        reasons.push(REASON_SETS[3]);
      }

      if (userId && blockedSet.has(userId)) {
        score = Math.max(score, 90);
        reasons.push(REASON_SETS[4]);
      }

      const distinctReasons = Array.from(new Set(reasons));
      const boundedScore = Math.min(score, 100);

      return {
        id: latestEvent?.id ?? sessionId,
        sessionId: `TS-AI-${hashString(sessionId).toString(16).slice(0, 8).toUpperCase()}`,
        user: userId ? `User ${userId.slice(0, 6)}` : "Guest session",
        match: matchMap.get(latestEvent?.match_id ?? "") ?? "Unknown fixture",
        score: boundedScore,
        decision: inferDecision(boundedScore),
        reasons: distinctReasons.length ? distinctReasons : ["Stable behaviour"],
        timestamp: latestEvent?.created_at ?? new Date().toISOString(),
      } satisfies SecuritySession;
    })
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 48);
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
