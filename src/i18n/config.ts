export const defaultLocale = "ar" as const;

export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  ar: "العربية",
  en: "English",
};

export const dirs: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Cookie used to persist the visitor's chosen language across sessions. */
export const LOCALE_COOKIE = "rb_locale";
/**
 * Independent preference for the admin panel. Admins may run the backend in one
 * language while browsing the public site in the other, so this cookie is kept
 * separate from `LOCALE_COOKIE`. `getAdminLocale` falls back to the site
 * cookie when this one has never been set.
 */
export const ADMIN_LOCALE_COOKIE = "rb_admin_locale";
