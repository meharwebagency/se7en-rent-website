import "server-only";

import { requireAdminRole, UnauthorizedError } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/supabase/server";

/**
 * Role-scoped admin service.
 *
 * Every admin-facing server action or route handler must pass through one of
 * these helpers — a "signed-in admin" label is insufficient. The granular
 * rules from the schema spec are enforced here:
 *
 *   super_admin — full access, can manage other admins + site settings +
 *                 permanently delete cars/bookings/customers.
 *   admin       — vehicle CRUD (no deletes on cars with booking history),
 *                 booking lifecycle, customer views. Cannot touch admins or
 *                 company-wide settings.
 */

export type { AdminRole };

export class VehicleDeleteNotAllowedError extends UnauthorizedError {
  constructor() {
    super(
      "This vehicle has booking history and may only be removed by a super admin.",
    );
    this.name = "VehicleDeleteNotAllowedError";
  }
}

/** Enforce a minimum role (default: admin). Throws UnauthorizedError. */
export function requireAdmin(min: AdminRole = "admin") {
  return requireAdminRole(min);
}

/**
 * Returns true when the admin may permanently delete the given car.
 * Rule: only super_admins delete cars that have any booking history.
 * Admins may delete cars with no bookings (and may always deactivate).
 */
export async function canDeleteCar(carId: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("car_id", carId);
  return (count ?? 0) === 0;
}

/** Throws when the caller may not permanently delete the given car. */
export async function requireCanDeleteCar(
  ctx: { isSuperAdmin: boolean },
  carId: string,
): Promise<void> {
  if (ctx.isSuperAdmin) return;
  if (!(await canDeleteCar(carId))) throw new VehicleDeleteNotAllowedError();
}

/** Human-readable role name for UI badges. */
export function roleLabel(role: AdminRole): "Super Admin" | "Admin" {
  return role === "super_admin" ? "Super Admin" : "Admin";
}