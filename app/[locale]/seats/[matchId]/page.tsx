import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BookingWorkspace } from "@/components/seats/booking-workspace";
import { Link } from "@/i18n/routing";
import { resolveLeagueLogo } from "@/lib/logo-resolver";
import { hasSupabaseEnv } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export default async function SeatsPage({ params }: { params: Promise<{ matchId: string }> | { matchId: string } }) {
  if (!hasSupabaseEnv()) {
    return notFound();
  }

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
            Booking flow
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <BookingWorkspace
          awayTeam={match.away_team}
          basePrice={match.base_price}
          heroDate={heroDate}
          homeTeam={match.home_team}
          leagueLogo={leagueLogo}
          matchId={match.id}
          stadium={match.stadium}
          tournamentName={tournament?.name || "Featured Match"}
          vsLabel={t("vs")}
        />
      </div>
    </main>
  );
}
