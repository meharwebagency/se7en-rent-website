import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/i18n/config";

export type LocationRow = Tables<"locations">;

export interface PickupLocation {
  id: string;
  name: string;
  name_ar: string;
  name_en: string;
  address?: string | null;
  address_ar?: string | null;
  address_en?: string | null;
}

function pick(locale: Locale, ar?: string | null, en?: string | null) {
  return locale === "ar" ? ar : en;
}

/**
 * Active pickup/drop-off locations, localized.
 */
export async function getLocations(locale: Locale): Promise<PickupLocation[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("active", true)
    .order("name_en", { ascending: true });

  if (error || !data) {
    console.error("getLocations error:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: pick(locale, row.name_ar, row.name_en) ?? row.name_en,
    name_ar: row.name_ar,
    name_en: row.name_en,
    address: pick(locale, row.address_ar, row.address_en),
    address_ar: row.address_ar,
    address_en: row.address_en,
  }));
}