"use client";

import React, { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Pencil, Search, Swords, Trash2 } from "lucide-react";

import { useAdminMatches } from "@/hooks/use-admin";
import { deleteMatch } from "@/lib/services/admin";
import { createClient } from "@/utils/supabase/client";

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale.startsWith("vi") ? "vi-VN" : "en-US").format(value);
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMatchesPage() {
  const t = useTranslations("Admin.matches");
  const locale = useLocale();
  const { data: matches, isLoading, refetch } = useAdminMatches();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return matches;
    const q = search.toLowerCase();
    return matches.filter(
      (m) =>
        m.home_team.toLowerCase().includes(q) ||
        m.away_team.toLowerCase().includes(q) ||
        m.stadium.toLowerCase().includes(q),
    );
  }, [matches, search]);

  const handleDelete = async (id: string) => {
    if (!confirm(locale.startsWith("vi") ? "Ban co chac muon xoa tran dau nay khong?" : "Are you sure you want to delete this match?")) return;
    try {
      const supabase = createClient();
      await deleteMatch(supabase, id);
      refetch();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search_placeholder")}
          className="admin-input-surface admin-focus-ring w-full py-2.5 pl-10 pr-4 text-sm"
        />
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
                <th className="px-4 py-3 text-left">{t("home_team")} / {t("away_team")}</th>
                <th className="px-4 py-3 text-left">{t("date")}</th>
                <th className="hidden px-4 py-3 text-left md:table-cell">{t("stadium")}</th>
                <th className="hidden px-4 py-3 text-right lg:table-cell">{t("price")}</th>
                <th className="hidden px-4 py-3 text-center lg:table-cell">{t("security")}</th>
                <th className="hidden px-4 py-3 text-right xl:table-cell">{t("seats")}</th>
                <th className="px-4 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-white/6">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="admin-skeleton h-5 rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((match) => (
                  <tr key={match.id} className="admin-table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4 shrink-0 text-cyan-300" />
                        <div>
                          <span className="font-medium text-white">{match.home_team}</span>
                          <span className="mx-1.5 text-slate-400">vs</span>
                          <span className="font-medium text-white">{match.away_team}</span>
                        </div>
                      </div>
                      {match.tournaments?.name && (
                        <div className="mt-0.5 pl-6 text-xs text-slate-500">{match.tournaments.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(match.date, locale)}</td>
                    <td className="hidden px-4 py-3 text-slate-400 md:table-cell">{match.stadium}</td>
                    <td className="hidden px-4 py-3 text-right font-medium text-white lg:table-cell">
                      {formatCurrency(match.base_price, locale)} VND
                    </td>
                    <td className="hidden px-4 py-3 text-center lg:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          match.security_level === "Ultra"
                            ? "border border-rose-500/18 bg-rose-500/10 text-rose-300"
                            : match.security_level === "Maximum"
                              ? "border border-orange-400/18 bg-orange-400/10 text-orange-300"
                              : match.security_level === "High"
                                ? "border border-amber-400/18 bg-amber-400/10 text-amber-300"
                                : "border border-white/8 bg-white/[0.04] text-slate-400"
                        }`}
                      >
                        {match.security_level}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-slate-400 xl:table-cell">
                      {match.available_seats}/{match.total_seats}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white"
                          title={t("edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="admin-button-danger rounded-lg p-2"
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {t("no_matches")}
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
