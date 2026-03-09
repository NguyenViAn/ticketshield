"use client";

import { useEffect, useState } from "react";
import { Check, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";
import { TICKET_TIERS, type TicketTierId } from "@/utils/tickets";

export function TicketTierList({ matchId, basePrice }: { matchId: string; basePrice: number }) {
  const [takenCounts, setTakenCounts] = useState<Record<string, number>>({
    VIP: 0,
    Premium: 0,
    Standard: 0,
    Economy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const t = useTranslations("TicketTierList");
  const locale = useLocale();
  const isVietnamese = locale.startsWith("vi");
  const selectLabel = isVietnamese ? "CHỌN GHẾ" : "CHOOSE SEAT";
  const tierMeta: Record<TicketTierId, { badge: string; summary: string; audience: string }> = isVietnamese
    ? {
        VIP: {
          badge: "Tầm nhìn đẹp nhất",
          summary: "Sát sân, trải nghiệm cao cấp với góc nhìn nổi bật.",
          audience: "Phù hợp khách muốn vị trí đẹp và dịch vụ tốt hơn.",
        },
        Premium: {
          badge: "Bán chạy",
          summary: "Cân bằng giữa tầm nhìn rộng và mức giá hợp lý.",
          audience: "Lý tưởng cho nhóm bạn hoặc gia đình đi cùng nhau.",
        },
        Standard: {
          badge: "Phổ biến",
          summary: "Theo dõi trọn vẹn bầu không khí trận đấu với mức giá dễ tiếp cận.",
          audience: "Lựa chọn an toàn cho phần lớn khán giả.",
        },
        Economy: {
          badge: "Giá tốt",
          summary: "Ngân sách nhẹ hơn nhưng vẫn bao quát nhịp trận và không khí sân.",
          audience: "Phù hợp khi cần tối ưu chi phí mà vẫn giữ trải nghiệm tốt.",
        },
      }
    : {
        VIP: {
          badge: "Best view",
          summary: "Closest to the pitch with premium matchday comfort.",
          audience: "Ideal for standout access and stronger hospitality.",
        },
        Premium: {
          badge: "Popular",
          summary: "Balanced stadium view and pricing for most supporters.",
          audience: "Great for groups and families attending together.",
        },
        Standard: {
          badge: "Flexible",
          summary: "Full atmosphere with an accessible and reliable price point.",
          audience: "A safe choice for the majority of matchgoers.",
        },
        Economy: {
          badge: "Best value",
          summary: "Budget-friendly entry with wide stadium coverage.",
          audience: "Built for fast, cost-conscious booking decisions.",
        },
      };

  useEffect(() => {
    if (!matchId) return;

    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("seat")
        .eq("match_id", matchId)
        .in("status", ["Valid", "Used"]);

      if (!error && data) {
        const newCounts = { VIP: 0, Premium: 0, Standard: 0, Economy: 0 };
        data.forEach((ticket) => {
          if (ticket.seat.startsWith("VIP")) newCounts.VIP += 1;
          else if (ticket.seat.startsWith("Premium")) newCounts.Premium += 1;
          else if (ticket.seat.startsWith("Standard")) newCounts.Standard += 1;
          else if (ticket.seat.startsWith("Economy")) newCounts.Economy += 1;
        });
        setTakenCounts(newCounts);
      }

      setIsLoading(false);
    };

    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const handleSelectTier = (tierId: TicketTierId) => {
    window.dispatchEvent(
      new CustomEvent("ticketshield:focus-seat-zone", {
        detail: { tierId, matchId },
      })
    );

    document.getElementById("seat-map-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-[24px] bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {TICKET_TIERS.map((tier) => {
        const price = basePrice * tier.priceMultiplier;
        const booked = takenCounts[tier.id] || 0;
        const available = tier.totalSeats - booked;
        const isSoldOut = available <= 0;

        return (
          <div
            key={tier.id}
            className={`group overflow-hidden rounded-[24px] border p-5 transition-all sm:p-6 ${
              isSoldOut
                ? "border-slate-200 bg-slate-50"
                : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
                      isSoldOut ? "bg-slate-200 text-slate-400" : "bg-brand-blue/10 text-brand-blue"
                    }`}
                  >
                    {tierMeta[tier.id].badge}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      isSoldOut ? "bg-slate-200 text-slate-400" : "bg-emerald-50 text-brand-green"
                    }`}
                  >
                    {available} {isVietnamese ? "ghế còn lại" : "seats left"}
                  </span>
                </div>

                <h3 className={`text-xl font-heading font-black tracking-tight ${isSoldOut ? "text-slate-400" : "text-slate-950"}`}>
                  {t(`tiers.${tier.id.toLowerCase()}_name`)}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{tierMeta[tier.id].summary}</p>
                <p className="mt-1 text-sm text-slate-500">{tierMeta[tier.id].audience}</p>

                {!isSoldOut ? (
                  <p className="mt-4 flex w-max items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-green">
                    <Check className="h-3 w-3" /> {t("available")}
                  </p>
                ) : (
                  <p className="mt-4 flex w-max items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <XCircle className="h-3 w-3" /> {t("sold_out")}
                  </p>
                )}
              </div>

              <div className="min-w-[220px] rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:self-stretch">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {isVietnamese ? "Giá khu vực" : "Stand price"}
                </div>
                <div className={`mt-2 text-3xl font-heading font-black tracking-tight ${isSoldOut ? "text-slate-400" : "text-brand-blue"}`}>
                  {price.toLocaleString(locale)}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{t("currency_symbol")}</div>
                <NeonButton
                  disabled={isSoldOut}
                  className={`mt-4 h-12 w-full whitespace-nowrap ${
                    isSoldOut ? "cursor-not-allowed !border-slate-300 !bg-slate-300 !text-slate-500 opacity-50" : ""
                  }`}
                  onClick={() => handleSelectTier(tier.id)}
                >
                  {isSoldOut ? t("btn_sold_out") : selectLabel}
                </NeonButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
