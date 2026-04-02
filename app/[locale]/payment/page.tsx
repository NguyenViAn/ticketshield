"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  CreditCard,
  Lock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/providers/auth-provider";
import { NeonButton } from "@/components/ui/neon-button";
import {
  MatchdayPanel,
  MatchdayPanelHeader,
  MatchdaySummaryBlock,
} from "@/components/ui/matchday";
import { logBookingEvent } from "@/lib/services/booking-events";
import { createClient } from "@/utils/supabase/client";
import {
  areConcreteSeatIds,
  areSeatIdsUnique,
  getSeatSelectionSummary,
  getSeatsTotalPrice,
  MAX_BOOKING_SEATS,
  normalizeSeatIds,
} from "@/utils/tickets";

type CheckoutRpcResult = {
  bookingGroupId?: string;
  ticketIds?: string[];
  totalPrice?: number;
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageFallback />}>
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const t = useTranslations("PaymentPage");
  const locale = useLocale();
  const matchId = searchParams.get("matchId");
  const seatIds = useMemo(() => normalizeSeatIds(searchParams.getAll("seatId")), [searchParams]);
  const hasValidSeatSelection = Boolean(
    matchId &&
      seatIds.length >= 1 &&
      seatIds.length <= MAX_BOOKING_SEATS &&
      areSeatIdsUnique(seatIds) &&
      areConcreteSeatIds(seatIds),
  );

  const [securePrice, setSecurePrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [anomalyTriggered, setAnomalyTriggered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [issuedTicketIds, setIssuedTicketIds] = useState<string[]>([]);
  const [issuedBookingGroupId, setIssuedBookingGroupId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardholder, setCardholder] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      router.push(loginUrl);
    }
  }, [authLoading, isLoggedIn, locale, router]);

  useEffect(() => {
    const fetchBasePrice = async () => {
      if (!matchId || !hasValidSeatSelection) {
        setPriceLoading(false);
        return;
      }

      const { data, error } = await supabase.from("matches").select("base_price").eq("id", matchId).single();
      if (data && !error) {
        setSecurePrice(getSeatsTotalPrice(data.base_price, seatIds));
      }
      setPriceLoading(false);
    };

    void fetchBasePrice();
  }, [hasValidSeatSelection, matchId, seatIds, supabase]);

  const stepMeta = [
    {
      id: 1,
      title: "Review seats",
      detail: "Validate the 1-4 seat selection before checkout.",
    },
    {
      id: 2,
      title: "Payment details",
      detail: "Use the demo payment form to trigger secure checkout.",
    },
    {
      id: 3,
      title: "Booking issued",
      detail: "Store every seat as one ticket under a booking group.",
    },
  ];

  const trustPoints = [
    "Maximum 4 active seats per user per match.",
    "Checkout is validated atomically in the database.",
    "Risk score uses interaction events, not synthetic hashes.",
  ];

  const handleNextStep = () => {
    if (!hasValidSeatSelection) return;

    if (step === 2) {
      if (!cardNumber.trim() || !expDate.trim() || !cvc.trim() || !cardholder.trim()) {
        return;
      }
      setAnomalyTriggered(true);
      return;
    }

    setStep((currentStep) => currentStep + 1);
  };

  const verifyHuman = async () => {
    if (!user || !matchId || !hasValidSeatSelection) {
      alert(t("error_auth"));
      return;
    }

    setIsProcessing(true);
    const nextRetryCount = retryCount + 1;
    setRetryCount(nextRetryCount);

    await logBookingEvent(supabase, {
      eventType: "checkout_attempt",
      matchId,
      metadata: {
        retryCount: nextRetryCount,
        seatIds,
        selectedCount: seatIds.length,
      },
      seatCount: seatIds.length,
    });

    try {
      const { data, error } = await supabase.rpc("checkout_booking", {
        match_uuid: matchId,
        seat_ids: seatIds,
      });

      if (error) {
        throw error;
      }

      const checkoutResult = (data ?? {}) as CheckoutRpcResult;
      const nextTicketIds = Array.isArray(checkoutResult.ticketIds)
        ? checkoutResult.ticketIds.map((ticketId) => String(ticketId))
        : [];

      setIssuedTicketIds(nextTicketIds);
      setIssuedBookingGroupId(checkoutResult.bookingGroupId ?? null);
      setSecurePrice(checkoutResult.totalPrice ?? securePrice);
      setAnomalyTriggered(false);
      setStep(3);

      await logBookingEvent(supabase, {
        eventType: "checkout_success",
        matchId,
        metadata: {
          retryCount: nextRetryCount,
          seatIds,
          selectedCount: seatIds.length,
        },
        seatCount: seatIds.length,
      });
    } catch (err: unknown) {
      console.error("Purchase error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to complete the transaction.";

      await logBookingEvent(supabase, {
        eventType: "checkout_failed",
        matchId,
        metadata: {
          retryCount: nextRetryCount,
          seatIds,
          selectedCount: seatIds.length,
        },
        seatCount: seatIds.length,
      });

      alert(t("error_transaction") + errorMessage);
      setAnomalyTriggered(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoggedIn && !authLoading) {
    return null;
  }

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="page-shell">
          <div className="border-b border-white/8 px-6 py-7 sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Multi-seat secure checkout
            </div>
            <h1 className="mt-5 text-4xl font-heading font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{t("subtitle")}</p>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_340px]">
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                {stepMeta.map((item) => {
                  const isActive = step === item.id;
                  const isComplete = step > item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-[24px] border p-4 transition-all ${
                        isActive
                          ? "border-emerald-400/24 bg-emerald-400/10"
                          : isComplete
                            ? "border-white/10 bg-white/5"
                            : "border-white/10 bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                            isActive || isComplete ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-400"
                          }`}
                        >
                          {item.id}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-xs text-slate-400">{item.detail}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <MatchdayPanel className="shadow-[0_20px_54px_-40px_rgba(15,23,42,0.16)]">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MatchdayPanelHeader
                        title="Confirm booking"
                        icon={<Ticket className="h-5 w-5 text-emerald-300" />}
                        className="mb-5"
                        titleClassName="text-lg"
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <MatchdaySummaryBlock label={t("session_id")} value={matchId || "TICKETSHIELD DEMO"} mono />
                        <MatchdaySummaryBlock
                          label="Selected seats"
                          value={hasValidSeatSelection ? getSeatSelectionSummary(seatIds) : t("not_selected")}
                          emphasis={hasValidSeatSelection}
                        />
                      </div>

                      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          Seat count
                        </div>
                        <div className="mt-3 text-3xl font-heading font-black text-white">
                          {hasValidSeatSelection ? `${seatIds.length}/${MAX_BOOKING_SEATS}` : "--"}
                        </div>
                      </div>

                      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
                        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                          {t("total_amount")}
                        </div>
                        <div className="mt-3 text-3xl font-heading font-black text-white">
                          {priceLoading ? (
                            <span className="text-sm font-medium text-slate-400">{t("calculating")}</span>
                          ) : !hasValidSeatSelection ? (
                            <span className="text-sm font-semibold text-rose-300">
                              Invalid seat selection
                            </span>
                          ) : (
                            `${securePrice.toLocaleString(locale)} VND`
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <NeonButton onClick={handleNextStep} disabled={priceLoading || !hasValidSeatSelection} className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                          Continue
                        </NeonButton>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 2 ? (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MatchdayPanelHeader
                        title={t("step_payment")}
                        icon={<CreditCard className="h-5 w-5 text-emerald-300" />}
                        className="mb-5"
                        titleClassName="text-lg"
                      />

                      <div className="mb-5 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        Booking includes {seatIds.length} seat{seatIds.length > 1 ? "s" : ""}: {getSeatSelectionSummary(seatIds)}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field className="md:col-span-2" placeholder={t("card_number")} value={cardNumber} onChange={setCardNumber} />
                        <Field placeholder={t("exp_date")} value={expDate} onChange={setExpDate} />
                        <Field placeholder={t("cvc")} value={cvc} onChange={setCvc} type="password" />
                        <Field className="md:col-span-2" placeholder={t("cardholder")} value={cardholder} onChange={setCardholder} />
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <button className="text-sm font-medium text-slate-400 transition-colors hover:text-white" onClick={() => setStep(1)}>
                          {t("btn_back")}
                        </button>
                        <NeonButton onClick={handleNextStep} disabled={!hasValidSeatSelection} className="rounded-[18px] px-5 text-xs uppercase tracking-[0.18em]">
                          {t("btn_pay")}
                        </NeonButton>
                      </div>
                    </motion.div>
                  ) : null}

                  {step === 3 ? (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-4"
                    >
                      <div className="text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-400/18 bg-emerald-400/12">
                          <CheckCircle className="h-12 w-12 text-emerald-300" />
                        </div>
                        <h2 className="mt-6 text-5xl font-heading font-black uppercase tracking-[-0.05em] text-emerald-300">
                          Booking confirmed
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                          {t("success_desc")}
                        </p>
                        <div className="mt-5 text-sm uppercase tracking-[0.24em] text-slate-400">
                          Booking group: #{issuedBookingGroupId?.slice(0, 8).toUpperCase() || "TS-DEMO"}
                        </div>
                      </div>

                      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="theme-inset-accent rounded-[28px] p-5">
                          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                            Issued tickets
                          </div>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <MatchdaySummaryBlock label="Seat list" value={getSeatSelectionSummary(seatIds)} emphasis />
                            <MatchdaySummaryBlock label="Ticket count" value={String(issuedTicketIds.length || seatIds.length)} emphasis />
                            <MatchdaySummaryBlock label={t("total_amount")} value={`${securePrice.toLocaleString(locale)} VND`} emphasis />
                            <MatchdaySummaryBlock label="Booking group" value={issuedBookingGroupId?.slice(0, 8).toUpperCase() || "TS-DEMO"} emphasis />
                          </div>
                        </div>

                        <div className="self-start space-y-3">
                          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                            <Link href={issuedTicketIds[0] ? (`/history/${issuedTicketIds[0]}` as never) : "/history"}>
                              <NeonButton className="h-12 w-full rounded-[18px] text-xs uppercase tracking-[0.18em]">
                                Open one issued ticket
                              </NeonButton>
                            </Link>
                          </div>

                          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                            <Link href="/history">
                              <NeonButton variant="outline" className="h-12 w-full rounded-[18px] text-xs uppercase tracking-[0.18em]">
                                {t("btn_view_wallet")}
                              </NeonButton>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </MatchdayPanel>
            </div>

            <aside className="space-y-5">
              <MatchdayPanel padding="p-5">
                <MatchdayPanelHeader title="Transaction summary" icon={<Lock className="h-5 w-5 text-emerald-300" />} className="mb-4" titleClassName="text-xl" />
                <MatchdaySummaryBlock label="Seat list" value={hasValidSeatSelection ? getSeatSelectionSummary(seatIds) : t("not_selected")} />
                <div className="mt-4">
                  <MatchdaySummaryBlock
                    label="Seat count"
                    value={hasValidSeatSelection ? `${seatIds.length}/${MAX_BOOKING_SEATS}` : "--"}
                    emphasis={!priceLoading && hasValidSeatSelection}
                  />
                </div>
                <div className="mt-4">
                  <MatchdaySummaryBlock
                    label={t("total_amount")}
                    value={priceLoading ? t("calculating") : `${securePrice.toLocaleString(locale)} VND`}
                    emphasis={!priceLoading && hasValidSeatSelection}
                  />
                </div>
              </MatchdayPanel>

              <MatchdayPanel padding="p-5">
                <MatchdayPanelHeader title="Assurance" icon={<ShieldCheck className="h-5 w-5 text-cyan-300" />} className="mb-4" titleClassName="text-xl" />
                <div className="space-y-3">
                  {trustPoints.map((point) => (
                    <div key={point} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
                      {point}
                    </div>
                  ))}
                </div>
              </MatchdayPanel>
            </aside>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {anomalyTriggered ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="theme-overlay-soft fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-[30px] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(51,33,42,0.96),rgba(30,18,27,0.96))] p-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.66)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-black text-white">{t("anomaly_title")}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{t("anomaly_desc")}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[20px] border border-rose-400/14 bg-rose-400/10 px-4 py-4 text-sm leading-6 text-slate-200">
                <p>{t("anomaly_notice")}</p>
                <p className="mt-2 font-semibold text-rose-200">{t("anomaly_action")}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={verifyHuman}
                  disabled={isProcessing}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-rose-500 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-rose-400 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>{t("btn_verifying")}</span>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      {t("btn_verify")}
                    </>
                  )}
                </button>
                <button onClick={() => setAnomalyTriggered(false)} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
                  {t("btn_cancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function Field({
  className = "",
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`page-input-surface h-14 w-full px-4 text-sm outline-none transition-all focus:border-emerald-400/24 focus:ring-4 focus:ring-emerald-500/10 ${className}`}
    />
  );
}

function PaymentPageFallback() {
  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <section className="page-shell px-6 py-10 sm:px-8">
          <div className="h-8 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-14 w-full max-w-lg animate-pulse rounded-[24px] bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/10" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_340px]">
            <div className="h-[420px] animate-pulse rounded-[30px] border border-white/10 bg-white/5" />
            <div className="space-y-5">
              <div className="h-40 animate-pulse rounded-[30px] border border-white/10 bg-white/5" />
              <div className="h-56 animate-pulse rounded-[30px] border border-white/10 bg-white/5" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
