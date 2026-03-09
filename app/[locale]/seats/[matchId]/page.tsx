import Image from "next/image";
import { SeatMapRadial } from "@/components/seats/seat-map-radial";
import { TicketTierList } from "@/components/seats/ticket-tier-list";
import { ArrowLeft, CalendarClock, Clock3, MapPin, ShieldCheck, Tag, Ticket } from "lucide-react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";

export default async function SeatsPage({ params }: { params: Promise<{ matchId: string }> | { matchId: string } }) {
    const supabase = await createClient();
    const t = await getTranslations("SeatsPage");
    const locale = await getLocale();

    // In Next.js 15+ (Turbopack), params is a promise
    const { matchId } = await Promise.resolve(params);

    // Fetch match data to populate pricing and details
    const { data: match, error } = await supabase
        .from('matches')
        .select('*, tournaments(name, logo_url)')
        .eq('id', matchId)
        .single();

    if (error || !match) {
        console.error("Failed to fetch match for seats page. ID:", matchId, "Error:", error);
        return notFound();
    }

    const isVietnamese = locale.startsWith("vi");
    const stepItems = isVietnamese
        ? ["1. Chọn khu vực", "2. Chọn ghế phù hợp", "3. Thanh toán an toàn"]
        : ["1. Choose a stand", "2. Pick your seat", "3. Secure checkout"];
    const supportPills = isVietnamese
        ? ["Vé điện tử xác thực", "Thanh toán bảo mật", "Nhận vé ngay sau khi thanh toán"]
        : ["Verified e-ticket", "Secure checkout", "Ticket delivered instantly"];
    const badgeLabel = isVietnamese ? "Mở bán chính thức" : "Official ticket release";
    const metaDate = new Date(match.date).toLocaleString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <main className="min-h-screen bg-slate-50 pb-16">
            <div className="relative overflow-hidden border-b border-brand-green/15 bg-slate-950 pt-24 pb-12 shadow-[0_30px_90px_rgba(2,6,23,0.4)]">
                <div className="absolute inset-0 bg-stadium bg-cover bg-center opacity-20 mix-blend-luminosity" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_34%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/88 to-slate-950/55" />

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <Link href="/matches" className="mb-7 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-200 transition-colors hover:border-brand-green/30 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t("back_to_events")}
                    </Link>

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
                        <div className="max-w-4xl">
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-green">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {badgeLabel}
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                                    <Ticket className="h-3.5 w-3.5 text-cyan-300" />
                                    {match.available_seats.toLocaleString(locale)} {isVietnamese ? "ghế đang mở bán" : "seats available"}
                                </div>
                            </div>

                            <div className="mb-5 flex items-center gap-3">
                                {match.tournaments?.logo_url && (
                                    <Image
                                        src={match.tournaments.logo_url}
                                        alt="League"
                                        width={36}
                                        height={36}
                                        className="h-9 w-9 object-contain drop-shadow"
                                        unoptimized
                                    />
                                )}
                                <span className="text-sm font-bold uppercase tracking-[0.24em] text-brand-green">
                                    {match.tournaments?.name || "V-LEAGUE"}
                                </span>
                            </div>

                            <h1 className="max-w-4xl text-4xl font-heading font-black uppercase leading-[0.96] tracking-tight text-white drop-shadow-lg md:text-6xl xl:text-7xl">
                                {match.home_team} <span className="text-slate-500">{t("vs")}</span> {match.away_team}
                            </h1>

                            <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                        <MapPin className="h-3.5 w-3.5 text-brand-red" />
                                        {isVietnamese ? "Sân vận động" : "Stadium"}
                                    </div>
                                    <div className="mt-2 font-semibold text-white">{match.stadium}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                        <Clock3 className="h-3.5 w-3.5 text-brand-blue" />
                                        {isVietnamese ? "Giờ thi đấu" : "Kick-off"}
                                    </div>
                                    <div className="mt-2 font-semibold text-white">{metaDate}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm sm:col-span-2 xl:col-span-1">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                        <CalendarClock className="h-3.5 w-3.5 text-emerald-300" />
                                        {isVietnamese ? "Quy trình" : "Booking flow"}
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-slate-100">
                                        {isVietnamese ? "Chọn khu vực, ghế và thanh toán trong một luồng liền mạch." : "Choose a stand, pick a seat and check out in one flow."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.45)] backdrop-blur-md">
                            <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">{t("price_from")}</div>
                            <div className="mt-3 flex items-end gap-2">
                                <span className="text-4xl font-heading font-black text-white md:text-5xl">
                                    {match.base_price.toLocaleString(locale)}
                                </span>
                                <span className="pb-1 text-lg font-bold text-brand-green">{t("currency")}</span>
                            </div>
                            <p className="mt-3 text-sm text-slate-300">
                                {isVietnamese
                                    ? "Giá hiển thị là mức vé thấp nhất. Chọn khu vực để xem ghế phù hợp và hoàn tất thanh toán an toàn."
                                    : "Displayed price is the lowest available tier. Choose a stand to review seats and continue securely."}
                            </p>
                            <div className="mt-5 space-y-2">
                                {stepItems.map((step) => (
                                    <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-green/25 bg-brand-green/12 text-xs font-bold text-brand-green">
                                            {step.split(".")[0]}
                                        </span>
                                        <span className="font-medium">{step}</span>
                                    </div>
                                ))}
                            </div>
                            <a
                                href="#booking-section"
                                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-green to-cyan-500 text-sm font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_40px_rgba(34,197,94,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(34,197,94,0.3)]"
                            >
                                <Tag className="h-5 w-5" /> {t("book_now")}
                            </a>
                            <div className="mt-5 flex flex-wrap gap-2">
                                {supportPills.map((item) => (
                                    <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="booking-section" className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                        <div className="h-6 w-1.5 rounded-full bg-brand-blue"></div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 uppercase tracking-wide">
                            {t("ticket_tier_title")}
                        </h2>
                    </div>
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_45px_rgba(15,23,42,0.06)] sm:p-6">
                        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                                {isVietnamese ? "Bắt đầu từ khu vực" : "Start with a stand"}
                            </div>
                            <p className="mt-2 max-w-xl text-sm text-slate-600">
                                {isVietnamese
                                    ? "Chọn khu vực phù hợp với ngân sách và tầm nhìn của bạn. Hệ thống sẽ đưa bạn tới ghế còn trống tốt nhất trong khu đã chọn."
                                    : "Choose the stand that matches your budget and preferred view. We will guide you to the best available seat in that stand."}
                            </p>
                        </div>
                        <TicketTierList matchId={match.id} basePrice={match.base_price} />
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                        <div className="h-6 w-1.5 rounded-full bg-brand-green"></div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 uppercase tracking-wide">
                            {t("seat_map_title")}
                        </h2>
                    </div>

                    <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_28px_60px_rgba(15,23,42,0.08)] sm:p-6 lg:p-7">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">{t("map_view")}</div>
                                <p className="mt-2 text-sm text-slate-600">
                                    {isVietnamese
                                        ? "Chọn ghế trực tiếp trên sơ đồ để xem giá và tiếp tục tới thanh toán."
                                        : "Choose directly on the map to review pricing and continue to checkout."}
                                </p>
                            </div>
                            <div className="rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-brand-green">
                                {isVietnamese ? "Cập nhật theo thời gian thực" : "Live seat states"}
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <SeatMapRadial matchId={match.id} basePrice={match.base_price} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
