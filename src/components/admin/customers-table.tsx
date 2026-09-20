"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminCustomer } from "@/lib/admin/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface CustomersTableProps {
  customers: AdminCustomer[];
  dict: Dictionary["admin"];
  locale: Locale;
}

export function CustomersTable({ customers, dict, locale }: CustomersTableProps) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="relative sm:max-w-xs">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.table.search}
          className="ps-9"
          aria-label={dict.table.search}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.customers.noResults}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{dict.customers.name}</th>
                  <th className="hidden px-3 py-3 text-start font-medium sm:table-cell">{dict.customers.email}</th>
                  <th className="hidden px-3 py-3 text-start font-medium md:table-cell">{dict.customers.phone}</th>
                  <th className="hidden px-3 py-3 text-start font-medium lg:table-cell">{dict.customers.nationality}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.customers.bookingsCount}</th>
                  <th className="hidden px-4 py-3 text-end font-medium md:table-cell">{dict.customers.joined}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{c.fullName}</td>
                    <td className="hidden px-3 py-3 text-muted-foreground sm:table-cell" dir="ltr">
                      {c.email ?? "—"}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground md:table-cell" dir="ltr">
                      {c.phone}
                    </td>
                    <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                      {c.nationality ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={c.bookings.length > 0 ? "accent" : "outline"}>
                        {c.bookings.length}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {formatAdminDate(c.createdAt, locale)}
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