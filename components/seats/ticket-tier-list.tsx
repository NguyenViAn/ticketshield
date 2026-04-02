"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";
import { TICKET_TIERS, type TicketTierId } from "@/utils/tickets";

type TierMeta = {
  badge: string;
  hint: string;
  tone: string;
};

const META_STYLES: Record<TicketTierId, string> = {
  VIP: "bg-emerald-400/12 text-emerald-300",
  Premium: "bg-cyan-400/12 text-cyan-300",
  Standard: "bg-white/10 text-slate-200",
  Economy: "bg-white/10 text-slate-200",
};

const CARD_STYLES: Record<TicketTierId, string> = {
  VIP: "border-emerald-400/18 bg-[linear-gradient(180deg,rgba(7,26,19,0.98),rgba(4,16,12,0.98))] hover:border-emerald-300/30",
  Premium: "border-cyan-400/14 bg-[linear-gradient(180deg,rgba(7,24,26,0.96),rgba(5,17,19,0.98))] hover:border-cyan-300/24",
  Standard: "border-white/10 bg-[linear-gradient(180deg,rgba(8,24,19,0.96),rgba(5,17,13,0.96))] hover:border-white/16",
  Economy: "border-white/10 bg-[linear-gradient(180deg,rgba(8,24,19,0.92),rgba(5,17,13,0.94))] hover:border-white/16",
};

export function TicketTierList({ matchId, basePrice }: { matchId: string; basePrice: number }) {
  const [takenCounts, setTakenCounts] = useState<Record<TicketTierId, number>>({
    VIP: 0,
    Premium: 0,
    Standard: 0,
    Economy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations("TicketTierList");

  const tierMeta: Record<TicketTierId, TierMeta> = {
    VIP: { badge: t("meta.vip_badge"), hint: t("meta.vip_hint"), tone: META_STYLES.VIP },
    Premium: { badge: t("meta.premium_badge"), hint: t("meta.premium_hint"), tone: META_STYLES.Premium },
    Standard: { badge: t("meta.standard_badge"), hint: t("meta.standard_hint"), tone: META_STYLES.Standard },
    Economy: { badge: t("meta.economy_badge"), hint: t("meta.economy_hint"), tone: META_STYLES.Economy },
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

    fetchTickets();
  }, [matchId, supabase]);

  const handleSelectTier = (tierId: TicketTierId) => {
    window.dispatchEvent(new CustomEvent("ticketshield:focus-seat-zone", { detail: { tierId, matchId } }));
    document.getElementById("seat-map-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[260px] animate-pulse rounded-[24px] bg-white/5" />
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
        const price = basePrice * tier.priceMultiplier;

        return (
          <div
            key={tier.id}
            className={`flex min-h-[300px] h-full flex-col rounded-[26px] border px-5 pb-5 pt-4 transition-all ${
              isSoldOut
                ? "border-white/8 bg-white/[0.04] opacity-65"
                : `${CARD_STYLES[tier.id]} shadow-[0_22px_60px_-42px_rgba(0,0,0,0.6)] hover:-translate-y-0.5`
            }`}
          >
            <div className="flex min-h-[3.25rem] items-start justify-between gap-3">
              <span
                className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tierMeta[tier.id].tone}`}
              >
                {tierMeta[tier.id].badge}
              </span>
              <span className="max-w-[8.5rem] pt-1 text-right text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-slate-400">
                {tierMeta[tier.id].hint}
              </span>
            </div>

            <div className="mt-5 text-[2.1rem] font-heading font-black leading-[0.92] tracking-[-0.05em] text-white">
              {t(`tiers.${tier.id.toLowerCase()}_name`)}
            </div>
            <div className="mt-2 min-h-5 text-sm text-slate-400">{t("seats_left", { count: available })}</div>

            <div className="theme-inset-surface mt-6 rounded-[22px] px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t("from_label")}</div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-[2.2rem] font-heading font-black leading-none tracking-[-0.05em] text-emerald-300">
                  {price.toLocaleString(locale)}
                </div>
                <div className="pb-1 text-sm font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {t("currency_symbol")}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <NeonButton
                disabled={isSoldOut}
                onClick={() => handleSelectTier(tier.id)}
                className={`h-12 w-full whitespace-nowrap rounded-[18px] ${
                  isSoldOut ? "cursor-not-allowed !border-white/10 !bg-white/10 !text-slate-500 opacity-60" : ""
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isSoldOut ? t("btn_sold_out") : t("btn_select")}
                  {!isSoldOut ? <ArrowRight className="h-4 w-4" /> : null}
                </span>
              </NeonButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}
