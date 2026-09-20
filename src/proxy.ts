import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";

/**
 * Locale routing proxy.
 *
 * Arabic (ar) is the default language. When a visitor hits a path without a
 * locale prefix, we redirect them to their preferred locale:
 *   - the persisted `rb_locale` cookie if it is valid, otherwise
 *   - the default (ar).
 *
 * This keeps clean, shared routes (no duplicated pages) while making Arabic
 * the default first-visit experience and persisting the user's choice.
 */
const LOCALE_PATTERN = /^\/(ar|en)(\/|$)/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle paths that don't already carry a locale prefix.
  if (LOCALE_PATTERN.test(pathname)) return NextResponse.next();

  // Special-case static/asset paths.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/admin") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals, API routes, static assets, and
  // metadata files.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
