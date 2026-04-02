"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { NeonButton } from "@/components/ui/neon-button";
import { logBookingEvent } from "@/lib/services/booking-events";
import { createClient } from "@/utils/supabase/client";
import {
  findFirstAvailableSeat,
  getSeatSelectionSummary,
  getSeatsTotalPrice,
  MAX_BOOKING_SEATS,
  type TicketTierId,
} from "@/utils/tickets";

export interface SeatMapRadialProps {
  matchId?: string;
  basePrice?: number;
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

const STADIUM_CENTER = { x: 0, y: 92 };
const ARC_START = 160;
const ARC_END = 380;
const ARC_PADDING = 10;
const HOLD_DURATION_SECONDS = 5 * 60;
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

function formatHoldTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getInteractionTimestamp() {
  return Date.now();
}

export function SeatMapRadial({ matchId, basePrice = 2500000 }: SeatMapRadialProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [takenSeats, setTakenSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [holdSeconds, setHoldSeconds] = useState(HOLD_DURATION_SECONDS);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  const t = useTranslations("SeatMapRadial");
  const lastInteractionAtRef = useRef<number | null>(null);

  const resetHoldWindow = () => {
    setHoldSeconds(HOLD_DURATION_SECONDS);
  };

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
        setSelectedSeats((currentSeats) => currentSeats.filter((seatId) => !seats.includes(seatId)));
      }
    };

