import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing';

const PROTECTED_ROUTE_REGEXES = [
    /^\/(en|vi)?\/?history/i,
    /^\/(en|vi)?\/?payment/i,
    /^\/(en|vi)?\/?profile/i,
];

function resolveLocale(request: NextRequest) {
    const detectedLocale = request.nextUrl.locale;
    if (detectedLocale && routing.locales.includes(detectedLocale as any)) {
        return detectedLocale;
    }

    const [firstSegment] = request.nextUrl.pathname.split('/').filter(Boolean);
    if (firstSegment && routing.locales.includes(firstSegment as any)) {
        return firstSegment;
    }

    return routing.defaultLocale;
}

function buildRedirectTarget(request: NextRequest, locale: string) {
    const fullPath = `${request.nextUrl.pathname}${request.nextUrl.search}` || '/';
    if (fullPath === '/' || fullPath === '') {
        return `/${locale}`;
    }
    return fullPath;
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set({ name, value, ...options })
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname;
    const isProtectedRoute = PROTECTED_ROUTE_REGEXES.some((regex) => regex.test(pathname));

    if (!user && isProtectedRoute) {
        const locale = resolveLocale(request);
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/login`
        url.search = ''
        url.searchParams.set('redirect', buildRedirectTarget(request, locale))
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
