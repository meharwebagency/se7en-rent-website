import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type {
  Database,
  Tables,
} from "@/lib/supabase/database.types";
import type { Locale } from "@/i18n/config";

type CarRow = Tables<"cars">;
type BookingRow = Tables<"bookings">;
type NotificationRow = Tables<"notifications">;
type BookingStatus = Database["public"]["Enums"]["booking_status"];

function nameFor(locale: Locale, ar?: string | null, en?: string | null): string {
  return (locale === "ar" ? ar : en) || en || ar || "";
}

// =============================================================================
// Dashboard
// =============================================================================

export interface DashboardData {
  vehicles: { total: number; available: number; booked: number };
  bookings: Record<BookingStatus, number>;
  recentBookings: RecentBooking[];
  availability: AvailabilityRow[];
  notifications: AdminNotification[];
}

export interface AdminNotification extends NotificationRow {
  /** Resolved booking id when the notification references a booking, else null. */
  bookingId: string | null;
}

export interface RecentBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  pickupDate: string;
  returnDate: string;
  totalPrice: number | null;
  createdAt: string;
  carName: string;
  customerName: string;
}

export interface AvailabilityRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  status: CarRow["status"];
  price: number;
  imageUrl: string | null;
  nextBookingPickup?: string | null;
  nextBookingReturn?: string | null;
}

// =============================================================================
// Visitor statistics (admin dashboard)
// =============================================================================

export interface VisitorStats {
  /** Total unique visitors (all time). */
  totalVisitors: number;
  /** Unique visitors first-seen today (local day boundary). */
  todayVisitors: number;
  /** Unique visitors first-seen in the last 7 days (including today). */
  weekVisitors: number;
  /** Unique visitors first-seen in the current calendar month. */
  monthVisitors: number;
  /** Total page views (all time). */
  totalViews: number;
  /** Daily page-view counts for the last 7 days (oldest → today). */
  dailyViews: Array<{ date: string; views: number }>;
}

/**
 * Aggregated visitor stats for the admin dashboard.
 *
 * All queries run against `page_views` / `page_visitors` with the service-role
 * client. Errors (e.g. tables not yet migrated) degrade to zero-filled stats
 * so the dashboard never breaks.
 */
