"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { NeonButton } from "@/components/ui/neon-button";
import { NeonInput } from "@/components/ui/neon-input";
import { ShieldAlert, CreditCard, ScanLine, CheckCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import { getSeatPrice, getTierFromSeatId, isConcreteSeatId } from "@/utils/tickets";

function PaymentContent() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createClient(), []);
    const t = useTranslations("PaymentPage");
    const locale = useLocale();

    // Capture pending ticket info from URL params
    const matchId = searchParams.get('matchId');
    const seatId = searchParams.get('seatId');
    const hasValidSeatSelection = Boolean(matchId && isConcreteSeatId(seatId));
    const isVietnamese = locale.startsWith("vi");

    // Secure Price State
    const [securePrice, setSecurePrice] = useState<number>(0);
    const [priceLoading, setPriceLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            const loginUrl = `/${locale}/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            router.push(loginUrl);
        }
    }, [isLoggedIn, authLoading, router, locale]);

    useEffect(() => {
        const fetchBasePrice = async () => {
            if (!matchId || !isConcreteSeatId(seatId)) {
                setPriceLoading(false);
                return;
            }

            const { data, error } = await supabase.from('matches').select('base_price').eq('id', matchId).single();
            if (data && !error) {
                setSecurePrice(getSeatPrice(data.base_price, seatId) ?? 0);
            }
            setPriceLoading(false);
        };
        fetchBasePrice();
    }, [matchId, seatId, supabase]);

    const [step, setStep] = useState(1);
    const [anomalyTriggered, setAnomalyTriggered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [expDate, setExpDate] = useState('');
    const [cvc, setCvc] = useState('');
    const [cardholder, setCardholder] = useState('');

    const handleNextStep = () => {
        if (!hasValidSeatSelection) {
            return;
        }

        if (step === 2) {
            // Basic validation for card fields
            if (!cardNumber.trim() || !expDate.trim() || !cvc.trim() || !cardholder.trim()) {
                return; // Don't proceed if fields are empty
            }
            setAnomalyTriggered(true);
        } else {
            setStep(step + 1);
        }
    };

    const verifyHuman = async () => {
        if (!user || !matchId || !seatId || !isConcreteSeatId(seatId)) {
            alert(t("error_auth"));
            return;
        }

        setIsProcessing(true);

        try {
            const { data: match, error: matchError } = await supabase
                .from("matches")
                .select("id, base_price, available_seats")
                .eq("id", matchId)
                .single();

            if (matchError || !match) {
                throw new Error(isVietnamese ? "Không tìm thấy trận đấu hợp lệ." : "Unable to validate the selected match.");
            }

            if (match.available_seats <= 0) {
                throw new Error(isVietnamese ? "Trận đấu này đã hết vé." : "This match is sold out.");
            }

            const ticketPrice = getSeatPrice(match.base_price, seatId);
            const selectedTier = getTierFromSeatId(seatId);

            if (!ticketPrice || !selectedTier) {
                throw new Error(isVietnamese ? "Ghế đã chọn không hợp lệ." : "The selected seat is invalid.");
            }

            const { data: existingTicket, error: existingTicketError } = await supabase
                .from("tickets")
                .select("id")
                .eq("match_id", match.id)
                .eq("seat", seatId)
                .in("status", ["Valid", "Used"])
                .maybeSingle();

            if (existingTicketError) {
                throw existingTicketError;
            }

            if (existingTicket) {
                throw new Error(
                    isVietnamese
                        ? `Ghế ${seatId} vừa được người khác đặt trước. Vui lòng chọn ghế khác.`
                        : `Seat ${seatId} has just been taken. Please choose another seat.`
                );
            }

            setSecurePrice(ticketPrice);

            // Write to database
            const { data, error } = await supabase.from('tickets').insert([
                {
                    user_id: user.id,
                    match_id: match.id,
                    seat: seatId,
                    price_paid: ticketPrice,
                    status: 'Valid',
                    ai_validation_hash: `TS-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`
                }
            ]).select();

            if (error) throw error;

            // Decrement available_seats on the match
            const insertedTicket = data?.[0];
            const { data: inventoryUpdated, error: inventoryError } = await supabase.rpc('decrement_available_seats', { match_uuid: match.id });

            if (inventoryError || inventoryUpdated === false) {
                if (insertedTicket?.id) {
                    await supabase
                        .from("tickets")
                        .delete()
                        .eq("id", insertedTicket.id)
                        .eq("user_id", user.id);
                }

                throw inventoryError ?? new Error(
                    isVietnamese
                        ? "Không thể cập nhật tồn kho ghế. Giao dịch đã được hoàn tác."
                        : "Unable to update seat inventory. The transaction has been rolled back."
                );
            }

            setAnomalyTriggered(false);
            setStep(3); // Proceed to success
        } catch (err: unknown) {
            console.error("Purchase error:", err);
            const errorMessage = err instanceof Error ? err.message : isVietnamese ? "Không thể hoàn tất giao dịch." : "Unable to complete the transaction.";
            alert(t("error_transaction") + errorMessage);
            setAnomalyTriggered(false);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isLoggedIn && !authLoading) return null;

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-emerald-500 rounded-full" />
                    <h1 className="text-3xl font-heading font-black text-slate-900 uppercase tracking-wide">{t("title")}</h1>
                </div>
                <p className="text-slate-500 font-sans ml-[19px]">{t("subtitle")}</p>
            </div>

            <div className="flex justify-center gap-3 mb-12">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-bold text-sm border transition-all duration-300 ${step >= s
                            ? 'border-brand-green text-brand-green bg-brand-green/10 shadow-sm shadow-brand-green/10'
                            : 'border-slate-200 text-slate-400 bg-slate-50'
                            }`}>
                            {s}
                        </div>
                        {s < 3 && <div className={`w-10 h-0.5 rounded-full transition-colors duration-300 ${step > s ? 'bg-brand-green' : 'bg-slate-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 className="text-xl font-heading border-b border-slate-200 pb-2 font-bold mb-6 text-slate-800">{t("step_confirm")}</h2>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-500 font-medium">{t("session_id")}</span>
                                    <span className="font-mono font-bold text-slate-700 text-right truncate max-w-[200px]">{matchId || 'TICKETSHIELD DEMO'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-500 font-medium">{t("seat_position")}</span>
                                    <span className="text-brand-green font-bold text-lg">{hasValidSeatSelection ? seatId : t("not_selected")}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                                    <span className="text-slate-800 font-bold">{t("total_amount")}</span>
                                    <span className="text-2xl font-black font-heading text-brand-blue">
                                        {priceLoading ? (
                                            <span className="text-sm text-slate-400 font-normal">{t("calculating")}</span>
                                        ) : !hasValidSeatSelection ? (
                                            <span className="text-sm text-brand-red font-semibold">
                                                {isVietnamese ? "Vui lòng chọn ghế hợp lệ từ sơ đồ ghế." : "Please select a valid seat from the seat map."}
                                            </span>
                                        ) : (
                                            `${securePrice.toLocaleString(locale)} VND`
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <NeonButton onClick={handleNextStep} disabled={priceLoading || !hasValidSeatSelection}>{t("btn_next")}</NeonButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2 text-slate-800">
                                <CreditCard className="w-5 h-5 text-brand-green" /> {t("step_payment")}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="col-span-1 md:col-span-2">
                                    <NeonInput placeholder={t("card_number")} value={cardNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)} />
                                </div>
                                <div><NeonInput placeholder={t("exp_date")} value={expDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpDate(e.target.value)} /></div>
                                <div><NeonInput placeholder={t("cvc")} type="password" value={cvc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCvc(e.target.value)} /></div>
                                <div className="col-span-1 md:col-span-2">
                                    <NeonInput placeholder={t("cardholder")} value={cardholder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardholder(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <button className="text-slate-500 hover:text-slate-800 font-medium" onClick={() => setStep(1)}>{t("btn_back")}</button>
                                <NeonButton onClick={handleNextStep} disabled={!hasValidSeatSelection}>{t("btn_pay")}</NeonButton>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-brand-green/15 to-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-green/20 shadow-sm shadow-brand-green/10">
                                <CheckCircle className="w-10 h-10 text-brand-green" />
                            </div>
                            <h2 className="text-3xl font-heading font-black text-slate-900 mb-2">{t("success_title")}</h2>
                            <p className="text-slate-500 mb-8 font-medium">{t("success_desc")}</p>
                            <Link href="/history">
                                <NeonButton variant="outline">{t("btn_view_wallet")}</NeonButton>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Security Verification Modal */}
            <AnimatePresence>
                {anomalyTriggered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8 }}
                            className="bg-white border-t-4 border-brand-red rounded-2xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                                    <ShieldAlert className="w-6 h-6 text-brand-red" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-black text-xl text-slate-900 uppercase">{t("anomaly_title")}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{t("anomaly_desc")}</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 text-sm text-slate-700">
                                <p className="mb-2">{t("anomaly_notice")}</p>
                                <p className="font-bold text-brand-red">{t("anomaly_action")}</p>
                            </div>

                            <div className="flex flex-col gap-3 mt-8">
                                <button
                                    onClick={verifyHuman}
                                    disabled={isProcessing}
                                    className="w-full h-12 rounded-lg bg-brand-red text-white font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-50 hover:bg-red-600 shadow-md shadow-red-500/20"
                                >
                                    {isProcessing ? (
                                        <span className="animate-pulse">{t("btn_verifying")}</span>
                                    ) : (
                                        <>
                                            <ScanLine className="w-5 h-5" />
                                            {t("btn_verify")}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setAnomalyTriggered(false)}
                                    className="text-slate-500 hover:text-slate-800 text-sm font-medium py-2"
                                >
                                    {t("btn_cancel")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center pt-24 pb-16">
                <div className="text-brand-green animate-pulse font-heading tracking-widest text-lg font-bold">
                    INITIALIZING PAYMENT...
                </div>
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}
