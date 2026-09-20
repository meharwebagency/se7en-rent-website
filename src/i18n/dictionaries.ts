import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import type { Locale } from "./config";
import { isLocale } from "./config";

import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";

/** Shape of every dictionary — derived from the English source of truth. */
export type Dictionary = typeof en;

const cached: Record<Locale, Dictionary> = {
  en,
  ar,
};

/** Synchronously get the dictionary for a known locale. */
export function getDictionaryFor(locale: Locale): Dictionary {
  return cached[locale];
}

/**
 * Load the dictionary for the current route locale.
 *
 * Only call from Server Components or server-side utilities — this uses the
 * `lang` root-param getter from `next/root-params`.
 */
export async function getDictionary(): Promise<Dictionary> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return cached[locale];
}
