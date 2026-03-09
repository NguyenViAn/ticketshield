import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    // Run Supabase Auth updateSession
    const authResponse = await updateSession(request);

    // If Supabase middleware initiated a redirect (e.g. auth guard), forward it.
    if (authResponse.headers.has('location')) {
        return authResponse;
    }

    // Run next-intl middleware
    const intlResponse = intlMiddleware(request) as NextResponse;

    // Merge Supabase cookies/headers into the i18n response to keep auth active
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
    // Match only internationalized pathnames
    matcher: ['/', '/(vi|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)']
};
