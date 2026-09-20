"use server";

import { cookies } from "next/headers";

import { ADMIN_LOCALE_COOKIE, LOCALE_COOKIE, isLocale } from "@/i18n/config";

/**
 * Persist the visitor's chosen locale in an `rb_locale` cookie so their
 * language preference survives across navigation and returning sessions.
 */
export async function setLocaleCookie(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}

/**
 * Persist the admin panel's own language preference in a separate
 * `rb_admin_locale` cookie so admins can run the backend in a different
 * language from the public site. Uses the exact same mechanism as the public
 * site's switcher (cookie via server action), just a distinct cookie name.
 */
export async function setAdminLocaleCookie(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(ADMIN_LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}
