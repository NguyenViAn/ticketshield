"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";

interface MatchCardProps {
  id: string;
  home_team: string;
  away_team: string;
  home_logo: string;
  away_logo: string;
  date: string;
  stadium: string;
  stadium_image?: string;
  security_level: string;
}

const DEFAULT_STADIUM_IMAGE =
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80";

const DEFAULT_TEAM_BADGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/8e/Football_pictogram.svg";

export function MatchCard({
  id,
  home_team,
  away_team,
  home_logo,
  away_logo,
  date,
  stadium,
  stadium_image,
  security_level,
}: MatchCardProps) {
  const t = useTranslations("Matches");
  const locale = useLocale();

  const formattedDate = new Date(date).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const buttonLabel = locale === "vi" ? "MUA VÉ" : t("buy_ticket").toUpperCase();
  const heroImage = stadium_image || DEFAULT_STADIUM_IMAGE;
  const isUltra = security_level === "Ultra";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="h-full"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.42)] transition-all duration-300 hover:border-emerald-400 hover:shadow-lg">
        <div
          className="absolute inset-x-0 top-0 h-28 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.74))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_42%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div
          className={`h-1 w-full ${
            isUltra
              ? "bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400"
              : "bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
          }`}
        />

        <div className="relative flex h-full flex-col p-5 pt-4">
          <div className="mb-12 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                suppressHydrationWarning
                className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur"
              >
                {formattedDate}
              </span>
            </div>
            <div
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur ${
                isUltra
                  ? "border-emerald-200/50 bg-emerald-100/85 text-emerald-800"
                  : "border-cyan-200/60 bg-cyan-100/85 text-cyan-800"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" />
                AI {security_level}
              </span>
            </div>
          </div>

          <div className="my-2 flex flex-grow flex-col items-center justify-center py-2">
            <div className="flex w-full items-center justify-center gap-4">
              <TeamMark logo={home_logo} team={home_team} />
              <div className="flex w-1/5 flex-col items-center">
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-heading font-black tracking-[0.2em] text-red-600 shadow-[0_10px_25px_-18px_rgba(239,68,68,0.65)]">
                  VS
                </span>
              </div>
              <TeamMark logo={away_logo} team={away_team} />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="text-center text-xl font-black tracking-[-0.02em] text-slate-950">
              {home_team} vs {away_team}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <CalendarDays className="h-4 w-4 text-cyan-700" />
              <span suppressHydrationWarning>{formattedDate}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="truncate font-medium">{stadium}</span>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Link href={`/seats/${id}`} className="block w-full">
              <NeonButton className="group/button relative w-full overflow-hidden rounded-full border-0 bg-[linear-gradient(135deg,#22c55e_0%,#14b8a6_38%,#2563eb_100%)] font-bold tracking-[0.14em] text-white shadow-[0_18px_40px_-22px_rgba(37,99,235,0.45)] transition-all duration-300 hover:shadow-[0_22px_55px_-22px_rgba(34,197,94,0.48)]">
                <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 blur-md transition-all duration-500 group-hover/button:left-[115%] group-hover/button:opacity-100" />
                <span className="relative">{buttonLabel}</span>
              </NeonButton>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TeamMark({ logo, team }: { logo?: string; team: string }) {
  return (
    <div className="flex w-2/5 min-w-0 flex-col items-center text-center">
      <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] transition-transform duration-300 group-hover:scale-[1.03]">
        <Image
          src={logo || DEFAULT_TEAM_BADGE}
          alt={team}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          unoptimized={Boolean(!logo)}
        />
      </div>
      <span className="line-clamp-2 text-sm font-bold text-slate-900">{team}</span>
    </div>
  );
}
