"use server";

import {
  getAvailableCarIdsForDates,
  isCarAvailableForDates,
} from "@/lib/vehicles/queries";

/**
 * Server actions backing the fleet browser + car detail pages.
 *
 * All reads run on the service-role client (server only); these actions are
 * the only bridge the client-side filter/sort UI uses to ask the database
 * about date-range availability.
 */

/**
 * Returns the ids of cars bookable for the inclusive [pickupDate, returnDate]
 * range, or `null` when the backend isn't available (callers treat null as
 * "skip the date constraint" rather than "everything is unavailable").
 */
export async function getAvailableCarIds(
  pickupDate: string,
  returnDate: string,
): Promise<string[] | null> {
  const ids = await getAvailableCarIdsForDates(pickupDate, returnDate);
  return ids ? Array.from(ids) : null;
}

/**
 * Single-car availability probe used by the reservation panel.
 * Returns `null` when the backend isn't reachable (UI shows "unknown").
 */
export async function checkCarAvailability(
  carId: string,
  pickupDate: string,
  returnDate: string,
): Promise<boolean | null> {
  return isCarAvailableForDates(carId, pickupDate, returnDate);
}