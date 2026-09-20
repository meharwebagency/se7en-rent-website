"use client";

import * as React from "react";

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
  CalendarDays,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CheckCircle2,
  CircleX,
  Loader2,
} from "lucide-react";

import {
  checkCarAvailability,
} from "@/app/actions/vehicles";
import { submitBooking } from "@/app/actions/bookings";

import { cn } from "@/lib/utils";
import { todayString, addDays, inclusiveDays } from "@/lib/utils/date";
import { formatOMR } from "@/lib/format/currency";
import { WhatsAppIcon } from "@/components/shared/social-icons";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Vehicle } from "@/lib/vehicles/types";

interface PickupOption {
  id: string;
  name: string;
}

interface ReservationPanelProps {
  car: Vehicle;
  dict: Dictionary;
  lang: Locale;
  locations: PickupOption[];
  businessPhone?: string;
}

type Availability =
  | "untested"
  | "checking"
  | "available"
  | "unavailable"
  | "unknown";

const roundOMR = (n: number) => Math.round(n);

/** Formats a YYYY-MM-DD string as e.g. "15 Oct 2026" (or Arabic). */
function formatWaDate(dateStr: string, lang: Locale): string {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-KW" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Formats an HH:MM time as "10:00 AM" (or Arabic ص/م). */
function formatWaTime(time: string, lang: Locale): string {
  if (!time) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  const h12 = ((h + 11) % 12) + 1;
  const amPm = lang === "ar" ? (h < 12 ? "ص" : "م") : h < 12 ? "AM" : "PM";
  return `${h12}:${m[2]} ${amPm}`;
}

function closeWaTab(tab: Window | null): void {
  if (!tab) return;
  try {
    tab.close();
  } catch {
    return;
  }
}

function navigateWaTab(tab: Window, href: string): boolean {
  try {
    tab.location.href = href;
    return true;
  } catch {
    return false;
  }
}

/** Best-effort estimate for a rental duration (daily vs weekly vs monthly). */
function estimateTotal(car: Vehicle, days: number): number {
  const daily = car.price_per_day;
  if (days <= 0) return 0;
  let total = daily * days;

  if (days >= 7 && car.weekly_price) {
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    total = Math.min(total, weeks * car.weekly_price + rest * daily);
  }
  if (days >= 30 && car.monthly_price) {
    const months = Math.floor(days / 30);
    const rest = days % 30;
    total = Math.min(total, months * car.monthly_price + rest * daily);
  }
  return roundOMR(total);
}

export function ReservationPanel({
  car,
  dict,
  lang,
  locations,
  businessPhone,
}: ReservationPanelProps) {
  const carDetail = dict.carDetail;

  const waDigits = businessPhone?.replace(/\D/g, "");
  const waBase = waDigits ? `https://wa.me/${waDigits}` : null;

  const today = React.useMemo(() => todayString(), []);
  const [pickup, setPickup] = React.useState(today);
  const [ret, setRet] = React.useState(addDays(today, 1));
  const [pickupTime, setPickupTime] = React.useState("10:00");
  const [returnTime, setReturnTime] = React.useState("10:00");

  const [location, setLocation] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [intlPhone, setIntlPhone] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const [availability, setAvailability] = React.useState<Availability>("untested");
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [reference, setReference] = React.useState<string | null>(null);
  const [waOpened, setWaOpened] = React.useState(false);

  const days = inclusiveDays(pickup, ret);
  const total = estimateTotal(car, days);

  const dateValid = Boolean(pickup && ret && ret >= pickup && pickup >= today);

  function buildWaHandoffHref(ref: string): string | null {
    if (!waBase) return null;
    const carLine = [car.brand, car.model].filter(Boolean).join(" ") || car.name || "—";
    const catLabel = car.category
      ? (dict.fleet.categoryTiers[car.category as keyof typeof dict.fleet.categoryTiers] ?? car.category)
      : null;
    const vehicleLine = catLabel
      ? `${carLine} (${catLabel})`
      : carLine;

    const locationName = locations.find((l) => l.id === location)?.name ?? location;
    const pickupDetail = [formatWaDate(pickup, lang), formatWaTime(pickupTime, lang)]
      .filter(Boolean)
      .join(", ");
    const returnDetail = [formatWaDate(ret, lang), formatWaTime(returnTime, lang)]
      .filter(Boolean)
      .join(", ");

    const messageLines = [
      `${carDetail.waNewBooking} - ${ref}`,
      `${carDetail.waVehicle}: ${vehicleLine}`,
      `${carDetail.waPickup}: ${locationName} - ${pickupDetail}`,
      `${carDetail.waReturn}: ${returnDetail}`,
      `${carDetail.waTotal}: ${formatOMR(total, { locale: lang })}`,
      `${carDetail.waCustomer}: ${name} - ${phone}`,
      ...(email.trim() ? [`${carDetail.waEmail}: ${email.trim()}`] : []),
      ...(notes.trim() ? [`${carDetail.waNotes}: ${notes.trim()}`] : []),
    ];
    return `${waBase}?text=${encodeURIComponent(messageLines.join("\n"))}`;
  }

  async function handleCheckAvailability() {
    if (!dateValid) return;
    setAvailability("checking");
    setServerError(null);
    const ok = await checkCarAvailability(car.id, pickup, ret);
    if (ok == null) setAvailability("unknown");
    else setAvailability(ok ? "available" : "unavailable");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateValid || submitting) return;
    setSubmitting(true);
    setServerError(null);

    const waTab = waBase ? window.open("", "_blank") : null;
    if (waTab) waTab.opener = null;

    let result;
    try {
      result = await submitBooking({
        fullName: name,
        email,
        phone,
        allowInternationalPhone: intlPhone,
        carId: car.id,
        pickupLocationId: location || null,
        pickupDate: pickup,
        returnDate: ret,
        pickupTime,
        returnTime,
        notes: notes.trim() || null,
      });
    } catch {
      closeWaTab(waTab);
      setSubmitting(false);
      setServerError(dict.common.error);
      return;
    }

    setSubmitting(false);
    if (result.ok && result.bookingReference) {
      const ref = result.bookingReference;
      setReference(ref);
      const href = buildWaHandoffHref(ref);
      if (waTab && href && navigateWaTab(waTab, href)) {
        setWaOpened(true);
      }
    } else if (result.error) {
      closeWaTab(waTab);
      setServerError(result.error);
    }
  }

  if (reference) {
    const waHandoffHref = buildWaHandoffHref(reference);

    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent/40 bg-card p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="font-display text-xl font-bold">{carDetail.successTitle}</h2>
        <p className="text-sm text-muted-foreground">{carDetail.successDesc}</p>
        <p className="font-mono text-lg font-semibold tracking-wider text-accent">
          {reference}
        </p>
        {waOpened && waHandoffHref ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <WhatsAppIcon className="h-4 w-4 text-emerald-500" />
            {carDetail.waOpenedHint}
          </p>
        ) : null}
        {!waOpened && waHandoffHref ? (
          <Button asChild variant="outline" size="sm" className="mt-1 gap-2">
            <a href={waHandoffHref} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              {carDetail.sendWhatsapp}
            </a>
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <a href={`/${lang}/cars`}>{carDetail.backToFleet}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-md sm:p-6">
      <h2 className="font-display text-lg font-bold">{carDetail.reservation}</h2>

      {/* Prices */}
      <div className="mt-3 flex items-baseline gap-2">
        <span dir="ltr" className="font-display text-2xl font-bold text-accent">
          {formatOMR(car.price_per_day, { locale: lang })}
        </span>
        <span className="text-sm text-muted-foreground">{carDetail.daily}</span>
      </div>

      {/* Dates */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rp-pickup" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            {carDetail.pickupDate}
          </Label>
          <Input
            id="rp-pickup"
            type="date"
            min={today}
            value={pickup}
            onChange={(e) => { setPickup(e.target.value); setAvailability("untested"); }}
            className="h-10 text-sm"
          />
          <Label htmlFor="rp-pickup-time" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-accent" />
            {carDetail.pickupTime}
          </Label>
          <Input
            id="rp-pickup-time"
            type="time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-return" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            {carDetail.returnDate}
          </Label>
          <Input
            id="rp-return"
            type="date"
            min={pickup}
            value={ret}
            onChange={(e) => { setRet(e.target.value); setAvailability("untested"); }}
            className="h-10 text-sm"
          />
          <Label htmlFor="rp-return-time" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-accent" />
            {carDetail.returnTime}
          </Label>
          <Input
            id="rp-return-time"
            type="time"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
      </div>

      {/* Availability status */}
      <div className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-border/70 p-3">
        <p className="text-sm">
          {availability === "checking" ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {carDetail.checkingAvailability}
            </span>
          ) : availability === "available" ? (
            <span className={cn("inline-flex items-center gap-2 font-medium", "text-emerald-600")}>
              <CheckCircle2 className="h-4 w-4" />
              {carDetail.availableNow}
            </span>
          ) : availability === "unavailable" ? (
            <span className="inline-flex items-center gap-2 font-medium text-red-600">
              <CircleX className="h-4 w-4" />
              {carDetail.notAvailableForDates}
            </span>
          ) : (
            <span className="text-muted-foreground">{carDetail.availableNow}</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCheckAvailability()}
          disabled={!dateValid || availability === "checking"}
        >
          {carDetail.checkAvailability}
        </Button>
      </div>

      {/* Booking form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rp-name" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 text-accent" />
            {carDetail.fullName}
          </Label>
          <Input
            id="rp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={carDetail.fullName}
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-email" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5 text-accent" />
            {carDetail.email}
          </Label>
          <Input
            id="rp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            dir="ltr"
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-phone" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 text-accent" />
            {carDetail.phone}
          </Label>
          <Input
            id="rp-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+96897102438"
            dir="ltr"
            className="h-10 text-sm"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {carDetail.phoneHelp}
          </p>
          <label className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={intlPhone}
              onChange={(e) => setIntlPhone(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-accent"
            />
            {carDetail.internationalPhone}
          </label>
        </div>

        {locations.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor="rp-location" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {carDetail.pickupLocation}
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="rp-location" className="h-10 w-full text-sm">
                <SelectValue placeholder={carDetail.pickupLocation} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="rp-notes" className="text-xs text-muted-foreground">
            {carDetail.notes}
          </Label>
          <textarea
            id="rp-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>

        {serverError ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {serverError}
          </p>
        ) : null}

        {/* Estimate */}
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
          <span className="text-sm text-muted-foreground">{carDetail.estimatedTotal}</span>
          <span className="text-end">
            <span dir="ltr" className="block font-display text-base font-bold">
              {dateValid ? formatOMR(total, { locale: lang }) : "—"}
            </span>
            {dateValid ? (
              <span className="block text-[11px] text-muted-foreground">
                {days} {carDetail.daysUnit}
              </span>
            ) : null}
          </span>
        </div>

        <Button
          type="submit"
          variant="accent"
          size="lg"
          className="w-full"
          disabled={
            submitting ||
            !dateValid ||
            !name.trim() ||
            !phone.trim() ||
            availability === "unavailable"
          }
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {carDetail.checkingAvailability}
            </span>
          ) : (
            carDetail.submitRequest
          )}
        </Button>
      </form>
    </div>
  );
}