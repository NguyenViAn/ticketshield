import type { SessionFeaturesPayload } from "@/lib/ai/sessionFeatures";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingEventMetadata, BookingEventType } from "@/types";

const BOOKING_SESSION_KEY = "ticketshield:booking-session-id";

function createBookingSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

export function getBookingSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const currentSessionId = window.sessionStorage.getItem(BOOKING_SESSION_KEY);
  if (currentSessionId) {
    return currentSessionId;
  }

  const nextSessionId = createBookingSessionId();
  window.sessionStorage.setItem(BOOKING_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

export async function logBookingEvent(
  supabase: SupabaseClient,
  {
    eventType,
    matchId,
    metadata,
    sessionId,
    seatCount,
  }: {
    eventType: BookingEventType;
    matchId: string;
    metadata?: BookingEventMetadata;
    sessionId?: string;
    seatCount: number;
  },
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("booking_events").insert({
      event_type: eventType,
      match_id: matchId,
      metadata: metadata ?? null,
      seat_count: seatCount,
      session_id: sessionId ?? getBookingSessionId(),
      user_id: user?.id ?? null,
    });

    if (error) {
      console.warn("Booking event log failed:", error.message);
    }
  } catch (error) {
    console.warn("Booking event log failed:", error);
  }
}

export async function logAiRiskEvent(
  supabase: SupabaseClient,
  {
    checkedAt,
    confidence,
    features,
    matchId,
    riskCheckStatus,
    riskLevel,
    seatCount,
    seatIds,
    sessionId,
    step,
    warningAccepted,
  }: {
    checkedAt: string;
    confidence: number | null;
    features: SessionFeaturesPayload;
    matchId: string;
    riskCheckStatus: "passed" | "failed_open";
    riskLevel?: "low" | "warning" | "high";
    seatCount: number;
    seatIds: string[];
    sessionId: string;
    step: "seat_page" | "payment_pre_checkout";
    warningAccepted?: boolean;
  }
) {
  const metadata: BookingEventMetadata = {
    checkedAt,
    confidence,
    features,
    riskCheckStatus,
    seatIds,
    selectedCount: seatCount,
    sessionId,
    step,
    warningAccepted,
  };

  if (riskLevel) {
    metadata.riskLevel = riskLevel;
  }

  await logBookingEvent(supabase, {
    eventType: "ai_risk_checked",
    matchId,
    metadata,
    sessionId,
    seatCount,
  });
}
