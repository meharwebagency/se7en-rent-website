import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { CarForm } from "@/components/admin/car-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";

export default async function AdminNewCarPage() {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader
        title={dict.cars.add}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/cars">{dict.common.back}</Link>
          </Button>
        }
      />
      <div className="max-w-4xl">
        <CarForm dict={dict} car={null} />
      </div>
    </AdminShell>
  );
}