    void fetchTickets();
  }, [matchId, supabase]);

  useEffect(() => {
    const handleFocusTier = (event: Event) => {
      const customEvent = event as CustomEvent<{ matchId?: string; tierId?: TicketTierId }>;
      const tierId = customEvent.detail?.tierId;
      const targetMatchId = customEvent.detail?.matchId;

      if (!tierId || (targetMatchId && targetMatchId !== matchId)) {
        return;
      }

      const suggestedSeat = findFirstAvailableSeat(tierId, takenSeats);
      if (!suggestedSeat) {
        return;
      }

      let nextSeatsForLog: string[] = [];
      let shouldLogSelection = false;
      setSelectedSeats((currentSeats) => {
        if (currentSeats.includes(suggestedSeat)) {
          nextSeatsForLog = currentSeats;
          return currentSeats;
        }

        if (currentSeats.length >= MAX_BOOKING_SEATS) {
          setFeedbackMessage(`Maximum ${MAX_BOOKING_SEATS} seats per booking.`);
          nextSeatsForLog = currentSeats;
          return currentSeats;
        }

        const nextSeats = [...currentSeats, suggestedSeat].sort((left, right) =>
          left.localeCompare(right, undefined, { numeric: true }),
        );
        nextSeatsForLog = nextSeats;
        shouldLogSelection = true;
        setFeedbackMessage(null);
        resetHoldWindow();
        return nextSeats;
      });

      if (matchId && shouldLogSelection) {
        const now = Date.now();
        const timeSinceLastActionMs = lastInteractionAtRef.current ? now - lastInteractionAtRef.current : null;
        lastInteractionAtRef.current = now;
        void logBookingEvent(supabase, {
          eventType: "seat_select",
          matchId,
          metadata: {
            seatIds: nextSeatsForLog,
            selectedCount: nextSeatsForLog.length,
            timeSinceLastActionMs,
          },
          seatCount: nextSeatsForLog.length,
        });
      }
    };

    window.addEventListener("ticketshield:focus-seat-zone", handleFocusTier as EventListener);
    return () => {
      window.removeEventListener("ticketshield:focus-seat-zone", handleFocusTier as EventListener);
    };
  }, [matchId, supabase, takenSeats]);

  useEffect(() => {
    if (!selectedSeats.length) {
      return;
    }

    const interval = window.setInterval(() => {
      setHoldSeconds((currentValue) => {
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
  }, [selectedSeats]);

  const sortedSelectedSeats = selectedSeats
    .slice()
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const primarySelectedSeat = sortedSelectedSeats[0] ?? null;
  const primarySelectedZone =
    primarySelectedSeat
      ? SEAT_ZONES.find((zone) => primarySelectedSeat.startsWith(`${zone.id}-`)) ?? null
      : null;
  const selectedTotal = getSeatsTotalPrice(basePrice, sortedSelectedSeats);
  const totalSeats = SEAT_ZONES.reduce((sum, zone) => sum + zone.count, 0);
  const occupancy = Math.round((takenSeats.length / totalSeats) * 100);
  const trustItems = [
    "Max 4 seats per booking",
    "Seat conflicts checked in database",
    "Risk scoring tracks real interactions",
  ];

  const handleSeatClick = (seatId: string, isTaken: boolean) => {
    if (isTaken || !matchId) {
      return;
    }

    const now = getInteractionTimestamp();
    const timeSinceLastActionMs = lastInteractionAtRef.current ? now - lastInteractionAtRef.current : null;
    lastInteractionAtRef.current = now;

    let nextSeatsForLog: string[] = [];
    let eventType: "seat_select" | "seat_deselect" | null = null;

    setSelectedSeats((currentSeats) => {
      if (currentSeats.includes(seatId)) {
        const nextSeats = currentSeats.filter((currentSeat) => currentSeat !== seatId);
        nextSeatsForLog = nextSeats;
        eventType = "seat_deselect";
        setFeedbackMessage(null);
        resetHoldWindow();
        return nextSeats;
      }

      if (currentSeats.length >= MAX_BOOKING_SEATS) {
        setFeedbackMessage(`Maximum ${MAX_BOOKING_SEATS} seats per booking.`);
        nextSeatsForLog = currentSeats;
        eventType = null;
        return currentSeats;
      }

      const nextSeats = [...currentSeats, seatId].sort((left, right) =>
        left.localeCompare(right, undefined, { numeric: true }),
      );
      nextSeatsForLog = nextSeats;
      eventType = "seat_select";
      setFeedbackMessage(null);
      resetHoldWindow();
      return nextSeats;
    });

    if (eventType) {
      void logBookingEvent(supabase, {
        eventType,
        matchId,
        metadata: {
          seatIds: nextSeatsForLog,
          selectedCount: nextSeatsForLog.length,
          timeSinceLastActionMs,
        },
        seatCount: nextSeatsForLog.length,
      });
    }
  };

  const handleCheckout = () => {
    if (!matchId || !sortedSelectedSeats.length) {
      return;
    }

    const query = new URLSearchParams();
    query.set("matchId", matchId);
    sortedSelectedSeats.forEach((seatId) => query.append("seatId", seatId));
    router.push(`/${locale}/payment?${query.toString()}`);
  };

  const handleChangeSection = () => {
    document.getElementById("seat-tier-grid")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div id="seat-map-panel" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-[30px] border border-emerald-500/12 bg-[linear-gradient(180deg,rgba(30,41,59,0.82),rgba(15,23,42,0.94))] p-5 shadow-[0_26px_80px_-44px_rgba(0,0,0,0.56)]"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/80">{t("map_mode")}</div>
            <div className="mt-1 text-sm text-slate-400">{t("map_hint")}</div>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
            {occupancy}% occupied
          </div>
        </div>

        <div className="rounded-[26px] border border-emerald-500/10 bg-[linear-gradient(180deg,rgba(13,42,32,0.82),rgba(7,24,19,0.86))] p-4 sm:p-5">
          <div className="mx-auto max-w-[760px]">
            <div className="relative aspect-square overflow-hidden rounded-[24px] border border-emerald-500/12 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),transparent_44%),linear-gradient(180deg,rgba(4,18,14,0.96),rgba(2,10,8,0.98))]">
              <svg viewBox="-240 -150 480 420" className="h-full w-full" aria-label={t("aria_label")}>
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

                  return (
                    <g key={zone.id}>
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
                        const isSelected = sortedSelectedSeats.includes(seatId);
                        const isAvailable = !isTaken;

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
                            className={isTaken ? "cursor-not-allowed" : "cursor-pointer"}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: isTaken ? 0.55 : 1, scale: isSelected ? 1.08 : 1 }}
                            transition={{ delay: zoneIndex * 0.03 + seatIndex * 0.006, duration: 0.18 }}
                            whileHover={isAvailable ? { scale: 1.14 } : undefined}
                            style={{
                              filter:
                                hoveredSeat === seatId && isAvailable
                                  ? "drop-shadow(0 0 10px rgba(74,222,128,0.55))"
                                  : isSelected
                                    ? "drop-shadow(0 0 14px rgba(74,222,128,0.6))"
                                    : "none",
                            }}
                            onMouseEnter={() => setHoveredSeat(seatId)}
                            onMouseLeave={() => setHoveredSeat((currentSeat) => (currentSeat === seatId ? null : currentSeat))}
                            onClick={() => handleSeatClick(seatId, isTaken)}
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
                    {t("field_label")}
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LegendPill color="bg-emerald-400" label={t("available_label")} />
          <LegendPill color="bg-slate-500" label={t("sold_label")} />
          <LegendPill color="bg-cyan-400" label="Max 4 seats" />
          <LegendPill color="bg-emerald-300 shadow-[0_0_12px_rgba(74,222,128,0.55)]" label={t("selected_label")} />
        </div>
      </motion.div>

      <div className="space-y-4 xl:sticky xl:top-24">
        <div className="theme-inset-accent rounded-[26px] p-5 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.52)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Selection</div>
            <div className="text-2xl font-heading font-black text-emerald-300">
              {sortedSelectedSeats.length}/{MAX_BOOKING_SEATS}
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#86efac)]"
              style={{ width: `${(sortedSelectedSeats.length / MAX_BOOKING_SEATS) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {sortedSelectedSeats.length
              ? getSeatSelectionSummary(sortedSelectedSeats)
              : "Pick up to 4 seats for one checkout."}
          </p>
        </div>

        <div className="theme-inset-accent rounded-[26px] p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.52)]">
          <div className="text-3xl font-heading font-black tracking-tight text-white">
            {primarySelectedZone ? `${primarySelectedZone.id} block` : "No seats selected"}
          </div>

          <div className="mt-6 space-y-5">
            <DetailRow label="Selected seats" value={sortedSelectedSeats.length ? String(sortedSelectedSeats.length) : "--"} />
            <DetailRow label="Seat list" value={sortedSelectedSeats.length ? getSeatSelectionSummary(sortedSelectedSeats) : "--"} />
            <DetailRow
              label="First seat"
              value={primarySelectedSeat ?? "--"}
              icon={<Eye className="h-4 w-4 text-emerald-300" />}
            />
          </div>

          <div className="theme-inset-surface mt-6 rounded-[18px] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total amount</div>
            <div className="mt-2 text-4xl font-heading font-black tracking-tight text-emerald-300">
              {sortedSelectedSeats.length ? selectedTotal.toLocaleString(locale) : "--"}
            </div>
            <div className="text-sm font-semibold text-slate-400">{sortedSelectedSeats.length ? t("currency_symbol") : ""}</div>
          </div>

          {feedbackMessage ? (
            <div className="mt-4 rounded-[18px] border border-amber-400/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {feedbackMessage}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {sortedSelectedSeats.map((seatId) => (
                <SelectedSeatChip key={seatId} seatId={seatId} onRemove={() => handleSeatClick(seatId, false)} />
              ))}
            </div>
            <NeonButton
              onClick={handleCheckout}
              disabled={!sortedSelectedSeats.length}
              className="h-14 w-full text-sm font-black uppercase tracking-[0.18em]"
            >
              <span className="inline-flex items-center gap-2">
                Proceed to payment
                <ArrowRight className="h-4 w-4" />
              </span>
            </NeonButton>
            <button
              type="button"
              onClick={handleChangeSection}
              className="flex h-14 w-full items-center justify-center rounded-[18px] border border-emerald-400/16 bg-white/[0.03] text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200 transition-colors hover:bg-white/[0.06]"
            >
              Change section
            </button>
          </div>
        </div>

        <div className="theme-inset-accent rounded-[24px] p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.14em] text-white">Booking guardrails</div>
              <div className="mt-2 space-y-2 text-sm text-slate-400">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="theme-inset-surface mt-4 rounded-[18px] px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <MapPinned className="h-4 w-4" />
              Selection window
            </div>
            <div className="mt-2 text-2xl font-heading font-black text-white">{formatHoldTime(holdSeconds)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-4 last:border-b-0 last:pb-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="flex items-center gap-2 text-lg font-semibold text-white">
        {icon}
        {value}
      </div>
    </div>
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

function SelectedSeatChip({ seatId, onRemove }: { seatId: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 transition-colors hover:bg-emerald-400/16"
    >
      {seatId}
    </button>
  );
}
