import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { isLocale } from "@/i18n/config";
import { lang } from "next/root-params";

export default async function CarNotFound() {
  const locale = await lang();
  const dict = await getDictionary();
  const Locale = isLocale(locale) ? (locale as Locale) : "ar";

  return (
    <div className="container-max px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Car className="h-7 w-7" />
        </span>
        <h1 className="font-display text-xl font-bold">
          {dict.carDetail.invalidTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.carDetail.invalidDesc}
        </p>
        <Button asChild variant="accent" className="mt-2">
          <Link href={`/${Locale}/cars`}>{dict.carDetail.browseOtherCars}</Link>
        </Button>
      </div>
    </div>
  );
}