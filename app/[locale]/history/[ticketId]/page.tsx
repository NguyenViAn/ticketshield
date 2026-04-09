"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";

import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";
import {
  MatchdayDetailBlock,
  MatchdayInfoField,
  MatchdayPanel,
  MatchdaySummaryRow,
} from "@/components/ui/matchday";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/utils/supabase/client";
import type { TicketWithMatch } from "@/types";

type BookingMate = Pick<TicketWithMatch, "id" | "seat" | "status" | "price_paid" | "booking_group_id" | "created_at">;

function QRCodeSVG({ data, size = 164 }: { data: string; size?: number }) {
  const cells = 21;
  const cellSize = size / cells;
  const pattern: boolean[][] = [];

  let seed = 0;
  for (let i = 0; i < data.length; i++) {
    seed = ((seed << 5) - seed + data.charCodeAt(i)) | 0;
  }

  const rng = (value: number) => {
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    value = Math.imul(value ^ (value >>> 13), 0x45d9f3b);
    return (value ^ (value >>> 16)) >>> 0;
  };

  for (let row = 0; row < cells; row++) {
    pattern[row] = [];
    for (let col = 0; col < cells; col++) {
      const inFinderTL = row < 7 && col < 7;
      const inFinderTR = row < 7 && col >= cells - 7;
      const inFinderBL = row >= cells - 7 && col < 7;

      if (inFinderTL || inFinderTR || inFinderBL) {
        const localRow = inFinderTL ? row : inFinderTR ? row : row - (cells - 7);
        const localCol = inFinderTL ? col : inFinderTR ? col - (cells - 7) : col;
        if (localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6) {
          pattern[row][col] = true;
        } else if (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4) {
          pattern[row][col] = true;
        } else {
          pattern[row][col] = false;
        }
      } else {
        seed = rng(seed + row * cells + col);
        pattern[row][col] = seed % 3 !== 0;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-xl">
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, rowIndex) =>
        row.map((filled, columnIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={columnIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#03140d"
            />
          ) : null
        )
      )}
    </svg>
  );
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; accent: string; panel: string; title: string }> = {
  Valid: {
    icon: CheckCircle2,
    accent: "text-emerald-300",
    panel: "border-emerald-400/18 bg-emerald-400/10",
    title: "Verified",
  },
  Used: {
    icon: Clock,
    accent: "text-cyan-300",
    panel: "border-cyan-400/18 bg-cyan-400/10",
    title: "Used",
  },
  Cancelled: {
    icon: XCircle,
    accent: "text-rose-300",
    panel: "border-rose-400/18 bg-rose-400/10",
    title: "Cancelled",
  },
  Suspended: {
    icon: ShieldAlert,
    accent: "text-amber-200",
    panel: "border-amber-300/18 bg-amber-300/10",
    title: "Suspended",
  },
};

