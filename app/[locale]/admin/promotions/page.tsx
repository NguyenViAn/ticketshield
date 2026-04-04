"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Percent, ToggleLeft, ToggleRight } from "lucide-react";

import { useAdminPromotions } from "@/hooks/use-admin";
import { togglePromotionActive } from "@/lib/services/admin";
import { createClient } from "@/utils/supabase/client";

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPromotionsPage() {
  const t = useTranslations("Admin.promotions");
  const locale = useLocale();
  const { data: promotions, isLoading, refetch } = useAdminPromotions();

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const supabase = createClient();
      await togglePromotionActive(supabase, id, !currentActive);
      refetch();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="admin-surface overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-4 py-3 text-left">{t("title_col")}</th>
                <th className="px-4 py-3 text-center">{t("discount")}</th>
                <th className="px-4 py-3 text-center">{t("active")}</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">{t("created")}</th>
                <th className="px-4 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : promotions.length > 0 ? (
                promotions.map((promo) => (
                  <tr key={promo.id} className="admin-table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 shrink-0 text-cyan-600" />
                        <div>
                          <div className="font-medium text-slate-950">
                            {locale.startsWith("vi") ? promo.title_vi : promo.title_en}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {locale.startsWith("vi") ? promo.description_vi : promo.description_en}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-700">
                        {promo.discount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          promo.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {promo.active ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {formatDate(promo.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleToggle(promo.id, promo.active)}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            promo.active
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {promo.active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                          {t("toggle_active")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {t("no_promos")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
