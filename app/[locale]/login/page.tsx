"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Chrome,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { NeonButton } from "@/components/ui/neon-button";
import { createClient } from "@/utils/supabase/client";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getDefaultRedirect(role: unknown, locale: string) {
  return role === "admin" ? `/${locale}/admin` : `/${locale}`;
}

function resolveRequestedRedirect(rawRedirect: string | null) {
  if (!rawRedirect || !rawRedirect.startsWith("/")) {
    return null;
  }

  return rawRedirect === "/" ? null : rawRedirect;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const locale = useLocale();
  const t = useTranslations("Login");

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [step, setStep] = useState<"credentials" | "scanning" | "success">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const requestedRedirect = resolveRequestedRedirect(searchParams.get("redirect"));
  const profileAfterReset = "/profile";

  const resolvePostAuthRedirect = (role: unknown) => requestedRedirect ?? getDefaultRedirect(role, locale);

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setStep("scanning");

    try {
      let authRole: unknown = null;

      if (isLoginMode) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }

        authRole = data.user?.user_metadata?.role;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              balance: 2500000,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        authRole = data.user?.user_metadata?.role;
      }

      const nextPath = resolvePostAuthRedirect(authRole);

      setTimeout(() => {
        setStep("success");
        setTimeout(() => {
          router.push(nextPath);
        }, 1200);
      }, 1200);
    } catch (err: unknown) {
      setStep("credentials");
      setError(getErrorMessage(err, t("error_override")));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("locale", locale);

      if (requestedRedirect) {
        callbackUrl.searchParams.set("next", requestedRedirect);
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, t("error_oauth")));
    }
  };

  const handleForgotPassword = async () => {
    setResetLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(profileAfterReset)}`,
      });

      if (resetError) {
        throw resetError;
      }

      setResetSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t("error_override")));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="page-premium">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_460px] lg:items-center">
          <section className="hidden lg:block">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/14 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("hero_badge")}
              </div>
              <h1 className="mt-6 text-6xl font-heading font-black uppercase leading-[0.92] tracking-[-0.05em] text-white">
                {t("hero_title")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">{t("subtitle")}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <HeroNote title={t("hero_note_one_title")} description={t("hero_note_one_desc")} />
                <HeroNote title={t("hero_note_two_title")} description={t("hero_note_two_desc")} />
              </div>
            </div>
          </section>

          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="page-shell">
            <div className="border-b border-white/10 px-6 py-7 sm:px-8">
              <div className="flex items-center justify-center lg:justify-start">
                <Logo showText={false} iconClassName="h-16 w-16" />
              </div>
              <h2 className="mt-5 text-center text-3xl font-heading font-black uppercase tracking-[-0.04em] text-white lg:text-left">
                {t("title")}
              </h2>
              <p className="mt-3 text-center text-sm leading-7 text-slate-300 lg:text-left">{t("subtitle")}</p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="mb-5 flex rounded-[18px] border border-white/10 bg-white/5 p-1 text-xs font-bold uppercase tracking-[0.18em]">
                <button
                  onClick={() => {
                    setIsLoginMode(true);
                    setError("");
                  }}
                  className={`flex-1 rounded-[14px] px-4 py-3 transition-colors ${
                    isLoginMode ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t("login_tab")}
                </button>
                <button
                  onClick={() => {
                    setIsLoginMode(false);
                    setError("");
                  }}
                  className={`flex-1 rounded-[14px] px-4 py-3 transition-colors ${
                    !isLoginMode ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t("register_tab")}
                </button>
              </div>

              <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-emerald-400/14 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-200">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <span>{t("security_notice")}</span>
              </div>

              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-start gap-3 rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm leading-6 text-rose-200"
                >
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              ) : null}

              <AnimatePresence mode="wait">
                {step === "credentials" ? (
                  <motion.form
                    key="credentials"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 14 }}
                    onSubmit={handleEmailAuth}
                    className="space-y-4"
                  >
                    {!isLoginMode ? (
                      <Field
                        icon={<User className="h-5 w-5" />}
                        placeholder={t("agent_name_placeholder")}
                        value={name}
                        onChange={setName}
                      />
                    ) : null}

                    <Field
                      icon={<Mail className="h-5 w-5" />}
                      placeholder={t("email_placeholder")}
                      type="email"
                      value={email}
                      onChange={setEmail}
                    />

                    <Field
                      icon={<Lock className="h-5 w-5" />}
                      placeholder={t("password_placeholder")}
                      type="password"
                      value={password}
                      onChange={setPassword}
                    />

                    <button
                      type="submit"
                      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-emerald-400 px-5 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
                    >
                      {isLoginMode ? t("submit_login") : t("submit_register")}
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    {isLoginMode ? (
                      <div className="pt-1 text-center">
                        {!showForgotPassword ? (
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-400"
                          >
                            {t("forgot_password")}
                          </button>
                        ) : !resetSent ? (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 rounded-[22px] border border-white/10 bg-white/5 p-4 text-left"
                          >
                            <p className="text-sm leading-6 text-slate-300">{t("forgot_desc")}</p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <div className="min-w-0 flex-1">
                                <Field
                                  icon={<KeyRound className="h-4 w-4" />}
                                  placeholder={t("email_placeholder")}
                                  type="email"
                                  value={resetEmail}
                                  onChange={setResetEmail}
                                  compact
                                />
                              </div>
                              <NeonButton
                                onClick={handleForgotPassword}
                                disabled={resetLoading || !resetEmail}
                                className="h-11 rounded-[16px] px-4 text-xs uppercase tracking-[0.18em]"
                              >
                                {resetLoading ? "..." : t("forgot_btn")}
                              </NeonButton>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 rounded-[20px] border border-emerald-400/18 bg-emerald-400/10 px-4 py-4 text-sm leading-6 text-emerald-200"
                          >
                            {t("forgot_success")}
                          </motion.div>
                        )}
                      </div>
                    ) : null}
                  </motion.form>
                ) : null}

                {step === "scanning" ? (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-400/18 bg-emerald-400/12">
                      <LoaderCircle className="h-12 w-12 animate-spin text-emerald-300" />
                    </div>
                    <div className="mt-6 text-2xl font-heading font-black uppercase tracking-[-0.03em] text-white">
                      {t("processing")}
                    </div>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">{t("warning")}</p>
                  </motion.div>
                ) : null}

                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-emerald-400/18 bg-emerald-400/12">
                      <ShieldCheck className="h-12 w-12 text-emerald-300" />
                    </div>
                    <h3 className="mt-6 text-4xl font-heading font-black uppercase tracking-[-0.04em] text-emerald-300">
                      {t("success_title")}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-slate-300">{t("success_desc")}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {step === "credentials" ? (
                <>
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs font-bold uppercase tracking-[0.18em]">
                      <span className="bg-[#111b31] px-4 text-slate-300">{t("or_external")}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/5 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white"
                  >
                    <Chrome className="h-5 w-5 text-cyan-300" />
                    {t("google_connect")}
                  </button>
                </>
              ) : null}
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}

function HeroNote({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-5">
      <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  );
}

function Field({
  compact = false,
  icon,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  compact?: boolean;
  icon: ReactNode;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className={`w-full rounded-[18px] border border-white/10 bg-white/5 pl-12 pr-4 text-white outline-none transition-all placeholder:text-slate-500 focus:border-emerald-400/24 focus:ring-4 focus:ring-emerald-500/10 ${
          compact ? "h-11 text-sm" : "h-14 text-sm"
        }`}
      />
    </div>
  );
}

function LoginFallback() {
  const t = useTranslations("Login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#111b31_0%,#101a2d_100%)] text-slate-300">
      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">{t("initializing")}</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
