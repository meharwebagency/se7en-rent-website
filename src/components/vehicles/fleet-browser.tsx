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
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SlidersHorizontal, RotateCcw, CalendarDays, Check, ChevronDown } from "lucide-react";

import { getAvailableCarIds } from "@/app/actions/vehicles";

import { cn } from "@/lib/utils";
import { todayString } from "@/lib/utils/date";
import { formatOMR } from "@/lib/format/currency";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { Vehicle, Transmission } from "@/lib/vehicles/types";

type PriceRange = "any" | "lt20" | "b20_40" | "b40_60" | "gt60";
type SortKey = "default" | "priceAsc" | "priceDesc" | "newest" | "featured";

interface Filters {
  category: string;
  brand: string;
  price: PriceRange;
  type: string;
  transmission: string;
  /** Min/max price in OMR; empty string means no bound. Mobile-only range filter. */
  priceMin: string;
  priceMax: string;
}

interface FleetBrowserProps {
  lang: Locale;
  dict: Dictionary;
  vehicles: Vehicle[];
  initialError: boolean;
  initialPickup?: string | null;
  initialReturn?: string | null;
  /** Server-computed availability for the initially requested dates. */
  initialAvailableIds?: string[] | null;
}

function matchesPrice(price: number, range: PriceRange): boolean {
  switch (range) {
    case "lt20":
      return price < 20;
    case "b20_40":
      return price >= 20 && price <= 40;
    case "b40_60":
      return price > 40 && price <= 60;
    case "gt60":
      return price > 60;
    default:
      return true;
  }
}

function sortVehicles(list: Vehicle[], sort: SortKey): Vehicle[] {
  const sorted = [...list];
  switch (sort) {
    case "priceAsc":
      sorted.sort((a, b) => a.price_per_day - b.price_per_day);
      break;
    case "priceDesc":
      sorted.sort((a, b) => b.price_per_day - a.price_per_day);
      break;
    case "newest":
      sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      break;
    case "featured":
      sorted.sort(
        (a, b) =>
          Number(b.is_featured ?? false) - Number(a.is_featured ?? false) ||
          a.price_per_day - b.price_per_day
      );
      break;
    default:
      break; // keep server order (price asc)
  }
  return sorted;
}

