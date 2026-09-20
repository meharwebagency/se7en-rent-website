/**
 * Vehicle domain model.
 *
 * Mirrors the `vehicles` table that will be generated into
 * `src/lib/supabase/database.types.ts`. Prices are stored in Omani Rial
 * with 3-decimal precision and formatted via the shared currency utility.
 */
export type Transmission = "automatic" | "manual";

export type VehicleStatus = "available" | "booked";

export interface Vehicle {
  id: string;
  /** URL-safe slug used for the detail route. */
  slug?: string;
  brand: string;
  model: string;
  /** Localized display name, e.g. "Toyota Camry" / "تويوتا كامري". */
  name?: string;
  name_ar?: string;
  type?: string;
  category?: string;
  category_ar?: string;
  year?: number;
  doors?: number;
  transmission?: Transmission;
  /** Price per day in OMR (3 decimals). */
  price_per_day: number;
  weekly_price?: number;
  monthly_price?: number;
  fuel_type?: string;
  color?: string;
  image_url?: string;
  image_url_ar?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  short_description?: string;
  features?: { ar?: string; en?: string }[];
  is_featured?: boolean;
  is_available?: boolean;
  /** Persisted status: available / booked. */
  status?: VehicleStatus;
  /** Storage path of the primary image. */
  image_path?: string | null;
  created_at?: string;
  updated_at?: string;
}
