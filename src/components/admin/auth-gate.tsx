import "server-only";

import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { getAdminLocale } from "@/lib/admin/i18n";
import { requireAdmin } from "@/lib/admin/authorization";
import { getCurrentUser } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/admin/authorization";
import type { AdminContext } from "@/lib/supabase/server";

export type PageAdminAccess =
  | { ok: true; ctx: AdminContext }
  | { ok: false };

/**
 * Page-level gate. Server pages call this once, then use `ctx` for the shell
 * (email, role) and render `<AccessDenied />` when unauthorized.
 */
export async function requirePageAdmin(
  min: AdminRole = "admin",
): Promise<PageAdminAccess> {
  // Signed out → send to the login page.
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  try {
    const ctx = await requireAdmin(min);
    return { ok: true, ctx };
  } catch {
    return { ok: false };
  }
}

export async function AccessDenied() {
  const locale = await getAdminLocale();
  const dict = getDictionaryFor(locale).admin;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <p className="text-sm font-semibold text-destructive">{dict.guard.title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{dict.guard.desc}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <SignOutButton dict={dict} />
          <Button asChild variant="ghost" size="sm">
            <Link href="/">{dict.guard.backToSite}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}