"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { SeatMapRadial } from "@/components/seats/seat-map-radial";
import { TicketTierList } from "@/components/seats/ticket-tier-list";
import {
  buildSessionFeatures,
  createInitialSeatSessionState,
  RISK_SESSION_ID_STORAGE_KEY,
  RISK_STATE_STORAGE_KEY,
  recordClick,
  type SeatSessionState,
} from "@/lib/ai/sessionFeatures";
import { checkSessionRisk, RiskCheckClientError } from "@/lib/ai/riskClient";
import { logAiRiskEvent } from "@/lib/services/booking-events";
import { createClient } from "@/utils/supabase/client";
import {
  getTierDefinition,
  getTierFromSeatId,
  getSeatsTotalPrice,
  getSeatSelectionSummary,
  MAX_BOOKING_SEATS,
  sortSeatIds,
  type TicketTierId,
} from "@/utils/tickets";

const SESSION_TIMER_SECONDS = 5 * 60;
const INTERACTION_WARNING_WINDOW_MS = 8_000;
const SECTION_RESET_NOTICE = "Selection cleared after section change";
const EMPTY_SECTION_LABEL = "No section selected";
const EMPTY_SEAT_LIST_LABEL = "No seats selected";
const EMPTY_TOTAL_LABEL = "Choose seats to calculate total";

type SessionRiskStatus = "Normal" | "Warning" | "Blocked";
type SessionRiskScore = "Low" | "Medium" | "High";

interface SessionRiskState {
  reason: string;
  score: SessionRiskScore;
  status: SessionRiskStatus;
}

const DEFAULT_RISK_STATE: SessionRiskState = {
  status: "Normal",
  score: "Low",
  reason: "Stable selection pattern",
};

function formatSessionTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getNextRiskState(interactionTimestamps: number[]): SessionRiskState {
  const now = Date.now();
  const recentInteractions = interactionTimestamps.filter((timestamp) => now - timestamp <= INTERACTION_WARNING_WINDOW_MS);

  if (recentInteractions.length >= 3) {
    return {
      status: "Warning",
      score: "Medium",
      reason: "Rapid seat switching detected",
    };
  }

  return DEFAULT_RISK_STATE;
}

function getCtaHelperText(activeTier: TicketTierId | null, selectedSeatCount: number) {
  if (!activeTier) {
    return "Choose a section and at least 1 seat to continue";
  }

  if (selectedSeatCount === 0) {
    return "Select between 1 and 4 seats to continue";
  }

  return "Review complete. Continue to secure payment";
}

function getRiskActionNote(status: SessionRiskStatus) {
  if (status === "Blocked") {
    return "Checkout may be restricted for this session";
  }

  if (status === "Warning") {
    return "Additional verification may be required at checkout";
  }

  return null;
}

