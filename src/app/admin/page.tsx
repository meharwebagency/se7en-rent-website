import Link from "next/link";
import {
  Car,
  CircleCheck,
  Ban,
  Hourglass,
  CalendarClock,
} from "lucide-react";

import { AdminShell } from "@/components/admin/shell";
import { requirePageAdmin, AccessDenied } from "@/components/admin/auth-gate";
import { NotificationsPanel } from "@/components/admin/notifications-panel";
import { RecentBookings } from "@/components/admin/recent-bookings";
import { PageHeader } from "@/components/admin/page-header";
import { VisitorStatsCard } from "@/components/admin/visitor-stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getAdminLocale, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminDashboardData, getVisitorStats } from "@/lib/admin/queries";
import { carStatusVariant } from "@/lib/admin/status";
import { formatOMR } from "@/lib/format/currency";
import { formatAdminDate } from "@/lib/admin/format";

export default async function AdminDashboardPage() {
  const access = await requirePageAdmin("admin");
  if (!access.ok) return <AccessDenied />;
  const { ctx } = access;

  const locale = await getAdminLocale();
  const dict = (await getAdminDictionary()).admin;
  const [data, visitorStats] = await Promise.all([
    getAdminDashboardData(),
    getVisitorStats(),
  ]);

  const statCards = [
    {
      label: dict.dashboard.totalVehicles,
      value: data.vehicles.total,
      icon: Car,
      href: "/admin/cars",
    },
    {
      label: dict.dashboard.availableVehicles,
      value: data.vehicles.available,
      icon: CircleCheck,
      tone: "text-emerald-500",
      href: "/admin/cars?status=available",
    },
    {
      label: dict.dashboard.bookedVehicles,
      value: data.vehicles.booked,
      icon: Ban,
      tone: "text-amber-500",
      href: "/admin/cars?status=booked",
    },
    {
      label: dict.dashboard.pendingBookings,
      value: data.bookings.pending,
      icon: Hourglass,
      tone: "text-amber-500",
      href: "/admin/bookings?status=pending",
    },
    {
      label: dict.dashboard.activeBookings,
      value: data.bookings.active,
      icon: CalendarClock,
      tone: "text-accent",
      href: "/admin/bookings?status=active",
    },
  ];

  return (
    <AdminShell
      dict={dict}
      locale={locale}
      userEmail={ctx.user.email ?? ""}
      isSuperAdmin={ctx.isSuperAdmin}
    >
      <PageHeader title={dict.dashboard.title} subtitle={dict.dashboard.subtitle} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`${stat.label}: ${stat.value}`}
            >
              <Card className="group h-full cursor-pointer transition-all duration-200 group-hover:border-accent group-hover:bg-secondary/40 group-hover:shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Icon className={`h-4 w-4 ${stat.tone ?? "text-accent"}`} />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="font-display text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Visitor statistics */}
      <div className="mt-6">
        <VisitorStatsCard stats={visitorStats} dict={dict} locale={locale} />
      </div>

      {/* Recent bookings + notifications */}
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">{dict.dashboard.recentBookings}</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/bookings">{dict.dashboard.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <RecentBookings bookings={data.recentBookings} dict={dict} locale={locale} />
            </CardContent>
          </Card>
        </div>

        <div>
          <NotificationsPanel
            notifications={data.notifications}
            dict={dict}
            locale={locale}
          />
        </div>
      </div>

      {/* Fleet availability */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.availability.map((car) => (
          <Card key={car.id} className="overflow-hidden">
            <div className="relative h-36 bg-secondary">
              {car.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={car.imageUrl}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Badge
                variant={carStatusVariant(car.status)}
                className="absolute end-2 top-2"
              >
                {car.status === "available" ? dict.cars.available : dict.cars.booked}
              </Badge>
            </div>
            <CardContent className="p-4">
              <p className="font-display text-sm font-bold">{car.brand} {car.model}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatOMR(car.price, { locale, perDay: true })}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {car.nextBookingPickup ? (
                  <>
                    {dict.dashboard.nextPickup}:{" "}
                    <span className="text-foreground">
                      {formatAdminDate(car.nextBookingPickup, locale)}
                    </span>
                  </>
                ) : (
                  <span className="text-emerald-500">{dict.dashboard.availableNow}</span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}