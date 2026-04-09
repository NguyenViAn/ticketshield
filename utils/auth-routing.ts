import { isRoutingLocale, routing, type AppLocale } from "@/i18n/routing";

const USER_PROTECTED_ROUTE_REGEXES = [
  /^\/(en|vi)?\/?history(?:\/|$)/i,
  /^\/(en|vi)?\/?payment(?:\/|$)/i,
  /^\/(en|vi)?\/?profile(?:\/|$)/i,
];

const ADMIN_ROUTE_REGEX = /^\/(en|vi)?\/?admin(?:\/|$)/i;

export function isAdminUser(role: unknown) {
  return role === "admin";
}

export function isUserProtectedRoute(pathname: string) {
  return USER_PROTECTED_ROUTE_REGEXES.some((regex) => regex.test(pathname));
}

export function isAdminRoute(pathname: string) {
  return ADMIN_ROUTE_REGEX.test(pathname);
}

export function isProtectedRoute(pathname: string) {
  return isUserProtectedRoute(pathname) || isAdminRoute(pathname);
}

export function resolveRoutingLocale(value: string | null | undefined): AppLocale {
  if (isRoutingLocale(value)) {
    return value;
  }

  return routing.defaultLocale;
}

export function resolveLocaleFromPathname(pathname: string): AppLocale | null {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  if (isRoutingLocale(firstSegment)) {
    return firstSegment;
  }

  return null;
}

export function getDefaultRedirect(role: unknown, locale: AppLocale) {
  return isAdminUser(role) ? `/${locale}/admin` : `/${locale}`;
}

export function resolveRequestedRedirect(rawRedirect: string | null) {
  if (!rawRedirect || !rawRedirect.startsWith("/") || rawRedirect.startsWith("//")) {
    return null;
  }

  return rawRedirect === "/" ? null : rawRedirect;
}

export function resolveRoleAwareRedirect(rawRedirect: string | null, locale: AppLocale, role: unknown) {
  const requestedRedirect = resolveRequestedRedirect(rawRedirect);
  if (!requestedRedirect) {
    return getDefaultRedirect(role, locale);
  }

  if (isAdminUser(role) && isUserProtectedRoute(requestedRedirect)) {
    return getDefaultRedirect(role, resolveLocaleFromPathname(requestedRedirect) ?? locale);
  }

  return requestedRedirect;
}
