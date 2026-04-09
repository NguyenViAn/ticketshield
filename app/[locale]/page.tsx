import HomePageClient from "@/components/home/home-page-client";
import { fetchFeaturedMatches } from "@/lib/services/matches";
import { hasSupabaseEnv } from "@/utils/supabase/env";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  if (!hasSupabaseEnv()) {
    return (
      <HomePageClient
        initialFeaturedMatches={[]}
        initialMatchCount={0}
        initialTicketCount={0}
      />
    );
  }

  const supabase = await createClient();

  const [
    featuredMatchesResult,
    matchCountResult,
    ticketCountResult,
  ] = await Promise.allSettled([
    fetchFeaturedMatches(supabase),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("tickets").select("id", { count: "exact", head: true }),
  ]);

  const featuredMatches =
    featuredMatchesResult.status === "fulfilled" ? featuredMatchesResult.value : [];
  const initialMatchCount =
    matchCountResult.status === "fulfilled" ? matchCountResult.value.count ?? 0 : 0;
  const initialTicketCount =
    ticketCountResult.status === "fulfilled" ? ticketCountResult.value.count ?? 0 : 0;

  return (
    <HomePageClient
      initialFeaturedMatches={featuredMatches}
      initialMatchCount={initialMatchCount}
      initialTicketCount={initialTicketCount}
    />
  );
}
