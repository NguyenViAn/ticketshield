"use client";

import { motion } from "framer-motion";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Info, MapPinned } from "lucide-react";
import { useLocale } from "next-intl";

import { createClient } from "@/utils/supabase/client";
import { getTierDefinition, MAX_BOOKING_SEATS, type TicketTierId } from "@/utils/tickets";

export interface SeatMapRadialProps {
  activeTier: TicketTierId | null;
  matchId?: string;
  basePrice?: number;
  onCrossSectionAttempt?: () => void;
  onInvalidSeatClick?: () => void;
  onSeatInteraction: (seatId: string) => void;
  onSelectedSeatsChange: (seatIds: string[]) => void;
  selectedSeats: string[];
}

type SeatZone = {
  id: "VIP" | "Premium" | "Standard" | "Economy";
  rowLabel: string;
  count: number;
  innerRadius: number;
  outerRadius: number;
  priceMultiplier: number;
  seatSize: number;
  fill: string;
  stroke: string;
  seatFill: string;
};

type TooltipState = {
  label: string;
  x: number;
  y: number;
};

const STADIUM_CENTER = { x: 0, y: 92 };
const ARC_START = 160;
const ARC_END = 380;
const ARC_PADDING = 10;
const SVG_PRECISION = 4;

const SEAT_ZONES: SeatZone[] = [
  {
    id: "VIP",
    rowLabel: "A",
    count: 14,
    innerRadius: 68,
    outerRadius: 92,
    priceMultiplier: 2.5,
    seatSize: 6.8,
    fill: "rgba(94, 234, 212, 0.14)",
    stroke: "rgba(52, 211, 153, 0.36)",
    seatFill: "rgba(52, 211, 153, 0.38)",
  },
  {
    id: "Premium",
    rowLabel: "B",
    count: 22,
    innerRadius: 102,
    outerRadius: 128,
    priceMultiplier: 1.5,
    seatSize: 6,
    fill: "rgba(34, 211, 238, 0.12)",
    stroke: "rgba(34, 211, 238, 0.32)",
    seatFill: "rgba(34, 211, 238, 0.24)",
  },
  {
    id: "Standard",
    rowLabel: "C",
    count: 30,
    innerRadius: 138,
    outerRadius: 166,
    priceMultiplier: 1,
    seatSize: 5.4,
    fill: "rgba(148, 163, 184, 0.08)",
    stroke: "rgba(148, 163, 184, 0.22)",
    seatFill: "rgba(148, 163, 184, 0.22)",
  },
  {
    id: "Economy",
    rowLabel: "D",
    count: 38,
    innerRadius: 176,
    outerRadius: 206,
    priceMultiplier: 0.75,
    seatSize: 4.9,
    fill: "rgba(100, 116, 139, 0.08)",
    stroke: "rgba(100, 116, 139, 0.2)",
    seatFill: "rgba(100, 116, 139, 0.18)",
  },
];

function roundSvgValue(value: number) {
  return Number(value.toFixed(SVG_PRECISION));
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: roundSvgValue(centerX + radius * Math.cos(angleInRadians)),
    y: roundSvgValue(centerY + radius * Math.sin(angleInRadians)),
  };
}

