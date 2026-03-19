import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    locales: ['vi', 'en'],
    defaultLocale: 'vi'
});

export type AppLocale = (typeof routing.locales)[number];

export function isRoutingLocale(locale: string | undefined | null): locale is AppLocale {
    return Boolean(locale) && routing.locales.includes(locale as AppLocale);
}

export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);
