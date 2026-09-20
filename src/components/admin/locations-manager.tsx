"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  adminDeleteLocation,
  adminUpsertLocation,
} from "@/app/actions/admin";

import type { Tables } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type LocationRow = Tables<"locations">;

interface LocationsManagerProps {
  locations: LocationRow[];
  dict: Dictionary["admin"];
  locale: Locale;
}

interface FormState {
  id?: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  nameAr: "",
  nameEn: "",
  addressAr: "",
  addressEn: "",
  phone: "",
  openingHours: "",
  latitude: "",
  longitude: "",
  active: true,
};

export function LocationsManager({ locations, dict, locale }: LocationsManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<LocationRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(location: LocationRow) {
    setEditing(location);
    setForm({
      id: location.id,
      nameAr: location.name_ar ?? "",
      nameEn: location.name_en ?? "",
      addressAr: location.address_ar ?? "",
      addressEn: location.address_en ?? "",
      phone: location.phone ?? "",
      openingHours: location.opening_hours ?? "",
      latitude: location.latitude != null ? String(location.latitude) : "",
      longitude: location.longitude != null ? String(location.longitude) : "",
      active: location.active,
    });
    setOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await adminUpsertLocation({
      id: form.id,
      nameAr: form.nameAr,
      nameEn: form.nameEn,
      addressAr: form.addressAr,
      addressEn: form.addressEn,
      phone: form.phone,
      openingHours: form.openingHours,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      active: form.active,
    });
    setBusy(false);
    setOpen(false);
    if (result.ok) {
      toast.success(form.id ? dict.locations.saved : dict.locations.created);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (deleting) return;
    setDeleting(id);
    const result = await adminDeleteLocation(id);
    setDeleting(null);
    if (result.ok) {
      toast.success(dict.locations.deleted);
      router.refresh();
    } else {
      toast.error(result.error);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" />
        {dict.locations.add}
      </Button>

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.locations.noResults}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold">
                    {locale === "ar" ? location.name_ar : location.name_en}
                    <span className="ms-1 font-normal text-muted-foreground">
                      / {locale === "ar" ? location.name_en : location.name_ar}
                    </span>
                  </p>
                  {location.opening_hours ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{location.opening_hours}</p>
                  ) : null}
                </div>
                <Badge variant={location.active ? "success" : "outline"}>
                  {location.active ? dict.locations.active : dict.table.all}
                </Badge>
              </div>

              {location.address_ar || location.address_en ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {locale === "ar"
                    ? (location.address_ar ?? location.address_en)
                    : (location.address_en ?? location.address_ar)}
                </p>
              ) : null}

              {location.phone ? (
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{location.phone}</p>
              ) : null}

              <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(location)}>
                  <Pencil className="h-4 w-4" />
                  {dict.table.edit}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => void handleDelete(location.id)}
                  disabled={deleting === location.id}
                >
                  {deleting === location.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {dict.table.delete}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? dict.locations.edit : dict.locations.add}</DialogTitle>
            <DialogDescription>{dict.locations.subtitle}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lm-name-ar">{dict.locations.nameAr} *</Label>
                <Input id="lm-name-ar" required value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-name-en">{dict.locations.nameEn} *</Label>
                <Input id="lm-name-en" required dir="ltr" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-address-ar">{dict.locations.addressAr}</Label>
                <Input id="lm-address-ar" value={form.addressAr} onChange={(e) => set("addressAr", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-address-en">{dict.locations.addressEn}</Label>
                <Input id="lm-address-en" dir="ltr" value={form.addressEn} onChange={(e) => set("addressEn", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-phone">{dict.locations.phone}</Label>
                <Input id="lm-phone" dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+968..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-hours">{dict.locations.openingHours}</Label>
                <Input id="lm-hours" value={form.openingHours} onChange={(e) => set("openingHours", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-lat">{dict.locations.latitude}</Label>
                <Input id="lm-lat" type="number" step="any" dir="ltr" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lm-lng">{dict.locations.longitude}</Label>
                <Input id="lm-lng" type="number" step="any" dir="ltr" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => set("active", !form.active)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <span className={`h-4 w-4 rounded-full border ${form.active ? "border-accent bg-accent" : "border-muted-foreground"}`} />
              {dict.locations.active}
            </button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {dict.common.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {dict.locations.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}