import "server-only";

import { createServerClient } from "@/lib/supabase/server";

/**
 * Dashboard event log. Writes are performed with the service role from server
 * actions only — the table has NO public policies, so RLS keeps it invisible
 * to browsers.
 */
export type AdminNotificationType =
  | "new_booking"
  | "booking_cancelled"
  | "unavailable_attempt";

export interface AdminNotificationInput {
  type: AdminNotificationType;
  reference?: string | null;
  message?: string | null;
  meta?: Record<string, string | number | boolean | null>;
}

export async function createAdminNotification(
  input: AdminNotificationInput,
): Promise<void> {
  try {
    const supabase = await createServerClient();
    await supabase.from("notifications").insert({
      type: input.type,
      reference: input.reference ?? null,
      message: input.message ?? null,
      meta: input.meta ?? {},
    });
  } catch (error) {
    // Never let notification bookkeeping break the underlying operation.
    console.error("createAdminNotification error:", error);
  }
}