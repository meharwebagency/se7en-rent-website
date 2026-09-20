import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeaturedVehicles } from "@/components/vehicles/featured-vehicles";
import { TrustSection } from "@/components/home/trust-section";
import { ServicesSection } from "@/components/home/services-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";

import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export default async function HomePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  const dict = await getDictionary();

  return (
    <>
      {/* ============ HERO ============ */}
      <section
        className="relative overflow-hidden bg-white text-foreground"
      >
        {/* Art-directed hero background (desktop + mobile) */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/hero-bg-desktop.jpg"
            alt=""
            fill
            preload
            sizes="100vw"
            className="hero-bg hidden object-cover object-bottom md:block"
          />
          <Image
            src="/images/hero-bg-mobile.jpg"
            alt=""
            fill
            loading="eager"
            sizes="100vw"
            className="hero-bg object-cover object-bottom md:hidden"
          />
          {/* Subtle dark scrim on the copy side so the white text stays readable on the photo */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(4,8,16,0.55)_0%,rgba(4,8,16,0.3)_42%,rgba(4,8,16,0)_68%)] rtl:bg-[linear-gradient(to_left,rgba(4,8,16,0.55)_0%,rgba(4,8,16,0.3)_42%,rgba(4,8,16,0)_68%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        </div>

        <div className="relative container-max flex min-h-[380px] items-center px-4 pb-12 pt-12 sm:px-6 md:min-h-[420px] md:pb-14 md:pt-14 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {lang === "ar" ? (
                <>
                  {dict.home.heroTitle}
                  <span className="text-accent">{dict.home.heroTitleAccent}</span>
                </>
              ) : (
                <>
                  <span className="text-accent">Drive</span> Your Way
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="accent" size="lg">
                <a href="#vehicles">{dict.vehicles.bookNow}</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/${lang}/cars`}>{dict.home.viewAllVehicles}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED VEHICLES ============ */}
      <section id="vehicles" className="bg-secondary/60 pb-8 pt-4 lg:pb-10 lg:pt-6">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {dict.home.vehiclesTitle}
              </h2>
              <span className="mt-3 block h-1 w-16 rounded-full bg-accent" />
            </div>
            <Link
              href={`/${lang}/cars`}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-accent"
            >
              {dict.home.viewAllVehicles}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:translate-x-0 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
          <div className="mt-4">
            <FeaturedVehicles dict={dict} lang={lang as Locale} />
          </div>
        </div>
      </section>

      {/* ============ FEATURED SERVICES ============ */}
      <ServicesSection dict={dict.home} lang={lang as Locale} />

      {/* ============ HOW IT WORKS ============ */}
      <HowItWorksSection dict={dict.home} lang={lang as Locale} />

      {/* ============ WHY / TRUST ============ */}
      <TrustSection dict={dict.home} lang={lang as Locale} />

      {/* ============ CONTACT CTA ============ */}
      <section className="relative overflow-hidden bg-accent py-12 text-accent-foreground lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.08)_100%)]" />
        <div className="container-max relative px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {dict.bookCta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-accent-foreground/80">
            {dict.bookCta.subtitle}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-accent hover:bg-white/90"
          >
            <a href="#vehicles">
              {dict.bookCta.button}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}
