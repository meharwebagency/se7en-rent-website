"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, CalendarDays, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface BookingWidgetProps {
  dict: Dictionary;
  lang: Locale;
  variant?: "overlay" | "inline";
  className?: string;
}

/**
 * Booking search widget.
 *
 * Collects rental search criteria and pushes them to the availability/booking
 * flow. The criteria are stored in state and serialized into the URL so the
 * vehicle availability system (connected in a later step) can read them.
 */
export function BookingWidget({
  dict,
  lang,
  variant = "overlay",
  className,
}: BookingWidgetProps) {
  const router = useRouter();
  const [location, setLocation] = React.useState("");
  const [pickupDate, setPickupDate] = React.useState("");
  const [returnDate, setReturnDate] = React.useState("");
  const [searching, setSearching] = React.useState(false);

  const todayLocal = new Date();
  const today = new Date(todayLocal.getTime() - todayLocal.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);

    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (pickupDate) params.set("pickup", pickupDate);
    if (returnDate) params.set("return", returnDate);

    // Route to the fleet with the search criteria for the availability system.
    const qs = params.toString();
    router.push(`/${lang}/cars${qs ? `?${qs}` : ""}#bookable`);
    // Simulated hand-off; real queries happen in the availability system.
    window.setTimeout(() => setSearching(false), 400);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full rounded-lg border border-border/70 bg-card px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.15)] sm:px-5 sm:py-3",
        className
      )}
      aria-label={dict.booking.searchCars}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end lg:gap-0">
        {/* Location */}
        <div className="space-y-1.5 lg:pe-3">
          <Label htmlFor="pickup-location" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {dict.booking.pickupLocation}
          </Label>
          <Input
            id="pickup-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={dict.booking.pickupLocationPlaceholder}
            className="h-12"
          />
        </div>

        {/* Pickup date */}
        <div className="space-y-1.5 lg:border-s lg:border-border/70 lg:px-3">
          <Label htmlFor="pickup-date" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            {dict.booking.pickupDate}
          </Label>
          <Input
            id="pickup-date"
            type="date"
            min={today}
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Return date */}
        <div className="space-y-1.5 lg:border-s lg:border-border/70 lg:px-3">
          <Label htmlFor="return-date" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            {dict.booking.returnDate}
          </Label>
          <Input
            id="return-date"
            type="date"
            min={pickupDate || today}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="h-12"
          />
        </div>

        {/* Search */}
        <div className="lg:ps-3">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="h-12 w-full lg:w-auto lg:px-8"
            disabled={searching}
          >
            {searching ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {dict.booking.checking}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                {dict.booking.searchCars}
              </span>
            )}
          </Button>
        </div>
      </div>

      {variant === "inline" ? null : null}
    </form>
  );
}
