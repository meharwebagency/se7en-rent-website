import { Suspense } from "react";

import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { LoadingState } from "@/components/shared/loading-state";

import { listVehicles } from "@/lib/vehicles/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

async function FleetRemainingGrid({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const { vehicles, error } = await listVehicles({ locale: lang, limit: 100 });

  if (error || vehicles.length === 0) return null;

  const remaining = vehicles.filter((v) => !v.is_featured);
  if (remaining.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {remaining.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} dict={dict} lang={lang} />
      ))}
    </div>
  );
}

export function FleetRemaining({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  return (
    <Suspense fallback={<LoadingState skeleton />}>
      <FleetRemainingGrid dict={dict} lang={lang} />
    </Suspense>
  );
}
