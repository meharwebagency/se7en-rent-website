"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["about"];

interface AboutContentProps {
  lang: Locale;
  dict: Dict;
  mapsUrl?: string;
}

export default function AboutContent({ lang, dict, mapsUrl }: AboutContentProps) {
  const fleetRef = useRef<HTMLElement | null>(null);
  const servicesRef = useRef<HTMLElement | null>(null);
  const featuresRef = useRef<HTMLElement | null>(null);
  const visitRef = useRef<HTMLElement | null>(null);
  const fleetCardsRef = useRef<HTMLDivElement | null>(null);
  const serviceCardsRef = useRef<HTMLDivElement | null>(null);
  const featureCardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    const sectionRefs = [fleetRef, servicesRef, featuresRef, visitRef];
    sectionRefs.forEach((ref) => {
      if (ref.current) sectionObserver.observe(ref.current);
    });

    // Staggered card entrance: each .premium-card in the grid slides up
    // with an 80 ms cascade delay based on its data-delay attribute.
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.delay ?? 0);
          requestAnimationFrame(() => {
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add("is-visible");
          });
          cardObserver.unobserve(el);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    [fleetCardsRef, serviceCardsRef, featureCardsRef].forEach((containerRef) => {
      if (!containerRef.current) return;
      containerRef.current.querySelectorAll(".premium-card").forEach((card) => {
        cardObserver.observe(card);
      });
    });

    const hero = document.querySelector(".hero-content");
    if (hero) {
      requestAnimationFrame(() => hero.classList.add("is-animated"));
    }

    return () => {
      sectionObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* ============ HERO ============ */}
      <section
        className="relative overflow-hidden bg-black text-white"
        aria-labelledby="about-hero-title"
      >
        {/* Responsive background: desktop image on PC, mobile image on small screens */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/about/hero-desktop.png"
            alt=""
            fill
            sizes="100vw"
            className="hero-bg hidden h-full w-full object-cover object-center md:block"
          />
          <Image
            src="/images/about/hero-mobile.png"
            alt=""
            fill
            sizes="100vw"
            className="hero-bg h-full w-full object-cover object-center md:hidden"
          />
          {/* Subtle overlay so white text stays readable without hiding the image */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(4,8,16,0.7)_0%,rgba(4,8,16,0.35)_45%,rgba(4,8,16,0)_75%)] rtl:bg-[linear-gradient(to_left,rgba(4,8,16,0.7)_0%,rgba(4,8,16,0.35)_45%,rgba(4,8,16,0)_75%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        </div>

        <div className="relative container-max flex min-h-[320px] items-center px-4 py-12 sm:px-6 md:min-h-[360px] md:py-14 lg:px-8">
          <div className="max-w-2xl hero-content">
            <span className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-8 bg-accent" />
              {dict.heroBadge}
            </span>
            <h1
              id="about-hero-title"
              className="text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {dict.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {dict.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ============ OUR DIVERSE FLEET ============ */}
      <section
        ref={fleetRef}
        id="fleet"
        className="about-section bg-secondary/60 py-12 lg:py-16"
        aria-labelledby="fleet-title"
      >
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="fleet-title" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dict.fleetTitle}
            </h2>
            <span className="mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
            <p className="mt-4 text-muted-foreground">{dict.fleetSubtitle}</p>
          </div>

          <div ref={fleetCardsRef} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dict.fleetItems.map((item, i) => {
              const isSports = i === 3;
              const fleetIcons = [
                "/images/icons/about/economy.png",
                "/images/icons/about/family.png",
                "/images/icons/about/luxury.png",
                "/images/icons/about/sports.png",
              ];
              return (
                <article
                  key={item}
                  data-delay={i * 80}
                  className="premium-card group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/8"
                >
                  <div className="premium-card-shine" aria-hidden="true" />
                  <div
                    className={
                      isSports
                        ? "relative mx-auto flex h-20 w-24 items-center justify-center rounded-2xl bg-accent/8 transition-transform duration-300 group-hover:scale-110"
                        : "relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/8 transition-transform duration-300 group-hover:scale-110"
                    }
                  >
                    <Image
                      src={fleetIcons[i]}
                      alt=""
                      width={isSports ? 96 : 80}
                      height={isSports ? 80 : 80}
                      sizes={isSports ? "96px" : "80px"}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <h3 className="relative mt-4 font-display text-lg font-semibold text-foreground">
                    {dict.fleetCardTitles[i]}
                  </h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{item}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ OUR SERVICES & CONTRACTS ============ */}
      <section
        ref={servicesRef}
        id="services"
        className="about-section bg-secondary py-12 lg:py-16"
        aria-labelledby="services-title"
      >
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="services-title" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dict.servicesTitle}
            </h2>
            <span className="mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
            <p className="mt-4 text-muted-foreground">{dict.servicesSubtitle}</p>
          </div>

          <div ref={serviceCardsRef} className="mt-10 grid gap-6 md:grid-cols-3">
            {dict.servicesItems.map((item, i) => {
              const serviceIcons = [
                "/images/icons/about/daily-weekly-monthly.png",
                "/images/icons/about/special-discounted.png",
                "/images/icons/about/airport-pickup.png",
              ];
              return (
                <article
                  key={item}
                  data-delay={i * 80}
                  className="premium-card group relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/8 sm:flex-row sm:items-start sm:gap-4 sm:px-5 sm:text-start"
                >
                  <div className="premium-card-shine" aria-hidden="true" />
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/8 transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src={serviceIcons[i]}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <p className="relative w-full text-base leading-relaxed text-foreground sm:w-auto">{item}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ OUR FEATURES ============ */}
      <section
        ref={featuresRef}
        id="features"
        className="about-section bg-secondary/60 py-12 lg:py-16"
        aria-labelledby="features-title"
      >
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="features-title" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dict.featuresTitle}
            </h2>
            <span className="mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
          </div>

          <div ref={featureCardsRef} className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dict.featuresItems.map((item, i) => {
              const featureIcons = [
                "/images/icons/about/gold-shield.png",
                "/images/icons/about/roadside-24-7.png",
                "/images/icons/about/free-delivery.png",
                // PLACEHOLDER: reuses the economy/money-coins icon.
                // Replace with a dedicated competitive-rates icon when available.
                "/images/icons/about/competitive-rates.png",
              ];
              return (
                <article
                  key={item}
                  data-delay={i * 80}
                  className="premium-card group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/8"
                >
                  <div className="premium-card-shine" aria-hidden="true" />
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/8 transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src={featureIcons[i]}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <p className="relative mt-4 text-sm leading-relaxed text-foreground">{item}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ VISIT US ============ */}
      <section
        ref={visitRef}
        id="visit"
        className="about-section bg-black py-12 lg:py-16 text-white"
        aria-labelledby="visit-title"
      >
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="visit-title" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.visitTitle}
            </h2>
            <span className="mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
            <p className="mt-4 text-white/70">{dict.visitSubtitle}</p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-6 text-center transition-colors hover:bg-white/10">
              <a
                href={`tel:+968${dict.visitPhones[0]}`}
                aria-label={dict.visitPhone}
                className="contact-icon-link mx-auto mb-2"
              >
                <Image
                  src="/images/icons/footer/phone.png"
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-10 w-10 object-contain"
                />
              </a>
              <h3 className="font-display text-lg font-semibold">{dict.visitPhone}</h3>
              <div className="mt-2 space-y-1">
                {dict.visitPhones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:+968${phone}`}
                    dir="ltr"
                    className="contact-link block text-center text-white/80 hover:text-accent"
                  >
                    +968 {phone.slice(0, 4)} {phone.slice(4)}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 p-6 text-center transition-colors hover:bg-white/10">
              <a
                href={`mailto:${dict.visitEmailAddress}`}
                aria-label={dict.visitEmail}
                className="contact-icon-link mx-auto mb-2"
              >
                <Image
                  src="/images/icons/footer/gmail.png"
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  className="h-10 w-10 object-contain"
                />
              </a>
              <h3 className="font-display text-lg font-semibold">{dict.visitEmail}</h3>
              <a
                href={`mailto:${dict.visitEmailAddress}`}
                className="contact-link mt-2 block text-white/80 hover:text-accent"
              >
                {dict.visitEmailAddress}
              </a>
            </div>

            <div className="rounded-2xl bg-white/5 p-6 text-center transition-colors hover:bg-white/10 md:col-span-2 lg:col-span-1">
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={lang === "ar" ? "الموقع" : "Location"}
                  className="contact-icon-link mx-auto mb-2"
                >
                  <Image
                    src="/images/icons/footer/googlemap.png"
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 object-contain"
                  />
                </a>
              ) : (
                <div className="contact-icon-link mx-auto mb-2 cursor-default">
                  <Image
                    src="/images/icons/footer/googlemap.png"
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 object-contain"
                  />
                </div>
              )}
              <h3 className="font-display text-lg font-semibold">
                {lang === "ar" ? "الموقع" : "Location"}
              </h3>
              <p className="mt-2 text-white/70">Muscat, Oman</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}