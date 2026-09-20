"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

import { useReveal } from "@/lib/motion/use-reveal";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["home"];

interface TrustSectionProps {
  dict: Dict;
  lang: Locale;
}

/**
 * Premium "Trusted by travelers" trust section.
 * Cinematic depth/scale settle-in with a staggered cascade, a subtle
 * scroll-driven parallax drift, and refined hover interactions.
 * Respects prefers-reduced-motion (CSS + JS short-circuit).
 */
export function TrustSection({ dict }: TrustSectionProps) {
  const sectionRef = useReveal<HTMLElement>({
    stagger: 130,
    cardSelector: ".trust-card",
  });
  const parallaxRef = useRef<HTMLDivElement | null>(null);

  // Subtle parallax drift while the section is in view (transform-only).
  useEffect(() => {
    const el = parallaxRef.current;
    const sectionEl = sectionRef.current;
    if (!el || !sectionEl) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = sectionEl.getBoundingClientRect();
        const vh = window.innerHeight;
        // Progress: -1 (below viewport) → 0 (centered) → +1 (above viewport)
        const raw = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2);
        const progress = Math.max(-1, Math.min(1, raw));
        // Very subtle drift: ±6px on the icon layer, opposite to scroll.
        el.style.transform = `translateY(${(-progress * 6).toFixed(2)}px)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const items = [
    {
      icon: "/images/icons/trust/transparent-pricing.png",
      title: dict.trust1Title,
      desc: dict.trust1Desc,
    },
    {
      icon: "/images/icons/trust/well-maintained-fleet.png",
      title: dict.trust2Title,
      desc: dict.trust2Desc,
    },
    {
      icon: "/images/icons/trust/flexible-terms.png",
      title: dict.trust3Title,
      desc: dict.trust3Desc,
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="trust-section bg-secondary pt-2 pb-12 lg:pt-4 lg:pb-16"
      aria-labelledby="trust-title"
    >
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="trust-title"
            className="mv-heading font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {dict.trustTitle}
          </h2>
          <span className="mv-heading mt-3 inline-block h-1 w-16 rounded-full bg-accent" />
          <p className="mv-heading mt-4 text-muted-foreground">{dict.trustSubtitle}</p>
        </div>

        <div ref={parallaxRef} className="trust-parallax relative mt-10 grid gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <article
              key={item.title}
              data-delay={i * 130}
              className="trust-card mv-lift group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-secondary p-7 text-center shadow-sm"
            >
              <div className="premium-card-shine" aria-hidden="true" />
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/8 ring-1 ring-accent/15">
                <Image
                  src={item.icon}
                  alt=""
                  width={80}
                  height={80}
                  sizes="80px"
                  className="trust-icon h-full w-full object-contain p-3"
                />
              </div>
              <h3 className="relative mt-5 font-display text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
