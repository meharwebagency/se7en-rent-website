import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SiteSettingsRow = Tables<"site_settings">;

export interface SiteSettings {
  companyNameAr: string | null;
  companyNameEn: string | null;
  email: string | null;
  phone: string | null;
  addressAr: string | null;
  addressEn: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  snapchatUrl: string | null;
}

/** Reads the singleton settings row. Returns null when not configured yet. */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    companyNameAr: data.company_name_ar,
    companyNameEn: data.company_name_en,
    email: data.email,
    phone: data.phone,
    addressAr: data.address_ar,
    addressEn: data.address_en,
    googleMapsUrl: data.google_maps_url,
    instagramUrl: data.instagram_url,
    tiktokUrl: data.tiktok_url,
    snapchatUrl: data.snapchat_url,
  };
}