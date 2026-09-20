"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { adminDeleteBooking } from "@/app/actions/admin";

import type { Dictionary } from "@/i18n/dictionaries";

interface DeleteBookingDialogProps {
  id: string;
  reference: string;
  dict: Dictionary["admin"];
  children: React.ReactNode;
}

export function DeleteBookingDialog({
  id,
  reference,
  dict,
  children,
}: DeleteBookingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    setBusy(true);
    const result = await adminDeleteBooking(id);
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      toast.success(dict.bookings.deleted);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()} onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dict.bookings.deleteTitle}</DialogTitle>
          <DialogDescription>
            {dict.bookings.deleteConfirm.replace("{ref}", reference)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {dict.common.cancel}
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
            <Trash2 className="h-4 w-4" />
            {dict.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}