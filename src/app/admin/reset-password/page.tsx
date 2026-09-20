import Link from "next/link";
import { Car } from "lucide-react";

import { ResetPasswordForm } from "@/components/admin/reset-password-form";
import { AdminLanguageSwitcher } from "@/components/admin/language-switcher";
import { Button } from "@/components/ui/button";

import { getAdminDictionary, getAdminLocale } from "@/lib/admin/i18n";

export default async function AdminResetPasswordPage() {
  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute start-6 top-6">
        <AdminLanguageSwitcher current={locale} ariaLabel={dict.language.switch} />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg">
            <Car className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-xl font-bold">{dict.brand}</h1>
            <p className="text-sm text-muted-foreground">{dict.reset.title}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <ResetPasswordForm dict={dict} />
        </div>

        <div className="mt-6 text-center">
          <Button asChild variant="link" size="sm">
            <Link href="/admin/login" dir="auto">{dict.reset.backToLogin}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}