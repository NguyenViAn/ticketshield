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
      return "border border-emerald-500/18 bg-emerald-500/10 text-emerald-300";
    case "Used":
      return "border border-cyan-500/18 bg-cyan-500/10 text-cyan-300";
    case "Cancelled":
      return "border border-rose-500/18 bg-rose-500/10 text-rose-300";
    case "Suspended":
      return "border border-amber-400/18 bg-amber-400/10 text-amber-300";
    default:
      return "border border-white/8 bg-white/[0.04] text-slate-400";
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
                    className={`admin-focus-ring rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === FILTER_VALUES[index]
                ? "border-cyan-500/18 bg-cyan-500/10 text-cyan-300"
                : "border-white/8 bg-white/[0.04] text-slate-400 hover:border-white/12 hover:bg-white/[0.06] hover:text-white"
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
            <thead className="admin-table-head">
              <tr>
                <th className="px-4 py-3 text-left">{t("match")}</th>
                <th className="px-4 py-3 text-left">{t("seat")}</th>
                <th className="hidden px-4 py-3 text-left xl:table-cell">Booking Group</th>
                <th className="hidden px-4 py-3 text-right md:table-cell">{t("price")}</th>
                <th className="px-4 py-3 text-center">{t("status")}</th>
                <th className="hidden px-4 py-3 text-left lg:table-cell">{t("created")}</th>
                <th className="px-4 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-white/6">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="admin-skeleton h-5 rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((ticket) => (
                  <tr key={ticket.id} className="admin-table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 shrink-0 text-cyan-300" />
                        <span className="font-medium text-white">
                          {ticket.matches?.home_team} vs {ticket.matches?.away_team}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-6 text-xs text-slate-500">ID: {ticket.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{ticket.seat}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 xl:table-cell">
                      {(ticket.booking_group_id ?? ticket.id).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-medium text-white md:table-cell">
                      {formatCurrency(ticket.price_paid, locale)} VND
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      {formatDate(ticket.created_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <select
                          value={ticket.status}
                          onChange={(event) => handleStatusChange(ticket.id, event.target.value)}
                          className="admin-focus-ring rounded-lg border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-slate-200 outline-none transition-colors focus:border-cyan-400/30"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
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
