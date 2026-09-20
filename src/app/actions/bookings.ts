"use server";

import {
  createBookingRequest,
  isCarAvailableForDates,
} from "@/lib/bookings/service";
import type { CreateBookingInput } from "@/lib/bookings/service";

/**
 * Public booking submission. Runs server-side via the service role; the
 * database exclusion constraint is the final race-safety guarantee.
 */

export interface SubmitBookingInput {
  fullName: string;
  email: string;
  phone: string;
  nationality?: string | null;
  drivingLicenseNumber?: string | null;
  allowInternationalPhone?: boolean;
  carId: string;
  pickupLocationId?: string | null;
  pickupDate: string;
  returnDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  notes?: string | null;
}

export async function submitBooking(
  input: SubmitBookingInput,
): Promise<{ ok: boolean; bookingReference?: string; field?: string; error?: string }> {
  const result = await createBookingRequest(input as CreateBookingInput);
  if (!result.ok) {
    return {
      ok: false,
      field: result.field,
      error: result.error,
    };
  }
  return {
    ok: true,
    bookingReference: result.booking.booking_reference,
  };
}

/** Live availability check used by car cards / detail pages. */
export async function checkAvailability(
  carId: string,
  pickupDate: string,
  returnDate: string,
): Promise<boolean> {
  return isCarAvailableForDates(carId, pickupDate, returnDate);
}