import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isRoutingLocale, routing } from "@/i18n/routing";

const PROTECTED_ROUTE_REGEXES = [
  /^\/(en|vi)?\/?history/i,
  /^\/(en|vi)?\/?payment/i,
  /^\/(en|vi)?\/?profile/i,
  /^\/(en|vi)?\/?admin/i,
];

const ADMIN_ROUTE_REGEX = /^\/(en|vi)?\/?admin/i;

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

function isAdminUser(role: unknown) {
  return role === "admin";
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
  const isProtectedRoute = PROTECTED_ROUTE_REGEXES.some((regex) => regex.test(pathname));
  const isAdminRoute = ADMIN_ROUTE_REGEX.test(pathname);

  if (!user && isProtectedRoute) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = "";
    url.searchParams.set("redirect", buildRedirectTarget(request, locale));
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute && !isAdminUser(user.user_metadata?.role)) {
    const locale = resolveLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
