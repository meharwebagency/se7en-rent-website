import "server-only";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
import { createServerClient as createSupabaseSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";

/**
 * Service-role client. Privileged: bypasses RLS. NEVER expose to the browser —
 * only import this module from server components / server actions / route
 * handlers that trust the caller (see admin/authorization.ts for role gates).
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseServiceClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: {       "x-application-name": "alzajel-rent" } },
  });
}

/**
 * Authenticated SSR client — resolves the caller's JWT cookie (the same
 * credentials the browser uses). RLS applies. Use for anything that must
 * respect the signed-in user's identity and permissions.
 */
export async function createAuthClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase client configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createSupabaseSsrClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // already refreshed the session tokens.
        }
      },
    },
  });
}

export interface AuthUser {
  id: string;
  email: string | null;
}

/**
 * Returns the currently signed-in user (via the SSR cookie) or null.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

export type AdminRole = Database["public"]["Enums"]["admin_role"];

export interface AdminContext {
  user: AuthUser;
  admin: Tables<"admins">;
  role: AdminRole;
  isSuperAdmin: boolean;
}

const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  admin: 0,
  super_admin: 1,
};

/**
 * Resolves the signed-in user's admin record, or null when they are not an
 * administrator.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerClient();
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) return null;

  return {
    user,
    admin,
    role: admin.role,
    isSuperAdmin: admin.role === "super_admin",
  };
}

export class UnauthorizedError extends Error {
  constructor(message = "Not authorized to perform this operation.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Throws unless the caller is signed in AND holds at least the requested
 * admin role. Every admin-facing server action / route handler MUST call this
 * first — checking "is a signed-in admin" is not enough; role scoping is
 * enforced here, not just stored as a label.
 */
export async function requireAdminRole(
  minimum: AdminRole = "admin",
): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new UnauthorizedError("Administrator access required.");

  const required = ADMIN_ROLE_RANK[minimum];
  const held = ADMIN_ROLE_RANK[ctx.role];
  if (held < required) throw new UnauthorizedError(`${minimum} access required.`);

  return ctx;
}