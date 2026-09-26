/**
 * Shared currency formatting for the Bahraini Dinar (BHD / د.ب).
 *
 * Prices are displayed as whole BHD amounts (no decimals, e.g. "18 BHD").
 * Every price in the app must be displayed through these helpers — never
 * format currency ad-hoc in individual components.
 */

export const CURRENCY_CODE = "BHD";
export const CURRENCY_SYMBOL_AR = "د.ب";
export const CURRENCY_SYMBOL_EN = "BHD";

export type CurrencyLocale = "ar" | "en";

interface FormatCurrencyOptions {
  locale?: CurrencyLocale;
  /** Append the "per day" suffix. Defaults to false. */
  perDay?: boolean;
}

/**
 * Format a numeric BHD amount as a whole number (no decimals), e.g. "18 BHD"
 * or "١٨ د.ب". Stored decimal values are rounded to the nearest BHD for
 * display; pass the value in BHD (e.g. 18.5).
 */
export function formatOMR(
  amount: number,
  { locale = "en", perDay = false }: FormatCurrencyOptions = {}
): string {
  const currency = locale === "ar" ? CURRENCY_SYMBOL_AR : CURRENCY_SYMBOL_EN;

  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-BH" : "en-BH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

  const suffix = perDay ? (locale === "ar" ? " / يوم" : " / day") : "";

  return `${formatted} ${currency}${suffix}`;
}

/** Whole-number form used in dense UIs (e.g. tables) — same output as formatOMR. */
export function formatOMRCompact(
  amount: number,
  locale: CurrencyLocale = "en"
): string {
  return formatOMR(amount, { locale });
}