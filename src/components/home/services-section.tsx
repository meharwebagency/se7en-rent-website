"use client";

import Image from "next/image";
import { useReveal } from "@/lib/motion/use-reveal";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["home"];

const SERVICE_ICONS = [
  "Airport_Pickup___Drop-off.png",
  "Delivery_Anywhere_in_Oman.png",
  "Free_Maintenance_Service_png.png",
  "24_7_Roadside_Assistance_png.png",
  "Gold_Comprehensive_Insurance_png.png",
];

interface ServicesSectionProps {
  dict: Dict;
  lang: Locale;
}

/**
 * "Our Services" featured-services section with a premium staggered reveal:
 * the heading fades up, then each card cascades in with a slightly different
 * entrance timing, and each icon has its own lagged scale-in.
 */
export function ServicesSection({ dict }: ServicesSectionProps) {
  const sectionRef = useReveal<HTMLElement>({
    stagger: 90,
    cardSelector: ".mv-card",
  });

  return (
    <section
      ref={sectionRef}
      className="mv-section container-max px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mv-heading font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {dict.featuredServicesTitle}
        </h2>
        <span className="mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {dict.featuredServices.map((title, i) => (
          <article
            key={title}
            className={`mv-card svc-card mv-lift relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gray-100 p-5 shadow-sm ${
              i === 4 ? "md:col-start-2" : ""
            }`}
          >
            <span className="mv-icon flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md">
              <Image
                src={`/images/icons/${SERVICE_ICONS[i]}`}
                alt={title}
                width={80}
                height={80}
                sizes="80px"
                className="h-full w-full object-contain"
              />
            </span>
            <h3 className="font-display text-lg font-bold leading-snug text-foreground md:text-xl">
              {title}
            </h3>
          </article>
        ))}
      </div>
    </section>
  );
}
