import type { SupabaseClient } from "@supabase/supabase-js";

import type { Promotion, PromotionRow } from "@/types";

export async function fetchActivePromotions(supabase: SupabaseClient, locale: string) {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PromotionRow[]).map((row) => ({
    id: row.id,
    title: locale === "vi" ? row.title_vi : row.title_en,
    description: locale === "vi" ? row.description_vi : row.description_en,
    discount: row.discount,
    gradientCode: row.gradient_code,
  })) satisfies Promotion[];
}
