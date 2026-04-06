export const RISK_SESSION_ID_STORAGE_KEY = "ticketshield_risk_session_id";
export const RISK_STATE_STORAGE_KEY = "ticketshield_risk_state_v1";

export type SeatSessionState = {
  sessionId: string;
  sessionStartTime: number;
  clickTimestamps: number[];
  totalClicks: number;
  seatSelectCount: number;
  seatDeselectCount: number;
  seatChangeCount: number;
  invalidSeatClickCount: number;
  crossSectionAttemptCount: number;
  tierChangeCount: number;
  selectedSeatCount: number;
  checkoutAttemptCount: number;
  refreshCount: number;
  firstSeatSelectedAt: number | null;
  reviewOpenedAt: number | null;
  paymentPageOpenedAt: number | null;
  paymentClickedAt: number | null;
  lastRiskLevel: "low" | "warning" | "high" | null;
  lastRiskConfidence: number | null;
  lastRiskCheckedAt: number | null;
};

export type SessionFeaturesPayload = {
  total_clicks: number;
  seat_select_count: number;
  seat_deselect_count: number;
  seat_change_count: number;
  invalid_seat_click_count: number;
  cross_section_attempt_count: number;
  tier_change_count: number;
  selected_seat_count: number;
  avg_click_interval_ms: number;
  min_click_interval_ms: number;
  time_to_first_seat_ms: number;
  time_to_complete_selection_ms: number;
  review_time_ms: number;
  payment_entry_delay_ms: number;
  checkout_attempt_count: number;
  refresh_count: number;
  session_duration_ms: number;
};

function createRiskSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `risk-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toRiskLevel(value: unknown): "low" | "warning" | "high" | null {
  return value === "low" || value === "warning" || value === "high" ? value : null;
}

export function createInitialSeatSessionState(sessionId = createRiskSessionId()): SeatSessionState {
  return {
    sessionId,
    sessionStartTime: Date.now(),
    clickTimestamps: [],
    totalClicks: 0,
    seatSelectCount: 0,
    seatDeselectCount: 0,
    seatChangeCount: 0,
    invalidSeatClickCount: 0,
    crossSectionAttemptCount: 0,
    tierChangeCount: 0,
    selectedSeatCount: 0,
    checkoutAttemptCount: 0,
    refreshCount: 0,
    firstSeatSelectedAt: null,
    reviewOpenedAt: null,
    paymentPageOpenedAt: null,
    paymentClickedAt: null,
    lastRiskLevel: null,
    lastRiskConfidence: null,
    lastRiskCheckedAt: null,
  };
}

export function recordClick(state: SeatSessionState): SeatSessionState {
  return {
    ...state,
    totalClicks: state.totalClicks + 1,
    clickTimestamps: [...state.clickTimestamps, Date.now()],
  };
}

export function parseSeatSessionState(value: unknown): SeatSessionState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.sessionId !== "string" || !record.sessionId) {
    return null;
  }

  return {
    sessionId: record.sessionId,
    sessionStartTime: toNumber(record.sessionStartTime, Date.now()),
    clickTimestamps: Array.isArray(record.clickTimestamps)
      ? record.clickTimestamps
          .map((timestamp) => toNumber(timestamp, NaN))
          .filter((timestamp) => Number.isFinite(timestamp))
      : [],
    totalClicks: toNumber(record.totalClicks),
    seatSelectCount: toNumber(record.seatSelectCount),
    seatDeselectCount: toNumber(record.seatDeselectCount),
    seatChangeCount: toNumber(record.seatChangeCount),
    invalidSeatClickCount: toNumber(record.invalidSeatClickCount),
    crossSectionAttemptCount: toNumber(record.crossSectionAttemptCount),
    tierChangeCount: toNumber(record.tierChangeCount),
    selectedSeatCount: toNumber(record.selectedSeatCount),
    checkoutAttemptCount: toNumber(record.checkoutAttemptCount),
    refreshCount: toNumber(record.refreshCount),
    firstSeatSelectedAt: toNullableNumber(record.firstSeatSelectedAt),
    reviewOpenedAt: toNullableNumber(record.reviewOpenedAt),
    paymentPageOpenedAt: toNullableNumber(record.paymentPageOpenedAt),
    paymentClickedAt: toNullableNumber(record.paymentClickedAt),
    lastRiskLevel: toRiskLevel(record.lastRiskLevel),
    lastRiskConfidence: toNullableNumber(record.lastRiskConfidence),
    lastRiskCheckedAt: toNullableNumber(record.lastRiskCheckedAt),
  };
}

function getClickIntervals(timestamps: number[]): number[] {
  if (timestamps.length < 2) {
    return [];
  }

  const intervals: number[] = [];

  for (let index = 1; index < timestamps.length; index += 1) {
    intervals.push(timestamps[index] - timestamps[index - 1]);
  }

  return intervals;
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function minimum(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return Math.min(...values);
}

export function buildSessionFeatures(state: SeatSessionState, now = Date.now()): SessionFeaturesPayload {
  const intervals = getClickIntervals(state.clickTimestamps);

  const timeToFirstSeat =
    state.firstSeatSelectedAt && state.firstSeatSelectedAt >= state.sessionStartTime
      ? state.firstSeatSelectedAt - state.sessionStartTime
      : 0;

  const selectionCompletedAt = state.reviewOpenedAt ?? now;
  const timeToCompleteSelection =
    selectionCompletedAt >= state.sessionStartTime ? selectionCompletedAt - state.sessionStartTime : 0;

  const reviewTime =
    state.reviewOpenedAt && state.paymentClickedAt && state.paymentClickedAt >= state.reviewOpenedAt
      ? state.paymentClickedAt - state.reviewOpenedAt
      : 0;

  const paymentEntryDelay =
    state.paymentPageOpenedAt && state.paymentClickedAt && state.paymentClickedAt >= state.paymentPageOpenedAt
      ? state.paymentClickedAt - state.paymentPageOpenedAt
      : 0;

  return {
    total_clicks: state.totalClicks,
    seat_select_count: state.seatSelectCount,
    seat_deselect_count: state.seatDeselectCount,
    seat_change_count: state.seatChangeCount,
    invalid_seat_click_count: state.invalidSeatClickCount,
    cross_section_attempt_count: state.crossSectionAttemptCount,
    tier_change_count: state.tierChangeCount,
    selected_seat_count: state.selectedSeatCount,
    avg_click_interval_ms: Math.round(average(intervals)),
    min_click_interval_ms: Math.round(minimum(intervals)),
    time_to_first_seat_ms: timeToFirstSeat,
    time_to_complete_selection_ms: timeToCompleteSelection,
    review_time_ms: reviewTime,
    payment_entry_delay_ms: paymentEntryDelay,
    checkout_attempt_count: state.checkoutAttemptCount,
    refresh_count: state.refreshCount,
    session_duration_ms: now - state.sessionStartTime,
  };
}
