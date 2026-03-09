"use client";

import { motion, AnimatePresence } from "framer-motion";

import { NeonInput } from "@/components/ui/neon-input";
import { NeonButton } from "@/components/ui/neon-button";
import { ShieldCheck, User, Lock, Chrome, Fingerprint, ShieldAlert, Cpu, Terminal, KeyRound } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/logo";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/utils/supabase/client";
import { useTranslations, useLocale } from "next-intl";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { } = useAuth();
    const t = useTranslations("Login");
    const locale = useLocale();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [step, setStep] = useState<'credentials' | 'scanning' | 'success'>('credentials');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only used in register
    const [error, setError] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const fallbackRedirect = `/${locale}`;
    const rawRedirect = searchParams.get('redirect');
    const redirectUrl = rawRedirect && rawRedirect.startsWith('/')
        ? (rawRedirect === '/' ? fallbackRedirect : rawRedirect)
        : fallbackRedirect;
    const profileAfterReset = `/${locale}/profile`;

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsScanning(true);
        setStep('scanning');

        try {
            if (isLoginMode) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            balance: 2500000 // give initial fake balance
                        }
                    }
                });
                if (signUpError) throw signUpError;
                // Note: If email confirmation is enabled on Supabase, this behaves differently.
                // Assuming it's disabled as per instruction.
            }

            // Success animation flow
            setTimeout(() => {
                setStep('success');
                setTimeout(() => {
                    router.push(redirectUrl);
                }, 1500);
            }, 2000);

        } catch (err: any) {
            setStep('credentials');
            setIsScanning(false);
            setError(err.message || t("error_override"));
        }
    };

    const handleGoogleLogin = async () => {
        setIsScanning(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setIsScanning(false);
            setError(err.message || t("error_oauth"));
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(profileAfterReset)}`,
            });
            if (error) throw error;
            setResetSent(true);
        } catch (err: any) {
            setError(err.message || t("error_override"));
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-brand-green/5 blur-[100px] rounded-full translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-brand-blue/5 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/4" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="w-full max-w-md relative z-10"
            >

                <div className="relative p-8 flex flex-col gap-6 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/30">
                    <div className="text-center mb-4 flex flex-col items-center">
                        <Logo showText={false} iconClassName="w-16 h-16 mb-4" />
                        <h1 className="text-3xl font-heading font-black text-slate-800 mb-2" dangerouslySetInnerHTML={{ __html: t.raw("title") }}></h1>
                        <p className="text-sm text-slate-500 font-sans">{t("subtitle")}</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 mb-2 font-heading tracking-widest text-xs uppercase shadow-inner">
                        <button
                            onClick={() => { setIsLoginMode(true); setError(''); }}
                            className={`flex-1 py-2.5 rounded-lg transition-all font-bold ${isLoginMode ? 'bg-white text-brand-green shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t("login_tab")}
                        </button>
                        <button
                            onClick={() => { setIsLoginMode(false); setError(''); }}
                            className={`flex-1 py-2.5 rounded-lg transition-all font-bold ${!isLoginMode ? 'bg-white text-brand-blue shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t("register_tab")}
                        </button>
                    </div>

                    <div className="flex bg-blue-50 border border-blue-100 rounded-xl p-3 items-center gap-3 text-sm text-brand-blue mb-2 font-medium">
                        <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                        <span>{t("security_notice")}</span>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-sm text-red-600 font-medium"
                        >
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'credentials' && (
                            <motion.form
                                key="credentials"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleEmailAuth}
                                className="space-y-4"
                            >
                                {!isLoginMode && (
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <NeonInput
                                            type="text"
                                            placeholder={t("agent_name_placeholder")}
                                            className="pl-10 font-medium"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLoginMode}
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <NeonInput
                                        type="email"
                                        placeholder={t("email_placeholder")}
                                        className="pl-10 font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <NeonInput
                                        type="password"
                                        placeholder={t("password_placeholder")}
                                        className="pl-10 font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className={`relative w-full h-12 rounded-xl text-white font-bold tracking-widest uppercase overflow-hidden group mt-4 shadow-lg transition-all hover:-translate-y-0.5 ${isLoginMode ? 'bg-gradient-to-r from-brand-green to-green-500 hover:shadow-green-500/30' : 'bg-gradient-to-r from-brand-blue to-blue-500 hover:shadow-blue-500/30'}`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <Fingerprint className="w-5 h-5" />
                                        {isLoginMode ? t("submit_login") : t("submit_register")}
                                    </span>
                                </button>

                                {/* Forgot Password */}
                                {isLoginMode && (
                                    <div className="text-center">
                                        {!showForgotPassword ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowForgotPassword(true)}
                                                className="text-sm text-slate-500 hover:text-brand-blue transition-colors font-medium"
                                            >
                                                {t("forgot_password")}
                                            </button>
                                        ) : !resetSent ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2"
                                            >
                                                <p className="text-sm text-slate-600 mb-3 font-medium">{t("forgot_desc")}</p>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <NeonInput
                                                            type="email"
                                                            placeholder={t("email_placeholder")}
                                                            className="pl-9 h-10 text-sm"
                                                            value={resetEmail}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetEmail(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <NeonButton
                                                        onClick={handleForgotPassword}
                                                        disabled={resetLoading || !resetEmail}
                                                        className="h-10 px-4 text-xs"
                                                    >
                                                        {resetLoading ? '...' : t("forgot_btn")}
                                                    </NeonButton>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-green-50 border border-green-200 rounded-xl p-4 mt-2 text-sm text-green-700 font-medium"
                                            >
                                                {t("forgot_success")}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </motion.form>
                        )}

                        {step === 'scanning' && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-8 gap-6"
                            >
                                <div className="relative w-24 h-24 flex items-center justify-center bg-brand-blue/5 rounded-full border border-brand-blue/20">
                                    <Cpu className="w-10 h-10 text-brand-blue animate-pulse relative z-10" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue/50 shadow-sm shadow-blue-500/50 animate-scan rounded-full" />
                                </div>
                                <div className="text-center w-full">
                                    <p className="text-slate-600 font-medium text-sm mb-2 opacity-80 animate-pulse uppercase tracking-wider">
                                        {t("processing")}
                                    </p>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-brand-blue to-brand-green shadow-sm animate-[shimmer_1.5s_infinite]"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono mt-2 text-right">AES-256</p>
                                </div>
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                    <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                                    <p className="text-xs text-slate-600 font-sans font-medium">
                                        {t("warning")}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-8 gap-6"
                            >
                                <motion.div
                                    initial={{ rotate: -90, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-20 h-20 rounded-full border-[3px] border-brand-green flex items-center justify-center bg-green-50 shadow-lg shadow-green-500/20"
                                >
                                    <ShieldCheck className="w-10 h-10 text-brand-green" />
                                </motion.div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-black font-heading text-slate-800 mb-2 uppercase">{t("success_title")}</h3>
                                    <p className="text-slate-500 font-sans text-sm">{t("success_desc")}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {step === 'credentials' && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                                    <span className="bg-white px-4 text-slate-400">{t("or_external")}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl font-bold tracking-wider uppercase transition-all shadow-sm"
                            >
                                <Chrome className="w-5 h-5 text-brand-blue" />
                                {t("google_connect")}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-blue animate-pulse font-heading tracking-widest font-bold">INITIALIZING...</div>}>
            <LoginContent />
        </Suspense>
    );
}
