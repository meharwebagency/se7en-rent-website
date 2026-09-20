"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { adminUpdateSiteSettings } from "@/app/actions/admin";

import type { AdminSiteSettings } from "@/lib/admin/queries";
import type { Dictionary } from "@/i18n/dictionaries";

interface SettingsFormProps {
  dict: Dictionary["admin"];
  settings: AdminSiteSettings;
}

export function SettingsForm({ dict, settings }: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = React.useState({
    companyNameAr: settings.companyNameAr ?? "",
    companyNameEn: settings.companyNameEn ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    addressAr: settings.addressAr ?? "",
    addressEn: settings.addressEn ?? "",
    googleMapsUrl: settings.googleMapsUrl ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    snapchatUrl: settings.snapchatUrl ?? "",
    businessHours: settings.businessHours ?? "",
  });
  const [busy, setBusy] = React.useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await adminUpdateSiteSettings({
      ...values,
      allowInternationalPhone: true,
    });
    setBusy(false);
    if (result.ok) {
      toast.success(dict.settings.saved);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.settings.company}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-name-ar">{dict.settings.companyNameAr}</Label>
            <Input id="st-name-ar" value={values.companyNameAr} onChange={(e) => set("companyNameAr", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-name-en">{dict.settings.companyNameEn}</Label>
            <Input id="st-name-en" dir="ltr" value={values.companyNameEn} onChange={(e) => set("companyNameEn", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.settings.contact}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-email">{dict.settings.email}</Label>
            <Input id="st-email" type="email" dir="ltr" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-phone">{dict.settings.phone}</Label>
            <Input id="st-phone" dir="ltr" value={values.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+968..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-address-ar">{dict.settings.addressAr}</Label>
            <Input id="st-address-ar" value={values.addressAr} onChange={(e) => set("addressAr", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-address-en">{dict.settings.addressEn}</Label>
            <Input id="st-address-en" dir="ltr" value={values.addressEn} onChange={(e) => set("addressEn", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.settings.social}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-maps">{dict.settings.googleMapsUrl}</Label>
            <Input id="st-maps" type="url" dir="ltr" value={values.googleMapsUrl} onChange={(e) => set("googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-instagram">{dict.settings.instagramUrl}</Label>
            <Input id="st-instagram" type="url" dir="ltr" value={values.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-tiktok">{dict.settings.tiktokUrl}</Label>
            <Input id="st-tiktok" type="url" dir="ltr" value={values.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-snapchat">{dict.settings.snapchatUrl}</Label>
            <Input id="st-snapchat" type="url" dir="ltr" value={values.snapchatUrl} onChange={(e) => set("snapchatUrl", e.target.value)} placeholder="https://snapchat.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.settings.hours}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label htmlFor="st-hours">{dict.settings.businessHours}</Label>
          <Input id="st-hours" value={values.businessHours} onChange={(e) => set("businessHours", e.target.value)} />
          <p className="text-xs text-muted-foreground">{dict.settings.businessHoursHelp}</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dict.settings.save}
        </Button>
      </div>
    </form>
  );
}