function formatLastChecked(timestamp: number | null) {
  if (!timestamp) {
    return "--";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function BookingWorkspace({
  awayTeam,
  basePrice,
  heroDate,
  homeTeam,
  leagueLogo,
  matchId,
  stadium,
  tournamentName,
  vsLabel,
}: {
  awayTeam: string;
  basePrice: number;
  heroDate: string;
  homeTeam: string;
  leagueLogo?: string | null;
  matchId: string;
  stadium: string;
  tournamentName?: string | null;
  vsLabel: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [activeTier, setActiveTier] = useState<TicketTierId | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [sessionTimer, setSessionTimer] = useState(SESSION_TIMER_SECONDS);
  const [sessionRisk, setSessionRisk] = useState<SessionRiskState>(DEFAULT_RISK_STATE);
  const [interactionTimestamps, setInteractionTimestamps] = useState<number[]>([]);
  const [summaryNotice, setSummaryNotice] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SeatSessionState>(
    createInitialSeatSessionState()
  );
  const [aiRiskLevel, setAiRiskLevel] = useState<"low" | "warning" | "high">("low");
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);

  const sortedSelectedSeats = useMemo(() => sortSeatIds(selectedSeats), [selectedSeats]);
  const selectedTierDefinition = activeTier ? getTierDefinition(activeTier) : null;
  const selectedTierPrice = selectedTierDefinition ? basePrice * selectedTierDefinition.priceMultiplier : null;
  const totalAmount = getSeatsTotalPrice(basePrice, sortedSelectedSeats);
  const currentStep = !activeTier ? 1 : sortedSelectedSeats.length === 0 ? 2 : 3;
  const selectedSectionLabel = activeTier ?? EMPTY_SECTION_LABEL;
  const seatListLabel = sortedSelectedSeats.length ? getSeatSelectionSummary(sortedSelectedSeats) : EMPTY_SEAT_LIST_LABEL;
  const totalAmountLabel = sortedSelectedSeats.length ? `${totalAmount.toLocaleString(locale)} VND` : EMPTY_TOTAL_LABEL;
  const ctaHelperText = getCtaHelperText(activeTier, sortedSelectedSeats.length);
  const effectiveRiskStatus: SessionRiskStatus =
    aiRiskLevel === "high" ? "Blocked" : aiRiskLevel === "warning" ? "Warning" : sessionRisk.status;
  const effectiveRiskScore: SessionRiskScore =
    aiRiskLevel === "high" ? "High" : aiRiskLevel === "warning" ? "Medium" : sessionRisk.score;
  const actionRiskNote = getRiskActionNote(effectiveRiskStatus);
  const isTimerLow = sessionTimer <= 60 && sessionTimer > 0;

  const pushToPayment = () => {
    const query = new URLSearchParams();
    query.set("matchId", matchId);
    query.set("sessionId", sessionState.sessionId);
    sortedSelectedSeats.forEach((seatId) => query.append("seatId", seatId));
    router.push(`/${locale}/payment?${query.toString()}`);
  };

  useEffect(() => {
    if (sortedSelectedSeats.length === 0) {
      setSessionTimer(SESSION_TIMER_SECONDS);
      return;
    }

    const interval = window.setInterval(() => {
      setSessionTimer((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [sortedSelectedSeats.length]);

  useEffect(() => {
    setSessionRisk(getNextRiskState(interactionTimestamps));
  }, [interactionTimestamps]);

  useEffect(() => {
    if (currentStep !== 3) {
      return;
    }

    setSessionState((prev) =>
      prev.reviewOpenedAt
        ? prev
        : {
            ...prev,
            reviewOpenedAt: Date.now(),
          }
    );
  }, [currentStep]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(RISK_SESSION_ID_STORAGE_KEY, sessionState.sessionId);
    window.sessionStorage.setItem(RISK_STATE_STORAGE_KEY, JSON.stringify(sessionState));
  }, [sessionState]);

  const handleChooseTier = (tierId: TicketTierId) => {
    if (activeTier === tierId) {
      return;
    }

    const hadSelection = selectedSeats.length > 0;
    setActiveTier(tierId);
    setSelectedSeats([]);
    setInteractionTimestamps([]);
    setSessionRisk(DEFAULT_RISK_STATE);
    setSessionTimer(SESSION_TIMER_SECONDS);
    setSummaryNotice(hadSelection ? SECTION_RESET_NOTICE : null);
    setAiRiskLevel("low");
    setAiConfidence(null);
    setSessionState((prev) => {
      const next = recordClick(prev);

      return {
        ...next,
        tierChangeCount: next.tierChangeCount + 1,
        selectedSeatCount: 0,
        reviewOpenedAt: null,
        lastRiskLevel: null,
        lastRiskConfidence: null,
        lastRiskCheckedAt: null,
      };
    });

    document.getElementById("seat-map-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectedSeatsChange = (nextSeats: string[]) => {
    const nextSortedSeats = sortSeatIds(nextSeats);

    setSelectedSeats(nextSortedSeats);
    setSessionTimer(SESSION_TIMER_SECONDS);
    setSummaryNotice(null);
    setSessionState((prev) => {
      if (nextSortedSeats.length > sortedSelectedSeats.length) {
        const next = recordClick(prev);

        return {
          ...next,
          seatSelectCount: next.seatSelectCount + 1,
          selectedSeatCount: nextSortedSeats.length,
          firstSeatSelectedAt: next.firstSeatSelectedAt ?? Date.now(),
        };
      }

      if (nextSortedSeats.length < sortedSelectedSeats.length) {
        const next = recordClick(prev);

        return {
          ...next,
          seatDeselectCount: next.seatDeselectCount + 1,
          seatChangeCount: next.seatChangeCount + 1,
          selectedSeatCount: nextSortedSeats.length,
        };
      }

      return {
        ...prev,
        selectedSeatCount: nextSortedSeats.length,
      };
    });
  };

  const handleSeatInteraction = () => {
    setInteractionTimestamps((currentTimestamps) => [...currentTimestamps, Date.now()].slice(-12));
  };

  const handleInvalidSeatClick = () => {
    setSessionState((prev) => {
      const next = recordClick(prev);

      return {
        ...next,
        invalidSeatClickCount: next.invalidSeatClickCount + 1,
      };
    });
  };

  const handleCrossSectionAttempt = () => {
    setSessionState((prev) => {
      const next = recordClick(prev);

      return {
        ...next,
        crossSectionAttemptCount: next.crossSectionAttemptCount + 1,
      };
    });
  };

  const handleClearSelection = () => {
    setSelectedSeats([]);
    setInteractionTimestamps([]);
    setSessionRisk(DEFAULT_RISK_STATE);
    setSessionTimer(SESSION_TIMER_SECONDS);
    setSummaryNotice(null);
    setAiRiskLevel("low");
    setAiConfidence(null);
    setSessionState((prev) => ({
      ...prev,
      selectedSeatCount: 0,
      reviewOpenedAt: null,
      lastRiskLevel: null,
      lastRiskConfidence: null,
      lastRiskCheckedAt: null,
    }));
  };

  const handleRemoveSeat = (seatId: string) => {
    handleSelectedSeatsChange(selectedSeats.filter((s) => s !== seatId));
  };

  const handleChooseAnotherSection = () => {
    handleClearSelection();
    setActiveTier(null);
    document.getElementById("seat-tier-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProceedToPayment = async () => {
    if (!sortedSelectedSeats.length) {
      return;
    }

    try {
      setIsCheckingRisk(true);

      const previewState: SeatSessionState = {
        ...sessionState,
        reviewOpenedAt: sessionState.reviewOpenedAt ?? Date.now(),
        selectedSeatCount: sortedSelectedSeats.length,
      };

      const features = buildSessionFeatures(previewState);
      const result = await checkSessionRisk(features);
      const checkedAtMs = Date.parse(result.checkedAt);

      await logAiRiskEvent(supabase, {
        checkedAt: result.checkedAt,
        confidence: result.confidence,
        features,
        matchId,
        riskCheckStatus: "passed",
        riskLevel: result.riskLevel,
        seatCount: sortedSelectedSeats.length,
        seatIds: sortedSelectedSeats,
        sessionId: sessionState.sessionId,
        step: "seat_page",
      });

      setAiRiskLevel(result.riskLevel);
      setAiConfidence(result.confidence);
      setSessionState((prev) => ({
        ...prev,
        reviewOpenedAt: previewState.reviewOpenedAt,
        selectedSeatCount: sortedSelectedSeats.length,
        lastRiskLevel: result.riskLevel,
        lastRiskConfidence: result.confidence,
        lastRiskCheckedAt: Number.isNaN(checkedAtMs) ? Date.now() : checkedAtMs,
      }));

      if (result.riskLevel === "high") {
        window.alert("Suspicious booking behaviour detected. Please slow down and try again.");
        return;
      }

      if (result.riskLevel === "warning") {
        const proceed = window.confirm(
          "Your session looks unusual. Do you still want to continue to payment?"
        );

        if (!proceed) {
          return;
        }
      }

      pushToPayment();
    } catch (error) {
      if (
        error instanceof RiskCheckClientError &&
        error.status >= 500
      ) {
        console.warn("Risk preview unavailable, continuing to payment:", error.message);
        window.alert("AI risk preview is temporarily unavailable. Risk will be checked again at payment.");
        pushToPayment();
        return;
      }

      console.error("Risk check failed:", error);
      window.alert("Could not verify session risk. Please try again.");
    } finally {
      setIsCheckingRisk(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── COMPACT HERO ─── */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              <span>Match overview</span>
              <span className="text-slate-500">&middot;</span>
              <span>{tournamentName || "Featured Match"}</span>
            </div>

            {leagueLogo ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] px-3 py-2 shadow-[0_18px_42px_-32px_rgba(16,185,129,0.24)] backdrop-blur-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 shadow-sm">
                  <Image
                    src={leagueLogo}
                    alt="League"
                    width={36}
                    height={36}
                    className="h-7 w-7 object-contain brightness-125 saturate-125"
                    unoptimized
                  />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                  {tournamentName || "V-LEAGUE"}
                </span>
              </div>
            ) : null}
          </div>

          <h1 className="mt-4 max-w-5xl text-balance text-3xl font-heading font-black uppercase leading-[0.94] tracking-tight text-white sm:text-4xl lg:text-5xl">
            <span>{homeTeam}</span>
            <span className="mx-3 inline-block align-middle text-emerald-400/50">{vsLabel}</span>
            <span>{awayTeam}</span>
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
              <MapPin className="h-3.5 w-3.5 text-emerald-300" />
              {stadium}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
              <CalendarClock className="h-3.5 w-3.5 text-emerald-300" />
              {heroDate}
            </span>
          </div>
        </div>

        {/* Price Card — compact */}
        <div className="page-card rounded-[26px] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {activeTier ? "Selected tier" : "Starting from"}
          </div>
          <div className="mt-3 text-4xl font-heading font-black leading-none tracking-tight text-emerald-300">
            {(selectedTierPrice ?? basePrice).toLocaleString(locale)}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-400">VND</div>
          <div className="mt-3 h-px bg-white/8" />
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {activeTier
              ? `${activeTier} tier selected. Choose up to ${MAX_BOOKING_SEATS} seats.`
              : "Pick a tier, select seats, then proceed to payment."}
          </p>
        </div>
      </section>

      {/* ─── STEP INDICATOR WITH PROGRESS ─── */}
      <StepIndicator currentStep={currentStep} />

      {/* ─── STEP 1: TICKET TIERS ─── */}
      <section id="seat-tier-step" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">Step 1</div>
          <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
            Choose ticket tier
          </h2>
        </div>
        <TicketTierList matchId={matchId} basePrice={basePrice} activeTier={activeTier} onChooseTier={handleChooseTier} />
      </section>

      {/* ─── STEP 2: SEAT MAP + SIDEBAR ─── */}
      <section id="seat-map-step" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">Step 2</div>
            <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
              Select up to 4 seats
            </h2>
          </div>
          <SeatMapRadial
            matchId={matchId}
            basePrice={basePrice}
            activeTier={activeTier}
            onCrossSectionAttempt={handleCrossSectionAttempt}
            onInvalidSeatClick={handleInvalidSeatClick}
            selectedSeats={sortedSelectedSeats}
            onSelectedSeatsChange={handleSelectedSeatsChange}
            onSeatInteraction={handleSeatInteraction}
          />
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="space-y-4 xl:sticky xl:top-24">
          {/* Session Timer — TOP of sidebar */}
          <div className={`rounded-[22px] border p-4 text-center transition-colors ${
            isTimerLow
              ? "border-amber-400/20 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(15,23,42,0.95))]"
              : "border-emerald-500/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(9,27,18,0.98))]"
          }`}>
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              <Clock className={`h-4 w-4 ${isTimerLow ? "text-amber-300" : "text-emerald-300"}`} />
              Session Timer
            </div>
            <motion.div
              key={sessionTimer}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className={`mt-2 text-4xl font-heading font-black tracking-tight ${
                isTimerLow ? "text-amber-300" : "text-white"
              }`}
            >
              {formatSessionTimer(sessionTimer)}
            </motion.div>
            <div className="mt-1 text-xs text-slate-400">Seats confirmed after checkout only</div>
          </div>

          {/* Booking Summary */}
          <PanelShell
            title="Booking Summary"
            actionLabel={sortedSelectedSeats.length ? "Clear all" : undefined}
            onAction={sortedSelectedSeats.length ? handleClearSelection : undefined}
            tone="primary"
          >
            <AnimatePresence initial={false}>
              {summaryNotice ? (
                <motion.div
                  key={summaryNotice}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 flex items-start gap-2 rounded-[18px] border border-cyan-400/16 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"
                >
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{summaryNotice}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <SummaryRow label="Section" value={selectedSectionLabel} />
            <SummaryRow label="Seats" value={`${sortedSelectedSeats.length}/${MAX_BOOKING_SEATS}`} />

            {/* Total Amount — Prominent */}
            <div className="mt-3 rounded-[18px] border border-emerald-500/14 bg-emerald-500/8 px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70">Total Amount</div>
              <div className="mt-1 text-2xl font-heading font-black tracking-tight text-emerald-300">
                {totalAmountLabel}
              </div>
            </div>

            {/* Selected Seats — Chip Tags */}
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selected seats</div>
              <div className="mt-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {sortedSelectedSeats.length ? (
                    <motion.div layout className="flex flex-wrap gap-2">
                      {sortedSelectedSeats.map((seatId) => (
                        <motion.button
                          key={seatId}
                          layout
                          type="button"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          onClick={() => handleRemoveSeat(seatId)}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-200"
                        >
                          {seatId}
                          <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-seats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-2 py-3 text-center"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-slate-500">
                        <Info className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-slate-400">Click seats on the map to select</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </PanelShell>

          {/* Session Control — Compact */}
          <PanelShell title="Session Control">
            <RiskStatusRow status={effectiveRiskStatus} score={effectiveRiskScore} />

            {/* AI Risk — Unified style, collapsible details */}
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <button
                type="button"
                onClick={() => setShowAiDetails(!showAiDetails)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm font-semibold text-white">AI Risk Monitor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    aiRiskLevel === "high"
                      ? "bg-rose-400/14 text-rose-300"
                      : aiRiskLevel === "warning"
                        ? "bg-amber-400/14 text-amber-300"
                        : "bg-emerald-400/14 text-emerald-300"
                  }`}>
                    {aiRiskLevel}
                  </span>
                  {showAiDetails ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {showAiDetails ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 border-t border-white/8 pt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Confidence</span>
                        <span className="font-semibold text-slate-200">
                          {aiConfidence !== null ? `${(aiConfidence * 100).toFixed(1)}%` : "--"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Last checked</span>
                        <span className="font-semibold text-slate-200">
                          {formatLastChecked(sessionState.lastRiskCheckedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Heuristic</span>
                        <span className="font-semibold text-slate-200">{sessionRisk.reason}</span>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Booking Rules — Compact */}
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Rules</div>
              <div className="mt-2 space-y-1.5 text-[13px] text-slate-300">
                <RuleItem text={`Max ${MAX_BOOKING_SEATS} seats per booking`} />
                <RuleItem text="Duplicate seat conflicts blocked" />
                <RuleItem text="Suspicious activity triggers warning" />
              </div>
            </div>
          </PanelShell>

          {/* Actions — Clear CTA hierarchy */}
          <PanelShell title="Actions">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!sortedSelectedSeats.length || isCheckingRisk}
              className="inline-flex h-14 w-full items-center justify-center rounded-[18px] bg-emerald-500 px-5 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_14px_30px_-18px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_18px_36px_-18px_rgba(16,185,129,0.5)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isCheckingRisk ? "Checking risk..." : "Proceed to Payment"}
            </button>

            <AnimatePresence initial={false}>
              {!sortedSelectedSeats.length && activeTier ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 flex items-start gap-2 rounded-[14px] border border-cyan-400/14 bg-cyan-400/8 px-3 py-2.5 text-[13px] text-cyan-200"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {ctaHelperText}
                </motion.div>
              ) : !activeTier ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-3 text-[13px] text-slate-400"
                >
                  {ctaHelperText}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {actionRiskNote ? (
                <motion.div
                  key={actionRiskNote}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`mt-3 flex items-start gap-2 rounded-[14px] border px-3 py-2.5 text-[13px] ${
                    effectiveRiskStatus === "Blocked"
                      ? "border-rose-400/18 bg-rose-400/10 text-rose-100"
                      : "border-amber-300/18 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {actionRiskNote}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Secondary action — ghost style */}
            <button
              type="button"
              onClick={handleChooseAnotherSection}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
            >
              Choose another section
            </button>
          </PanelShell>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Choose tier" },
    { id: 2, label: "Select seats" },
    { id: 3, label: "Review booking" },
    { id: 4, label: "Payment" },
  ];

  return (
    <div className="relative">
      {/* Progress bar behind steps */}
      <div className="absolute left-0 right-0 top-1/2 z-0 hidden -translate-y-1/2 md:block">
        <div className="mx-12 h-0.5 bg-white/8">
          <motion.div
            className="h-full bg-emerald-400/60"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(((currentStep - 1) / 3) * 100, 0)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="relative z-10 grid gap-3 md:grid-cols-4">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <motion.div
              key={step.id}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`rounded-[20px] border px-4 py-3.5 transition-all ${
                isActive
                  ? "border-emerald-400/24 bg-emerald-400/10 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.3)]"
                  : isComplete
                    ? "border-emerald-400/14 bg-emerald-400/5"
                    : "border-white/8 bg-slate-900/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-emerald-400 text-slate-950 shadow-[0_6px_16px_-8px_rgba(16,185,129,0.6)]"
                      : isComplete
                        ? "bg-emerald-400/80 text-slate-950"
                        : "bg-white/10 text-slate-400"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </div>
                <div className={`text-sm font-semibold ${isActive ? "text-white" : isComplete ? "text-emerald-200" : "text-slate-400"}`}>
                  {step.label}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function PanelShell({
  actionLabel,
  children,
  onAction,
  title,
  tone = "default",
}: {
  actionLabel?: string;
  children: ReactNode;
  onAction?: () => void;
  title: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={`rounded-[22px] border p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.52)] ${
        tone === "primary"
          ? "border-emerald-500/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(9,27,18,0.98))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,19,15,0.98))]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">{title}</div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 py-2.5 last:border-b-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="max-w-[14rem] text-right text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function RiskStatusRow({ score, status }: { score: SessionRiskScore; status: SessionRiskStatus }) {
  const toneClass =
    status === "Blocked"
      ? "border-rose-400/18 bg-rose-400/10 text-rose-200"
      : status === "Warning"
        ? "border-amber-300/18 bg-amber-300/10 text-amber-100"
        : "border-emerald-400/18 bg-emerald-400/10 text-emerald-100";

  const icon =
    status === "Blocked" ? (
      <ShieldAlert className="h-4 w-4" />
    ) : status === "Warning" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : (
      <CheckCircle2 className="h-4 w-4" />
    );

  return (
    <div className={`flex items-center justify-between rounded-[14px] border px-4 py-3 ${toneClass}`}>
      <div className="inline-flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>Status: {status}</span>
      </div>
      <div className="text-sm font-semibold">Score: {score}</div>
    </div>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/60" />
      <span>{text}</span>
    </div>
  );
}
