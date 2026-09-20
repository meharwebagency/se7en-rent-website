import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import {
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  CircleDollarSign,
  Gauge,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarGallery } from "@/components/vehicles/car-gallery";
import { ReservationPanel } from "@/components/vehicles/reservation-panel";

import { getDictionary } from "@/i18n/dictionaries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getVehicleDetail } from "@/lib/vehicles/queries";
import { getLocations } from "@/lib/locations/service";
import { getSiteSettings } from "@/lib/settings/service";
import { formatOMR } from "@/lib/format/currency";
import type { Vehicle } from "@/lib/vehicles/types";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/cars/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const dict = await getDictionary();

  const detail = await getVehicleDetail({ locale: lang as Locale, id });
  if (!detail) {
    return { title: dict.carDetail.invalidTitle };
  }

  const { vehicle } = detail;
  return {
    title: vehicle.name,
    description:
      vehicle.short_description ?? vehicle.description ?? dict.fleet.subtitle,
    alternates: {
      canonical: `/${lang}/cars/${id}`,
    },
    openGraph: {
      title: `${vehicle.name} — ${dict.meta.title}`,
      description: vehicle.description ?? undefined,
      images: vehicle.image_url ? [{ url: vehicle.image_url }] : undefined,
      type: "website",
    },
  };
}

