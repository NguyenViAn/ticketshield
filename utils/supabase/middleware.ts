import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isRoutingLocale, routing } from "@/i18n/routing";
import { isAdminRoute, isAdminUser, isProtectedRoute, isUserProtectedRoute } from "@/utils/auth-routing";

function resolveLocale(request: NextRequest) {
  const detectedLocale = request.nextUrl.locale;
  if (isRoutingLocale(detectedLocale)) {
    return detectedLocale;
  }

  const [firstSegment] = request.nextUrl.pathname.split("/").filter(Boolean);
  if (isRoutingLocale(firstSegment)) {
    return firstSegment;
  }

  return routing.defaultLocale;
}

function buildRedirectTarget(request: NextRequest, locale: string) {
  const fullPath = `${request.nextUrl.pathname}${request.nextUrl.search}` || "/";
  if (fullPath === "/" || fullPath === "") {
    return `/${locale}`;
  }

  return fullPath;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options }),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const requiresAuth = isProtectedRoute(pathname);
  const adminRoute = isAdminRoute(pathname);
  const userProtectedRoute = isUserProtectedRoute(pathname);
  const userIsAdmin = isAdminUser(user?.user_metadata?.role);

  if (!user && requiresAuth) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = "";
    url.searchParams.set("redirect", buildRedirectTarget(request, locale));
    return NextResponse.redirect(url);
  }

  if (user && adminRoute && !userIsAdmin) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && userProtectedRoute && userIsAdmin) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/admin`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
