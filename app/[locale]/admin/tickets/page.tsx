"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Ticket } from "lucide-react";

import { useAdminTickets } from "@/hooks/use-admin";
import { updateTicketStatus } from "@/lib/services/admin";
import { createClient } from "@/utils/supabase/client";

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale.startsWith("vi") ? "vi-VN" : "en-US").format(value);
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_OPTIONS = ["Valid", "Used", "Cancelled", "Suspended"];
const FILTER_KEYS = ["filter_all", "filter_valid", "filter_used", "filter_cancelled", "filter_suspended"] as const;
const FILTER_VALUES = ["All", "Valid", "Used", "Cancelled", "Suspended"];

function statusColor(status: string) {
  switch (status) {
    case "Valid":
      return "bg-emerald-500/15 text-emerald-400";
    case "Used":
      return "bg-blue-500/15 text-blue-400";
    case "Cancelled":
      return "bg-red-500/15 text-red-400";
    case "Suspended":
      return "bg-yellow-500/15 text-yellow-400";
    default:
      return "bg-slate-500/15 text-slate-400";
  }
}

export default function AdminTicketsPage() {
  const t = useTranslations("Admin.tickets");
  const locale = useLocale();
  const { data: tickets, isLoading, refetch } = useAdminTickets();
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return tickets;
    return tickets.filter((ticket) => ticket.status === filter);
  }, [tickets, filter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const supabase = createClient();
      await updateTicketStatus(supabase, id, newStatus);
      refetch();
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_KEYS.map((key, index) => (
          <button
            key={key}
            onClick={() => setFilter(FILTER_VALUES[index])}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === FILTER_VALUES[index]
                ? "bg-emerald-500/20 text-emerald-300 shadow-[inset_0_1px_0_rgba(52,211,153,0.15)]"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="admin-surface overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("match")}
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("seat")}
                </th>
                <th className="hidden px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:table-cell">
                  {t("price")}
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("status")}
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:table-cell">
                  {t("created")}
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="admin-table-row"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 shrink-0 text-cyan-500" />
                        <span className="font-medium text-white">
                          {ticket.matches?.home_team} vs {ticket.matches?.away_team}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-6 text-xs text-slate-400">ID: {ticket.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{ticket.seat}</td>
                    <td className="hidden px-4 py-3 text-right font-medium text-emerald-400 md:table-cell">
                      {formatCurrency(ticket.price_paid, locale)} VND
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                      {formatDate(ticket.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <select
                          value={ticket.status}
                          onChange={(event) => handleStatusChange(ticket.id, event.target.value)}
                          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none transition-colors focus:border-emerald-500/40"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status} className="bg-slate-950 text-slate-100">
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {t("no_tickets")}
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
