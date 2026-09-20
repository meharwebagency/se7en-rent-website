"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminNotificationsClear,
  adminNotificationsReadAll,
} from "@/app/actions/admin";

import type { AdminNotification } from "@/lib/admin/queries";
import { formatAgo } from "@/lib/admin/format";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  notifications: AdminNotification[];
  dict: Dictionary["admin"];
  locale: Locale;
}

export function NotificationsPanel({
  notifications,
  dict,
  locale,
}: NotificationsPanelProps) {
  const [items, setItems] = React.useState(notifications);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  const unread = items.filter((n) => !n.read).length;

  const open = (item: AdminNotification) => {
    router.push(item.bookingId ? `/admin/bookings/${item.bookingId}` : "/admin/bookings");
  };

  async function markAllRead() {
    setBusy(true);
    const result = await adminNotificationsReadAll();
    setBusy(false);
    if (result.ok) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function clear() {
    setBusy(true);
    const result = await adminNotificationsClear();
    setBusy(false);
    if (result.ok) {
      setItems([]);
      toast.success(dict.dashboard.noNotifications);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold">
          <Bell className="h-4 w-4 text-accent" />
          {dict.dashboard.notifications}
          {unread > 0 ? (
            <Badge variant="accent">{unread} {dict.dashboard.unread}</Badge>
          ) : null}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void markAllRead()}
            disabled={busy || unread === 0}
          >
            <CheckCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void clear()}
            disabled={busy || items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-96 divide-y divide-border overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {dict.dashboard.noNotifications}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              aria-label={
                item.reference
                  ? `${dict.notification[item.type as keyof typeof dict.notification] ?? item.type} ${item.reference}`
                  : (dict.notification[item.type as keyof typeof dict.notification] ?? item.type)
              }
              className="flex w-full items-start gap-3 px-5 py-3 text-start transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  item.read ? "bg-border" : "bg-accent"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !item.read && "font-semibold")}>
                  {dict.notification[item.type as keyof typeof dict.notification] ??
                    item.type}
                </p>
                {item.message ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  {formatAgo(item.created_at, locale)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                {item.reference ? (
                  <code className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    {item.reference}
                  </code>
                ) : null}
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}