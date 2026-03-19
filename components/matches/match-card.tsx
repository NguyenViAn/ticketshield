"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { NeonButton } from "@/components/ui/neon-button";
import { resolveTeamLogo } from "@/lib/logo-resolver";

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
  base_price?: number;
  available_seats?: number;
  total_seats?: number;
  tournament_name?: string;
}

const DEFAULT_STADIUM_IMAGE =
  "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80";

export function MatchCard({
  id,
  home_team,
  away_team,
  home_logo,
  away_logo,
  date,
  stadium,
  stadium_image,
  base_price,
  tournament_name,
}: MatchCardProps) {
  const locale = useLocale();
  const t = useTranslations("MatchCard");
  const isVietnamese = locale.startsWith("vi");

  const formattedDate = new Intl.DateTimeFormat(isVietnamese ? "vi-VN" : "en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

  const heroImage = stadium_image || DEFAULT_STADIUM_IMAGE;
  const resolvedHomeLogo = resolveTeamLogo(home_team, home_logo);
  const resolvedAwayLogo = resolveTeamLogo(away_team, away_logo);
  const buttonLabel =
    typeof base_price === "number"
      ? t("button_from", { price: base_price.toLocaleString(locale) })
      : t("button_default");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="h-full"
    >
      <div className="group flex h-full flex-col overflow-hidden rounded-[34px] border border-white/10 bg-slate-900/60 text-white shadow-[0_24px_56px_-34px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:shadow-[0_28px_64px_-34px_rgba(0,0,0,0.6)]">
        <div className="relative h-40 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.02),rgba(255,255,255,0.04))]" />
        </div>

        <div className="flex h-full flex-col px-5 pb-5 pt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
            <TeamMark logo={resolvedHomeLogo} team={home_team} />
            <div className="flex flex-col items-center justify-center gap-1 pt-2">
              <span className="text-xl font-black italic tracking-[-0.04em] text-slate-400">VS</span>
            </div>
            <TeamMark logo={resolvedAwayLogo} team={away_team} />
          </div>

          {tournament_name ? (
            <div className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              {tournament_name}
            </div>
          ) : null}

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" />
              </span>
              <span suppressHydrationWarning>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{stadium}</span>
            </div>
          </div>

          <div className="mt-auto pt-5">
            <Link href={`/seats/${id}`} className="block w-full">
              <NeonButton className="h-12 w-full rounded-none bg-emerald-600 font-black uppercase tracking-[0.18em] text-white shadow-none transition-colors hover:bg-emerald-500">
                {buttonLabel}
              </NeonButton>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TeamMark({ logo, team }: { logo?: string; team: string }) {
  const resolvedLogo = logo ?? "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";

  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_18px_-12px_rgba(255,255,255,0.45)]">
        <Image
          src={resolvedLogo}
          alt={team}
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          unoptimized
        />
      </div>

      <span className="line-clamp-2 max-w-[7rem] text-[13px] font-black uppercase leading-[1.15] tracking-[0.02em] text-slate-300">
        {team}
      </span>
    </div>
  );
}
