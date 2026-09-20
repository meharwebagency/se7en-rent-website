"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil, Star, Car } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { adminDeleteVehicle } from "@/app/actions/admin";

import { formatOMRCompact } from "@/lib/format/currency";
import { carStatusVariant } from "@/lib/admin/status";
import type { AdminCar } from "@/lib/admin/queries";
import type { Database } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type CarStatus = Database["public"]["Enums"]["car_status"];

interface CarsTableProps {
  cars: AdminCar[];
  dict: Dictionary["admin"];
  locale: Locale;
  isSuperAdmin: boolean;
  initialStatus?: CarStatus | "all";
}

export function CarsTable({ cars, dict, locale, isSuperAdmin, initialStatus = "all" }: CarsTableProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<CarStatus | "all">(initialStatus);
  const [target, setTarget] = React.useState<AdminCar | null>(null);
  const [busy, setBusy] = React.useState(false);

  function handleStatusChange(v: CarStatus | "all") {
    setStatus(v);
    router.replace(v === "all" ? "/admin/cars" : `/admin/cars?status=${v}`);
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return cars.filter((car) => {
      if (status !== "all" && car.status !== status) return false;
      if (!q) return true;
      return `${car.brand} ${car.model} ${car.type} ${car.category}`.toLowerCase().includes(q);
    });
  }, [cars, query, status]);

  async function handleDelete() {
    if (!target) return;
    setBusy(true);
    const result = await adminDeleteVehicle(target.id);
    setBusy(false);
    setTarget(null);
    if (result.ok) {
      toast.success(dict.cars.deleted);
      router.refresh();
    } else {
      toast.error(result.error);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild>
          <Link href="/admin/cars/new">
            <Plus className="h-4 w-4" />
            {dict.cars.add}
          </Link>
        </Button>
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
        <div className="sm:w-44">
          <Select
            value={status}
            onValueChange={(v) => handleStatusChange(v as CarStatus | "all")}
          >
            <SelectTrigger aria-label={dict.cars.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{dict.table.all}</SelectItem>
              <SelectItem value="available">{dict.cars.available}</SelectItem>
              <SelectItem value="booked">{dict.cars.booked}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.table.noResults}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{dict.cars.name}</th>
                   <th className="hidden px-3 py-3 text-start font-medium md:table-cell">{dict.cars.type}</th>
                  <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">{dict.cars.year}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.cars.dailyPrice}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.cars.status}</th>
                  <th className="hidden px-3 py-3 text-start font-medium md:table-cell">{dict.cars.bookingsCount}</th>
                  <th className="px-4 py-3 text-end font-medium">{dict.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((car) => (
                  <tr key={car.id} className="transition-colors hover:bg-secondary/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/cars/${car.id}`} className="flex items-center gap-3">
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {car.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={car.imageUrl} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover" />
                          ) : (
                            <Car className="h-4 w-4 text-muted-foreground" />
                          )}
                        </span>
                        <span className="font-medium hover:text-accent">
                          {car.brand} {car.model}
                          {car.featured ? (
                            <Star className="ms-1 inline h-3.5 w-3.5 fill-accent text-accent" />
                          ) : null}
                        </span>
                      </Link>
                    </td>
                     <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{car.type}</td>
                    <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">{car.year}</td>
                    <td className="px-3 py-3 font-medium">{formatOMRCompact(car.dailyPrice, locale)}</td>
                    <td className="px-3 py-3">
                      <Badge variant={carStatusVariant(car.status)}>
                        {car.status === "available" ? dict.cars.available : dict.cars.booked}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{car.bookingCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="iconSm" title={dict.table.edit}>
                          <Link href={`/admin/cars/${car.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="iconSm"
                              className="text-destructive hover:text-destructive"
                              title={dict.table.delete}
                              onClick={() => setTarget(car)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{dict.cars.deleteTitle}</DialogTitle>
                              <DialogDescription>
                                {car.bookingCount > 0 && !isSuperAdmin
                                  ? dict.cars.deleteBlocked
                                  : car.bookingCount > 0
                                    ? dict.cars.deleteWithBookings
                                    : dict.cars.deleteConfirm}
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setTarget(null)}>
                                {dict.common.cancel}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => void handleDelete()}
                                disabled={busy || (car.bookingCount > 0 && !isSuperAdmin)}
                              >
                                <Trash2 className="h-4 w-4" />
                                {dict.common.delete}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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