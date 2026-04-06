"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Info, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
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
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              <span>Match overview</span>
              <span className="text-slate-500">&middot;</span>
              <span>{tournamentName || "Featured Match"}</span>
            </div>

            {leagueLogo ? (
              <div className="inline-flex items-center gap-4 rounded-[24px] border border-emerald-400/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] px-4 py-3 shadow-[0_18px_42px_-32px_rgba(16,185,129,0.24)] backdrop-blur-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/92 shadow-[0_16px_32px_-24px_rgba(255,255,255,0.8)]">
                  <Image
                    src={leagueLogo}
                    alt="League"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain brightness-125 saturate-125"
                    unoptimized
                  />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Competition
                  </div>
                  <div className="mt-1 text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                    {tournamentName || "V-LEAGUE"}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 max-w-5xl">
            <h1 className="text-balance text-3xl font-heading font-black uppercase leading-[0.94] tracking-tight text-white sm:text-4xl lg:text-5xl">
              <span>{homeTeam}</span>
              <span className="mx-3 inline-block align-middle text-white/24">{vsLabel}</span>
              <span>{awayTeam}</span>
            </h1>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-base text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <MapPin className="h-4 w-4 text-emerald-300" />
              {stadium}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              {heroDate}
            </span>
          </div>
        </div>

        <div className="page-card rounded-[30px] p-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {activeTier ? "Selected tier" : "Starting from"}
          </div>
          <div className="mt-4 text-4xl font-heading font-black leading-none tracking-tight text-emerald-300">
            {(selectedTierPrice ?? basePrice).toLocaleString(locale)}
          </div>
          <div className="mt-2 text-base font-semibold text-slate-400">VND</div>
          <div className="mt-4 h-px bg-white/8" />
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {activeTier
              ? `Selected tier: ${activeTier}. Continue to choose up to ${MAX_BOOKING_SEATS} seats in this section.`
              : "Choose a ticket tier first, then select seats and review the booking before payment."}
          </p>
        </div>
      </section>

      <StepIndicator currentStep={currentStep} />

      <section id="seat-tier-step" className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">Step 1</div>
          <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
            Choose ticket tier
          </h2>
        </div>
        <TicketTierList matchId={matchId} basePrice={basePrice} activeTier={activeTier} onChooseTier={handleChooseTier} />
      </section>

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

        <div className="space-y-4 xl:sticky xl:top-24">
          <PanelShell
            title="Booking Summary"
            actionLabel={sortedSelectedSeats.length ? "Clear selection" : undefined}
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

            <SummaryRow label="Selected seats" value={`${sortedSelectedSeats.length}/${MAX_BOOKING_SEATS}`} />
            <SummaryRow label="Section" value={selectedSectionLabel} />
            <SummaryRow label="Seat list" value={seatListLabel} />
            <SummaryRow label="Total amount" value={totalAmountLabel} />

            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selected seats</div>
              <div className="mt-3 space-y-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {sortedSelectedSeats.length ? (
                    sortedSelectedSeats.map((seatId) => (
                      <motion.div
                        key={seatId}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center justify-between text-sm text-slate-200"
                      >
                        <span>{seatId}</span>
                        <span className="text-slate-400">{getTierFromSeatId(seatId)}</span>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      key="empty-seats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-slate-400"
                    >
                      No seats selected
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </PanelShell>

          <PanelShell title="Session Control">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Rule-based Risk</div>
            <div className="mt-3">
              <RiskStatusRow status={effectiveRiskStatus} score={effectiveRiskScore} />
            </div>
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Heuristic Reason</div>
              <div className="mt-2">{sessionRisk.reason}</div>
            </div>
            <div className="mt-4 rounded-xl border border-white/8 p-3">
              <p className="text-sm font-medium text-white">AI Risk</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">AI Status</p>
              <p className="text-lg font-semibold uppercase text-white">{aiRiskLevel}</p>
              <p className="text-xs text-slate-400">
                Confidence: {aiConfidence !== null ? `${(aiConfidence * 100).toFixed(1)}%` : "--"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Last checked: {formatLastChecked(sessionState.lastRiskCheckedAt)}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Monitoring seat switching and checkout behaviour
            </p>

            <div className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Booking Rules</div>
              <div className="mt-3 space-y-3">
                <RuleItem text="Maximum 4 seats per booking" />
                <RuleItem text="Duplicate seat conflicts are blocked" />
                <RuleItem text="Suspicious activity may trigger warning or block" />
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Session Timer
              </div>
              <div className="mt-2 text-2xl font-heading font-black text-white">{formatSessionTimer(sessionTimer)}</div>
              <div className="mt-2 text-xs text-slate-400">Seats are confirmed only after successful checkout.</div>
            </div>
          </PanelShell>

          <PanelShell title="Actions">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!sortedSelectedSeats.length || isCheckingRisk}
              className="inline-flex h-14 w-full items-center justify-center rounded-[18px] bg-emerald-500 px-5 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCheckingRisk ? "Checking risk..." : "Proceed to Payment"}
            </button>
            <div className="mt-3 text-sm text-slate-400">{ctaHelperText}</div>

            <AnimatePresence initial={false}>
              {actionRiskNote ? (
                <motion.div
                  key={actionRiskNote}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`mt-3 rounded-[18px] border px-4 py-3 text-sm ${
                    effectiveRiskStatus === "Blocked"
                      ? "border-rose-400/18 bg-rose-400/10 text-rose-100"
                      : "border-amber-300/18 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {actionRiskNote}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleChooseAnotherSection}
              className="mt-3 inline-flex h-14 w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Choose Another Section
            </button>
            <div className="mt-4 text-xs text-slate-400">
              Current section: {activeTier || EMPTY_SECTION_LABEL}
            </div>
          </PanelShell>
        </div>
      </section>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Choose tier" },
    { id: 2, label: "Select seats" },
    { id: 3, label: "Review booking" },
    { id: 4, label: "Payment" },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep;

        return (
          <div
            key={step.id}
            className={`rounded-[24px] border px-4 py-4 transition-all ${
              isActive
                ? "border-emerald-400/24 bg-emerald-400/10"
                : isComplete
                  ? "border-white/10 bg-white/5"
                  : "border-white/10 bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                  isActive || isComplete ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-400"
                }`}
              >
                {step.id}
              </div>
              <div className="text-sm font-semibold text-white">{step.label}</div>
            </div>
          </div>
        );
      })}
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
      className={`rounded-[26px] border p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.52)] ${
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
    <div className="flex items-center justify-between gap-3 border-b border-white/6 py-3 last:border-b-0">
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
    <div className={`flex items-center justify-between rounded-[18px] border px-4 py-3 ${toneClass}`}>
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
    <div className="flex items-start gap-2 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
      <span>{text}</span>
    </div>
  );
}
