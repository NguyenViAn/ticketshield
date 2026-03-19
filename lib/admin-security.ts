import type { AdminTicket, BlockedUser, Match } from "@/types";

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
  "Velocity spike",
  "IP rotation",
  "Device mismatch",
  "Proxy fingerprint",
  "Seat scraping",
  "Repeated checkout",
];

function hashString(value: string) {
  return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function inferDecision(score: number): SecurityDecision {
  if (score >= 85) return "block";
  if (score >= 60) return "warn";
  return "allow";
}

export function buildSecuritySessions(
  tickets: AdminTicket[],
  matches: Match[],
  blockedUsers: BlockedUser[]
): SecuritySession[] {
  const blockedSet = new Set(blockedUsers.map((item) => item.user_id));

  return tickets.slice(0, 24).map((ticket, index) => {
    const base = hashString(ticket.id + ticket.user_id + ticket.ai_validation_hash);
    const scoreFromHash = (base % 61) + 28;
    const score = blockedSet.has(ticket.user_id) ? Math.max(scoreFromHash, 89) : scoreFromHash;
    const fallbackMatch = matches[index % Math.max(matches.length, 1)];
    const matchName = ticket.matches
      ? `${ticket.matches.home_team} vs ${ticket.matches.away_team}`
      : fallbackMatch
      ? `${fallbackMatch.home_team} vs ${fallbackMatch.away_team}`
      : "Unknown fixture";

    return {
      id: ticket.id,
      sessionId: `TS-AI-${ticket.id.slice(0, 8).toUpperCase()}`,
      user: `User ${ticket.user_id.slice(0, 6)}`,
      match: matchName,
      score,
      decision: inferDecision(score),
      reasons: [
        REASON_SETS[base % REASON_SETS.length],
        REASON_SETS[(base + 2) % REASON_SETS.length],
      ],
      timestamp: ticket.created_at,
    };
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
