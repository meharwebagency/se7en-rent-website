import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { BookingsTable } from "@/components/admin/bookings-table";
import { PageHeader } from "@/components/admin/page-header";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { listAdminBookings } from "@/lib/admin/queries";

type BookingStatusFilter = "pending" | "confirmed" | "active" | "completed" | "cancelled";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const bookings = await listAdminBookings();

  const sp = await searchParams;
  const validStatuses = ["pending", "confirmed", "active", "completed", "cancelled"];
  const initialFilter: BookingStatusFilter | "all" = validStatuses.includes(sp.status ?? "")
    ? (sp.status as BookingStatusFilter)
    : "all";

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.bookings.title} subtitle={dict.bookings.subtitle} />
      <BookingsTable bookings={bookings} dict={dict} locale={locale} initialFilter={initialFilter} />
    </AdminShell>
  );
}