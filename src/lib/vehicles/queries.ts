import "server-only";

import { connection } from "next/server";

import type { Locale } from "@/i18n/config";
import type { Vehicle, Transmission } from "./types";

import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/** Backoff between retries (ms). */
const RETRY_BASE_DELAY_MS = 350;
/** How many attempts a transient Supabase failure gets before surfacing an error. */
const MAX_ATTEMPTS = 3;

/**
 * Returns true when Supabase server credentials are present. Used to avoid
 * throwing during builds / before the backend is configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Pick the localized display value from a pair of optional fields. */
function pick(ar?: string, en?: string, locale: Locale = "ar") {
  return locale === "ar" ? ar : en;
}

export type CarRow = Tables<"cars">;
export type CarImageRow = Tables<"car_images">;

interface VehicleFeature {
  ar?: string;
  en?: string;
}

function parseFeatures(value: unknown): VehicleFeature[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((f): VehicleFeature | null => {
      if (typeof f !== "object" || f === null) return null;
      const o = f as Record<string, unknown>;
      const entry: VehicleFeature = {};
      if (typeof o.ar === "string") entry.ar = o.ar;
      if (typeof o.en === "string") entry.en = o.en;
      return entry;
    })
    .filter((f): f is VehicleFeature => f !== null);
}

function mapVehicle(
  row: CarRow,
  images: Pick<CarImageRow, "image_url" | "sort_order">[],
  locale: Locale
): Vehicle {
  const transmission = (row.transmission as Transmission) ?? "automatic";

  const nameAr = `${row.brand} ${row.model}`;
  const nameEn = `${row.brand} ${row.model}`;

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    name: pick(nameAr, nameEn, locale),
    name_ar: nameAr,
    type: row.type,
    category: row.category,
    category_ar: row.category,
    year: row.year,
    doors: row.doors,
    transmission,
    price_per_day: Number(row.daily_price),
    weekly_price: row.weekly_price != null ? Number(row.weekly_price) : undefined,
    monthly_price: row.monthly_price != null ? Number(row.monthly_price) : undefined,
    fuel_type: row.fuel_type ?? undefined,
    color: row.color ?? undefined,
    image_url: firstImage(images),
    description: pick(
      row.description_ar ?? undefined,
      row.description_en ?? undefined,
      locale
    ),
    description_ar: row.description_ar ?? undefined,
    description_en: row.description_en ?? undefined,
    short_description: pick(
      row.short_description_ar ?? undefined,
      row.short_description_en ?? undefined,
      locale
    ),
    features: parseFeatures(row.features),
    is_featured: row.featured,
    is_available: row.status === "available",
    status: row.status,
    image_path: null,
    created_at: row.created_at,
  };
}

/**
 * First public image URL for a car. When an image row lives in Supabase
 * Storage its `image_url` is the public bucket URL already; arbitrary external
 * URLs are supported too.
 */
function firstImage(
  images: Pick<CarImageRow, "image_url" | "sort_order">[]
): string | undefined {
  // Undefined sort order (fallback 0) keeps the array stable and deterministic.
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.image_url ?? undefined;
}

/** Reads a `car_images` array safely out of a joined cars row. */
function joinedImages(
  row: CarRow & { car_images?: unknown[] },
): Pick<CarImageRow, "image_url" | "sort_order">[] {
  return (row.car_images ?? []) as Pick<CarImageRow, "image_url" | "sort_order">[];
}

interface VehiclesOptions {
  locale: Locale;
  featuredOnly?: boolean;
  limit?: number;
}

export interface FleetSnapshot {
  vehicles: Vehicle[];
  /** True when the Supabase call failed (vs. simply no rows yet). */
  error: boolean;
  /** Last failure message, when error is true. */
  errorMessage?: string;
}

/**
 * Fetch bookable (status = 'available') vehicles from Supabase, keeping track
 * of whether the fetch genuinely failed so pages can distinguish a DB error
 * from an empty fleet.
 *
 * Uses the service-role client (server only). When the backend isn't
 * configured the snapshot is empty without error, so the UI degrades to a
 * clean empty state.
 *
 * Runs at request time (never baked into a statically-prerendered page) so a
 * transient Supabase failure can't permanently poison a static cache.
 */
