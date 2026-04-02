import Image from "next/image";
import { ArrowLeft, CalendarClock, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { SeatMapRadial } from "@/components/seats/seat-map-radial";
import { TicketTierList } from "@/components/seats/ticket-tier-list";
import { Link } from "@/i18n/routing";
import { resolveLeagueLogo } from "@/lib/logo-resolver";
import { createClient } from "@/utils/supabase/server";

export default async function SeatsPage({ params }: { params: Promise<{ matchId: string }> | { matchId: string } }) {
  const supabase = await createClient();
  const t = await getTranslations("SeatsPage");
  const locale = await getLocale();
  const { matchId } = await Promise.resolve(params);

  const { data: match, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch match for seats page. ID:", matchId, "Error:", error);
    return notFound();
  }

  if (!match) {
    return notFound();
  }

  let tournament: { name: string; logo_url: string | null } | null = null;

  if (match.tournament_id) {
    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournaments")
      .select("name, logo_url")
      .eq("id", match.tournament_id)
      .maybeSingle();

    if (tournamentError) {
      console.error("Failed to fetch tournament for seats page. Match ID:", matchId, "Error:", tournamentError);
    } else {
      tournament = tournamentData;
    }
  }

  const isVietnamese = locale.startsWith("vi");
  const heroDate = new Date(match.date).toLocaleString(locale, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const leagueLogo = resolveLeagueLogo(tournament?.name, tournament?.logo_url);

  return (
    <main className="page-premium pb-20 pt-5 sm:pt-7">
      <div className="border-b border-emerald-500/10 bg-slate-800/36 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/matches" className="page-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em]">
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_events")}
          </Link>

          <div className="page-button-secondary hidden rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 md:block">
            Live selection
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                <span>Live selection</span>
                <span className="text-slate-500">&middot;</span>
                <span>{tournament?.name || "Featured Match"}</span>
              </div>

              <div className="inline-flex items-center gap-4 rounded-[24px] border border-emerald-400/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(255,255,255,0.02))] px-4 py-3 shadow-[0_18px_42px_-32px_rgba(16,185,129,0.24)] backdrop-blur-sm">
                {leagueLogo ? (
                  <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/92 shadow-[0_16px_32px_-24px_rgba(255,255,255,0.8)]">
                    <Image
                      src={leagueLogo}
                      alt="League"
                      width={56}
                      height={56}
                      className="h-11 w-11 object-contain brightness-125 saturate-125"
                      unoptimized
                    />
                  </span>
                ) : null}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {isVietnamese ? "Giải đấu" : "Competition"}
                  </div>
                  <div className="mt-1 text-base font-black uppercase tracking-[0.22em] text-emerald-300">
                    {tournament?.name || "V-LEAGUE"}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 max-w-5xl">
              <h1 className="text-balance text-4xl font-heading font-black uppercase leading-[0.9] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[5.4rem]">
                <span>{match.home_team}</span>
                <span className="mx-4 inline-block align-middle text-white/24">{t("vs")}</span>
                <span>{match.away_team}</span>
              </h1>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-lg text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
                <MapPin className="h-5 w-5 text-emerald-300" />
                {match.stadium}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
                <CalendarClock className="h-5 w-5 text-emerald-300" />
                {heroDate}
              </span>
            </div>
          </div>

          <div className="page-card rounded-[30px] p-6 xl:mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              {t("price_from")}
            </div>
            <div className="mt-4 text-5xl font-heading font-black leading-none tracking-tight text-emerald-300">
              {match.base_price.toLocaleString(locale)}
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-400">{t("currency")}</div>
            <div className="mt-5 h-px bg-white/8" />
            <p className="mt-5 text-sm leading-7 text-slate-300">
              {isVietnamese
                ? "Chon khu phu hop, khoa ghe truc tiep tren so do va tiep tuc thanh toan trong cung mot luong."
                : "Pick a stand, lock a seat directly on the map, and continue through one streamlined flow."}
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Select section</div>
            <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
              {t("ticket_tier_title")}
            </h2>
          </div>
          <TicketTierList matchId={match.id} basePrice={match.base_price} />
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Map control</div>
            <h2 className="mt-2 text-2xl font-heading font-black tracking-tight text-white">
              {t("seat_map_title")}
            </h2>
          </div>
          <SeatMapRadial matchId={match.id} basePrice={match.base_price} />
        </section>
      </div>
    </main>
  );
}
