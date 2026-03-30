import HomePageClient from "@/components/home/home-page-client";
import { fetchFeaturedMatches } from "@/lib/services/matches";
import { fetchActivePromotions } from "@/lib/services/promotions";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const [
    featuredMatchesResult,
    promotionsResult,
    matchCountResult,
    ticketCountResult,
  ] = await Promise.allSettled([
    fetchFeaturedMatches(supabase),
    fetchActivePromotions(supabase, locale),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
  ]);

  const featuredMatches =
    featuredMatchesResult.status === "fulfilled" ? featuredMatchesResult.value : [];
  const promotions =
    promotionsResult.status === "fulfilled" ? promotionsResult.value : [];
  const initialMatchCount =
    matchCountResult.status === "fulfilled" ? matchCountResult.value.count ?? 0 : 0;
  const initialTicketCount =
    ticketCountResult.status === "fulfilled" ? ticketCountResult.value.count ?? 0 : 0;

  return (
    <HomePageClient
      initialFeaturedMatches={featuredMatches}
      initialPromotions={promotions}
      initialMatchCount={initialMatchCount}
      initialTicketCount={initialTicketCount}
    />
  );
}
