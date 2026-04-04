"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocale } from "next-intl";

import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";
import { TICKET_TIERS, type TicketTierId } from "@/utils/tickets";

const CARD_STYLES: Record<TicketTierId, string> = {
  VIP: "border-emerald-400/18 bg-[linear-gradient(180deg,rgba(7,26,19,0.98),rgba(4,16,12,0.98))]",
  Premium: "border-cyan-400/14 bg-[linear-gradient(180deg,rgba(7,24,26,0.96),rgba(5,17,19,0.98))]",
  Standard: "border-white/10 bg-[linear-gradient(180deg,rgba(8,24,19,0.96),rgba(5,17,13,0.96))]",
  Economy: "border-white/10 bg-[linear-gradient(180deg,rgba(8,24,19,0.92),rgba(5,17,13,0.94))]",
};

export function TicketTierList({
  activeTier,
  basePrice,
  matchId,
  onChooseTier,
}: {
  activeTier: TicketTierId | null;
  basePrice: number;
  matchId: string;
  onChooseTier: (tierId: TicketTierId) => void;
}) {
  const [takenCounts, setTakenCounts] = useState<Record<TicketTierId, number>>({
    VIP: 0,
    Premium: 0,
    Standard: 0,
    Economy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const locale = useLocale();

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
        const nextCounts: Record<TicketTierId, number> = {
          VIP: 0,
          Premium: 0,
          Standard: 0,
          Economy: 0,
        };

        data.forEach((ticket) => {
          if (ticket.seat.startsWith("VIP")) nextCounts.VIP += 1;
          else if (ticket.seat.startsWith("Premium")) nextCounts.Premium += 1;
          else if (ticket.seat.startsWith("Standard")) nextCounts.Standard += 1;
          else if (ticket.seat.startsWith("Economy")) nextCounts.Economy += 1;
        });

        setTakenCounts(nextCounts);
      }

      setIsLoading(false);
    };

    void fetchTickets();
  }, [matchId, supabase]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[280px] animate-pulse rounded-[24px] bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div id="seat-tier-grid" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TICKET_TIERS.map((tier) => {
        const booked = takenCounts[tier.id] || 0;
        const available = Math.max(tier.totalSeats - booked, 0);
        const isSoldOut = available <= 0;
        const isSelected = activeTier === tier.id;
        const price = basePrice * tier.priceMultiplier;
        const statusLabel = isSoldOut ? "Sold out" : isSelected ? "Selected" : "Available";

        return (
          <div
            key={tier.id}
            className={`flex min-h-[300px] h-full flex-col rounded-[26px] border px-5 pb-5 pt-4 transition-all ${
              isSoldOut
                ? "border-white/8 bg-white/[0.04] opacity-65"
                : `${CARD_STYLES[tier.id]} shadow-[0_22px_60px_-42px_rgba(0,0,0,0.6)]`
            } ${isSelected ? "ring-2 ring-emerald-400/40" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isSelected
                    ? "bg-emerald-400/16 text-emerald-200"
                    : isSoldOut
                      ? "bg-white/10 text-slate-400"
                      : "bg-white/10 text-slate-200"
                }`}
              >
                {statusLabel}
              </span>
              <span className="max-w-[8.5rem] pt-1 text-right text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-slate-400">
                {available} left
              </span>
            </div>

            <div className="mt-5 text-[2rem] font-heading font-black leading-[0.95] tracking-[-0.05em] text-white">
              {tier.id}
            </div>
            <div className="mt-2 min-h-5 text-sm text-slate-400">
              {tier.totalSeats} seats in this section
            </div>

            <div className="theme-inset-surface mt-6 rounded-[22px] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Price per seat</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-[2.2rem] font-heading font-black leading-none tracking-[-0.05em] text-emerald-300">
                  {price.toLocaleString(locale)}
                </div>
                <div className="pb-1 text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">VND</div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <NeonButton
                disabled={isSoldOut}
                onClick={() => onChooseTier(tier.id)}
                className={`h-12 w-full whitespace-nowrap rounded-[18px] ${
                  isSelected
                    ? "!bg-emerald-400 !text-slate-950"
                    : isSoldOut
                      ? "cursor-not-allowed !border-white/10 !bg-white/10 !text-slate-500 opacity-60"
                      : ""
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isSoldOut ? (
                    "Sold out"
                  ) : isSelected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Selected
                    </>
                  ) : (
                    <>
                      {`Choose ${tier.id}`}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </NeonButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
