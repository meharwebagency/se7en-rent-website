import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { CarsTable } from "@/components/admin/cars-table";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { listAdminCars } from "@/lib/admin/queries";

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const cars = await listAdminCars();

  const sp = await searchParams;
  const initialStatus =
    sp.status === "available" || sp.status === "booked" ? sp.status : "all";

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.cars.title} subtitle={dict.cars.subtitle} />
      <CarsTable
        cars={cars}
        dict={dict}
        locale={locale}
        isSuperAdmin={ctx.isSuperAdmin}
        initialStatus={initialStatus}
      />
    </AdminShell>
  );
}