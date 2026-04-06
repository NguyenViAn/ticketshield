import { NextRequest, NextResponse } from "next/server";

import { buildSessionFeatures, createInitialSeatSessionState, parseSeatSessionState } from "@/lib/ai/sessionFeatures";
import { logAiRiskEvent } from "@/lib/services/booking-events";
import { RiskServiceError, requestServerRiskCheck } from "@/lib/ai/serverRisk";
import { createClient } from "@/utils/supabase/server";
import { areConcreteSeatIds, areSeatIdsUnique, MAX_BOOKING_SEATS, normalizeSeatIds } from "@/utils/tickets";

type SecureCheckoutBody = {
  matchId?: string;
  seatIds?: string[];
  sessionId?: string;
  warningAccepted?: boolean;
  riskState?: unknown;
};

type CheckoutRpcResult = {
  bookingGroupId?: string;
  ticketIds?: string[];
  totalPrice?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SecureCheckoutBody;
    const matchId = typeof body.matchId === "string" ? body.matchId : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const seatIds = Array.isArray(body.seatIds) ? normalizeSeatIds(body.seatIds.map(String)) : [];
    const warningAccepted = body.warningAccepted === true;

    if (!matchId || !sessionId) {
      return NextResponse.json(
        { error: "matchId and sessionId are required." },
        { status: 400 }
      );
    }

    if (
      seatIds.length < 1 ||
      seatIds.length > MAX_BOOKING_SEATS ||
      !areSeatIdsUnique(seatIds) ||
      !areConcreteSeatIds(seatIds)
    ) {
      return NextResponse.json(
        { error: "Invalid seat selection." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const parsedRiskState = parseSeatSessionState(body.riskState);
    const baseState =
      parsedRiskState && parsedRiskState.sessionId === sessionId
        ? parsedRiskState
        : createInitialSeatSessionState(sessionId);
    const paymentClickedAt = Date.now();
    const paymentPageOpenedAt = baseState.paymentPageOpenedAt ?? paymentClickedAt;
    const finalRiskState = {
      ...baseState,
      sessionId,
      selectedSeatCount: seatIds.length,
      reviewOpenedAt: baseState.reviewOpenedAt ?? paymentPageOpenedAt,
      paymentPageOpenedAt,
      paymentClickedAt,
      checkoutAttemptCount: baseState.checkoutAttemptCount + 1,
    };
    const features = buildSessionFeatures(finalRiskState, paymentClickedAt);

    let riskResult:
      | Awaited<ReturnType<typeof requestServerRiskCheck>>
      | null = null;
    let riskCheckStatus: "passed" | "failed_open" = "passed";
    let checkedAt = new Date().toISOString();

    try {
      riskResult = await requestServerRiskCheck(features);
      checkedAt = riskResult.checkedAt;
    } catch (error) {
      if (!(error instanceof RiskServiceError)) {
        throw error;
      }

      console.warn("Secure checkout risk check failed open:", error.message);
      riskCheckStatus = "failed_open";
      checkedAt = new Date().toISOString();
    }

    await logAiRiskEvent(supabase, {
      checkedAt,
      confidence: riskResult?.confidence ?? null,
      features,
      matchId,
      riskCheckStatus,
      riskLevel: riskResult?.riskLevel,
      seatCount: seatIds.length,
      seatIds,
      sessionId,
      step: "payment_pre_checkout",
      warningAccepted,
    });

    if (riskResult?.riskLevel === "high") {
      return NextResponse.json({
        status: "blocked",
        riskLevel: riskResult.riskLevel,
        confidence: riskResult.confidence,
        checkedAt,
        riskCheckStatus,
        message: "Suspicious booking behaviour detected. Checkout was blocked.",
      });
    }

    if (riskResult?.riskLevel === "warning" && !warningAccepted) {
      return NextResponse.json({
        status: "warning",
        riskLevel: riskResult.riskLevel,
        confidence: riskResult.confidence,
        checkedAt,
        riskCheckStatus,
        message: "Your session looks unusual. Confirm to continue checkout.",
      });
    }

    const { data, error } = await supabase.rpc("checkout_booking", {
      match_uuid: matchId,
      seat_ids: seatIds,
    });

    if (error) {
      console.error("Secure checkout RPC failed:", error);
      return NextResponse.json(
        { error: error.message || "Checkout failed." },
        { status: 500 }
      );
    }

    const checkoutResult = (data ?? {}) as CheckoutRpcResult;

    return NextResponse.json({
      status: "success",
      riskLevel: riskResult?.riskLevel ?? "low",
      confidence: riskResult?.confidence ?? null,
      checkedAt,
      riskCheckStatus,
      bookingGroupId: checkoutResult.bookingGroupId ?? null,
      ticketIds: Array.isArray(checkoutResult.ticketIds)
        ? checkoutResult.ticketIds.map(String)
        : [],
      totalPrice: checkoutResult.totalPrice ?? null,
      message:
        riskCheckStatus === "failed_open"
          ? "Risk service unavailable. Checkout continued with fallback policy."
          : null,
    });
  } catch (error) {
    console.error("Secure checkout route error:", error);

    return NextResponse.json(
      { error: "Failed to complete secure checkout." },
      { status: 500 }
    );
  }
}
