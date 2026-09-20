"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, SupabaseClientOptions } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Browser-side Supabase client.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Used for public reads (with RLS) and the admin auth flow.
 *
 * Pass `{ auth: { detectSessionInUrl: false } }` when the page parses and
 * exchanges the auth callback itself (the admin reset-password page).
 */
export function createBrowserSupabaseClient(
  options?: SupabaseClientOptions<"public">
): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase client configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient<Database>(url, anonKey, options);
}