function describeArcBand(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(STADIUM_CENTER.x, STADIUM_CENTER.y, outerRadius, startAngle);
  const outerEnd = polarToCartesian(STADIUM_CENTER.x, STADIUM_CENTER.y, outerRadius, endAngle);
  const innerEnd = polarToCartesian(STADIUM_CENTER.x, STADIUM_CENTER.y, innerRadius, endAngle);
  const innerStart = polarToCartesian(STADIUM_CENTER.x, STADIUM_CENTER.y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function SeatMapRadial({
  activeTier,
  matchId,
  basePrice = 2500000,
  onCrossSectionAttempt,
  onInvalidSeatClick,
  onSeatInteraction,
  onSelectedSeatsChange,
  selectedSeats,
}: SeatMapRadialProps) {
  const [takenSeats, setTakenSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const locale = useLocale();
  const mapShellRef = useRef<HTMLDivElement | null>(null);
  const isInactive = !activeTier;

  useEffect(() => {
    if (!matchId) {
      return;
    }

    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("seat")
        .eq("match_id", matchId)
        .in("status", ["Valid", "Used"]);

      if (!error && data) {
        const seats = data.map((ticket) => ticket.seat);
        setTakenSeats(seats);
      }
    };

    void fetchTickets();
  }, [matchId, supabase]);

  const selectedTierDefinition = activeTier ? getTierDefinition(activeTier) : null;
  const selectedTierPrice = selectedTierDefinition ? basePrice * selectedTierDefinition.priceMultiplier : null;
  const totalSeats = SEAT_ZONES.reduce((sum, zone) => sum + zone.count, 0);
  const occupancy = Math.round((takenSeats.length / totalSeats) * 100);
  const selectedLegendLabel = activeTier ? `${activeTier} - ${selectedTierPrice?.toLocaleString(locale) ?? "--"} VND` : "Choose a section";

  const updateTooltip = (
    event: ReactMouseEvent<SVGCircleElement>,
    seatId: string,
    zoneId: TicketTierId,
    isTaken: boolean,
  ) => {
    const mapShell = mapShellRef.current;

    if (!activeTier || zoneId !== activeTier || isTaken || !mapShell) {
      setTooltip(null);
      return;
    }

    const containerRect = mapShell.getBoundingClientRect();
    const tierDefinition = getTierDefinition(zoneId);

    if (!tierDefinition) {
      setTooltip(null);
      return;
    }

    const seatPrice = basePrice * tierDefinition.priceMultiplier;

    setTooltip({
      label: `${seatId} - ${seatPrice.toLocaleString(locale)} VND`,
      x: event.clientX - containerRect.left + 12,
      y: event.clientY - containerRect.top - 12,
    });
  };

  const handleSeatClick = (seatId: string, zoneId: TicketTierId, isTaken: boolean) => {
    if (isInactive || isTaken) {
      onInvalidSeatClick?.();
      return;
    }

    if (zoneId !== activeTier) {
      onCrossSectionAttempt?.();
      setFeedbackMessage("Select seats in the chosen section only.");
      return;
    }

    if (selectedSeats.includes(seatId)) {
      setFeedbackMessage(null);
      onSeatInteraction(seatId);
      onSelectedSeatsChange(selectedSeats.filter((currentSeat) => currentSeat !== seatId));
      return;
    }

    if (selectedSeats.length >= MAX_BOOKING_SEATS) {
      onInvalidSeatClick?.();
      setFeedbackMessage(`Maximum ${MAX_BOOKING_SEATS} seats per booking.`);
      return;
    }

    setFeedbackMessage(null);
    onSeatInteraction(seatId);
    onSelectedSeatsChange([...selectedSeats, seatId]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-[30px] border border-emerald-500/12 bg-[linear-gradient(180deg,rgba(30,41,59,0.82),rgba(15,23,42,0.94))] p-5 shadow-[0_26px_80px_-44px_rgba(0,0,0,0.56)]"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Seat map</div>
          <h3 className="mt-2 text-2xl font-heading font-black text-white">
            Select between 1 and 4 seats in the chosen section.
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SeatMapMeta label="Selected" value={`${selectedSeats.length}/${MAX_BOOKING_SEATS}`} />
            <SeatMapMeta label="Section" value={activeTier ?? "No section selected"} />
            <SeatMapMeta
              label="Price per seat"
              value={activeTier ? `${selectedTierPrice?.toLocaleString(locale)} VND` : "Choose tier first"}
            />
          </div>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
          {occupancy}% occupied
        </div>
      </div>

      {!isInactive && feedbackMessage ? (
        <div className="mb-4 flex items-start gap-2 rounded-[18px] border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      ) : null}

      <div
        className={`rounded-[26px] border border-emerald-500/10 bg-[linear-gradient(180deg,rgba(13,42,32,0.82),rgba(7,24,19,0.86))] p-4 sm:p-5 ${
          isInactive ? "relative" : ""
        }`}
      >
        <div ref={mapShellRef} className={`mx-auto max-w-[760px] ${isInactive ? "opacity-40" : ""}`}>
          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-emerald-500/12 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_44%),linear-gradient(180deg,rgba(4,18,14,0.96),rgba(2,10,8,0.98))]">
            {!isInactive && tooltip ? (
              <div
                className="pointer-events-none absolute z-20 rounded-[14px] border border-emerald-400/18 bg-slate-950/92 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)]"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                {tooltip.label}
              </div>
            ) : null}

            <svg viewBox="-240 -150 480 420" className="h-full w-full" aria-label="Semi stadium seat map">
              <defs>
                <radialGradient id="fieldGlow" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.36)" />
                  <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                </radialGradient>
              </defs>

              <ellipse cx="0" cy="118" rx="112" ry="42" fill="url(#fieldGlow)" opacity="0.75" />

              {SEAT_ZONES.map((zone, zoneIndex) => {
                const segmentPath = describeArcBand(zone.innerRadius, zone.outerRadius, ARC_START, ARC_END);
                const angleStep = (ARC_END - ARC_START - ARC_PADDING * 2) / Math.max(zone.count - 1, 1);
                const isActiveZone = activeTier === zone.id;
                const zoneOpacity = activeTier ? (isActiveZone ? 1 : 0.28) : 0.45;

                return (
                  <g key={zone.id} opacity={zoneOpacity}>
                    <motion.path
                      d={segmentPath}
                      fill={zone.fill}
                      stroke={zone.stroke}
                      strokeWidth="1.2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: zoneIndex * 0.06, duration: 0.28 }}
                    />
                    {Array.from({ length: zone.count }).map((_, seatIndex) => {
                      const seatAngle = ARC_START + ARC_PADDING + angleStep * seatIndex;
                      const seatPosition = polarToCartesian(
                        STADIUM_CENTER.x,
                        STADIUM_CENTER.y,
                        (zone.innerRadius + zone.outerRadius) / 2,
                        seatAngle,
                      );
                      const seatId = `${zone.id}-${seatIndex + 1}`;
                      const isTaken = takenSeats.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      const isInSelectedZone = activeTier === zone.id;

                      return (
                        <motion.circle
                          key={seatId}
                          cx={seatPosition.x}
                          cy={seatPosition.y}
                          r={isSelected ? zone.seatSize + 1.2 : zone.seatSize}
                          fill={
                            isTaken
                              ? "rgba(71, 85, 105, 0.42)"
                              : isSelected
                                ? "rgba(74, 222, 128, 0.96)"
                                : zone.seatFill
                          }
                          stroke={
                            isTaken
                              ? "rgba(100, 116, 139, 0.34)"
                              : isSelected
                                ? "rgba(220, 252, 231, 0.95)"
                                : zone.stroke
                          }
                          strokeWidth={isSelected ? 2.2 : 1.4}
                          className={isTaken ? "cursor-not-allowed" : isInSelectedZone ? "cursor-pointer" : "cursor-default"}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isTaken ? 0.55 : 1, scale: isSelected ? 1.08 : 1 }}
                          transition={{ delay: zoneIndex * 0.03 + seatIndex * 0.006, duration: 0.18 }}
                          whileHover={isInSelectedZone && !isTaken && !isInactive ? { scale: 1.14 } : undefined}
                          style={{
                            filter:
                              hoveredSeat === seatId && !isTaken
                                ? "drop-shadow(0 0 10px rgba(74,222,128,0.55))"
                                : isSelected
                                  ? "drop-shadow(0 0 14px rgba(74,222,128,0.6))"
                                  : "none",
                          }}
                          onMouseEnter={(event) => {
                            setHoveredSeat(seatId);
                            updateTooltip(event, seatId, zone.id, isTaken);
                          }}
                          onMouseMove={(event) => updateTooltip(event, seatId, zone.id, isTaken)}
                          onMouseLeave={() => {
                            setHoveredSeat((currentSeat) => (currentSeat === seatId ? null : currentSeat));
                            setTooltip(null);
                          }}
                          onClick={() => handleSeatClick(seatId, zone.id, isTaken)}
                        />
                      );
                    })}
                  </g>
                );
              })}

              <g>
                <rect x="-72" y="66" width="144" height="80" rx="28" fill="rgba(5,20,16,0.96)" stroke="rgba(52,211,153,0.18)" strokeWidth="1.4" />
                <rect x="-56" y="80" width="112" height="52" rx="18" fill="rgba(34,197,94,0.16)" stroke="rgba(74,222,128,0.25)" strokeWidth="1" />
                <line x1="0" y1="80" x2="0" y2="132" stroke="rgba(148,163,184,0.22)" strokeWidth="1.2" />
                <circle cx="0" cy="106" r="10" fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="1.2" />
                <text x="0" y="162" fill="rgba(220,252,231,0.88)" fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="2.4">
                  FIELD
                </text>
              </g>
            </svg>

            {isInactive ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/46 backdrop-blur-[1px]">
                <div className="mx-6 max-w-sm rounded-[22px] border border-emerald-400/16 bg-slate-950/88 px-5 py-5 text-center shadow-[0_24px_60px_-36px_rgba(0,0,0,0.72)]">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/14 bg-emerald-400/10 text-emerald-300">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    Seat selection locked
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    Choose a ticket tier to unlock seat selection.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${isInactive ? "opacity-45" : ""}`}>
        <LegendPill color="bg-emerald-400" label="Available" />
        <LegendPill color="bg-slate-500" label="Sold" />
        <LegendPill color="bg-cyan-400" label={selectedLegendLabel} />
        <LegendPill color="bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.55)]" label="Selected" />
      </div>

      <div className={`mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 ${isInactive ? "opacity-45" : ""}`}>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <MapPinned className="h-4 w-4" />
          Session reminder
        </div>
        <div className="mt-2 text-sm text-slate-300">Only seats from the selected section can be added to the booking.</div>
      </div>
    </motion.div>
  );
}

function SeatMapMeta({ label, value }: { label: string; value: string }) {
  return (
    <motion.div layout className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <motion.div
        key={`${label}:${value}`}
        initial={{ opacity: 0.45, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="mt-2 text-base font-semibold text-white"
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className="theme-inset-surface flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm text-slate-300">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
