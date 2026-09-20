"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { adminUpdateBookingStatus } from "@/app/actions/admin";

import { bookingStatusVariant } from "@/lib/admin/status";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/i18n/dictionaries";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface BookingStatusControlProps {
  bookingId: string;
  currentStatus: BookingStatus;
  dict: Dictionary["admin"];
}

export function BookingStatusControl({
  bookingId,
  currentStatus,
  dict,
}: BookingStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState<BookingStatus>(currentStatus);
  const [busy, setBusy] = React.useState(false);

  const changed = status !== currentStatus;

  async function handleSave() {
    setBusy(true);
    const result = await adminUpdateBookingStatus(bookingId, status);
    setBusy(false);
    if (result.ok) {
      toast.success(dict.bookings.saved);
      router.refresh();
    } else {
      toast.error(result.error);
      router.refresh();
    }
  }

  const statuses: BookingStatus[] = ["pending", "confirmed", "active", "completed", "cancelled"];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Badge variant={bookingStatusVariant(currentStatus)} className="w-fit">
        {dict.status[currentStatus]}
      </Badge>
      <div className="flex flex-1 flex-col gap-2 sm:max-w-xs sm:flex-row">
        <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
          <SelectTrigger aria-label={dict.bookings.updateStatus}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {dict.status[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={busy || !changed}
          className="sm:w-fit"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {dict.common.save}
        </Button>
      </div>
    </div>
  );
}