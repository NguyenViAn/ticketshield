"use client";

import * as React from "react";
import { Link } from "@/i18n/routing";
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
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { SearchBar } from "@/components/matches/search-bar";
import { useFeaturedMatches } from "@/hooks/use-matches";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MegaMenu, MobileNav } from "./mega-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isLoggedIn, user, logout, isLoading } = useAuth();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const navRef = React.useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [navHeight, setNavHeight] = React.useState(88);
  const { data: featuredMatches } = useFeaturedMatches();

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
  const searchDialogTitle = locale === "vi" ? "Tìm trận đấu hoặc giải đấu" : "Search matches or leagues";
  const searchDialogDescription =
    locale === "vi"
      ? "Nhập tên đội, sân vận động hoặc giải đấu để đi thẳng vào danh sách vé đang mở bán."
      : "Search by club, venue or competition and jump straight into live ticket listings.";

  return (
    <>
      <nav ref={navRef} className="fixed inset-x-0 top-0 z-[120] px-3 pt-3 sm:px-4">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-[28px] border border-white/70 bg-white/80 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.32)] backdrop-blur-2xl transition-all duration-300",
            isScrolled ? "shadow-[0_28px_90px_-40px_rgba(15,23,42,0.38)]" : "shadow-[0_18px_56px_-42px_rgba(15,23,42,0.24)]",
          )}
        >
          <div className="flex min-h-[68px] items-center gap-3 px-4 py-3 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="xl:hidden">
                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                  <SheetTrigger asChild>
                    <Button
                      aria-label="Open navigation"
                      className="h-11 w-11 rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      size="icon"
                      variant="ghost"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[min(92vw,420px)] rounded-r-[32px] border-r-0 bg-slate-50 p-0 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.55)]"
                  >
                    <SheetHeader className="border-b border-slate-200/80 bg-white px-6 py-5 text-left">
                      <SheetTitle className="flex items-center justify-between gap-3">
                        <Logo
                          animated
                          iconClassName="h-10 w-10 p-1.5"
                          showText
                          textClassName="text-xl font-black text-slate-900"
                        />
                      </SheetTitle>
                      <div className="mt-4 rounded-[24px] border border-emerald-100/80 bg-[linear-gradient(145deg,rgba(34,197,94,0.08),rgba(255,255,255,0.94))] p-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">TicketShield Matchday Access</div>
                            <div className="mt-1 text-sm leading-6 text-slate-600">
                              Tìm nhanh trận hot, mở ví vé và theo dõi giao dịch an toàn ngay trên mobile.
                            </div>
                          </div>
                        </div>
                      </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                      <MobileNav
                        featuredMatches={featuredMatches}
                        onNavigate={() => {
                          setIsMobileNavOpen(false);
                        }}
                      />
                    </div>
                    <div className="border-t border-slate-200/80 bg-white px-5 py-5">
                      <div className="mb-4">
                        <LanguageSwitcher />
                      </div>
                      {!isLoading ? (
                        isLoggedIn ? (
                          <div className="space-y-3">
                            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50 p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                  <UserIcon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900">{user?.name}</div>
                                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                    <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                                    {user?.balance.toLocaleString("vi-VN")}₫
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Button asChild className="h-11 rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                                <Link href="/history" onClick={() => setIsMobileNavOpen(false)}>
                                  {t("my_tickets")}
                                </Link>
                              </Button>
                              <Button asChild className="h-11 rounded-2xl bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">
                                <Link href="/profile" onClick={() => setIsMobileNavOpen(false)}>
                                  {t("profile")}
                                </Link>
                              </Button>
                            </div>
                            <Button
                              className="h-11 w-full rounded-2xl bg-red-50 text-red-600 hover:bg-red-100"
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
                          <Button
                            asChild
                            className="h-11 w-full rounded-2xl bg-[linear-gradient(135deg,#16a34a,#0ea5e9)] text-white hover:opacity-95"
                          >
                            <Link href="/login" onClick={() => setIsMobileNavOpen(false)}>
                              {t("login")} / {t("register")}
                            </Link>
                          </Button>
                        )
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <Link className="flex items-center" href="/">
                <Logo
                  animated
                  iconClassName="h-10 w-10 p-1.5 sm:h-11 sm:w-11"
                  showText
                  textClassName="hidden text-[1.45rem] font-black tracking-tight text-slate-900 md:block"
                />
              </Link>
            </div>

            <div className="hidden flex-1 justify-center xl:flex">
              <MegaMenu featuredMatches={featuredMatches} navHeight={navHeight} />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                aria-label="Open search"
                className="h-11 w-11 rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                size="icon"
                variant="ghost"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                asChild
                className="relative h-11 w-11 rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                size="icon"
                variant="ghost"
              >
                <Link aria-label="Open ticket wallet" href={cartHref}>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </Link>
              </Button>

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {!isLoading ? (
                isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-11 rounded-full border border-slate-200/80 bg-white pl-3 pr-1.5 text-slate-700 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.42)] hover:border-emerald-200 hover:bg-emerald-50/60"
                        variant="ghost"
                      >
                        <div className="hidden min-w-0 items-end text-right lg:flex lg:flex-col">
                          <span className="truncate text-sm font-semibold text-slate-900">{user?.name}</span>
                          <span className="text-[11px] text-slate-500">{user?.balance.toLocaleString("vi-VN")}₫</span>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                          <UserIcon className="h-4 w-4" />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="mt-3 w-72 rounded-[28px] border border-white/80 bg-white/95 p-2 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] backdrop-blur-2xl"
                    >
                      <div className="rounded-[22px] border border-slate-200/80 bg-slate-50 p-4">
                        <div className="text-base font-semibold text-slate-900">{user?.name}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">{user?.email}</div>
                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                            Balance
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{user?.balance.toLocaleString("vi-VN")}₫</span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 font-medium text-slate-700">
                          <Link href="/history">
                            <Ticket className="mr-2 h-4 w-4 text-emerald-700" />
                            {t("my_tickets")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-2xl px-3 py-3 font-medium text-slate-700">
                          <Link href="/profile">
                            <Settings className="mr-2 h-4 w-4 text-emerald-700" />
                            {t("profile")}
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-2 bg-slate-200/80" />
                      <DropdownMenuItem className="rounded-2xl px-3 py-3 font-medium text-red-600 focus:bg-red-50 focus:text-red-700" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    asChild
                    className="h-11 rounded-full bg-[linear-gradient(135deg,#16a34a,#0ea5e9)] px-5 text-white shadow-[0_20px_50px_-28px_rgba(14,165,233,0.45)] hover:opacity-95"
                  >
                    <Link href="/login">
                      <UserIcon className="mr-2 h-4 w-4" />
                      {t("login")}
                    </Link>
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent
          className="max-w-3xl rounded-[32px] border border-white/80 bg-white/90 p-0 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.55)] backdrop-blur-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="border-b border-slate-200/80 px-6 pb-4 pt-6 text-left">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Search className="h-5 w-5" />
            </div>
            <DialogTitle className="pt-4 text-2xl font-heading font-black tracking-tight text-slate-950">{searchDialogTitle}</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-500">
              {searchDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 pt-5">
            <SearchBar />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
