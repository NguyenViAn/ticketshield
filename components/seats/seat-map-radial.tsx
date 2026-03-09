"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Clock3,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";
import { findFirstAvailableSeat, type TicketTierId } from "@/utils/tickets";

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

const SEAT_ZONES: SeatZone[] = [
  {
    id: "VIP",
    rowLabel: "A",
    count: 14,
    innerRadius: 68,
    outerRadius: 92,
    priceMultiplier: 2.5,
    seatSize: 6.8,
    fill: "rgba(245, 158, 11, 0.12)",
    stroke: "rgba(251, 191, 36, 0.32)",
    seatFill: "rgba(245, 158, 11, 0.34)",
  },
  {
    id: "Premium",
    rowLabel: "B",
    count: 22,
    innerRadius: 102,
    outerRadius: 128,
    priceMultiplier: 1.5,
    seatSize: 6,
    fill: "rgba(56, 189, 248, 0.1)",
    stroke: "rgba(125, 211, 252, 0.26)",
    seatFill: "rgba(148, 163, 184, 0.25)",
  },
  {
    id: "Standard",
    rowLabel: "C",
    count: 30,
    innerRadius: 138,
    outerRadius: 166,
    priceMultiplier: 1,
    seatSize: 5.4,
    fill: "rgba(129, 140, 248, 0.08)",
    stroke: "rgba(165, 180, 252, 0.22)",
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
    fill: "rgba(34, 197, 94, 0.08)",
    stroke: "rgba(74, 222, 128, 0.18)",
    seatFill: "rgba(100, 116, 139, 0.2)",
  },
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
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

export function SeatMapRadial({ matchId, basePrice = 2500000 }: SeatMapRadialProps) {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [takenSeats, setTakenSeats] = useState<string[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [holdSeconds, setHoldSeconds] = useState(HOLD_DURATION_SECONDS);
  const router = useRouter();
  const t = useTranslations("SeatMapRadial");
  const locale = useLocale();
  const isVietnamese = locale.startsWith("vi");
  const resetHoldWindow = () => {
    setHoldSeconds(HOLD_DURATION_SECONDS);
  };

  useEffect(() => {
    if (!matchId) return;

    const supabase = createClient();

    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("seat")
        .eq("match_id", matchId)
        .in("status", ["Valid", "Used"]);

      if (!error && data) {
        const seats = data.map((ticket) => ticket.seat);
        setTakenSeats(seats);
        setSelectedSeat((currentSeat) => (currentSeat && seats.includes(currentSeat) ? null : currentSeat));
      }
    };

    fetchTickets();
  }, [matchId]);

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

      resetHoldWindow();
      setSelectedSeat(suggestedSeat);
    };

    window.addEventListener("ticketshield:focus-seat-zone", handleFocusTier as EventListener);
    return () => {
      window.removeEventListener("ticketshield:focus-seat-zone", handleFocusTier as EventListener);
    };
  }, [matchId, takenSeats]);

  useEffect(() => {
    if (!selectedSeat) return;
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
  }, [selectedSeat]);

  const getPrice = (tierPriceMultiplier: number) => basePrice * tierPriceMultiplier;

  const selectedZone =
    selectedSeat ? SEAT_ZONES.find((zone) => selectedSeat.startsWith(`${zone.id}-`)) ?? null : null;
  const selectedSeatNumber = selectedSeat?.split("-")[1] ?? null;
  const selectedSeatLabel = selectedZone && selectedSeatNumber ? `${selectedZone.rowLabel}${selectedSeatNumber}` : "--";
  const selectedPrice = selectedZone ? getPrice(selectedZone.priceMultiplier) : null;

  const trustItems = isVietnamese
    ? [
        "Vé điện tử được xác thực trước khi phát hành",
        "Thông tin thanh toán được bảo vệ bằng kết nối an toàn",
        "Ghế đang chọn sẽ được kiểm tra lại trước khi tạo vé",
      ]
    : [
        "E-tickets are verified before delivery",
        "Payment details are protected by a secure connection",
        "Selected seats are rechecked before ticket creation",
      ];

  const getZoneState = (zoneId: SeatZone["id"]) => {
    const isActive = hoveredSeat?.startsWith(`${zoneId}-`) || selectedSeat?.startsWith(`${zoneId}-`);
    return {
      isActive: Boolean(isActive),
      label: t(`zones.${zoneId.toLowerCase()}`),
    };
  };

  const handleSeatClick = (seatId: string, isTaken: boolean) => {
    if (isTaken) return;
    setSelectedSeat((currentSeat) => {
      const nextSeat = currentSeat === seatId ? null : seatId;
      resetHoldWindow();
      return nextSeat;
    });
  };

  const handleCheckout = () => {
    if (!selectedSeat || !selectedZone) return;

    const price = getPrice(selectedZone.priceMultiplier);
    router.push(`/${locale}/payment?matchId=${matchId || ""}&seatId=${selectedSeat}&price=${price}`);
  };

  return (
    <div id="seat-map-panel" className="w-full scroll-mt-32">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[28px] border border-slate-900 bg-slate-950 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-4 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-[18%] h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">{t("map_mode")}</div>
              <div className="mt-1 text-sm text-slate-300">{t("map_hint")}</div>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              {t("semi_stadium")}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SEAT_ZONES.map((zone) => {
              const zoneState = getZoneState(zone.id);
              return (
                <div
                  key={zone.id}
                  className={`rounded-2xl border px-3 py-3 transition-all ${
                    zoneState.isActive
                      ? "border-emerald-300/35 bg-emerald-400/12 shadow-[0_0_22px_rgba(52,211,153,0.12)]"
                      : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200">
                      {zoneState.label}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {isVietnamese ? `Hàng ${zone.rowLabel}` : `Row ${zone.rowLabel}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.08),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]">
            <svg viewBox="-240 -150 480 420" className="h-full w-full" aria-label={t("aria_label")}>
              <defs>
                <radialGradient id="fieldGlow" cx="50%" cy="50%" r="65%">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.45)" />
                  <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                </radialGradient>
              </defs>

              <ellipse cx="0" cy="118" rx="112" ry="42" fill="url(#fieldGlow)" opacity="0.65" />

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
                      transition={{ delay: zoneIndex * 0.08, duration: 0.35 }}
                    />
                    {Array.from({ length: zone.count }).map((_, seatIndex) => {
                      const seatAngle = ARC_START + ARC_PADDING + angleStep * seatIndex;
                      const seatPosition = polarToCartesian(
                        STADIUM_CENTER.x,
                        STADIUM_CENTER.y,
                        (zone.innerRadius + zone.outerRadius) / 2,
                        seatAngle
                      );
                      const seatId = `${zone.id}-${seatIndex + 1}`;
                      const isTaken = takenSeats.includes(seatId);
                      const isSelected = selectedSeat === seatId;
                      const isAvailable = !isTaken;

                      const fill = isTaken
                        ? "rgba(148,163,184,0.42)"
                        : isSelected
                          ? "rgba(16,185,129,0.96)"
                          : zone.seatFill;
                      const stroke = isTaken
                        ? "rgba(248,113,113,0.35)"
                        : isSelected
                          ? "rgba(103,232,249,0.95)"
                          : zone.stroke;

                      return (
                        <motion.circle
                          key={seatId}
                          cx={seatPosition.x}
                          cy={seatPosition.y}
                          r={isSelected ? zone.seatSize + 1.2 : zone.seatSize}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isSelected ? 2.3 : 1.5}
                          className={isTaken ? "cursor-not-allowed" : "cursor-pointer"}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{
                            opacity: isTaken ? 0.72 : 1,
                            scale: isSelected ? 1.08 : 1,
                          }}
                          transition={{
                            delay: zoneIndex * 0.05 + seatIndex * 0.008,
                            duration: 0.22,
                            ease: "easeOut",
                          }}
                          whileHover={isAvailable ? { scale: 1.18, transition: { duration: 0.16 } } : undefined}
                          style={{
                            filter:
                              hoveredSeat === seatId && isAvailable
                                ? "drop-shadow(0 0 12px rgba(34,211,238,0.7))"
                                : isSelected
                                  ? "drop-shadow(0 0 16px rgba(52,211,153,0.7))"
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
                <rect
                  x="-72"
                  y="66"
                  width="144"
                  height="80"
                  rx="28"
                  fill="rgba(15,23,42,0.96)"
                  stroke="rgba(125,211,252,0.24)"
                  strokeWidth="1.6"
                />
                <rect
                  x="-56"
                  y="80"
                  width="112"
                  height="52"
                  rx="18"
                  fill="rgba(34,197,94,0.18)"
                  stroke="rgba(74,222,128,0.32)"
                  strokeWidth="1"
                />
                <line x1="0" y1="80" x2="0" y2="132" stroke="rgba(226,232,240,0.28)" strokeWidth="1.2" />
                <circle cx="0" cy="106" r="10" fill="none" stroke="rgba(226,232,240,0.25)" strokeWidth="1.2" />
                <text
                  x="0"
                  y="162"
                  fill="rgba(226,232,240,0.9)"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  letterSpacing="2.6"
                >
                  {t("field_label")}
                </text>
              </g>
            </svg>

            <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-slate-950/75 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                <MapPinned className="h-3.5 w-3.5" />
                {t("focal_point")}
              </div>
              <div className="mt-1 text-sm text-slate-300">{t("focal_point_desc")}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.95fr)]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                <Ticket className="h-4 w-4 text-brand-blue" />
                {t("summary_title")}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {selectedSeat ? t("summary_ready") : t("summary_hint")}
              </div>
            </div>
            <div className="rounded-2xl border border-brand-green/15 bg-brand-green/10 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-green">
                <Clock3 className="h-3.5 w-3.5" />
                {isVietnamese ? "Giữ lựa chọn trong phiên" : "Selection window"}
              </div>
              <div className="mt-1 text-2xl font-heading font-black text-slate-950">{formatHoldTime(holdSeconds)}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("section_label")}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {selectedZone ? t(`zones.${selectedZone.id.toLowerCase()}`) : "--"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("seat_label")}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">{selectedSeatLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2 xl:col-span-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("price_label")}</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">
                {selectedPrice ? `${selectedPrice.toLocaleString(locale)} ${t("currency_symbol")}` : "--"}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-brand-green" />
              {isVietnamese ? "Cam kết TicketShield" : "TicketShield assurance"}
            </div>
            <div className="space-y-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {isVietnamese ? "Tiếp tục với ghế đã chọn" : "Continue with selected seat"}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {selectedSeat
                  ? isVietnamese
                    ? "Kiểm tra lần cuối rồi chuyển sang trang thanh toán an toàn."
                    : "Review once more, then continue to secure checkout."
                  : isVietnamese
                    ? "Chọn một ghế còn trống trên sơ đồ để mở thanh toán."
                    : "Select an available seat on the map to unlock checkout."}
              </div>
            </div>
            <NeonButton
              onClick={handleCheckout}
              disabled={!selectedSeat}
              className="h-12 w-full whitespace-nowrap xl:min-w-[220px] xl:w-auto"
            >
              {t("btn_buy_seat")}
            </NeonButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{t("legend_title")}</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-200/70 text-slate-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>{t("available_label")}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300 bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.28)]">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span>{t("selected_label")}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-slate-700">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-slate-300/90 text-rose-500">
                <Ban className="h-4 w-4" />
              </span>
              <span>{t("sold_label")}</span>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              {isVietnamese ? "Mẹo chọn ghế" : "Quick seat tips"}
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                {isVietnamese
                  ? "VIP và Premium phù hợp khi cần tầm nhìn trung tâm và lối vào thuận tiện."
                  : "VIP and Premium are best when you want a more central view and easier access."}
              </p>
              <p>
                {isVietnamese
                  ? "Standard và Economy phù hợp khi ưu tiên ngân sách nhưng vẫn muốn theo dõi không khí sân."
                  : "Standard and Economy work well when you want stronger value while keeping the stadium atmosphere."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