export default function TicketDetailPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("TicketDetail");
  const locale = useLocale();
  const isVietnamese = locale.startsWith("vi");

  const [ticket, setTicket] = useState<TicketWithMatch | null>(null);
  const [bookingTickets, setBookingTickets] = useState<BookingMate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      const historyPath = `/${locale}/history`;
      router.push(`/${locale}/login?redirect=${encodeURIComponent(historyPath)}`);
    }
  }, [authLoading, isLoggedIn, locale, router]);

  useEffect(() => {
    if (!ticketId || !isLoggedIn || !user) return;

    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, matches(*, tournaments(name))")
        .eq("id", ticketId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Failed to fetch ticket:", error);
        router.push(`/${locale}/history`);
        return;
      }

      const currentTicket = data as unknown as TicketWithMatch;
      setTicket(currentTicket);

      const bookingGroupId = currentTicket.booking_group_id ?? currentTicket.id;
      const { data: bookingData, error: bookingError } = await supabase
        .from("tickets")
        .select("id, seat, status, price_paid, booking_group_id, created_at")
        .eq("user_id", user.id)
        .or(`booking_group_id.eq.${bookingGroupId},id.eq.${bookingGroupId}`)
        .order("created_at", { ascending: true });

      if (bookingError) {
        console.warn("Failed to fetch booking group:", bookingError.message);
        setBookingTickets([
          {
            id: currentTicket.id,
            seat: currentTicket.seat,
            status: currentTicket.status,
            price_paid: currentTicket.price_paid,
            booking_group_id: currentTicket.booking_group_id,
            created_at: currentTicket.created_at,
          },
        ]);
      } else {
        setBookingTickets((bookingData ?? []) as BookingMate[]);
      }

      setIsLoading(false);
    };

    void fetchTicket();
  }, [ticketId, isLoggedIn, supabase, router, locale, user]);

  const handleCancelTicket = async () => {
    if (!ticket || !user) return;
    setIsCancelling(true);

    const { error } = await supabase
      .from("tickets")
      .update({ status: "Cancelled" })
      .eq("id", ticket.id)
      .eq("user_id", user.id);

    if (error) {
      alert(t("cancel_error") + error.message);
      setIsCancelling(false);
      return;
    }

    const { data: inventoryUpdated, error: inventoryError } = await supabase.rpc("increment_available_seats", {
      match_uuid: ticket.match_id,
    });

    if (inventoryError || inventoryUpdated === false) {
      await supabase.from("tickets").update({ status: "Valid" }).eq("id", ticket.id).eq("user_id", user.id);
      alert(t("cancel_error") + (inventoryError?.message ?? "Unable to restore seat inventory."));
    } else {
      setTicket({ ...ticket, status: "Cancelled" });
      setBookingTickets((currentTickets) =>
        currentTickets.map((currentTicket) =>
          currentTicket.id === ticket.id ? { ...currentTicket, status: "Cancelled" } : currentTicket,
        ),
      );
      setShowCancelConfirm(false);
    }

    setIsCancelling(false);
  };

  const handleCopyHash = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ai_validation_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (!isLoggedIn && !authLoading) return null;

  if (isLoading) {
    return (
      <main className="page-premium">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-12 w-44 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-52 animate-pulse rounded-[34px] border border-white/10 bg-white/5" />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
              <div className="h-[520px] animate-pulse rounded-[30px] border border-white/10 bg-white/5" />
              <div className="h-[520px] animate-pulse rounded-[30px] border border-white/10 bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!ticket) return null;

  const status = statusConfig[ticket.status] || statusConfig.Valid;
  const StatusIcon = status.icon;
  const matchTitle = ticket.matches
    ? `${ticket.matches.home_team} vs ${ticket.matches.away_team}`
    : t("unknown_match");
  const purchaseDate = new Date(ticket.created_at);
  const matchDate = ticket.matches ? new Date(ticket.matches.date) : null;
  const bookingGroupId = ticket.booking_group_id ?? ticket.id;
  const groupSeats = bookingTickets.map((bookingTicket) => bookingTicket.seat).join(", ");
  const bookingTotal = bookingTickets.reduce((sum, bookingTicket) => sum + bookingTicket.price_paid, 0);
  const bookingStatus = bookingTickets.every((bookingTicket) => bookingTicket.status === "Cancelled") ? "Cancelled" : "Active";
  const matchDay = matchDate
    ? new Intl.DateTimeFormat(isVietnamese ? "vi-VN" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(matchDate)
    : "--";
  const kickoffTime = matchDate
    ? new Intl.DateTimeFormat(isVietnamese ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(matchDate)
    : "--";

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/history" className="theme-link-accent inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </motion.div>

        <section className="mt-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-400/18 bg-emerald-400/12 text-emerald-300">
            <StatusIcon className="h-12 w-12" />
          </div>
          <h1 className="mt-8 text-5xl font-heading font-black uppercase tracking-[-0.05em] text-emerald-300 sm:text-6xl lg:text-7xl">
            {ticket.status === "Valid"
              ? "Ticket ready"
              : ticket.status === "Cancelled"
                ? "Ticket cancelled"
                : "Ticket updated"}
          </h1>
          <p className="mt-5 text-sm uppercase tracking-[0.28em] text-slate-400">
            Ticket #{ticket.id.slice(0, 8).toUpperCase()} in group #{bookingGroupId.slice(0, 8).toUpperCase()}
          </p>
          <div className="mx-auto mt-4 h-1 w-28 rounded-full bg-emerald-400" />
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <MatchdayPanel className="overflow-hidden border-emerald-400/14 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.88)]">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.28em] text-emerald-300">
                    Verified ticket
                  </div>
                  <h2 className="mt-4 max-w-xl text-4xl font-heading font-black uppercase leading-[1.02] tracking-[-0.04em] text-white">
                    {matchTitle}
                  </h2>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <MatchdayDetailBlock label={t("match_date")} value={matchDay} />
                    <MatchdayDetailBlock label="Kickoff" value={kickoffTime} />
                    <MatchdayDetailBlock label={t("stadium")} value={ticket.matches?.stadium || "Venue updating"} />
                    <MatchdayDetailBlock label={t("seat")} value={ticket.seat} />
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-5">
                    <div className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-slate-300">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      AI validation hash linked to this seat
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-5 text-center">
                  <div className="rounded-[24px] bg-white p-4 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.22)]">
                    <QRCodeSVG data={ticket.ai_validation_hash} />
                  </div>
                  <div className="mt-4 font-mono text-sm text-slate-400">#{ticket.id.slice(0, 8).toUpperCase()}-VALID</div>
                </div>
              </div>
            </MatchdayPanel>

            <div className="grid gap-5 md:grid-cols-2">
              <InfoPanel
                title="Booking group"
                description={`This ticket belongs to group ${bookingGroupId.slice(0, 8).toUpperCase()} with ${bookingTickets.length} seat(s): ${groupSeats}.`}
              />
              <InfoPanel
                title="Shared booking total"
                description={`The full booking is currently ${bookingStatus} with a combined value of ${bookingTotal.toLocaleString(locale)} VND.`}
              />
            </div>
          </motion.div>

          <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-5">
            <MatchdayPanel className="border-emerald-400/14 bg-[linear-gradient(180deg,rgba(20,83,45,0.22),rgba(30,41,59,0.82)_26%,rgba(15,23,42,0.9)_100%)] p-6 shadow-[0_28px_72px_-46px_rgba(0,0,0,0.42)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1 rounded-full bg-emerald-400" />
                <h3 className="text-2xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                  Order summary
                </h3>
              </div>

              <div className="mt-8 space-y-5 text-slate-300">
                <MatchdaySummaryRow
                  label="Current seat"
                  value={ticket.seat}
                />
                <MatchdaySummaryRow
                  label="Booking group"
                  value={bookingGroupId.slice(0, 8).toUpperCase()}
                />
                <MatchdaySummaryRow
                  label="Seats in group"
                  value={groupSeats}
                />
                <MatchdaySummaryRow
                  label={t("price_paid")}
                  value={`${ticket.price_paid.toLocaleString(locale)} VND`}
                />
                <MatchdaySummaryRow
                  label="Booking total"
                  value={`${bookingTotal.toLocaleString(locale)} VND`}
                />
                <MatchdaySummaryRow
                  label="Booked at"
                  value={purchaseDate.toLocaleString(locale)}
                />
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-xl font-heading font-black uppercase text-white">
                    This ticket
                  </span>
                  <span className="text-4xl font-heading font-black tracking-[-0.04em] text-emerald-300">
                    {ticket.price_paid.toLocaleString(locale)}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[18px] bg-emerald-400 px-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
                >
                  <Download className="h-4 w-4" />
                  Print or save
                </button>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="page-button-secondary inline-flex h-14 w-full items-center justify-center gap-3 rounded-[18px] px-5 text-sm font-semibold uppercase tracking-[0.2em]"
                >
                  <Copy className="h-4 w-4" />
                  {copiedHash ? "Copied hash" : "Copy AI hash"}
                </button>
              </div>

              <MatchdayInfoField label="Ticket status" className="mt-5">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] ${status.panel} ${status.accent}`}>
                  <StatusIcon className="h-4 w-4" />
                  {isVietnamese ? t(`status_${ticket.status.toLowerCase()}`) : status.title}
                </div>
              </MatchdayInfoField>

              {ticket.status === "Valid" ? (
                <div className="mt-5">
                  {!showCancelConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300 transition-colors hover:text-rose-200"
                    >
                      Cancel this ticket
                    </button>
                  ) : (
                    <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 p-4">
                      <p className="text-sm leading-6 text-slate-300">{t("cancel_confirm")}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <NeonButton
                          onClick={handleCancelTicket}
                          disabled={isCancelling}
                          className="rounded-[16px] !bg-rose-500 px-4 text-xs uppercase tracking-[0.18em] text-white hover:!bg-rose-400"
                        >
                          {isCancelling ? t("cancelling") : "Confirm cancel"}
                        </NeonButton>
                        <button type="button" onClick={() => setShowCancelConfirm(false)} className="text-sm font-medium text-slate-400">
                          Keep ticket
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </MatchdayPanel>

            <MatchdayPanel className="p-5 shadow-[0_20px_54px_-40px_rgba(0,0,0,0.8)]">
              <div className="text-xl font-heading font-black uppercase tracking-[-0.02em] text-white">
                Other seats in booking
              </div>
              <div className="mt-4 space-y-3">
                {bookingTickets.map((bookingTicket) => (
                  <Link
                    key={bookingTicket.id}
                    href={`/history/${bookingTicket.id}` as never}
                    className={`block rounded-[18px] border px-4 py-3 text-sm transition-colors ${
                      bookingTicket.id === ticket.id
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        {bookingTicket.seat}
                      </span>
                      <span className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        {bookingTicket.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </MatchdayPanel>

            <Link href="/matches" className="theme-link-accent inline-flex items-center gap-3 text-lg font-semibold uppercase tracking-[0.18em]">
              <ArrowLeft className="h-5 w-5" />
              Back to matches
            </Link>
          </motion.aside>
        </section>
      </div>
    </main>
  );
}

function InfoPanel({ description, title }: { description: string; title: string }) {
  return (
    <MatchdayPanel className="p-5 shadow-[0_20px_54px_-40px_rgba(0,0,0,0.8)]">
      <div className="text-xl font-heading font-black uppercase tracking-[-0.02em] text-white">{title}</div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </MatchdayPanel>
  );
}
