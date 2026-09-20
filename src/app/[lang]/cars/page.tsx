import type { Metadata } from "next";

import { FleetBrowser } from "@/components/vehicles/fleet-browser";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { listVehicles, getAvailableCarIdsForDates } from "@/lib/vehicles/queries";
import { parseDateParam } from "@/lib/utils/date";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/cars">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary();

  return {
    title: dict.fleet.title,
    description: dict.fleet.subtitle,
    alternates: {
      canonical: `/${lang}/cars`,
    },
    openGraph: {
      title: dict.fleet.title,
      description: dict.fleet.subtitle,
      type: "website",
    },
  };
}

export default async function FleetPage({
  params,
  searchParams,
}: PageProps<"/[lang]/cars">) {
  const { lang } = await params;
  const dict = await getDictionary();
  const sp = await searchParams;

  const { snapshot, factionAvailableIds } = await loadFleet(
    lang as Locale,
    sp,
  );

  return (
    <FleetBrowser
      lang={lang as Locale}
      dict={dict}
      vehicles={snapshot.vehicles}
      initialError={snapshot.error}
      initialPickup={parseDateParam(readParam(sp, "pickup"))}
      initialReturn={parseDateParam(readParam(sp, "return"))}
      initialAvailableIds={factionAvailableIds}
    />
  );
}

function readParam(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = sp[key];
  return typeof value === "string" ? value : null;
}

async function loadFleet(
  lang: Locale,
  sp: Record<string, string | string[] | undefined>,
) {
  const snapshot = await listVehicles({ locale: lang, limit: 100 });

  const pickup = parseDateParam(readParam(sp, "pickup"));
  const ret = parseDateParam(readParam(sp, "return"));

  let availableIds: string[] | null = null;
  if (pickup && ret) {
    const ids = await getAvailableCarIdsForDates(pickup, ret);
    if (ids) availableIds = Array.from(ids);
  }

  return { snapshot, factionAvailableIds: availableIds };
}