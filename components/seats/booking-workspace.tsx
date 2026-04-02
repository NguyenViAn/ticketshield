"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

import { SeatMapRadial } from "@/components/seats/seat-map-radial";
import { TicketTierList } from "@/components/seats/ticket-tier-list";
import { getTierDefinition, getTierFromSeatId, getSeatsTotalPrice, getSeatSelectionSummary, MAX_BOOKING_SEATS, sortSeatIds, type TicketTierId } from "@/utils/tickets";

const SESSION_TIMER_SECONDS = 5 * 60;
const INTERACTION_WARNING_WINDOW_MS = 8_000;

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

function getInteractionTimestamp() {
  return Date.now();
}

function getNextRiskState(interactionTimestamps: number[], checkoutRetryCount: number): SessionRiskState {
  const now = Date.now();
  const recentInteractions = interactionTimestamps.filter((timestamp) => now - timestamp <= INTERACTION_WARNING_WINDOW_MS);

  if (checkoutRetryCount >= 2) {
    return {
      status: "Warning",
      score: "Medium",
      reason: "Repeated checkout attempts detected",
    };
  }

  if (recentInteractions.length >= 3) {
    return {
      status: "Warning",
      score: "Medium",
      reason: "Rapid seat switching detected",
    };
  }

  return DEFAULT_RISK_STATE;
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
  const [activeTier, setActiveTier] = useState<TicketTierId | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [sessionTimer, setSessionTimer] = useState(SESSION_TIMER_SECONDS);
  const [sessionRisk, setSessionRisk] = useState<SessionRiskState>(DEFAULT_RISK_STATE);
  const [interactionTimestamps, setInteractionTimestamps] = useState<number[]>([]);
  const [checkoutRetryCount] = useState(0);

  const sortedSelectedSeats = useMemo(() => sortSeatIds(selectedSeats), [selectedSeats]);
  const selectedTierDefinition = activeTier ? getTierDefinition(activeTier) : null;
  const selectedTierPrice = selectedTierDefinition ? basePrice * selectedTierDefinition.priceMultiplier : null;
  const totalAmount = getSeatsTotalPrice(basePrice, sortedSelectedSeats);
  const currentStep = !activeTier ? 1 : sortedSelectedSeats.length === 0 ? 2 : 3;
  const selectedSectionLabel = activeTier ?? "--";

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
    setSessionRisk(getNextRiskState(interactionTimestamps, checkoutRetryCount));
  }, [checkoutRetryCount, interactionTimestamps]);

  const handleChooseTier = (tierId: TicketTierId) => {
    setActiveTier((currentTier) => {
      if (currentTier === tierId) {
        return currentTier;
      }

      setSelectedSeats([]);
      setInteractionTimestamps([]);
      setSessionRisk(DEFAULT_RISK_STATE);
      setSessionTimer(SESSION_TIMER_SECONDS);
      return tierId;
    });

    document.getElementById("seat-map-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectedSeatsChange = (nextSeats: string[]) => {
    setSelectedSeats(sortSeatIds(nextSeats));
    setSessionTimer(SESSION_TIMER_SECONDS);
  };

  const handleSeatInteraction = () => {
    setInteractionTimestamps((currentTimestamps) => [...currentTimestamps, getInteractionTimestamp()].slice(-12));
  };

  const handleClearSelection = () => {
    setSelectedSeats([]);
    setInteractionTimestamps([]);
    setSessionRisk(DEFAULT_RISK_STATE);
    setSessionTimer(SESSION_TIMER_SECONDS);
  };

  const handleChooseAnotherSection = () => {
    handleClearSelection();
    setActiveTier(null);
    document.getElementById("seat-tier-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProceedToPayment = () => {
    if (!sortedSelectedSeats.length) {
      return;
    }

    const query = new URLSearchParams();
    query.set("matchId", matchId);
    sortedSelectedSeats.forEach((seatId) => query.append("seatId", seatId));
    router.push(`/${locale}/payment?${query.toString()}`);
  };

  const selectedSeatTierLabels = Array.from(
    new Set(sortedSelectedSeats.map((seatId) => getTierFromSeatId(seatId)).filter(Boolean)),
  ).join(", ");

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
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

          <div className="mt-6 max-w-5xl">
            <h1 className="text-balance text-3xl font-heading font-black uppercase leading-[0.94] tracking-tight text-white sm:text-4xl lg:text-5xl">
              <span>{homeTeam}</span>
              <span className="mx-3 inline-block align-middle text-white/24">{vsLabel}</span>
              <span>{awayTeam}</span>
            </h1>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-base text-slate-300">
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
          <div className="mt-5 h-px bg-white/8" />
          <p className="mt-5 text-sm leading-7 text-slate-300">
            {activeTier
              ? `Selected tier: ${activeTier}. Continue to choose up to ${MAX_BOOKING_SEATS} seats in this section.`
              : "Choose a ticket tier first, then select seats and review the booking before payment."}
          </p>
        </div>
      </section>

      <StepIndicator currentStep={currentStep} />

      <section id="seat-tier-step" className="space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-300">Step 1</div>
          <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
            Choose ticket tier
          </h2>
        </div>
        <TicketTierList matchId={matchId} basePrice={basePrice} activeTier={activeTier} onChooseTier={handleChooseTier} />
      </section>

      <section id="seat-map-step" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-5">
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
          >
            <SummaryRow label="Selected seats" value={`${sortedSelectedSeats.length}/${MAX_BOOKING_SEATS}`} />
            <SummaryRow label="Section" value={selectedSectionLabel} />
            <SummaryRow label="Seat list" value={sortedSelectedSeats.length ? getSeatSelectionSummary(sortedSelectedSeats) : "--"} />
            <SummaryRow label="Total amount" value={sortedSelectedSeats.length ? `${totalAmount.toLocaleString(locale)} VND` : "--"} />
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Selected Seats</div>
              <div className="mt-3 space-y-2">
                {sortedSelectedSeats.length ? (
                  sortedSelectedSeats.map((seatId) => (
                    <div key={seatId} className="flex items-center justify-between text-sm text-slate-200">
                      <span>{seatId}</span>
                      <span className="text-slate-400">{getTierFromSeatId(seatId)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No seats selected yet.</div>
                )}
              </div>
            </div>
          </PanelShell>

          <PanelShell title="Session Risk">
            <RiskStatusRow status={sessionRisk.status} score={sessionRisk.score} />
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Reason</div>
              <div className="mt-2">{sessionRisk.reason}</div>
            </div>
          </PanelShell>

          <PanelShell title="Booking Rules">
            <RuleItem text="Maximum 4 seats per booking" />
            <RuleItem text="Duplicate seat conflicts are blocked" />
            <RuleItem text="Suspicious activity may trigger warning or block" />
            <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Session timer
              </div>
              <div className="mt-2 text-2xl font-heading font-black text-white">{formatSessionTimer(sessionTimer)}</div>
              <div className="mt-2 text-xs text-slate-400">Seats are confirmed only after successful checkout.</div>
            </div>
          </PanelShell>

          <PanelShell title="Actions">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={!sortedSelectedSeats.length}
              className="inline-flex h-14 w-full items-center justify-center rounded-[18px] bg-emerald-500 px-5 text-sm font-black uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proceed to Payment
            </button>
            <button
              type="button"
              onClick={handleChooseAnotherSection}
              className="mt-3 inline-flex h-14 w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Choose Another Section
            </button>
            <div className="mt-4 text-xs text-slate-400">
              Current seat group: {selectedSeatTierLabels || "No section selected"}
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
}: {
  actionLabel?: string;
  children: ReactNode;
  onAction?: () => void;
  title: string;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(8,19,15,0.98))] p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.52)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">{title}</div>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 hover:text-emerald-200">
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
      <div className="text-sm font-semibold text-white">{value}</div>
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
