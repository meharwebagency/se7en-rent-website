import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { formatOMR } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/vehicles/types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface VehicleCardProps {
  vehicle: Vehicle;
  dict: Dictionary;
  lang: Locale;
  className?: string;
}

/**
 * Category tier → dark rich-neon gradient badge styling.
 * Each tier uses a smooth dark→rich gradient + subtle matching glow.
 * economy=emerald, mid-range=battery blue, luxury=satin gold, sport=passion red.
 */
function categoryTierClasses(category?: string): string {
  switch ((category ?? "").toLowerCase()) {
    case "economy":
      return "border border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-700 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25),inset_0_0_10px_rgba(16,185,129,0.15)]";
    case "mid-range":
      return "border border-blue-500/40 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.3),inset_0_0_10px_rgba(59,130,246,0.18)]";
    case "luxury":
      return "border border-amber-500/40 bg-gradient-to-br from-amber-950 via-amber-800 to-amber-600 text-amber-300 shadow-[0_0_12px_rgba(217,119,6,0.3),inset_0_0_10px_rgba(245,158,11,0.18)]";
    case "sport":
      return "border border-red-500/40 bg-gradient-to-br from-red-950 via-red-900 to-rose-800 text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.3),inset_0_0_10px_rgba(244,63,94,0.18)]";
    default:
      return "border border-blue-500/40 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-blue-300 shadow-[0_0_12px_rgba(37,99,235,0.3),inset_0_0_10px_rgba(59,130,246,0.18)]";
  }
}

export function VehicleCard({ vehicle, dict, lang, className }: VehicleCardProps) {
  const name = vehicle.name || `${vehicle.brand} ${vehicle.model}`;
  const isAvailable = vehicle.is_available !== false;

  return (
    <Link
      href={`/${lang}/cars/${vehicle.slug ?? vehicle.id}`}
      className={cn("group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    >
      <Card className="flex h-full flex-col overflow-hidden border-border/70 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* Photo on a light-gray backdrop, consistent ratio */}
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {vehicle.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.image_url}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent/10 text-accent">
              <span className="font-display text-3xl font-bold">{vehicle.brand?.[0] ?? "R"}</span>
            </div>
          )}
          <div className="absolute start-3 top-3">
            <Badge
              variant={isAvailable ? "success" : "secondary"}
              className="backdrop-blur"
            >
              {isAvailable ? `● ${dict.vehicles.available}` : dict.vehicles.unavailable}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <CardContent className="flex flex-1 flex-col pt-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="min-w-0 truncate font-display text-lg font-bold leading-snug text-foreground">
              {name}
            </h3>
            <Badge
              variant="secondary"
              className={cn("shrink-0", categoryTierClasses(vehicle.category))}
            >
              {vehicle.category
                ? (dict.fleet.categoryTiers[
                    vehicle.category as keyof typeof dict.fleet.categoryTiers
                  ] ?? vehicle.category)
                : vehicle.brand}
            </Badge>
          </div>
        </CardContent>

        {/* Footer: price + Book Now */}
        <CardFooter className="flex items-center justify-between gap-3 border-t border-border pt-5">
          <div className="flex items-baseline gap-1">
            <span dir="ltr" className="font-display text-xl font-bold text-accent">
              {formatOMR(vehicle.price_per_day, { locale: lang })}
            </span>
            <span className="text-xs text-muted-foreground">
              {dict.vehicles.perDay}
            </span>
          </div>
          <Button
            asChild
            variant={isAvailable ? "accent" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            <span>
              {dict.vehicles.bookNow}
              <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </span>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}