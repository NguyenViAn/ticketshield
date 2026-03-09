"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Wallet, Edit2, Check, ArrowUpCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslations, useLocale } from "next-intl";

export default function ProfilePage() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations("ProfilePage");
    const locale = useLocale();

    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            const profilePath = `/${locale}/profile`;
            router.push(`/${locale}/login?redirect=${encodeURIComponent(profilePath)}`);
        }
    }, [isLoggedIn, authLoading, router, locale]);

    useEffect(() => {
        if (user) {
            setEditName(user.name);
            setBalance(user.balance);
        }
    }, [user]);

    if (!isLoggedIn || !user) return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-10">
                <div className="h-8 w-48 bg-slate-100 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 h-64 bg-slate-100 rounded-2xl animate-pulse" />
                <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
        </main>
    );

    const handleUpdateName = async () => {
        if (!editName.trim() || editName === user.name) {
            setIsEditingMode(false);
            return;
        }

        setIsUpdating(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: editName }
        });

        if (error) {
            alert(t("error_update") + error.message);
        } else {
            setIsEditingMode(false);
            // In a real app we'd want to refresh the auth context here.
            // But Supabase's onAuthStateChange handles it generally.
        }
        setIsUpdating(false);
    };

    const handleAddFunds = async () => {
        const amountToAdd = 1000000; // 1,000,000 VND simulated
        const newBalance = balance + amountToAdd;
        setIsUpdating(true);

        const { error } = await supabase.auth.updateUser({
            data: { balance: newBalance }
        });

        if (!error) {
            setBalance(newBalance);
            alert(t("success_funds", { amount: amountToAdd.toLocaleString('vi-VN') }));
        } else {
            alert(t("error_funds") + error.message);
        }
        setIsUpdating(false);
    };

    return (
        <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-8 bg-gradient-to-b from-brand-green to-emerald-500 rounded-full" />
                    <h1 className="text-3xl font-heading font-black text-slate-900 uppercase tracking-wide">{t("title")}</h1>
                </div>
                <p className="text-slate-500 font-sans ml-[19px]">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Widget */}
                <div className="md:col-span-2 bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200/80 hover:border-brand-green/20 transition-all duration-300 p-8">
                    <h2 className="text-xl font-heading font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2.5">
                        <User className="w-5 h-5 text-brand-blue" />
                        {t("id_info")}
                    </h2>

                    <div className="space-y-6">
                        {/* Name Block */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-2">{t("fullname")}</label>
                            {isEditingMode ? (
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border-2 border-brand-blue rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition-all font-medium"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        disabled={isUpdating}
                                    />
                                    <button
                                        onClick={handleUpdateName}
                                        disabled={isUpdating}
                                        className="bg-brand-blue text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                                    <span className="text-lg font-bold text-slate-800">{user.name}</span>
                                    <button
                                        onClick={() => setIsEditingMode(true)}
                                        className="text-slate-400 hover:text-brand-blue transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email Block */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-2">{t("email")}</label>
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 opacity-70">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-700 font-medium">{user.email || t("no_email")}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{t("email_note")}</p>
                        </div>
                    </div>
                </div>

                {/* Wallet Widget */}
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-200/80 hover:border-brand-green/20 transition-all duration-300 p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-green/15 to-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-brand-green/20 shadow-sm shadow-brand-green/10">
                        <Wallet className="w-8 h-8 text-brand-green" />
                    </div>
                    <h2 className="text-lg font-heading font-bold text-slate-500 uppercase tracking-wide mb-2">{t("wallet_title")}</h2>
                    <div className="text-3xl font-black text-slate-900 mb-8 font-heading">
                        {balance.toLocaleString('vi-VN')} <span className="text-sm text-slate-500">VND</span>
                    </div>

                    <button
                        onClick={handleAddFunds}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-green to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <ArrowUpCircle className="w-5 h-5" />
                        {t("btn_add_funds")}
                    </button>
                    <p className="text-xs text-slate-400 mt-4">{t("funds_note")}</p>
                </div>
            </div>
        </main>
    );
}
