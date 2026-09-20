import { Suspense } from "react";
import { RefreshCw } from "lucide-react";

import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";

import { getVehicles } from "@/lib/vehicles/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

async function FeaturedGrid({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const { vehicles, error } = await getVehicles({ locale: lang, featuredOnly: true, limit: 6 });

  if (error) {
    return (
      <EmptyState
        title={dict.vehicles.error}
        icon={<RefreshCw className="h-7 w-7" />}
      />
    );
  }

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title={dict.vehicles.empty}
        icon={<span className="text-2xl">🚗</span>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} dict={dict} lang={lang} />
      ))}
    </div>
  );
}

export function FeaturedVehicles({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  return (
    <Suspense fallback={<LoadingState skeleton />}>
      <FeaturedGrid dict={dict} lang={lang} />
    </Suspense>
  );
}
