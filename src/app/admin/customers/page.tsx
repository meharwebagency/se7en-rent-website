import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { CustomersTable } from "@/components/admin/customers-table";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { listAdminCustomers } from "@/lib/admin/queries";

export default async function AdminCustomersPage() {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const customers = await listAdminCustomers();

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.customers.title} subtitle={dict.customers.subtitle} />
      <CustomersTable customers={customers} dict={dict} locale={locale} />
    </AdminShell>
  );
}