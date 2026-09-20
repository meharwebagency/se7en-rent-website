"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAdmin,
  requireCanDeleteCar,
} from "@/lib/admin/authorization";
import { adminMessages } from "@/lib/admin/i18n";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  CAR_IMAGE_BUCKET,
  uploadCarImage,
} from "@/lib/storage/car-images";
import { validatePhoneNumber } from "@/lib/utils/phone";

type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];
type CarStatus = Database["public"]["Enums"]["car_status"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];
type AdminRole = Database["public"]["Enums"]["admin_role"];

type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; field?: string; error: string };

function clean(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function cleanNum(v: number | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const VEHICLE_CATEGORIES = ["economy", "mid-range", "luxury", "sport"] as const;

function vehicleCategoryPayload(input: {
  category?: string;
}): { ok: true; category: string } | { ok: false } {
  const category = input.category ?? "";
  if (!VEHICLE_CATEGORIES.includes(category as (typeof VEHICLE_CATEGORIES)[number])) {
    return { ok: false };
  }
  return { ok: true, category };
}

// =============================================================================
// Vehicles
// =============================================================================

export async function adminCreateVehicle(
  input: Omit<CarInsert, "id" | "created_at" | "updated_at">,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  if (!input.brand?.trim() || !input.model?.trim()) {
    return { ok: false, field: "brand", error: m.brandModelRequired };
  }
  if (!(input.daily_price >= 0)) {
    return { ok: false, field: "daily_price", error: m.priceRequired };
  }
  if (!Number.isInteger(input.daily_price)) {
    return { ok: false, field: "daily_price", error: m.priceInvalid };
  }
  if (
    input.weekly_price != null &&
    (!Number.isInteger(input.weekly_price) || input.weekly_price < 0)
  ) {
    return { ok: false, field: "weekly_price", error: m.priceInvalid };
  }
  if (
    input.monthly_price != null &&
    (!Number.isInteger(input.monthly_price) || input.monthly_price < 0)
  ) {
    return { ok: false, field: "monthly_price", error: m.priceInvalid };
  }
  const categoryPayload = vehicleCategoryPayload(input);
  if (!categoryPayload.ok) {
    return { ok: false, field: "category", error: m.invalidCategory };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("cars")
    .insert({ ...input, category: categoryPayload.category })
    .select("id")
    .single();

  if (error) {
    console.error("adminCreateVehicle error:", error.message);
    return { ok: false, error: m.vehicleCreateFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: data?.id, message: m.vehicleCreated };
}

export async function adminUpdateVehicle(
  id: string,
  input: Omit<CarInsert, "id" | "created_at" | "updated_at">,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  if (!input.brand?.trim() || !input.model?.trim()) {
    return { ok: false, field: "brand", error: m.brandModelRequired };
  }
  if (!(input.daily_price >= 0)) {
    return { ok: false, field: "daily_price", error: m.priceRequired };
  }
  if (!Number.isInteger(input.daily_price)) {
    return { ok: false, field: "daily_price", error: m.priceInvalid };
  }
  if (
    input.weekly_price != null &&
    (!Number.isInteger(input.weekly_price) || input.weekly_price < 0)
  ) {
    return { ok: false, field: "weekly_price", error: m.priceInvalid };
  }
  if (
    input.monthly_price != null &&
    (!Number.isInteger(input.monthly_price) || input.monthly_price < 0)
  ) {
    return { ok: false, field: "monthly_price", error: m.priceInvalid };
  }
  const categoryPayload = vehicleCategoryPayload(input);
  if (!categoryPayload.ok) {
    return { ok: false, field: "category", error: m.invalidCategory };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("cars")
    .update({ ...input, category: categoryPayload.category })
    .eq("id", id);
  if (error) {
    console.error("adminUpdateVehicle error:", error.message);
    return { ok: false, error: m.vehicleUpdateFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.vehicleUpdated };
}

export async function adminSetVehicleStatus(
  id: string,
  status: CarStatus,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("cars").update({ status }).eq("id", id);
  if (error) {
    console.error("adminSetVehicleStatus error:", error.message);
    return { ok: false, error: m.vehicleStatusUpdateFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.vehicleStatusUpdated };
}

/** Permanent deletion. Only super_admins may delete cars with booking history. */
export async function adminDeleteVehicle(id: string): Promise<ActionResult> {
  let ctx;
  const m = await adminMessages();
  try {
    ctx = await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  try {
    await requireCanDeleteCar(ctx, id);
  } catch {
    return {
      ok: false,
      error: m.deleteNeedsSuperAdmin,
    };
  }

  const supabase = await createServerClient();

  // Remove uploaded gallery objects first so storage does not leak orphaned
  // files (the car_images rows themselves go down with the car via cascade).
  const { data: images } = await supabase
    .from("car_images")
    .select("image_url")
    .eq("car_id", id);
  for (const image of images ?? []) {
    await removeImageStorageObject(image.image_url);
  }

  // Super admins may delete vehicles with booking history. bookings.car_id is
  // ON DELETE RESTRICT, so the booking rows must be removed before the car.
  if (ctx.isSuperAdmin) {
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .eq("car_id", id);
    if (bookingsError) {
      console.error("adminDeleteVehicle bookings error:", bookingsError.message);
      return { ok: false, error: m.vehicleDeleteFailed };
    }
  }

  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteVehicle error:", error.message);
    return { ok: false, error: m.vehicleDeleteFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.vehicleDeleted };
}

/** Uploads an image and attaches it to a vehicle. */
export async function adminUploadVehicleImage(
  carId: string,
  file: File,
  opts?: { altTextAr?: string; altTextEn?: string; sortOrder?: number },
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const upload = await uploadCarImage(file, `vehicles/${carId}`);
  if (!upload.ok) return { ok: false, error: upload.error };

  const supabase = await createServerClient();
  const { error } = await supabase.from("car_images").insert({
    car_id: carId,
    image_url: upload.publicUrl,
    alt_text_ar: clean(opts?.altTextAr),
    alt_text_en: clean(opts?.altTextEn),
    sort_order: opts?.sortOrder ?? 0,
  });

  if (error) {
    console.error("adminUploadVehicleImage error:", error.message);
    return { ok: false, error: m.imageAttachFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.imageUploaded };
}

/**
 * Best-effort removal of a storage object when its `image_url` points into the
 * public 'car-images' bucket. External (non-bucket) URLs are left untouched.
 */
async function removeImageStorageObject(imageUrl: string): Promise<void> {
  const base = process.env.SUPABASE_URL;
  if (!base) return;
  const marker = `${base}/storage/v1/object/public/${CAR_IMAGE_BUCKET}/`;
  if (!imageUrl.startsWith(marker)) return;
  const objectPath = decodeURIComponent(imageUrl.slice(marker.length));
  if (!objectPath) return;

  const supabase = await createServerClient();
  await supabase.storage.from(CAR_IMAGE_BUCKET).remove([objectPath]);
}

/**
 * Persists the final image set for a vehicle: assigns `sort_order` from the
 * supplied order (first = cover) and deletes rows that were removed. New files
 * must be uploaded separately through POST /admin/api/car-images (returns the
 * row ids used here).
 */
export async function adminSaveCarImages(
  carId: string,
  ordered: string[],
  remove: string[] = [],
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();

  const { data: car } = await supabase
    .from("cars")
    .select("id")
    .eq("id", carId)
    .maybeSingle();
  if (!car) return { ok: false, error: m.vehicleNotFound };

  for (const id of remove) {
    const { data: row } = await supabase
      .from("car_images")
      .select("image_url")
      .eq("id", id)
      .eq("car_id", carId)
      .maybeSingle();
    if (!row) continue;
    await removeImageStorageObject(row.image_url);
    await supabase.from("car_images").delete().eq("id", id);
  }

  for (let i = 0; i < ordered.length; i++) {
    await supabase
      .from("car_images")
      .update({ sort_order: i })
      .eq("id", ordered[i])
      .eq("car_id", carId);
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.imagesUpdated };
}

// =============================================================================
// Bookings
// =============================================================================

export async function adminUpdateBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) {
    console.error("adminUpdateBookingStatus error:", error.message);
    return {
      ok: false,
      error: error.message.includes("car_already_booked")
        ? m.bookingDatesConflict
        : m.bookingUpdateFailed,
    };
  }

  return { ok: true, message: m.bookingStatusUpdated };
}

/**
 * Permanently deletes a booking. Also removes any dashboard notifications
 * that reference the booking (linked by `booking_reference`), so the
 * notification panel never points at a deleted booking.
 */
export async function adminDeleteBooking(id: string): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_reference")
    .eq("id", id)
    .maybeSingle();
  if (!booking) {
    return { ok: false, error: m.bookingNotFound };
  }

  if (booking.booking_reference) {
    const { error: notifError } = await supabase
      .from("notifications")
      .delete()
      .eq("reference", booking.booking_reference);
    if (notifError) {
      console.error("adminDeleteBooking notifications error:", notifError.message);
    }
  }

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteBooking error:", error.message);
    return { ok: false, error: m.bookingDeleteFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.bookingDeleted };
}

// =============================================================================
// Sites settings (super_admin only)
// =============================================================================

export async function adminUpdateSiteSettings(input: {
  companyNameAr?: string;
  companyNameEn?: string;
  email?: string;
  phone?: string;
  addressAr?: string;
  addressEn?: string;
  googleMapsUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  snapchatUrl?: string;
  businessHours?: string;
  allowInternationalPhone?: boolean;
}): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  if (input.phone) {
    const phone = validatePhoneNumber(input.phone, {
      allowInternational: input.allowInternationalPhone ?? false,
    });
    if (!phone.ok) return { ok: false, field: "phone", error: m.invalidPhone };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      company_name_ar: clean(input.companyNameAr),
      company_name_en: clean(input.companyNameEn),
      email: clean(input.email),
      phone: clean(input.phone),
      address_ar: clean(input.addressAr),
      address_en: clean(input.addressEn),
      google_maps_url: clean(input.googleMapsUrl),
      instagram_url: clean(input.instagramUrl),
      tiktok_url: clean(input.tiktokUrl),
      snapchat_url: clean(input.snapchatUrl),
      business_hours: clean(input.businessHours),
    })
    .eq("id", 1);

  if (error) {
    console.error("adminUpdateSiteSettings error:", error.message);
    return { ok: false, error: m.settingsUpdateFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.settingsUpdated };
}

// =============================================================================
// Admin accounts (super_admin only)
// =============================================================================

export async function adminCreateAdmin(
  email: string,
  role: AdminRole,
  temporaryPassword: string,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, field: "email", error: m.emailRequired };
  }
  if (temporaryPassword.length < 8) {
    return { ok: false, field: "password", error: m.passwordTooShort };
  }

  const supabase = await createServerClient();
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (error || !user.user) {
    return { ok: false, error: m.adminCreateFailed };
  }

  const { error: adminError } = await supabase.from("admins").insert({
    user_id: user.user.id,
    role,
  });
  if (adminError) {
    console.error("adminCreateAdmin error:", adminError.message);
    return { ok: false, error: m.adminGrantFailed };
  }

  return { ok: true, message: m.adminCreated };
}

export async function adminUpdateAdminRole(
  adminId: string,
  role: AdminRole,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("admins").update({ role }).eq("id", adminId);
  if (error) {
    console.error("adminUpdateAdminRole error:", error.message);
    return { ok: false, error: m.roleUpdateFailed };
  }

  return { ok: true, message: m.roleUpdated };
}

export async function adminRemoveAdmin(adminId: string): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  const supabase = await createServerClient();
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("id", adminId)
    .maybeSingle();

  if (adminRow) {
    const { error: delRowError } = await supabase
      .from("admins")
      .delete()
      .eq("id", adminId);
    if (delRowError) {
      console.error("adminRemoveAdmin error:", delRowError.message);
      return { ok: false, error: m.adminRemoveFailed };
    }
    if (adminRow.user_id) {
      await supabase.auth.admin.deleteUser(adminRow.user_id);
    }
  }

  return { ok: true, message: m.adminRemoved };
}

// =============================================================================
// Locations (admin)
// =============================================================================

export async function adminUpsertLocation(input: {
  id?: string;
  nameAr: string;
  nameEn: string;
  addressAr?: string;
  addressEn?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  openingHours?: string;
  active?: boolean;
}): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  if (!input.nameAr?.trim() || !input.nameEn?.trim()) {
    return { ok: false, field: "name", error: m.nameRequired };
  }

  const supabase = await createServerClient();
  const payload: Database["public"]["Tables"]["locations"]["Insert"] = {
    name_ar: input.nameAr.trim(),
    name_en: input.nameEn.trim(),
    address_ar: clean(input.addressAr),
    address_en: clean(input.addressEn),
    latitude: cleanNum(input.latitude),
    longitude: cleanNum(input.longitude),
    phone: clean(input.phone),
    opening_hours: clean(input.openingHours),
    active: input.active ?? true,
  };

  const { error } = input.id
    ? await supabase.from("locations").update(payload).eq("id", input.id)
    : await supabase.from("locations").insert(payload);

  if (error) {
    console.error("adminUpsertLocation error:", error.message);
    return { ok: false, error: m.locationSaveFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.locationSaved };
}

export async function adminDeleteLocation(id: string): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) {
    console.error("adminDeleteLocation error:", error.message);
    return { ok: false, error: m.locationDeleteFailed };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: m.locationDeleted };
}

