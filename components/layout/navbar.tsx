"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Ticket,
  User as UserIcon,
  Wallet,
} from "lucide-react";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/components/providers/auth-provider";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SearchBar } from "@/components/matches/search-bar";
import { useFeaturedMatches } from "@/hooks/use-matches";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { MegaMenu, MobileNav } from "./mega-menu";

export function Navbar() {
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const numberLocale = locale.startsWith("vi") ? "vi-VN" : "en-US";
  const navRef = React.useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [navHeight, setNavHeight] = React.useState(88);
  const { data: featuredMatches } = useFeaturedMatches();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    const updateNavHeight = () => {
      setNavHeight(navRef.current?.offsetHeight ?? 88);
    };

    updateNavHeight();

    if (typeof ResizeObserver === "undefined" || !navRef.current) {
      window.addEventListener("resize", updateNavHeight);
      return () => window.removeEventListener("resize", updateNavHeight);
    }

    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(navRef.current);
    window.addEventListener("resize", updateNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavHeight);
    };
  }, [isScrolled]);

  const cartHref = isLoggedIn ? "/history" : "/login";
  const balanceText = `${(user?.balance ?? 0).toLocaleString(numberLocale)} VND`;

  return (
    <>
      <nav ref={navRef} className="fixed inset-x-0 top-0 z-[120] px-2 pt-2.5 sm:px-3 sm:pt-3">
        <div
          className={cn(
            "theme-shell mx-auto max-w-7xl rounded-[28px] border border-border/80 bg-card/92 transition-all duration-300 ",
            isScrolled ? "shadow-[0_18px_46px_-34px_rgba(15,23,42,0.18)] " : "shadow-[0_12px_30px_-28px_rgba(15,23,42,0.14)] ",
          )}
        >
          <div className="flex min-h-[64px] items-center gap-2 px-3 py-2.5 sm:min-h-[68px] sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="xl:hidden">
                {isMounted ? (
                  <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetTrigger asChild>
                        <Button aria-label={t("open_navigation")} className="theme-control-surface h-11 w-11 rounded-2xl will-change-auto" size="icon" variant="ghost">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[min(94vw,420px)] rounded-r-[28px] border-r-0 bg-background p-0 text-foreground shadow-[0_32px_80px_-44px_rgba(15,23,42,0.55)] sm:rounded-r-[32px]"
                    >
                        <SheetHeader className="border-b border-border/80 bg-card/90 px-5 py-5 text-left sm:px-6">
                        <SheetTitle className="flex items-center justify-between gap-3">
                          <Logo animated iconClassName="h-10 w-10 p-1.5" showText textClassName="text-xl font-black theme-title" />
                        </SheetTitle>
                        <div className="mt-4 rounded-[24px] border border-border/80 bg-muted/70 p-4 ">
                          <div className="flex items-start gap-3">
                            <span className="theme-icon-chip h-10 w-10">
                              <ShieldCheck className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-semibold theme-title">{t("mobile_access_title")}</div>
                              <div className="mt-1 text-sm leading-6 theme-copy-muted">{t("mobile_access_description")}</div>
                            </div>
                          </div>
                        </div>
                      </SheetHeader>

                      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                        <MobileNav
                          featuredMatches={featuredMatches}
                          onNavigate={() => {
                            setIsMobileNavOpen(false);
                          }}
                        />
                      </div>

                      <div className="border-t border-border/80 bg-card/90 px-4 py-5 sm:px-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <LanguageSwitcher />
                        </div>

                        {!isLoading ? (
                          isLoggedIn ? (
                            <div className="space-y-3">
                              <div className="theme-shell-muted rounded-[24px] p-4">
                                <div className="flex items-center gap-3">
                                  <div className="theme-icon-chip h-12 w-12">
                                    <UserIcon className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold theme-title">{user?.name}</div>
                                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold theme-copy shadow-sm">
                                      <Wallet className="h-3.5 w-3.5 text-emerald-300" />
                                      {balanceText}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <Button asChild className="h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800   ">
                                  <Link href="/history" onClick={() => setIsMobileNavOpen(false)}>
                                    {t("my_tickets")}
                                  </Link>
                                </Button>
                                <Button asChild className="h-11 rounded-2xl border border-border/80 bg-card text-foreground hover:bg-accent/70">
                                  <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
                                    {t("profile")}
                                  </Link>
                                </Button>
                              </div>

                              <Button
                                className="h-11 w-full rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/15   "
                                variant="ghost"
                                onClick={() => {
                                  setIsMobileNavOpen(false);
                                  logout();
                                }}
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                {t("logout")}
                              </Button>
                            </div>
                          ) : (
                            <Button asChild className="h-11 w-full rounded-2xl bg-emerald-700 text-white hover:bg-emerald-600">
                              <Link href="/login" onClick={() => setIsMobileNavOpen(false)}>
                                {t("login")} / {t("register")}
                              </Link>
                            </Button>
                          )
                        ) : null}
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Button aria-label={t("open_navigation")} className="theme-control-surface h-11 w-11 rounded-2xl will-change-auto" size="icon" variant="ghost">
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <Link className="flex items-center" href="/">
                <Logo
                  animated
                  iconClassName="h-10 w-10 p-1.5 sm:h-11 sm:w-11"
                  showText
                  textClassName="hidden text-[1.28rem] font-black tracking-tight theme-title md:block lg:text-[1.45rem]"
                />
              </Link>
              <div className="hidden items-center 2xl:flex">
                <span className="theme-chip">{t("desktop_badge")}</span>
              </div>
            </div>

            <div className="hidden flex-1 justify-center xl:flex">
              <MegaMenu featuredMatches={featuredMatches} navHeight={navHeight} />
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2 xl:gap-1.5 2xl:gap-3">
              <Button
                aria-label={t("open_search")}
                className="theme-control-surface h-11 w-11 rounded-2xl will-change-auto"
                size="icon"
                variant="ghost"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button asChild className="theme-control-surface relative h-11 w-11 rounded-2xl will-change-auto" size="icon" variant="ghost">
                <Link aria-label={t("open_wallet")} href={cartHref}>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-card " />
                </Link>
              </Button>

              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {!isLoading ? (
                isLoggedIn && isMounted ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="theme-control-surface h-11 rounded-full pl-2.5 pr-1.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.18)] will-change-auto lg:pl-3 " variant="ghost">
                        <div className="hidden min-w-0 items-end text-right min-[1100px]:flex min-[1100px]:flex-col">
                          <span className="truncate text-sm font-semibold theme-title">{user?.name}</span>
                          <span className="text-[11px] theme-copy-muted">{balanceText}</span>
                        </div>
                        <span className="theme-icon-chip h-9 w-9 rounded-full">
                          <UserIcon className="h-4 w-4" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="theme-shell mt-3 w-72 rounded-[28px] p-2">
                      <div className="theme-shell-muted rounded-[22px] p-4">
                        <div className="text-base font-semibold theme-title">{user?.name}</div>
                        <div className="mt-1 truncate text-sm theme-copy-muted">{user?.email}</div>
                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-card px-3 py-2.5 shadow-sm">
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] theme-copy-muted">
                            <Wallet className="h-3.5 w-3.5 text-emerald-300" />
                            {t("balance_label")}
                          </span>
                          <span className="text-sm font-semibold theme-title">{balanceText}</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 font-medium theme-copy">
                          <Link href="/history">
                            <Ticket className="mr-2 h-4 w-4 text-emerald-300" />
                            {t("my_tickets")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 font-medium theme-copy">
                          <Link href="/profile">
                            <Settings className="mr-2 h-4 w-4 text-emerald-300" />
                            {t("profile")}
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-2 bg-border" />
                      <DropdownMenuItem
                        className="rounded-2xl px-3 py-3 font-medium text-red-300 focus:bg-red-500/10 focus:text-red-200   "
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="hidden h-11 rounded-[16px] bg-emerald-700 px-3 font-black uppercase tracking-[0.12em] text-white shadow-[0_14px_28px_-22px_rgba(5,150,105,0.24)] hover:bg-emerald-600 md:inline-flex xl:px-3 2xl:px-5 2xl:tracking-[0.14em]"
                  >
                    <Link href="/login">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span className="min-[1536px]:hidden">{t("login")}</span>
                      <span className="hidden min-[1536px]:inline">
                        {t("register")} / {t("login")}
                      </span>
                    </Link>
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="theme-shell max-w-3xl rounded-[28px] p-0 shadow-[0_28px_72px_-40px_rgba(15,23,42,0.24)]  sm:rounded-[32px]" showCloseButton={false}>
          <DialogHeader className="border-b border-border/80 px-4 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
            <div className="theme-icon-chip h-11 w-11">
              <Search className="h-5 w-5" />
            </div>
            <DialogTitle className="pt-4 text-2xl font-heading font-black tracking-tight theme-title">{t("search_dialog_title")}</DialogTitle>
            <DialogDescription className="text-sm leading-6 theme-copy-muted">{t("search_dialog_description")}</DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <SearchBar />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