export function FleetBrowser({
  lang,
  dict,
  vehicles,
  initialError,
  initialPickup,
  initialReturn,
  initialAvailableIds,
}: FleetBrowserProps) {
  const [filters, setFilters] = React.useState<Filters>({
    category: "all",
    brand: "all",
    price: "any",
    type: "all",
    transmission: "all",
    priceMin: "",
    priceMax: "",
  });
  const [pickup, setPickup] = React.useState(initialPickup ?? "");
  const [ret, setRet] = React.useState(initialReturn ?? "");
  const [datesMode, setDatesMode] = React.useState(
    Boolean(initialPickup && initialReturn && initialAvailableIds != null)
  );
  const [availableIds, setAvailableIds] = React.useState<Set<string> | null>(
    initialPickup && initialReturn && initialAvailableIds != null
      ? new Set(initialAvailableIds)
      : null
  );
  const [sort, setSort] = React.useState<SortKey>("default");
  const [checking, setChecking] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const today = React.useMemo(() => todayString(), []);

  const facets = React.useMemo(() => buildFacets(vehicles), [vehicles]);

  /** Data-driven price bounds (KD) so the range inputs match real prices. */
  const priceBounds = React.useMemo(() => {
    if (vehicles.length === 0) return { min: 0, max: 0, step: 1 };
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of vehicles) {
      if (v.price_per_day < lo) lo = v.price_per_day;
      if (v.price_per_day > hi) hi = v.price_per_day;
    }
    const min = Math.floor(lo);
    const max = Math.ceil(hi);
    const step = max - min <= 60 ? 1 : 5;
    return { min, max, step };
  }, [vehicles]);

  const visible = React.useMemo(() => {
    let list = vehicles;

    if (filters.category !== "all") {
      list = list.filter((v) => v.category === filters.category);
    }
    if (filters.brand !== "all") {
      list = list.filter((v) => v.brand === filters.brand);
    }
    if (filters.type !== "all") {
      list = list.filter((v) => v.type === filters.type);
    }
    if (filters.price !== "any") {
      list = list.filter((v) => matchesPrice(v.price_per_day, filters.price));
    }
    if (filters.priceMin !== "" || filters.priceMax !== "") {
      const lo = filters.priceMin !== "" ? Number(filters.priceMin) : -Infinity;
      const hi = filters.priceMax !== "" ? Number(filters.priceMax) : Infinity;
      list = list.filter((v) => v.price_per_day >= lo && v.price_per_day <= hi);
    }
    if (filters.transmission !== "all") {
      list = list.filter(
        (v) => (v.transmission as Transmission | undefined) === filters.transmission
      );
    }

    if (datesMode && availableIds != null) {
      list = list.filter((v) => availableIds.has(v.id));
    }

    return sortVehicles(list, sort);
  }, [vehicles, filters, datesMode, availableIds, sort]);

  const activeCount = React.useMemo(() => {
    let n = 0;
    if (filters.category !== "all") n++;
    if (filters.brand !== "all") n++;
    if (filters.price !== "any") n++;
    if (filters.type !== "all") n++;
    if (filters.priceMin !== "" || filters.priceMax !== "") n++;
    if (filters.transmission !== "all") n++;
    if (datesMode && availableIds != null) n++;
    return n;
  }, [filters, datesMode, availableIds]);

  const applyingDates = datesMode && !pickup && !ret;

  async function handleApplyAvailability() {
    if (!pickup || !ret) return;
    setChecking(true);
    try {
      const ids = await getAvailableCarIds(pickup, ret);
      setAvailableIds(ids ? new Set(ids) : null);
      setDatesMode(true);
    } finally {
      setChecking(false);
    }
  }

  function handleEnableDatesMode() {
    setDatesMode(true);
    if (pickup && ret) void handleApplyAvailability();
  }

  function handleReset() {
    setFilters({
      category: "all",
      brand: "all",
      price: "any",
      type: "all",
      transmission: "all",
      priceMin: "",
      priceMax: "",
    });
    setPickup("");
    setRet("");
    setDatesMode(false);
    setAvailableIds(null);
    setSort("default");
  }

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (initialError) {
    return (
      <FleetShell dict={dict} count={0}>
        <ErrorState
          title={dict.fleet.noCars}
          description={dict.fleet.databaseError}
        />
      </FleetShell>
    );
  }

  if (vehicles.length === 0) {
    return (
      <FleetShell dict={dict} count={0}>
        <EmptyState
          title={dict.fleet.noCars}
          icon={<span className="text-2xl">{lang === "ar" ? "🚙" : "🚗"}</span>}
        />
      </FleetShell>
    );
  }

  return (
    <FleetShell dict={dict} count={visible.length}>
      {/* ===== Filters ===== */}
      <section
        className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5"
        aria-label={dict.fleet.filterBy}
      >
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="fleet-filters-content"
          className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-muted-foreground md:cursor-default md:pointer-events-none"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            {dict.fleet.filterBy}
          </span>
          <span className="inline-flex items-center gap-2">
            {activeCount > 0 ? (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold leading-4 text-white"
                aria-label={`${activeCount} active filters`}
              >
                {activeCount}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform md:hidden",
                mobileOpen ? "rotate-180" : ""
              )}
            />
          </span>
        </button>

        <div
          id="fleet-filters-content"
          className={cn(mobileOpen ? "block" : "hidden", "md:block")}
        >
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Category (tier) */}
          <FilterSelect
            label={dict.fleet.filters.category}
            value={filters.category}
            onValueChange={(v) => set("category", v)}
            items={Object.entries(dict.fleet.categoryTiers).map(([value, label]) => ({
              value,
              label,
            }))}
            allLabel={dict.fleet.all}
            includeAll
          />
          {/* Brand */}
          <FilterSelect
            label={dict.fleet.filters.brand}
            value={filters.brand}
            onValueChange={(v) => set("brand", v)}
            items={facets.brands.map((b) => ({ value: b, label: b }))}
            allLabel={dict.fleet.all}
            includeAll
          />
          {/* Price */}
          <FilterSelect
            label={dict.fleet.filters.price}
            value={filters.price}
            onValueChange={(v) => set("price", v as PriceRange)}
            items={(Object.keys(dict.fleet.priceRanges) as PriceRange[]).map((k) => ({
              value: k,
              label: dict.fleet.priceRanges[k],
            }))}
            allLabel={dict.fleet.filters.price}
            className="hidden md:block"
          />
          {/* Transmission */}
          <FilterSelect
            label={dict.fleet.filters.transmission}
            value={filters.transmission}
            onValueChange={(v) => set("transmission", v)}
            items={facets.transmissions.map((t) => ({
              value: t,
              label: t === "automatic" ? dict.carDetail.automatic : dict.carDetail.manual,
            }))}
            allLabel={dict.fleet.all}
            includeAll
            className="hidden md:block"
          />
        </div>

        {/* Mobile-only: Price Range + Type filters */}
        <div className="mt-4 space-y-4 md:hidden">
          {/* Price range (min/max, data-driven) */}
          <div className="space-y-2 rounded-xl border border-border/70 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                {dict.fleet.filters.price}
              </Label>
              {(filters.priceMin !== "" || filters.priceMax !== "") ? (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {formatOMR(filters.priceMin !== "" ? Number(filters.priceMin) : priceBounds.min, {
                    locale: lang,
                  })}{" "}
                  –{" "}
                  {formatOMR(
                    filters.priceMax !== "" ? Number(filters.priceMax) : priceBounds.max,
                    { locale: lang },
                  )}
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fleet-price-min" className="text-xs text-muted-foreground">
                  {dict.fleet.filters.priceMin}
                </Label>
                <Input
                  id="fleet-price-min"
                  type="number"
                  inputMode="decimal"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={filters.priceMin}
                  onChange={(e) => set("priceMin", e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fleet-price-max" className="text-xs text-muted-foreground">
                  {dict.fleet.filters.priceMax}
                </Label>
                <Input
                  id="fleet-price-max"
                  type="number"
                  inputMode="decimal"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={priceBounds.step}
                  value={filters.priceMax}
                  onChange={(e) => set("priceMax", e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Type (from actual vehicle data) */}
          <FilterSelect
            label={dict.fleet.filters.type}
            value={filters.type}
            onValueChange={(v) => set("type", v)}
            items={facets.types.map((t) => ({ value: t, label: t }))}
            allLabel={dict.fleet.all}
            includeAll
          />
        </div>

        {/* Availability by dates (desktop only) */}
        <div
          className={cn(
            "mt-4 hidden rounded-xl border p-3.5 transition-colors md:block",
            datesMode ? "border-accent/40 bg-accent/5" : "border-border/70"
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleEnableDatesMode}
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border",
                  datesMode ? "border-accent bg-accent text-accent-foreground" : "border-border"
                )}
                aria-hidden="true"
              >
                {datesMode ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className={cn(datesMode ? "text-foreground" : "text-muted-foreground")}>
                {dict.fleet.availabilityOptions.available}
              </span>
            </button>

            <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="fleet-pickup" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-accent" />
                  {dict.fleet.filters.pickupDate}
                </Label>
                <Input
                  id="fleet-pickup"
                  type="date"
                  min={today}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  disabled={!datesMode}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fleet-return" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-accent" />
                  {dict.fleet.filters.returnDate}
                </Label>
                <Input
                  id="fleet-return"
                  type="date"
                  min={pickup || today}
                  value={ret}
                  onChange={(e) => setRet(e.target.value)}
                  disabled={!datesMode}
                  className="h-10 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-full sm:w-auto"
                onClick={() => void handleApplyAvailability()}
                disabled={!datesMode || applyingDates || checking}
              >
                {checking ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {dict.fleet.filters.apply}
                  </span>
                ) : (
                  dict.fleet.filters.apply
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:hidden">
          <Button
            type="button"
            className="w-full gap-1.5"
            onClick={() => setMobileOpen(false)}
          >
            {dict.fleet.filters.apply}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {dict.fleet.reset}
          </Button>
        </div>

        <div className="mt-4 hidden flex-wrap items-center justify-between gap-3 md:flex">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {dict.fleet.reset}
          </Button>
        </div>
        </div>
      </section>

      {/* ===== Results row + sort ===== */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{visible.length}</span>{" "}
          {visible.length === 1 ? dict.fleet.resultsOne : dict.fleet.resultsMany}
        </p>
        <FilterSelect
          label={dict.fleet.sortBy}
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
          items={(Object.keys(dict.fleet.sort) as SortKey[])
            .filter((k) => k !== "default")
            .map((k) => ({ value: k, label: dict.fleet.sort[k] }))}
          allLabel={dict.fleet.sort.default}
          compact
        />
      </div>

      {/* ===== Grid ===== */}
      {visible.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} dict={dict} lang={lang} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={dict.fleet.empty}
            description={dict.fleet.emptyHint}
            icon={<span className="text-2xl">🔍</span>}
            action={
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="me-2 h-3.5 w-3.5" />
                {dict.fleet.reset}
              </Button>
            }
          />
        </div>
      )}
    </FleetShell>
  );
}

function FleetShell({
  dict,
  count,
  children,
}: {
  dict: Dictionary;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="container-max px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {dict.fleet.title}
          </h1>
          <span className="mt-3 block h-1 w-16 rounded-full bg-accent" />
          <p className="mt-3 max-w-xl text-muted-foreground">{dict.fleet.subtitle}</p>
        </div>
        <p className="whitespace-nowrap text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{count}</span>{" "}
          {count === 1 ? dict.fleet.resultsOne : dict.fleet.resultsMany}
        </p>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  items,
  allLabel,
  includeAll = false,
  compact = false,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
  allLabel?: string;
  /** Prepend an "All" option (value "all"). Required when the selected value is "all". */
  includeAll?: boolean;
  compact?: boolean;
  /** Extra classes for the wrapper div (e.g. responsive visibility). */
  className?: string;
}) {
  const options = includeAll
    ? [{ value: "all", label: allLabel ?? "All" }, ...items]
    : items;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={compact ? "h-9 w-full max-w-56 gap-1 text-sm" : "h-10 w-full text-sm"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Unique facet values (brand, transmission, type) derived from the list. */
function buildFacets(vehicles: Vehicle[]) {
  const brands = [...new Set(vehicles.map((v) => v.brand).filter(Boolean))].sort();
  const transmissions = [...new Set(vehicles.map((v) => v.transmission).filter(Boolean))] as Transmission[];
  const types = [...new Set(vehicles.map((v) => v.type).filter(Boolean) as string[])].sort();

  return { brands, transmissions, types };
}