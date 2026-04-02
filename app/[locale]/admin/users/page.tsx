"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldBan, ShieldCheck, UserX, UserCheck, X, AlertTriangle } from "lucide-react";
import { useBlockedUsers } from "@/hooks/use-admin";
import { blockUser, unblockUser } from "@/lib/services/admin";
import { createClient } from "@/utils/supabase/client";

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale.startsWith("vi") ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const locale = useLocale();
  const { data: blockedUsers, isLoading, refetch } = useBlockedUsers();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBlock = async () => {
    if (!userId.trim() || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      await blockUser(supabase, userId.trim(), reason.trim());
      setShowBlockDialog(false);
      setUserId("");
      setReason("");
      refetch();
    } catch (err) {
      console.error("Block failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    if (!confirm(t("confirm_unblock"))) return;
    try {
      const supabase = createClient();
      await unblockUser(supabase, blockedUserId);
      refetch();
    } catch (err) {
      console.error("Unblock failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowBlockDialog(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/25"
        >
          <UserX className="h-4 w-4" />
          {t("block")}
        </button>
      </div>

      {/* Block Dialog */}
      <AnimatePresence>
        {showBlockDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlockDialog(false)}
              className="fixed inset-0 z-50 bg-slate-900/58 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t("block_dialog_title")}</h3>
                    <p className="text-xs text-slate-400">{t("block_dialog_desc")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBlockDialog(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder={t("user_id_placeholder")}
                    className="admin-input-surface w-full px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("reason_placeholder")}
                    className="admin-input-surface w-full px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowBlockDialog(false)}
                    className="admin-button-muted flex-1 rounded-xl py-2.5 text-sm font-medium"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={isSubmitting || !userId.trim() || !reason.trim()}
                    className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "..." : t("confirm_block")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Blocked Users Table */}
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
                  {locale.startsWith("vi") ? "Mã người dùng" : "User ID"}
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("reason")}
                </th>
                <th className="hidden px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:table-cell">
                  {t("blocked_at")}
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-white/10">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : blockedUsers.length > 0 ? (
                blockedUsers.map((bu) => (
                  <tr
                    key={bu.id}
                    className="admin-table-row"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldBan className="h-4 w-4 shrink-0 text-red-400" />
                        <span className="font-mono text-xs text-slate-300">{bu.user_id.slice(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                        🔴 {t("status_blocked")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{bu.reason}</td>
                    <td className="hidden px-4 py-3 text-slate-400 md:table-cell">
                      {formatDate(bu.blocked_at, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleUnblock(bu.user_id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {t("unblock")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck className="h-10 w-10 text-emerald-500/40" />
                      <span className="text-sm text-slate-400">{t("no_blocked")}</span>
                    </div>
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
