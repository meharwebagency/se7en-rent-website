"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  adminCreateVehicle,
  adminSaveCarImages,
  adminUpdateVehicle,
} from "@/app/actions/admin";
import {
  CarImagesManager,
  type CarImageDraft,
} from "@/components/admin/car-images-manager";

import type { AdminCar } from "@/lib/admin/queries";
import type { Database } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/i18n/dictionaries";

type CarStatus = Database["public"]["Enums"]["car_status"];
type Transmission = Database["public"]["Enums"]["transmission_type"];

interface CarFormProps {
  dict: Dictionary["admin"];
  car: AdminCar | null;
}

const EMPTY = {
  brand: "",
  model: "",
  year: String(new Date().getFullYear()),
  type: "",
  category: "mid-range",
  dailyPrice: "",
  weeklyPrice: "",
  monthlyPrice: "",
  transmission: "automatic" as Transmission,
  color: "",
  status: "available" as CarStatus,
  featured: false,
};

export function CarForm({ dict, car }: CarFormProps) {
  const router = useRouter();
  const isEdit = Boolean(car);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [values, setValues] = React.useState(() =>
    car
      ? {
          brand: car.brand,
          model: car.model,
          year: String(car.year),
          type: car.type,
          category: car.category,
          dailyPrice: String(car.dailyPrice),
          weeklyPrice: car.weeklyPrice != null ? String(car.weeklyPrice) : "",
          monthlyPrice: car.monthlyPrice != null ? String(car.monthlyPrice) : "",
          transmission: car.transmission,
          color: car.color ?? "",
          status: car.status,
          featured: car.featured,
        }
      : EMPTY
  );

  const [drafts, setDrafts] = React.useState<CarImageDraft[]>(() =>
    (car?.images ?? []).map((img) => ({
      key: `row-${img.id}`,
      id: img.id,
      url: img.image_url,
    })),
  );
  const baselineImageIds = React.useMemo(
    () => (car?.images ?? []).map((img) => img.id),
    [car],
  );

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: undefined } : prev));
  }

  function parseNum(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const nextErrors: Record<string, string | undefined> = {};

    if (!values.brand.trim() || !values.model.trim()) {
      nextErrors.brand = dict.messages.brandModelRequired;
      nextErrors.model = dict.messages.brandModelRequired;
    }

    const year = parseNum(values.year);
    if (year === null) nextErrors.year = dict.cars.yearRequired;

    const dailyPrice = parseNum(values.dailyPrice);
    if (dailyPrice === null) nextErrors.dailyPrice = dict.messages.priceRequired;
    else if (!Number.isInteger(dailyPrice) || dailyPrice < 0) nextErrors.dailyPrice = dict.cars.priceInvalid;

    const weeklyRaw = values.weeklyPrice;
    const monthlyRaw = values.monthlyPrice;
    const weeklyPrice = weeklyRaw.trim() !== "" ? parseNum(weeklyRaw) : null;
    const monthlyPrice = monthlyRaw.trim() !== "" ? parseNum(monthlyRaw) : null;
    if (weeklyRaw.trim() !== "" && (weeklyPrice === null || !Number.isInteger(weeklyPrice) || weeklyPrice < 0)) nextErrors.weeklyPrice = dict.cars.priceInvalid;
    if (monthlyRaw.trim() !== "" && (monthlyPrice === null || !Number.isInteger(monthlyPrice) || monthlyPrice < 0)) nextErrors.monthlyPrice = dict.cars.priceInvalid;

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);

    const payload = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: year as number,
      type: values.type.trim(),
      category: values.category || "mid-range",
      daily_price: dailyPrice as number,
      weekly_price: weeklyRaw.trim() ? weeklyPrice : null,
      monthly_price: monthlyRaw.trim() ? monthlyPrice : null,
      transmission: values.transmission,
      color: values.color.trim() || null,
      status: values.status,
      featured: values.featured,
    };

    let carId = car?.id;
    const result = isEdit && car
      ? await adminUpdateVehicle(car.id, payload)
      : await adminCreateVehicle(payload);
    if (result.ok && !carId) carId = result.id;

    if (result.ok && carId) {
      const pending = drafts.filter((d) => d.file);

      // 1. Upload new files through the route handler (no action body limit).
      const uploadedIdByKey = new Map<string, string>();
      if (pending.length > 0) {
        const formData = new FormData();
        formData.append("carId", carId);
        for (const draft of pending) formData.append("files", draft.file as File);

        try {
          const res = await fetch("/admin/api/car-images", {
            method: "POST",
            body: formData,
          });
          const body = await res.json().catch(() => null);
          if (!res.ok || !body?.ok) {
            setBusy(false);
            toast.error(body?.error ?? dict.cars.uploadFailed);
            return;
          }
          pending.forEach((draft, i) => {
            const row = body.images?.[i];
            if (row?.id) uploadedIdByKey.set(draft.key, row.id);
          });
        } catch {
          setBusy(false);
          toast.error(dict.cars.uploadFailed);
          return;
        }
      }

      // 2. Final order: first draft is the cover, deletions are dropped.
      const ordered = drafts
        .map((d) => d.id ?? uploadedIdByKey.get(d.key))
        .filter((x): x is string => Boolean(x));
      const remove = baselineImageIds.filter((id) => !ordered.includes(id));
      const orderChanged =
        ordered.length !== baselineImageIds.length ||
        ordered.some((id, i) => id !== baselineImageIds[i]);

      if (orderChanged) {
        const orderResult = await adminSaveCarImages(carId, ordered, remove);
        if (!orderResult.ok) {
          setBusy(false);
          toast.error(orderResult.error);
          return;
        }
      }
    }

    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(isEdit ? dict.cars.updated : dict.cars.created);
    router.push("/admin/cars");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Core */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-brand">{dict.cars.brand} *</Label>
          <Input id="cf-brand" required value={values.brand} onChange={(e) => set("brand", e.target.value)} aria-invalid={Boolean(errors.brand)} />
          {errors.brand ? <p className="text-xs font-medium text-destructive">{errors.brand}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-model">{dict.cars.model} *</Label>
          <Input id="cf-model" required value={values.model} onChange={(e) => set("model", e.target.value)} aria-invalid={Boolean(errors.model)} />
          {errors.model ? <p className="text-xs font-medium text-destructive">{errors.model}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-year">{dict.cars.year} *</Label>
          <Input id="cf-year" type="number" min={1990} max={2100} value={values.year} onChange={(e) => set("year", e.target.value)} aria-invalid={Boolean(errors.year)} />
          {errors.year ? <p className="text-xs font-medium text-destructive">{errors.year}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-type">{dict.cars.type}</Label>
          <Input id="cf-type" value={values.type} onChange={(e) => set("type", e.target.value)} placeholder={dict.cars.typePlaceholder} dir="ltr" />
        </div>
        <div className="space-y-1.5">
          <Label>{dict.cars.category}</Label>
          <Select value={values.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">{dict.cars.categoryTiers.economy}</SelectItem>
              <SelectItem value="mid-range">{dict.cars.categoryTiers["mid-range"]}</SelectItem>
              <SelectItem value="luxury">{dict.cars.categoryTiers.luxury}</SelectItem>
              <SelectItem value="sport">{dict.cars.categoryTiers.sport}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Pricing */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cf-daily">{dict.cars.dailyPrice} *</Label>
          <Input id="cf-daily" type="number" min={0} step={1} required value={values.dailyPrice} onChange={(e) => set("dailyPrice", e.target.value)} dir="ltr" aria-invalid={Boolean(errors.dailyPrice)} />
          {errors.dailyPrice ? <p className="text-xs font-medium text-destructive">{errors.dailyPrice}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-weekly">{dict.cars.weeklyPrice}</Label>
          <Input id="cf-weekly" type="number" min={0} step={1} value={values.weeklyPrice} onChange={(e) => set("weeklyPrice", e.target.value)} dir="ltr" aria-invalid={Boolean(errors.weeklyPrice)} />
          {errors.weeklyPrice ? <p className="text-xs font-medium text-destructive">{errors.weeklyPrice}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-monthly">{dict.cars.monthlyPrice}</Label>
          <Input id="cf-monthly" type="number" min={0} step={1} value={values.monthlyPrice} onChange={(e) => set("monthlyPrice", e.target.value)} dir="ltr" aria-invalid={Boolean(errors.monthlyPrice)} />
          {errors.monthlyPrice ? <p className="text-xs font-medium text-destructive">{errors.monthlyPrice}</p> : null}
        </div>
      </section>

      {/* Specs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{dict.cars.transmission}</Label>
          <Select value={values.transmission} onValueChange={(v) => set("transmission", v as Transmission)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">{dict.cars.automatic}</SelectItem>
              <SelectItem value="manual">{dict.cars.manual}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-color">{dict.cars.color}</Label>
          <Input id="cf-color" value={values.color} onChange={(e) => set("color", e.target.value)} placeholder="Black / أسود" />
        </div>
        <div className="space-y-1.5">
          <Label>{dict.cars.status}</Label>
          <Select value={values.status} onValueChange={(v) => set("status", v as CarStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">{dict.cars.available}</SelectItem>
              <SelectItem value="booked">{dict.cars.booked}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Featured */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => set("featured", !values.featured)}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
        >
          <span className={`h-4 w-4 rounded-full border ${values.featured ? "border-accent bg-accent" : "border-muted-foreground"}`} />
          {dict.cars.featured}
        </button>
      </section>

      {/* Images */}
      <section className="space-y-3">
        <Label>{dict.cars.images}</Label>
        <CarImagesManager
          dict={dict}
          drafts={drafts}
          onChange={setDrafts}
          disabled={busy}
        />
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? dict.cars.edit : dict.cars.add}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          {dict.common.cancel}
        </Button>
      </div>
    </form>
  );
}