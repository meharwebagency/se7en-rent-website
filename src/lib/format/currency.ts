/**
 * Shared currency formatting for the Omani Rial (OMR / ر.ع.).
 *
 * Prices are displayed as whole OMR amounts (no baisa decimals, e.g. "18 OMR").
 * Every price in the app must be displayed through these helpers — never
 * format currency ad-hoc in individual components.
 */

export const CURRENCY_CODE = "OMR";
export const CURRENCY_SYMBOL_AR = "ر.ع.";
export const CURRENCY_SYMBOL_EN = "OMR";

export type CurrencyLocale = "ar" | "en";

interface FormatCurrencyOptions {
  locale?: CurrencyLocale;
  /** Append the "per day" suffix. Defaults to false. */
  perDay?: boolean;
}

/**
 * Format a numeric OMR amount as a whole number (no decimals), e.g. "18 OMR"
 * or "١٨ ر.ع.". Stored decimal values are rounded to the nearest OMR for
 * display; pass the value in OMR (e.g. 18.5).
 */
export function formatOMR(
  amount: number,
  { locale = "en", perDay = false }: FormatCurrencyOptions = {}
): string {
  const currency = locale === "ar" ? CURRENCY_SYMBOL_AR : CURRENCY_SYMBOL_EN;

  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
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