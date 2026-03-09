import { Link } from "@/i18n/routing";
import { Shield, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";

export function Footer() {
    const t = useTranslations("Footer");
    return (
        <footer className="w-full bg-slate-900 relative z-10 overflow-hidden">
            {/* Gradient accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-brand-green/50 to-transparent" />

            <div className="pt-16 pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand Info */}
                    <div>
                        <div className="mb-6">
                            <Logo showText={true} iconClassName="w-9 h-9" textClassName="text-xl text-white" />
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 font-sans">
                            {t("description")}
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-blue hover:border-brand-blue/50 hover:shadow-lg hover:shadow-brand-blue/20 transition-all duration-300 hover:-translate-y-0.5">
                                <Facebook className="w-4.5 h-4.5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-red hover:border-brand-red/50 hover:shadow-lg hover:shadow-brand-red/20 transition-all duration-300 hover:-translate-y-0.5">
                                <Instagram className="w-4.5 h-4.5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-sky-500 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 hover:-translate-y-0.5">
                                <Twitter className="w-4.5 h-4.5" />
                            </a>
                        </div>
                    </div>

                    {/* Customer Support */}
                    <div>
                        <h3 className="text-white font-heading font-semibold tracking-wider uppercase mb-4">{t("customer_support")}</h3>
                        <ul className="flex flex-col gap-3 text-sm text-slate-400">
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("help_center")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("buy_guide")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("faq")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("refund_policy")}</Link></li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div>
                        <h3 className="text-white font-heading font-semibold tracking-wider uppercase mb-4">{t("policies")}</h3>
                        <ul className="flex flex-col gap-3 text-sm text-slate-400">
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("privacy_policy")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("operations")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("terms")}</Link></li>
                            <li><Link href="/" className="hover:text-brand-green transition-colors">{t("disputes")}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-heading font-semibold tracking-wider uppercase mb-4">{t("contact")}</h3>
                        <ul className="flex flex-col gap-4 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-brand-green flex-shrink-0" />
                                <span>{t("address")}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-green flex-shrink-0" />
                                <span>{t("hotline")}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-brand-green flex-shrink-0" />
                                <span>support@ticketshield.vn</span>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-500 font-sans">
                        &copy; {new Date().getFullYear()} TICKETSHIELD. All rights reserved.
                    </p>
                    <div className="text-xs text-slate-500 flex gap-4">
                        <span className="hover:text-brand-green cursor-pointer transition-colors">{t("registered")}</span>
                        <span className="hover:text-brand-green cursor-pointer transition-colors">{t("security_cert")}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