// =============================================================================
// Authentication (admin login page)
// =============================================================================

export async function adminSignIn(
  email: string,
  password: string,
): Promise<ActionResult & { redirectTo?: string }> {
  const m = await adminMessages();
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return { ok: false, field: "email", error: m.credentialsRequired };
  }

  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: m.invalidCredentials };
  }

  // Verify the authenticated user is actually an admin (service-side lookup,
  // independent of row-level policies on `admins`).
  const server = await createServerClient();
  const { data: adminRow } = await server
    .from("admins")
    .select("id, role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { ok: false, error: m.notAuthorized };
  }

  return { ok: true, redirectTo: "/admin" };
}

export async function adminSignOut(): Promise<void> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// =============================================================================
// Notifications (admin dashboard)
// =============================================================================

export async function adminNotificationsReadAll(): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) {
    console.error("adminNotificationsReadAll error:", error.message);
    return { ok: false, error: m.notificationsUpdateFailed };
  }

  return { ok: true };
}

export async function adminNotificationsClear(): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: m.accessRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("notifications").delete().neq("id", "");
  if (error) {
    console.error("adminNotificationsClear error:", error.message);
    return { ok: false, error: m.notificationsClearFailed };
  }

  return { ok: true };
}

// =============================================================================
// Admin accounts — grant / revoke access (super_admin only)
// =============================================================================

