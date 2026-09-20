"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteBookingDialog } from "@/components/admin/delete-booking-dialog";

import { bookingStatusVariant } from "@/lib/admin/status";
import { formatOMRCompact } from "@/lib/format/currency";
import { formatAdminDate } from "@/lib/admin/format";
import type { RecentBooking } from "@/lib/admin/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface RecentBookingsProps {
  bookings: RecentBooking[];
  dict: Dictionary["admin"];
  locale: Locale;
}

export function RecentBookings({ bookings, dict, locale }: RecentBookingsProps) {
  const router = useRouter();

  const open = (id: string) => router.push(`/admin/bookings/${id}`);

  const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open(id);
    }
  };

  const onReferenceClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.stopPropagation();
    open(id);
  };

  if (bookings.length === 0) {
    return <p className="px-6 pb-8 pt-4 text-sm text-muted-foreground">{dict.dashboard.noBookings}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="px-6 py-3 text-start font-medium">{dict.bookings.reference}</th>
            <th className="px-3 py-3 text-start font-medium">{dict.bookings.customer}</th>
            <th className="px-3 py-3 text-start font-medium">{dict.bookings.vehicle}</th>
            <th className="px-3 py-3 text-start font-medium">{dict.bookings.pickup}</th>
            <th className="px-3 py-3 text-start font-medium">{dict.bookings.total}</th>
            <th className="px-3 py-3 text-start font-medium">{dict.bookings.status}</th>
            <th className="px-6 py-3 text-end font-medium" aria-label={dict.table.actions} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {bookings.map((b) => (
            <tr
              key={b.id}
              tabIndex={0}
              role="link"
              aria-label={`${dict.bookings.reference} ${b.reference}`}
              onClick={() => open(b.id)}
              onKeyDown={(e) => onRowKeyDown(e, b.id)}
              className="cursor-pointer transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <td className="px-6 py-3">
                <Link
                  href={`/admin/bookings/${b.id}`}
                  onClick={(e) => onReferenceClick(e, b.id)}
                  className="font-mono text-xs font-semibold text-accent hover:underline"
                  dir="ltr"
                  tabIndex={-1}
                >
                  {b.reference}
                </Link>
              </td>
              <td className="max-w-40 truncate px-3 py-3">{b.customerName}</td>
              <td className="px-3 py-3">{b.carName}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {formatAdminDate(b.pickupDate, locale)}
              </td>
              <td className="px-3 py-3 font-medium">
                {b.totalPrice != null ? formatOMRCompact(b.totalPrice, locale) : "—"}
              </td>
              <td className="px-3 py-3">
                <Badge variant={bookingStatusVariant(b.status)}>{dict.status[b.status]}</Badge>
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center justify-end">
                  <DeleteBookingDialog id={b.id} reference={b.reference} dict={dict}>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      className="text-destructive hover:text-destructive"
                      title={dict.bookings.deleteTitle}
                      aria-label={`${dict.bookings.deleteTitle} ${b.reference}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeleteBookingDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}