export async function listVehicles({
  locale,
  featuredOnly = false,
  limit = 100,
}: VehiclesOptions): Promise<FleetSnapshot> {
  if (!isSupabaseConfigured()) return { vehicles: [], error: false };

  await connection();

  let lastError: string | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const supabase = await createServerClient();

    let query = supabase
      .from("cars")
      .select("*, car_images (image_url, sort_order)")
      .eq("status", "available")
      .order("daily_price", { ascending: true })
      .limit(limit);

    if (featuredOnly) query = query.eq("featured", true);

    const { data, error } = await query;

    if (error) {
      lastError = error.message;
      console.error(
        `listVehicles attempt ${attempt + 1}/${MAX_ATTEMPTS} error: ${error.message}`,
      );
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BASE_DELAY_MS * (attempt + 1)),
        );
      }
      continue;
    }

    return {
      vehicles: (data ?? []).map((row) => mapVehicle(row, joinedImages(row), locale)),
      error: false,
    };
  }

  return { vehicles: [], error: true, errorMessage: lastError ?? undefined };
}

/**
 * Convenience wrapper preserving the error flag so callers can tell a
 * genuinely empty fleet apart from a failed Supabase query. Used by the
 * homepage featured grid.
 */
export async function getVehicles({
  locale,
  featuredOnly = false,
  limit = 12,
}: VehiclesOptions): Promise<FleetSnapshot> {
  return listVehicles({ locale, featuredOnly, limit });
}

interface GetVehicleByIdOptions {
  locale: Locale;
  id: string;
}

/**
 * Fetch a single car by id (server, all statuses). Returns the full row plus
 * its ordered image gallery — used by the detail page so it can distinguish
 * between an unavailable (booked) car, an invalid (unknown) id,
 * and a live listing.
 */
export async function getVehicleDetail({
  locale,
  id,
}: GetVehicleByIdOptions): Promise<{ vehicle: Vehicle; images: CarImageRow[] } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const { data: images, error: imagesError } = await supabase
    .from("car_images")
    .select("*")
    .eq("car_id", id)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    console.error("getVehicleDetail images error:", imagesError.message);
    return null;
  }

  return {
    vehicle: mapVehicle(
      data,
      (images ?? []) as Pick<CarImageRow, "image_url" | "sort_order">[],
      locale,
    ),
    images: images ?? [],
  };
}

/** Public single-car read used by the previous detail API (kept for compat). */
export async function getVehicleById({
  locale,
  id,
}: GetVehicleByIdOptions): Promise<Vehicle | null> {
  const detail = await getVehicleDetail({ locale, id });
  return detail?.vehicle ?? null;
}

/**
 * Live, date-range availability check for a set of cars. Wraps the database
 * `get_available_cars(pickup, return)` helper (uses the real overlap logic).
 * Returns the set of car ids that are bookable for the inclusive range.
 * Returns `null` when the backend isn't configured (UI treats as "no data").
 */
export async function getAvailableCarIdsForDates(
  pickupDate: string,
  returnDate: string,
): Promise<Set<string> | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("get_available_cars", {
    p_pickup_date: pickupDate,
    p_return_date: returnDate,
  });

  if (error) {
    console.error("getAvailableCarIdsForDates error:", error.message);
    return null;
  }

  return new Set((data ?? []).map((row) => row.id));
}

/**
 * Single-car availability probe (mirrors the public `check_car_availability`
 * helper). Returns `null` when the backend isn't configured.
 */
export async function isCarAvailableForDates(
  carId: string,
  pickupDate: string,
  returnDate: string,
): Promise<boolean | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("check_car_availability", {
    p_car_id: carId,
    p_pickup_date: pickupDate,
    p_return_date: returnDate,
  });

  if (error) {
    console.error("isCarAvailableForDates error:", error.message);
    return null;
  }

  return data === true;
}