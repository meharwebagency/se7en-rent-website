import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminSiteSettings } from "@/lib/admin/queries";

export default async function AdminSettingsPage() {
  const access = await requirePageAdmin("super_admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const settings = await getAdminSiteSettings();

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.settings.title} subtitle={dict.settings.subtitle} />
      {settings ? (
        <div className="max-w-3xl">
          <SettingsForm dict={dict} settings={settings} />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.table.noResults}
        </div>
      )}
    </AdminShell>
  );
}