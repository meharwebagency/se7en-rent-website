import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { validatePhoneNumber } from "@/lib/utils/phone";
import { createAdminNotification } from "@/lib/admin/notifications";

export type BookingRow = Tables<"bookings">;
export type CarRow = Tables<"cars">;
export type CustomerRow = Tables<"customers">;

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export interface CreateBookingInput {
  fullName: string;
  email: string;
  phone: string;
  nationality?: string | null;
  drivingLicenseNumber?: string | null;
  allowInternationalPhone?: boolean;
  carId: string;
  pickupLocationId?: string | null;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  pickupTime?: string | null;
  returnTime?: string | null;
  notes?: string | null;
}

export type CreateBookingResult =
  | { ok: true; booking: BookingRow }
  | { ok: false; field?: string; error: string };

export function daysBetween(pickupDate: string, returnDate: string): number {
  const start = new Date(`${pickupDate}T00:00:00Z`);
  const end = new Date(`${returnDate}T00:00:00Z`);
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.round(ms / 86_400_000) + 1; // inclusive days
}

function priceForDays(dailyPrice: number, days: number): number {
  const total = dailyPrice * days;
  return Math.round(total); // BHD whole numbers
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isDateInFuture(value: string): boolean {
  const day = new Date(`${value}T00:00:00Z`).getTime();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return day >= today.getTime();
}

/**
 * Validates the input and persists a booking request (status = 'pending').
 *
 * Race-safety: the final authority is the database — the INSERT is rejected by
 * the `bookings_no_overlap` EXCLUDE constraint (and the availability trigger)
 * when another pending/confirmed/active booking overlaps the same car, so two
 * concurrent requests can never both succeed.
 */
export async function createBookingRequest(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const supabase = await createServerClient();

  // ---- validation ---------------------------------------------------------
  if (!input.fullName.trim()) {
    return { ok: false, field: "fullName", error: "Full name is required." };
  }
  const hasEmail = Boolean(input.email.trim());
  if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, field: "email", error: "A valid email is required." };
  }

  const phone = validatePhoneNumber(input.phone, {
    allowInternational: input.allowInternationalPhone ?? false,
  });
  if (!phone.ok) {
    return { ok: false, field: "phone", error: phone.error };
  }

  if (!isValidDate(input.pickupDate) || !isValidDate(input.returnDate)) {
    return { ok: false, field: "dates", error: "Invalid pickup or return date." };
  }
  if (!isDateInFuture(input.pickupDate)) {
    return { ok: false, field: "pickupDate", error: "Pickup date must be today or later." };
  }
  if (input.returnDate < input.pickupDate) {
    return { ok: false, field: "returnDate", error: "Return date must be after the pickup date." };
  }

  // ---- fetch the car (service role, RLS bypassed deliberately) -----------
  const { data: car, error: carError } = await supabase
    .from("cars")
    .select("*")
    .eq("id", input.carId)
    .maybeSingle();
  if (carError || !car) {
    return { ok: false, field: "carId", error: "Vehicle not found." };
  }
  if (car.status !== "available") {
    return {
      ok: false,
      field: "carId",
      error: "This vehicle is not currently bookable.",
    };
  }

  // ---- customer: reuse by (email, phone) / phone alone, else create ------
  const normalizedEmail = hasEmail ? input.email.trim().toLowerCase() : null;
  let customerQuery = supabase.from("customers").select("*");
  if (normalizedEmail) {
    customerQuery = customerQuery.eq("email", normalizedEmail).eq("phone", phone.normalized);
  } else {
    customerQuery = customerQuery.eq("phone", phone.normalized).limit(1);
  }
  const { data: existingCustomer } = await customerQuery.maybeSingle();

  let customerId: string;
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: input.fullName.trim(),
        email: normalizedEmail,
        phone: phone.normalized,
        nationality: input.nationality?.trim() || null,
        driving_license_number: input.drivingLicenseNumber?.trim() || null,
      })
      .select()
      .single();
    if (customerError || !customer) {
      return {
        ok: false,
        field: "customer",
        error: "Could not create the customer record.",
      };
    }
    customerId = customer.id;
  }

  const days = daysBetween(input.pickupDate, input.returnDate);
  const totalPrice = priceForDays(Number(car.daily_price), days);

  // ---- insert booking; the DB lock + exclusion constraint guard races ----
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: customerId,
      car_id: car.id,
      pickup_location_id: input.pickupLocationId || null,
      pickup_date: input.pickupDate,
      return_date: input.returnDate,
      pickup_time: input.pickupTime || null,
      return_time: input.returnTime || null,
      status: "pending",
      total_price: totalPrice,
      notes: input.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    const message = error.message ?? "";
    if (
      message.includes("car_already_booked") ||
      message.includes("bookings_no_overlap") ||
      message.includes("EXCLUDE") ||
      message.includes("overlapping")
    ) {
      await createAdminNotification({
        type: "unavailable_attempt",
        meta: {
          car: `${car.brand} ${car.model}`,
          pickup: input.pickupDate,
          return: input.returnDate,
        },
      });
      return {
        ok: false,
        field: "dates",
        error: "This vehicle is already booked for those dates.",
      };
    }
    if (message.includes("car_not_bookable")) {
      return {
        ok: false,
        field: "carId",
        error: "This vehicle is not currently bookable.",
      };
    }
    console.error("createBookingRequest error:", message);
    return {
      ok: false,
      field: "booking",
      error: "Could not create the booking. Please try again.",
    };
  }

  await createAdminNotification({
    type: "new_booking",
    reference: booking.booking_reference,
    meta: {
      customer: input.fullName.trim(),
      car: `${car.brand} ${car.model}`,
      total: totalPrice,
      pickup: input.pickupDate,
      return: input.returnDate,
    },
  });

  return { ok: true, booking };
}

/** Inclusive day count for a range (exported for price previews). */
export { daysBetween as rentalDays };

/** Live availability probe (server-side, service client). */
export async function isCarAvailableForDates(
  carId: string,
  pickupDate: string,
  returnDate: string,
): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("car_available_for_dates", {
    p_car_id: carId,
    p_pickup_date: pickupDate,
    p_return_date: returnDate,
  });
  return data === true;
}