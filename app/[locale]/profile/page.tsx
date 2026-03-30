"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  ArrowUpCircle,
  Camera,
  Check,
  CreditCard,
  Edit2,
  Mail,
  ShieldCheck,
  Smartphone,
  Ticket,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useAuth } from "@/components/providers/auth-provider";
import { Link } from "@/i18n/routing";
import { useTickets } from "@/hooks/use-tickets";
import {
  MatchdayActionTile,
  MatchdayInfoField,
  MatchdayPanel,
  MatchdayPanelHeader,
  MatchdayStatCard,
  MatchdayStatusCard,
} from "@/components/ui/matchday";
import { createClient } from "@/utils/supabase/client";

export default function ProfilePage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const isVietnamese = locale.startsWith("vi");
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [balanceOverride, setBalanceOverride] = useState<number | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      const profilePath = `/${locale}/profile`;
      router.push(`/${locale}/login?redirect=${encodeURIComponent(profilePath)}`);
    }
  }, [authLoading, isLoggedIn, locale, router]);

  const ticketSummary = useMemo(() => {
    const validTickets = tickets.filter((ticket) => ticket.status === "Valid");
    const upcomingTickets = validTickets.filter(
      (ticket) => new Date(ticket.matches?.date ?? ticket.created_at) > new Date()
    );
    const spentTotal = tickets.reduce((sum, ticket) => sum + ticket.price_paid, 0);
    const latestTicket = tickets[0] ?? null;
    const earliestTicket = tickets[tickets.length - 1] ?? null;
    const loyaltyPoints = Math.max(1200, validTickets.length * 180 + Math.round(spentTotal / 15000));

    return {
      earliestTicket,
      latestTicket,
      loyaltyPoints,
      spentTotal,
      totalTickets: tickets.length,
      upcomingTickets: upcomingTickets.length,
      validTickets: validTickets.length,
    };
  }, [tickets]);

  if (!isLoggedIn || !user) {
    return (
      <main className="page-premium">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-[34px] border border-white/10 bg-white/5  " />
            <div className="grid gap-5 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-[28px] border border-white/10 bg-white/5  " />
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
              <div className="h-[520px] animate-pulse rounded-[30px] border border-white/10 bg-white/5  " />
              <div className="h-[520px] animate-pulse rounded-[30px] border border-white/10 bg-white/5  " />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const balance = balanceOverride ?? user.balance;
  const avatarSrc = avatarPreview ?? user.avatarUrl ?? null;
  const memberSinceLabel = ticketSummary.earliestTicket
    ? new Intl.DateTimeFormat(isVietnamese ? "vi-VN" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(ticketSummary.earliestTicket.created_at))
    : t("account_activation");

  const handleUpdateName = async () => {
    const nextName = editName.trim() || user.name;
    if (nextName === user.name) {
      setIsEditingMode(false);
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: nextName },
    });

    if (error) {
      alert(t("error_update") + error.message);
    } else {
      setIsEditingMode(false);
    }

    setIsUpdating(false);
  };

  const handleAddFunds = async () => {
    const amountToAdd = 1_000_000;
    const newBalance = balance + amountToAdd;
    setIsUpdating(true);

    const { error } = await supabase.auth.updateUser({
      data: { balance: newBalance },
    });

    if (error) {
      alert(t("error_funds") + error.message);
    } else {
      setBalanceOverride(newBalance);
      alert(t("success_funds", { amount: amountToAdd.toLocaleString(locale) }));
    }

    setIsUpdating(false);
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUpdating(true);

    const fileExtension = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      setIsUpdating(false);
      alert(t("upload_avatar_error"));
      return;
    }

    const { data: publicImage } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicImage.publicUrl },
    });

    if (updateError) {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(null);
      alert(t("update_avatar_error") + updateError.message);
    } else {
      URL.revokeObjectURL(previewUrl);
      setAvatarPreview(`${publicImage.publicUrl}?t=${Date.now()}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsUpdating(false);
  };

  return (
    <main className="page-premium">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="page-shell">
          <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)_auto] lg:items-center">
            <div className="relative mx-auto h-[210px] w-[210px] overflow-hidden rounded-[30px] border border-emerald-400/18 bg-[linear-gradient(180deg,rgba(8,34,25,0.96),rgba(4,16,11,0.98))] shadow-[0_24px_50px_-34px_rgba(16,185,129,0.2)] lg:mx-0">
              {avatarSrc ? (
                <Image src={avatarSrc} alt={user.name} fill unoptimized className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-7xl font-heading font-black text-emerald-200">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ticketSummary.validTickets > 3 ? t("member_priority") : t("member_verified")}
              </div>
              <h1 className="mt-4 text-5xl font-heading font-black uppercase leading-[0.95] tracking-[-0.04em] text-white  sm:text-6xl">
                {user.name}
              </h1>
              <p className="mt-4 text-xl text-slate-400 ">
                {t("member_since")} {memberSinceLabel}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300   ">
                  {user.email || t("no_email")}
                </span>
                <span className="rounded-full border border-emerald-400/14 bg-emerald-400/10 px-4 py-2 text-emerald-200">
                  {balance.toLocaleString(locale)} VND
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-[220px]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
                className="page-button-secondary inline-flex h-11 items-center justify-center gap-2 rounded-[18px] px-4 text-sm font-semibold disabled:opacity-50 "
              >
                <Camera className="h-4 w-4" />
                {t("change_photo")}
              </button>
              <button
                onClick={handleAddFunds}
                disabled={isUpdating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-emerald-400 px-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
              >
                <ArrowUpCircle className="h-4 w-4" />
                {t("btn_add_funds")}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-3">
          <MatchdayStatCard
            label={t("stat_tickets")}
            value={`${ticketSummary.validTickets}`}
            trailing={t("stat_active")}
            accent="emerald"
            icon={<Ticket className="h-6 w-6" />}
            footer={
              <Link href="/history" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                {t("manage_passes")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <MatchdayStatCard
            label={t("stat_wallet")}
            value={balance.toLocaleString(locale)}
            trailing="VND"
            accent="cyan"
            icon={<Wallet className="h-6 w-6" />}
            footer={
              <button onClick={handleAddFunds} className="text-sm font-semibold text-emerald-300">
                {t("add_funds_more")}
              </button>
            }
          />
          <MatchdayStatCard
            label={t("stat_loyalty")}
            value={ticketSummary.loyaltyPoints.toLocaleString(locale)}
            trailing="PTS"
            accent="amber"
            icon={<Trophy className="h-6 w-6" />}
            footer={
                <div className="h-2 overflow-hidden rounded-full bg-white/10 ">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#fcd34d,#fb923c)]"
                  style={{ width: `${Math.min(100, Math.round((ticketSummary.loyaltyPoints / 10000) * 100))}%` }}
                />
              </div>
            }
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className="space-y-6">
            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("personal_information")}
                icon={<User className="h-5 w-5 text-emerald-300" />}
                titleClassName="text-3xl"
                className="mb-6"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <MatchdayInfoField label={t("fullname")}>
                  {isEditingMode ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={isUpdating}
                        className="h-14 flex-1 rounded-[18px] border border-white/10 bg-[#071b14] px-4 text-lg text-white outline-none transition-all focus:border-emerald-400/30 focus:ring-4 focus:ring-emerald-500/10"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={isUpdating}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-400 text-slate-950 transition-colors hover:bg-emerald-300 disabled:opacity-50"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-semibold text-white">{user.name}</span>
                      <button
                        onClick={() => {
                          setEditName(user.name);
                          setIsEditingMode(true);
                        }}
                        className="rounded-full border border-white/10 p-2 text-slate-400 transition-colors hover:border-emerald-400/24 hover:text-emerald-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </MatchdayInfoField>

                <MatchdayInfoField label={t("email")}>
                  <div className="flex items-center gap-3 text-lg text-slate-200">
                    <Mail className="h-4 w-4 text-emerald-300" />
                    <span className="truncate">{user.email || t("no_email")}</span>
                  </div>
                </MatchdayInfoField>

                <MatchdayInfoField label={t("member_code")}>
                  <span className="text-lg font-semibold text-white">#{user.id.slice(0, 8).toUpperCase()}</span>
                </MatchdayInfoField>

                <MatchdayInfoField label={t("available_wallet")}>
                  <span className="text-lg font-semibold text-white">{balance.toLocaleString(locale)} VND</span>
                </MatchdayInfoField>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdating || !isEditingMode}
                  className="inline-flex h-12 min-w-[220px] items-center justify-center rounded-[18px] bg-emerald-400 px-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("update_information")}
                </button>
              </div>
            </MatchdayPanel>

            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("recent_activity")}
                icon={<CreditCard className="h-5 w-5 text-cyan-300" />}
                titleClassName="text-3xl"
                className="mb-6"
              />

              {ticketsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-[22px] border border-white/10 bg-white/5  " />
                  ))}
                </div>
              ) : ticketSummary.latestTicket ? (
                <div className="rounded-[24px] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(9,32,23,0.92),rgba(5,20,14,0.96))] p-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                    {t("latest_ticket")}
                  </div>
                  <div className="mt-3 text-2xl font-heading font-black uppercase leading-tight text-white">
                    {ticketSummary.latestTicket.matches
                      ? `${ticketSummary.latestTicket.matches.home_team} vs ${ticketSummary.latestTicket.matches.away_team}`
                      : t("match_updating")}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span>{ticketSummary.latestTicket.seat}</span>
                    <span>{ticketSummary.latestTicket.price_paid.toLocaleString(locale)} VND</span>
                    <span>{new Date(ticketSummary.latestTicket.created_at).toLocaleString(locale)}</span>
                  </div>
                  <Link
                    href={`/history/${ticketSummary.latestTicket.id}` as never}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
                  >
                    {t("view_ticket_detail")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300   ">
                  {t("no_activity")}
                </div>
              )}
            </MatchdayPanel>
          </div>

          <div className="space-y-6">
            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("connected_title")}
                icon={<Smartphone className="h-5 w-5 text-cyan-300" />}
              />
              <div className="space-y-3">
                <QuickTile
                  href="/history"
                  title={t("quick_wallet_title")}
                  description={t("quick_wallet_desc")}
                />
                <QuickTile
                  href="/matches"
                  title={t("quick_matches_title")}
                  description={t("quick_matches_desc")}
                />
              </div>
            </MatchdayPanel>

            <MatchdayPanel>
              <MatchdayPanelHeader
                title={t("account_status_title")}
                icon={<ShieldCheck className="h-5 w-5 text-emerald-300" />}
              />
              <div className="space-y-3">
                <MatchdayStatusCard
                  title={t("verification_title")}
                  description={t("verification_desc")}
                />
                <MatchdayStatusCard
                  title={t("inventory_title")}
                  description={t("inventory_desc", { count: ticketSummary.totalTickets })}
                />
              </div>
            </MatchdayPanel>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickTile({
  description,
  href,
  title,
}: {
  description: string;
  href: string;
  title: string;
}) {
  return (
    <Link href={href} className="group block">
      <MatchdayActionTile>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-white">{title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-300">{description}</div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-300 transition-transform group-hover:translate-x-1" />
        </div>
      </MatchdayActionTile>
    </Link>
  );
}
