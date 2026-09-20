import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { LocationsManager } from "@/components/admin/locations-manager";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { listAdminLocations } from "@/lib/admin/queries";

export default async function AdminLocationsPage() {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const locations = await listAdminLocations();

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.locations.title} subtitle={dict.locations.subtitle} />
      <LocationsManager locations={locations} dict={dict} locale={locale} />
    </AdminShell>
  );
}