export async function adminGrantAccess(
  email: string,
  role: AdminRole,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, field: "email", error: m.emailRequired };
  }

  const supabase = await createServerClient();

  // The account must already exist in Supabase Auth (they sign in with it).
  const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = userList?.users.find(
    (u) => u.email?.toLowerCase() === normalized,
  );
  if (!existing) {
    return {
      ok: false,
      field: "email",
      error: m.noAccountFound,
    };
  }

  const { data: alreadyAdmin } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", existing.id)
    .maybeSingle();
  if (alreadyAdmin) {
    return { ok: false, field: "email", error: m.alreadyAdmin };
  }

  const { error } = await supabase.from("admins").insert({
    user_id: existing.id,
    role,
  });
  if (error) {
    console.error("adminGrantAccess error:", error.message);
    return { ok: false, error: m.grantFailed };
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message: m.accessGranted };
}

export async function adminSetAdminRole(
  adminId: string,
  role: AdminRole,
): Promise<ActionResult> {
  const m = await adminMessages();
  try {
    const ctx = await requireAdmin("super_admin");
    if (ctx.admin.id === adminId) {
      return { ok: false, error: m.cannotChangeOwnRole };
    }
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("admins").update({ role }).eq("id", adminId);
  if (error) {
    console.error("adminSetAdminRole error:", error.message);
    return { ok: false, error: m.roleUpdateFailed };
  }

  return { ok: true, message: m.roleUpdated };
}

/** Revokes the admins row only — the auth account stays intact. */
export async function adminRevokeAccess(adminId: string): Promise<ActionResult> {
  let ctx;
  const m = await adminMessages();
  try {
    ctx = await requireAdmin("super_admin");
  } catch {
    return { ok: false, error: m.superAdminRequired };
  }

  const supabase = await createServerClient();
  const { data: target } = await supabase
    .from("admins")
    .select("user_id")
    .eq("id", adminId)
    .maybeSingle();

  if (target?.user_id === ctx.user.id) {
    return { ok: false, error: m.cannotRevokeSelf };
  }

  const { error } = await supabase.from("admins").delete().eq("id", adminId);
  if (error) {
    console.error("adminRevokeAccess error:", error.message);
    return { ok: false, error: m.revokeFailed };
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message: m.accessRevoked };
}