export async function getVisitorStats(): Promise<VisitorStats> {
  const empty: VisitorStats = {
    totalVisitors: 0,
    todayVisitors: 0,
    weekVisitors: 0,
    monthVisitors: 0,
    totalViews: 0,
    dailyViews: buildDailyWindow(7).map((date) => ({ date, views: 0 })),
  };

  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    return empty;
  }

  const now = new Date();
  const startOfDay = startOfLocalDay(now);
  const sevenDaysAgo = addDays(startOfDay, -6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Unique visitors — count by first_seen (a visitor is "new" on the day they
  // first appear). Today/week/month each filter on first_seen.
  const [todayRes, weekRes, monthRes, allVisitorsRes] = await Promise.all([
    supabase.from("page_visitors").select("id", { count: "exact", head: true }).gte("first_seen", startOfDay.toISOString()),
    supabase.from("page_visitors").select("id", { count: "exact", head: true }).gte("first_seen", sevenDaysAgo.toISOString()),
    supabase.from("page_visitors").select("id", { count: "exact", head: true }).gte("first_seen", startOfMonth.toISOString()),
    supabase.from("page_visitors").select("id", { count: "exact", head: true }),
  ]);

  // Daily views for the last 7 calendar days.
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();
  const viewsRes = await supabase
    .from("page_views")
    .select("created_at")
    .gte("created_at", sevenDaysAgoIso);

  const dailyMap = new Map<string, number>();
  for (const row of viewsRes.data ?? []) {
    const key = localDayKey(new Date(row.created_at));
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const dailyViews = buildDailyWindow(7).map((date) => ({
    date,
    views: dailyMap.get(date) ?? 0,
  }));

  return {
    totalVisitors: allVisitorsRes.count ?? 0,
    todayVisitors: todayRes.count ?? 0,
    weekVisitors: weekRes.count ?? 0,
    monthVisitors: monthRes.count ?? 0,
    totalViews: dailyViews.reduce((sum, d) => sum + d.views, 0),
    dailyViews,
  };
}

// --- date helpers (local-timezone day boundaries) ---------------------------

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** "YYYY-MM-DD" local key for a date. */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Last N local-day keys, oldest first, ending today. */
function buildDailyWindow(n: number): string[] {
  const today = startOfLocalDay(new Date());
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(localDayKey(addDays(today, -i)));
  }
  return out;
}

export async function getAdminDashboardData(): Promise<DashboardData> {
  const supabase = await createServerClient();

  const [carsRes, bookingsRes, recentRes, notifRes] = await Promise.all([
    supabase
      .from("cars")
      .select("id, brand, model, year, status, daily_price, car_images(image_url, sort_order)"),
    supabase.from("bookings").select("status"),
    supabase
      .from("bookings")
      .select(
        "id, booking_reference, status, pickup_date, return_date, total_price, created_at, car_id(brand, model, year), customer_id(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const vehicles = { total: 0, available: 0, booked: 0 };
  const allRows = (carsRes.data ?? []).map((r) => r);
  for (const row of allRows) {
    vehicles.total += 1;
    if (row.status === "available") vehicles.available += 1;
    else vehicles.booked += 1;
  }

  const bookings: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const row of bookingsRes.data ?? []) {
    if (row.status in bookings) bookings[row.status] += 1;
  }

  const recentBookings: RecentBooking[] = (recentRes.data ?? []).map((row) => ({
    id: row.id,
    reference: row.booking_reference,
    status: row.status,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    totalPrice: row.total_price,
    createdAt: row.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    carName: `${(row as any).car_id?.brand ?? ""} ${(row as any).car_id?.model ?? ""}`.trim(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customerName: (row as any).customer_id?.full_name ?? "—",
  }));

  // Active overlaps per car → "next rental" windows for the availability card.
  const { data: overlaps } = await supabase
    .from("bookings")
    .select("car_id, pickup_date, return_date, status")
    .in("status", ["pending", "confirmed", "active"]);
  const overlapMap = new Map<string, { pickup: string; ret: string }>();
  for (const b of overlaps ?? []) {
    const existing = overlapMap.get(b.car_id);
    if (!existing || b.pickup_date < existing.pickup) {
      overlapMap.set(b.car_id, { pickup: b.pickup_date, ret: b.return_date });
    }
  }

  const availability: AvailabilityRow[] = [];
  for (const row of allRows) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imgs = (row as any).car_images as Array<{ image_url: string; sort_order?: number }> | undefined;
    const cover = [...(imgs ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )[0]?.image_url;
    const next = overlapMap.get(row.id);
    availability.push({
      id: row.id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      status: row.status,
      price: Number(row.daily_price),
      imageUrl: cover ?? null,
      nextBookingPickup: next?.pickup ?? null,
      nextBookingReturn: next?.ret ?? null,
    });
  }

  const notifications = notifRes.data ?? [];

  const refToBookingId = new Map<string, string>();
  const references = [...new Set(notifications.map((n) => n.reference).filter((r): r is string => Boolean(r)))];
  if (references.length > 0) {
    const { data: refBookings } = await supabase
      .from("bookings")
      .select("id, booking_reference")
      .in("booking_reference", references);
    for (const row of refBookings ?? []) refToBookingId.set(row.booking_reference, row.id);
  }

  return {
    vehicles,
    bookings,
    recentBookings,
    availability,
    notifications: notifications.map((n) => ({
      ...n,
      bookingId: n.reference ? (refToBookingId.get(n.reference) ?? null) : null,
    })),
  };
}

// =============================================================================
// Cars (admin)
// =============================================================================

export interface AdminCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  category: string;
  status: CarRow["status"];
  featured: boolean;
  dailyPrice: number;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
  transmission: CarRow["transmission"];
  color: string | null;
  imageUrl: string | null;
  images: Array<{
    id: string;
    image_url: string;
    alt_text_ar: string | null;
    alt_text_en: string | null;
    sort_order: number;
  }>;
  bookingCount: number;
}

export async function listAdminCars(): Promise<AdminCar[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(id, image_url, alt_text_ar, alt_text_en, sort_order)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminCars error:", error.message);
    return [];
  }

  const ids = (data ?? []).map((row) => row.id);
  let bookingMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: counts } = await supabase
      .from("bookings")
      .select("car_id")
      .in("car_id", ids);
    bookingMap = new Map<string, number>();
    for (const row of counts ?? []) {
      bookingMap.set(row.car_id, (bookingMap.get(row.car_id) ?? 0) + 1);
    }
  }

  return (data ?? []).map((row) => {
    const images = [...(row.car_images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      id: row.id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      type: row.type,
      category: row.category,
      status: row.status,
      featured: row.featured,
      dailyPrice: Number(row.daily_price),
      weeklyPrice: row.weekly_price != null ? Number(row.weekly_price) : null,
      monthlyPrice: row.monthly_price != null ? Number(row.monthly_price) : null,
      transmission: row.transmission,
      color: row.color,
      imageUrl: images[0]?.image_url ?? null,
      images,
      bookingCount: bookingMap.get(row.id) ?? 0,
    };
  });
}

export async function getAdminCar(id: string): Promise<AdminCar | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(id, image_url, alt_text_ar, alt_text_en, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const images = [...(data.car_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("car_id", id);
  return {
    id: data.id,
    brand: data.brand,
    model: data.model,
    year: data.year,
    type: data.type,
    category: data.category,
    status: data.status,
    featured: data.featured,
    dailyPrice: Number(data.daily_price),
    weeklyPrice: data.weekly_price != null ? Number(data.weekly_price) : null,
    monthlyPrice: data.monthly_price != null ? Number(data.monthly_price) : null,
    transmission: data.transmission,
    color: data.color,
    imageUrl: images[0]?.image_url ?? null,
    images,
    bookingCount: count ?? 0,
  };
}

// =============================================================================
// Bookings (admin)
// =============================================================================

export interface AdminBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  pickupDate: string;
  returnDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  totalPrice: number | null;
  notes: string | null;
  createdAt: string;
  vehicle: { brand: string; model: string; year: number } | null;
  customer: { full_name: string; email: string; phone: string } | null;
  location: { name_ar: string | null; name_en: string | null } | null;
}

export interface AdminBookingFilters {
  q?: string | null;
  status?: BookingStatus | "all" | null;
  sort?: "newest" | "oldest" | "price_high" | "price_low" | null;
  limit?: number;
}

export async function listAdminBookings(
  filters: AdminBookingFilters = {},
): Promise<AdminBooking[]> {
  const supabase = await createServerClient();
  const q = filters.q?.trim() ?? "";
  const sort = filters.sort ?? "newest";

  let query = supabase
    .from("bookings")
    .select(
      "*, car_id(brand, model, year), customer_id(full_name, email, phone), pickup_location_id(name_ar, name_en)",
    );

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (q) {
    // Match by booking reference OR customer name/email.
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    const customerIds = customers?.map((c) => c.id) ?? [];
    const filter: string[] = [`booking_reference.ilike.%${q}%`];
    if (customerIds.length > 0) {
      filter.push(`customer_id.in.(${customerIds.join(",")})`);
    }
    query = query.or(filter.join(","));
  }

  const ordered =
    sort === "oldest"
      ? query.order("created_at", { ascending: true })
      : sort === "price_high"
        ? query.order("total_price", { ascending: false, nullsFirst: false })
        : sort === "price_low"
          ? query.order("total_price", { ascending: true, nullsFirst: false })
          : query.order("created_at", { ascending: false });

  const { data, error } = await ordered.limit(filters.limit ?? 250);
  if (error) {
    console.error("listAdminBookings error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({ ...toAdminBooking(row) }));
}

export async function getAdminBooking(id: string): Promise<AdminBooking | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, car_id(brand, model, year), customer_id(full_name, email, phone), pickup_location_id(name_ar, name_en)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toAdminBooking(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAdminBooking(row: any): AdminBooking {
  return {
    id: row.id,
    reference: row.booking_reference,
    status: row.status,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    pickupTime: row.pickup_time,
    returnTime: row.return_time,
    totalPrice: row.total_price,
    notes: row.notes,
    createdAt: row.created_at,
    vehicle: row.car_id ? { ...row.car_id } : null,
    customer: row.customer_id ? { ...row.customer_id } : null,
    location: row.pickup_location_id ? { ...row.pickup_location_id } : null,
  };
}

// =============================================================================
// Customers (admin)
// =============================================================================

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  nationality: string | null;
  drivingLicense: string | null;
  createdAt: string;
  bookings: Array<{
    id: string;
    reference: string;
    status: BookingStatus;
    totalPrice: number | null;
    createdAt: string;
    pickupDate: string;
    returnDate: string;
  }>;
}

export async function listAdminCustomers(q?: string | null): Promise<AdminCustomer[]> {
  const supabase = await createServerClient();
  const term = q?.trim() ?? "";

  let query = supabase
    .from("customers")
    .select(
      "*, bookings(id, booking_reference, status, total_price, created_at, pickup_date, return_date)",
    );

  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) {
    console.error("listAdminCustomers error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    nationality: row.nationality,
    drivingLicense: row.driving_license_number,
    createdAt: row.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookings: (row as any).bookings ?? [],
  }));
}

// =============================================================================
// Locations (admin)
// =============================================================================

export async function listAdminLocations() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name_en", { ascending: true });
  if (error) {
    console.error("listAdminLocations error:", error.message);
    return [];
  }
  return data ?? [];
}

// =============================================================================
// Site settings (admin / super admin)
// =============================================================================

export interface AdminSiteSettings {
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
  businessHours: string | null;
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettings | null> {
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
    businessHours: data.business_hours,
  };
}

// =============================================================================
// Admin users (super admin only)
// =============================================================================

export interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: Database["public"]["Enums"]["admin_role"];
  createdAt: string;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createServerClient();
  const { data: admins, error } = await supabase
    .from("admins")
    .select("id, user_id, role, created_at")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listAdminUsers error:", error.message);
    return [];
  }

  const emailById = new Map<string, string>();
  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!usersError) {
      for (const user of users.users) emailById.set(user.id, user.email ?? "");
    }
  } catch (err) {
    console.error("listAdminUsers auth fetch error:", err);
  }

  return (admins ?? []).map((admin) => ({
    id: admin.id,
    userId: admin.user_id,
    email: emailById.get(admin.user_id) ?? "—",
    role: admin.role,
    createdAt: admin.created_at,
  }));
}

/** Convenience for the availability overview (used by the car table too). */
export function localizedCarName(
  locale: Locale,
  brand: string,
  model: string,
): string {
  return `${brand} ${model}`;
}

export type { CarRow, BookingRow, NotificationRow };
export { nameFor };