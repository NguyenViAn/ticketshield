"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PromoCardProps {
    title: string;
    description: string;
    discount: string;
    gradientCode: string;
    delay?: number;
}

export function PromoCard({ title, description, discount, gradientCode, delay = 0 }: PromoCardProps) {
    const t = useTranslations("Promotions");
    const badgeClassName = getPromoGradientClass(gradientCode);

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay, type: "spring" }}
            whileHover={{ y: -4, scale: 1.015 }}
            className="h-full"
        >
            <Link href="/matches">
                <div className="sports-gradient-border group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,253,250,0.96))] p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)] transition-all hover:border-emerald-200 hover:shadow-[0_28px_70px_-42px_rgba(16,185,129,0.22)]">
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 blur-3xl opacity-20 transition-opacity group-hover:opacity-45" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.09),transparent_44%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative z-10 mb-4 flex items-start justify-between">
                        <div className="rounded-2xl bg-emerald-50 p-3 transition-colors group-hover:bg-emerald-100">
                            <Tag className="h-6 w-6 text-emerald-700" />
                        </div>
                        <div className={cn("rounded-full bg-gradient-to-r px-3 py-1.5 text-sm font-heading font-bold text-white shadow-md", badgeClassName)}>
                            {discount}
                        </div>
                    </div>

                    <div className="relative z-10 flex-grow">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            TicketShield Offer
                        </div>
                        <h3 className="mb-2 text-xl font-heading font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                            {title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-6 text-slate-500">{description}</p>
                    </div>

                    <div className="relative z-10 mt-6 border-t border-slate-100 pt-4">
                        <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                            {t("apply_now")}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

function getPromoGradientClass(gradientCode: string) {
    if (gradientCode.includes("cyan")) {
        return "from-emerald-500 to-cyan-600";
    }

    if (gradientCode.includes("orange")) {
        return "from-orange-500 to-rose-600";
    }

    return "from-sky-600 to-indigo-700";
}

