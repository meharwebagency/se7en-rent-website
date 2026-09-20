import { notFound } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { BookingStatusControl } from "@/components/admin/booking-status-control";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminBooking } from "@/lib/admin/queries";
import { formatOMR } from "@/lib/format/currency";
import { formatAdminDate } from "@/lib/admin/format";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const { id } = await params;
  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const booking = await getAdminBooking(id);
  if (!booking) notFound();

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader
        title={booking.reference}
        subtitle={dict.bookings.details}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/bookings">{dict.bookings.back}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{dict.bookings.status}</CardTitle>
            </CardHeader>
            <CardContent>
              <BookingStatusControl
                bookingId={booking.id}
                currentStatus={booking.status}
                dict={dict}
              />
            </CardContent>
          </Card>

          {/* Rental window */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{dict.bookings.vehicle}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">{dict.bookings.vehicle}</p>
                <p className="mt-1 font-semibold">
                  {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">{dict.bookings.total}</p>
                <p className="mt-1 font-display text-lg font-bold">
                  {booking.totalPrice != null ? formatOMR(booking.totalPrice, { locale }) : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">{dict.bookings.pickup}</p>
                <p className="mt-1 font-medium">{formatAdminDate(booking.pickupDate, locale)}</p>
                {booking.pickupTime ? (
                  <p className="text-xs text-muted-foreground" dir="ltr">{booking.pickupTime}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground">{dict.bookings.return}</p>
                <p className="mt-1 font-medium">{formatAdminDate(booking.returnDate, locale)}</p>
                {booking.returnTime ? (
                  <p className="text-xs text-muted-foreground" dir="ltr">{booking.returnTime}</p>
                ) : null}
              </div>
              {booking.location ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-4 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">{dict.bookings.pickup} — {dict.bookings.customer}</p>
                  <p className="mt-1 font-medium">
                    {locale === "ar" ? booking.location.name_ar : booking.location.name_en}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Notes */}
          {booking.notes ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{dict.bookings.notes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{booking.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Customer */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dict.bookings.customer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{dict.customers.name}</p>
              <p className="font-medium">{booking.customer?.full_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{dict.customers.email}</p>
              <p dir="ltr" className="font-medium">{booking.customer?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{dict.customers.phone}</p>
              <p dir="ltr" className="font-medium">{booking.customer?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{dict.bookings.created}</p>
              <p className="font-medium">{formatAdminDate(booking.createdAt, locale, true)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}