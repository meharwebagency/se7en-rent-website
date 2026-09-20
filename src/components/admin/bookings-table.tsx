"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DeleteBookingDialog } from "@/components/admin/delete-booking-dialog";

import { formatOMRCompact } from "@/lib/format/currency";
import { formatAdminDate } from "@/lib/admin/format";
import { bookingStatusVariant } from "@/lib/admin/status";
import type { AdminBooking } from "@/lib/admin/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Filter = "all" | "pending" | "confirmed" | "active" | "completed" | "cancelled";
type Sort = "newest" | "oldest";

interface BookingsTableProps {
  bookings: AdminBooking[];
  dict: Dictionary["admin"];
  locale: Locale;
  initialFilter?: Filter;
}

export function BookingsTable({ bookings, dict, locale, initialFilter = "all" }: BookingsTableProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>(initialFilter);
  const [sort, setSort] = React.useState<Sort>("newest");

  function handleFilterChange(v: Filter) {
    setFilter(v);
    router.replace(v === "all" ? "/admin/bookings" : `/admin/bookings?status=${v}`);
  }

  const openBooking = (id: string) => router.push(`/admin/bookings/${id}`);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, select")) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openBooking(id);
    }
  };

  const onReferenceClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.stopPropagation();
    openBooking(id);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = bookings.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.reference.toLowerCase().includes(q) ||
        (b.customer?.full_name ?? "").toLowerCase().includes(q) ||
        (b.customer?.email ?? "").toLowerCase().includes(q) ||
        `${b.vehicle?.brand ?? ""} ${b.vehicle?.model ?? ""}`.toLowerCase().includes(q)
      );
    });
    return sort === "oldest"
      ? [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bookings, query, filter, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.table.search}
            className="ps-9"
            aria-label={dict.table.search}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-auto">
          <div className="sm:w-48">
            <Select value={filter} onValueChange={(v) => handleFilterChange(v as Filter)}>
              <SelectTrigger aria-label={dict.bookings.status}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.table.all}</SelectItem>
                <SelectItem value="pending">{dict.status.pending}</SelectItem>
                <SelectItem value="confirmed">{dict.status.confirmed}</SelectItem>
                <SelectItem value="active">{dict.status.active}</SelectItem>
                <SelectItem value="completed">{dict.status.completed}</SelectItem>
                <SelectItem value="cancelled">{dict.status.cancelled}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:w-44">
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label={dict.table.sort}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{dict.bookings.created} ↓</SelectItem>
                <SelectItem value="oldest">{dict.bookings.created} ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.bookings.noResults}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{dict.bookings.reference}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.bookings.customer}</th>
                  <th className="hidden px-3 py-3 text-start font-medium md:table-cell">{dict.bookings.vehicle}</th>
                  <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">{dict.bookings.pickup}</th>
                  <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">{dict.bookings.return}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.bookings.submitted}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.bookings.total}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.bookings.status}</th>
                  <th className="px-4 py-3 text-end font-medium">{dict.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    tabIndex={0}
                    role="link"
                    aria-label={`${dict.bookings.reference} ${b.reference}`}
                    onClick={() => openBooking(b.id)}
                    onKeyDown={(e) => onRowKeyDown(e, b.id)}
                    className="cursor-pointer transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <td className="px-4 py-3">
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
                    <td className="max-w-44 truncate px-3 py-3">
                      <p className="font-medium">{b.customer?.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {b.customer?.email}
                      </p>
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                      {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : "—"}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                      {formatAdminDate(b.pickupDate, locale)}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                      {formatAdminDate(b.returnDate, locale)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {formatAdminDate(b.createdAt, locale, true)}
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {b.totalPrice != null ? formatOMRCompact(b.totalPrice, locale) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={bookingStatusVariant(b.status)}>
                        {dict.status[b.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
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
        </div>
      )}
    </div>
  );
}