export default async function CarDetailPage({
  params,
}: PageProps<"/[lang]/cars/[id]">) {
  const { lang, id } = await params;
  const dict = await getDictionary();

  const detail = await getVehicleDetail({ locale: lang as Locale, id });
  if (!detail) notFound();

  const { vehicle, images } = detail;

  if (vehicle.status !== "available") {
    return <CarUnavailable dict={dict} lang={lang as Locale} />;
  }

  const locations = await getLocations(lang as Locale);
  const siteSettings = await getSiteSettings();
  const businessPhone = siteSettings?.phone?.trim() || null;

  return (
    <div className="container-max px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        href={`/${lang}/cars`}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {dict.carDetail.backToFleet}
      </Link>

      {/* Header */}
      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {vehicle.name}
            </h1>
            {vehicle.is_featured ? (
              <Badge variant="accent" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {dict.vehicles.featured}
              </Badge>
            ) : null}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{vehicle.brand}</span>
            <span>•</span>
            <span>{vehicle.year}</span>
            <span>•</span>
            <span>
              {dict.fleet.categoryTiers[
                (vehicle.category ?? "") as keyof typeof dict.fleet.categoryTiers
              ] ?? vehicle.category}
            </span>
          </p>
        </div>
        <div className="text-end">
          <span dir="ltr" className="font-display text-3xl font-bold text-accent">
            {formatOMR(vehicle.price_per_day, { locale: lang as Locale })}
          </span>
          <span className="ms-2 text-sm text-muted-foreground">
            {dict.carDetail.daily}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left: gallery + content */}
        <div className="min-w-0 space-y-6">
          <CarGallery
            images={images}
            name={vehicle.name ?? `${vehicle.brand} ${vehicle.model}`}
            brand={vehicle.brand}
            dict={dict}
          />

          {/* Rental options */}
          <RentalOptions vehicle={vehicle} dict={dict} lang={lang as Locale} />

          {/* About */}
          <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">
              {dict.carDetail.overview}
            </h2>
            <span className="mt-3 block h-1 w-12 rounded-full bg-accent" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {vehicle.description ??
                dict.fleet.subtitle}
            </p>
          </section>

          {/* Specs */}
          <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">
              {dict.carDetail.specifications}
            </h2>
            <span className="mt-3 block h-1 w-12 rounded-full bg-accent" />
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {specRows(vehicle, dict).map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-2.5 rounded-xl bg-secondary px-3 py-3"
                >
                  <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="truncate text-sm font-semibold">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 ? (
            <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">
                {dict.carDetail.features}
              </h2>
              <span className="mt-3 block h-1 w-12 rounded-full bg-accent" />
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vehicle.features.map((feature, index) => {
                  const label =
                    (lang === "ar" ? feature.ar : feature.en) ??
                    feature.ar ??
                    feature.en;
                  return (
                    <li
                      key={`${label}-${index}`}
                      className="flex items-center gap-2.5 rounded-xl bg-secondary px-4 py-3 text-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Check className="h-3 w-3" />
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Right: reservation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ReservationPanel
            car={vehicle}
            dict={dict}
            lang={lang as Locale}
            locations={locations.map((l) => ({ id: l.id, name: l.name }))}
            businessPhone={businessPhone ?? undefined}
          />
        </aside>
      </div>
    </div>
  );
}

function RentalOptions({
  vehicle,
  dict,
  lang,
}: {
  vehicle: Vehicle;
  dict: Dictionary;
  lang: Locale;
}) {
  const daily = vehicle.price_per_day;

  const week = vehicle.weekly_price
    ? Math.round((1 - vehicle.weekly_price / (daily * 7)) * 100)
    : null;
  const month = vehicle.monthly_price
    ? Math.round((1 - vehicle.monthly_price / (daily * 30)) * 100)
    : null;

  const options = [
    {
      key: "day",
      label: dict.carDetail.daily,
      price: daily,
      sub: dict.carDetail.daily,
      percent: null,
      icon: CalendarDays,
    },
    ...(vehicle.weekly_price
      ? [{
          key: "week",
          label: dict.carDetail.weekly,
          price: vehicle.weekly_price,
          sub: dict.carDetail.perWeek,
          percent: week,
          icon: ShieldCheck,
        }]
      : []),
    ...(vehicle.monthly_price
      ? [{
          key: "month",
          label: dict.carDetail.monthly,
          price: vehicle.monthly_price,
          sub: dict.carDetail.perMonth,
          percent: month,
          icon: CircleDollarSign,
        }]
      : []),
  ];

  return (
    <section>
      <h2 className="font-display text-xl font-bold">
        {dict.carDetail.rentalOptions}
      </h2>
      <span className="mt-3 block h-1 w-12 rounded-full bg-accent" />
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {options.map((option) => (
          <Card key={option.key} className="relative overflow-hidden">
            <CardContent className="p-5">
              {option.percent != null && option.percent > 0 ? (
                <Badge variant="success" className="absolute end-3 top-3">
                  {lang === "ar"
                    ? `وفّر ${option.percent}%`
                    : `Save ${option.percent}%`}
                </Badge>
              ) : null}
              <option.icon className="h-5 w-5 text-accent" />
              <p className="mt-3 text-sm font-semibold">{option.label}</p>
              <p className="mt-1">
                <span dir="ltr" className="font-display text-xl font-bold">
                  {formatOMR(option.price, { locale: lang })}
                </span>
                <span className="ms-1.5 text-xs text-muted-foreground">
                  {option.sub}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function specRows(vehicle: Vehicle, dict: Dictionary) {
  return [
    { icon: CalendarDays, label: dict.carDetail.year, value: String(vehicle.year ?? "—") },
    {
      icon: Car,
      label: dict.carDetail.category,
      value:
        dict.fleet.categoryTiers[
          (vehicle.category ?? "") as keyof typeof dict.fleet.categoryTiers
        ] ?? vehicle.category ?? "—",
    },
    { icon: ShieldCheck, label: dict.carDetail.brand, value: vehicle.brand },
    { icon: Gauge, label: dict.carDetail.model, value: vehicle.model },
    {
      icon: Car,
      label: dict.carDetail.transmission,
      value:
        vehicle.transmission === "manual"
          ? dict.carDetail.manual
          : dict.carDetail.automatic,
    },
    {
      icon: Palette,
      label: dict.carDetail.color,
      value: vehicle.color ?? "—",
    },
  ];
}

function CarUnavailable({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  return (
    <div className="container-max px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Car className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold">
          {dict.carDetail.unavailableTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.carDetail.unavailableDesc}
        </p>
        <Button asChild variant="accent" className="mt-2">
          <Link href={`/${lang}/cars`}>{dict.carDetail.browseOtherCars}</Link>
        </Button>
      </div>
    </div>
  );
}