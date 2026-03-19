"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
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
      transition={{ duration: 0.45, delay, type: "spring" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href="/matches">
        <div className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.5)] transition-all hover:border-white/20 hover:shadow-[0_22px_52px_-30px_rgba(0,0,0,0.6)]     ">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl opacity-40 transition-opacity group-hover:opacity-60    " />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_44%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 " />

          <div className="relative z-10 mb-4 flex items-start justify-between">
            <div className="rounded-2xl bg-emerald-500/10 p-3 transition-colors group-hover:bg-emerald-500/20  ">
              <Tag className="h-6 w-6 text-emerald-400 " />
            </div>
            <div className={cn("rounded-[12px] bg-gradient-to-r px-3 py-1.5 text-sm font-heading font-black uppercase tracking-[0.14em] text-slate-950 shadow-md", badgeClassName)}>
              {discount}
            </div>
          </div>

          <div className="relative z-10 flex-grow">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300   ">
              <Sparkles className="h-3.5 w-3.5" />
              TicketShield Offer
            </div>
            <h3 className="mb-2 text-xl font-heading font-black text-white transition-colors group-hover:text-emerald-400  ">
              {title}
            </h3>
            <p className="line-clamp-3 text-sm leading-6 text-slate-400 ">{description}</p>
          </div>

          <div className="relative z-10 mt-6 border-t border-white/10 pt-4 ">
            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-400 ">
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
    return "from-emerald-300 to-cyan-300";
  }

  if (gradientCode.includes("orange")) {
    return "from-amber-300 to-rose-300";
  }

  return "from-emerald-300 to-lime-300";
}
