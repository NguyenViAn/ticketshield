import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { Logo } from "@/components/logo";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="relative z-10 mt-16 w-full overflow-hidden border-t border-emerald-500/10 bg-[linear-gradient(180deg,#07130f_0%,#06100d_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_24%)]" />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr] lg:gap-10">
          <div>
            <div className="mb-6">
              <Logo showText iconClassName="h-9 w-9" textClassName="text-xl text-white" />
            </div>
            <p className="mb-6 max-w-sm text-sm leading-7 text-slate-400">{t("description")}</p>
            <div className="flex flex-wrap gap-3">
              <SocialLink icon={<Facebook className="h-4.5 w-4.5" />} />
              <SocialLink icon={<Instagram className="h-4.5 w-4.5" />} />
              <SocialLink icon={<Twitter className="h-4.5 w-4.5" />} />
            </div>
          </div>

          <FooterColumn title={t("customer_support")}>
            <FooterItem href="/">{t("help_center")}</FooterItem>
            <FooterItem href="/">{t("buy_guide")}</FooterItem>
            <FooterItem href="/">{t("faq")}</FooterItem>
            <FooterItem href="/">{t("refund_policy")}</FooterItem>
          </FooterColumn>

          <FooterColumn title={t("policies")}>
            <FooterItem href="/">{t("privacy_policy")}</FooterItem>
            <FooterItem href="/">{t("operations")}</FooterItem>
            <FooterItem href="/">{t("terms")}</FooterItem>
            <FooterItem href="/">{t("disputes")}</FooterItem>
          </FooterColumn>

          <FooterColumn title={t("contact")}>
            <InfoRow icon={<MapPin className="h-4.5 w-4.5" />} text={t("address")} />
            <InfoRow icon={<Phone className="h-4.5 w-4.5" />} text={t("hotline")} />
            <InfoRow icon={<Mail className="h-4.5 w-4.5" />} text="Annvbc00289@fpt.edu.vn" />
          </FooterColumn>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-6 text-left sm:flex-row sm:items-center">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
            &copy; {new Date().getFullYear()} TICKETSHIELD. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.12em] text-slate-500 sm:justify-end">
            <span className="transition-colors hover:text-emerald-300">{t("registered")}</span>
            <span className="transition-colors hover:text-emerald-300">{t("security_cert")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">{title}</h3>
      <div className="flex flex-col gap-3 text-sm text-slate-400">{children}</div>
    </div>
  );
}

function FooterItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="transition-colors hover:text-emerald-300">
      {children}
    </Link>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm text-slate-400">
      <span className="mt-0.5 text-emerald-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
  return (
    <a
      href="#"
      className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/8 bg-white/[0.03] text-slate-400 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/14 hover:bg-emerald-400/10 hover:text-emerald-300"
    >
      {icon}
    </a>
  );
}
