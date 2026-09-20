import "server-only";

import { cookies } from "next/headers";

import type { Locale } from "@/i18n/config";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  ADMIN_LOCALE_COOKIE,
} from "@/i18n/config";
import {
  getDictionaryFor,
  type Dictionary,
} from "@/i18n/dictionaries";

/**
 * Admin area is locale-less in the URL (admin-only routes). The UI language is
 * read from the dedicated `rb_admin_locale` cookie so an admin's preference is
 * independent from the public site's. When the admin cookie has never been
 * set, it falls back to the site's `rb_locale` cookie, then to the site
 * default (Arabic).
 */
export async function getAdminLocale(): Promise<Locale> {
  const store = await cookies();
  const admin = store.get(ADMIN_LOCALE_COOKIE)?.value;
  if (isLocale(admin)) return admin;
  const shared = store.get(LOCALE_COOKIE)?.value;
  return isLocale(shared) ? shared : defaultLocale;
}

export async function getAdminDictionary(): Promise<Dictionary> {
  return getDictionaryFor(await getAdminLocale());
}

/** Full admin section of the dictionary, ready to hand to client components. */
export async function getAdminT(): Promise<Dictionary["admin"]> {
  return (await getAdminDictionary()).admin;
}

/**
 * Localized admin action messages (validation + server-side errors and
 * success toasts). Server actions read them through the same admin locale
 * cookie so the strings handed back to client components are already in the
 * admin's language.
 */
export async function adminMessages(): Promise<Dictionary["admin"]["messages"]> {
  return (await getAdminDictionary()).admin.messages;
}