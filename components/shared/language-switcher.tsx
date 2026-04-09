'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { routing, type AppLocale } from '@/i18n/routing';

export function LanguageSwitcher() {
    const locale = useLocale();
    const t = useTranslations('LanguageSwitcher');
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isMounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const [isPending, startTransition] = React.useTransition();

    function switchLanguage(newLocale: AppLocale) {
        const localePattern = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);
        const normalizedPath = pathname.replace(localePattern, '') || '/';
        const nextPath = normalizedPath === '/' ? `/${newLocale}` : `/${newLocale}${normalizedPath}`;
        const query = searchParams.toString();
        const nextUrl = query ? `${nextPath}?${query}` : nextPath;

        startTransition(() => {
            window.location.assign(nextUrl);
        });
    }

    if (!isMounted) {
        return (
            <Button
                variant="ghost"
                size="sm"
                aria-label={t('label')}
                className="theme-control-surface h-9 w-16 rounded-full px-0 text-[11px] font-bold uppercase tracking-widest will-change-auto"
            >
                {locale === 'en' ? (
                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-blue" /> EN</span>
                ) : (
                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-red" /> VI</span>
                )}
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('label')}
                    disabled={isPending}
                    className="theme-control-surface h-9 w-16 rounded-full px-0 text-[11px] font-bold uppercase tracking-widest will-change-auto"
                >
                    {locale === 'en' ? (
                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-blue" /> EN</span>
                    ) : (
                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-red" /> VI</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="theme-shell w-32 min-w-[8rem] rounded-2xl p-1.5">
                <DropdownMenuItem
                    className={`cursor-pointer rounded-xl text-sm font-medium ${locale === 'vi' ? 'bg-emerald-500/10 text-brand-green ' : 'theme-copy'}`}
                    disabled={isPending || locale === 'vi'}
                    onSelect={() => switchLanguage('vi')}
                >
                    {t('vi')}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer rounded-xl text-sm font-medium ${locale === 'en' ? 'bg-emerald-500/10 text-brand-green ' : 'theme-copy'}`}
                    disabled={isPending || locale === 'en'}
                    onSelect={() => switchLanguage('en')}
                >
                    {t('en')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
