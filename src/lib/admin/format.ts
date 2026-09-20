import type { Locale } from "@/i18n/config";

/** Human-friendly date for a YYYY-MM-DD (or ISO timestamp) value. */
export function formatAdminDate(
  value: string,
  locale: Locale,
  withTime = false,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-GB", opts).format(date);
}

/** Relative-ish timestamp for notification lists. */
export function formatAgo(value: string, locale: Locale): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(date.getTime()) || diff < 0) return formatAdminDate(value, locale, true);

  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return locale === "ar" ? "الآن" : "just now";
  if (mins < 60) return locale === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === "ar" ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "ar" ? `منذ ${days} يوم` : `${days}d ago`;
  return formatAdminDate(value, locale, true);
}