import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
    const authResponse = await updateSession(request);

    if (authResponse.headers.has('location')) {
        return authResponse;
    }

    const intlResponse = intlMiddleware(request) as NextResponse;

    authResponse.cookies.getAll().forEach((cookie) => {
        intlResponse.cookies.set(cookie.name, cookie.value);
    });

    authResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        intlResponse.headers.set(key, value);
    });

    return intlResponse;
}

export const config = {
    matcher: ['/', '/(vi|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
