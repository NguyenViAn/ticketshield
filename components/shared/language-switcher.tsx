'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    function switchLanguage(newLocale: 'en' | 'vi') {
        router.replace(pathname, { locale: newLocale });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-16 px-0 font-bold tracking-widest text-[11px] uppercase bg-transparent hover:bg-slate-50 text-slate-600">
                    {locale === 'en' ? (
                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-blue" /> EN</span>
                    ) : (
                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-brand-red" /> VI</span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 min-w-[8rem]">
                <DropdownMenuItem
                    className={`cursor-pointer font-medium text-sm ${locale === 'vi' ? 'bg-slate-50 text-brand-green' : ''}`}
                    onClick={() => switchLanguage('vi')}
                >
                    🇻🇳 Tiếng Việt
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer font-medium text-sm ${locale === 'en' ? 'bg-slate-50 text-brand-green' : ''}`}
                    onClick={() => switchLanguage('en')}
                >
                    🇬🇧 English
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
