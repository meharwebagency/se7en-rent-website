import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { UsersManager } from "@/components/admin/users-manager";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { listAdminUsers } from "@/lib/admin/queries";

export default async function AdminUsersPage() {
  const access = await requirePageAdmin("super_admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const users = await listAdminUsers();

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.users.title} subtitle={dict.users.subtitle} />
      <UsersManager
        users={users}
        dict={dict}
        locale={locale}
        currentUserId={ctx.user.id}
      />
    </AdminShell>
  );
}