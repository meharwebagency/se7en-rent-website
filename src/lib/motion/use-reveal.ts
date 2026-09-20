"use client";

import { useEffect, useRef, type RefObject } from "react";

interface RevealOptions {
  /** Stagger delay in ms between each card (0 = all at once). */
  stagger?: number;
  /** Card elements to stagger. When set, cards are observed individually and get
   *  a `transitionDelay` based on their index. When omitted, only the root reveals. */
  cardSelector?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Generic scroll-reveal hook.
 *
 * - Adds `is-visible` to the root when it enters the viewport.
 * - When `cardSelector` is provided, also observes each matching child and
 *   sets an incremental `transitionDelay` so they cascade in.
 *
 * Honors `prefers-reduced-motion` by revealing everything instantly with no
 * transforms.
 *
 * Usage:
 *   const ref = useReveal<HTMLElement>({ stagger: 90, cardSelector: ".svc-card" });
 *   <section ref={ref} className="svc-section">
 *     <div className="svc-card">…</div>
 *   </section>
 */
export function useReveal<T extends HTMLElement>(options: RevealOptions = {}): RefObject<T | null> {
  const { stagger = 0, cardSelector, threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () => {
      root.classList.add("is-visible");
      if (cardSelector) {
        root.querySelectorAll<HTMLElement>(cardSelector).forEach((el, i) => {
          el.style.transitionDelay = reduceMotion ? "0ms" : `${i * stagger}ms`;
          el.classList.add("is-visible");
        });
      }
    };

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      revealAll();
      return;
    }

    const cards = cardSelector
      ? Array.from(root.querySelectorAll<HTMLElement>(cardSelector))
      : [];

    let io: IntersectionObserver | null = null;
    let rootIO: IntersectionObserver | null = null;

    if (cardSelector && cards.length > 0) {
      // Root reveals on intersect, then cards cascade by index.
      rootIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            rootIO?.unobserve(entry.target);
            cards.forEach((el, i) => {
              const delay = i * stagger;
              requestAnimationFrame(() => {
                el.style.transitionDelay = `${delay}ms`;
                el.classList.add("is-visible");
              });
            });
            rootIO?.disconnect();
          });
        },
        { threshold, rootMargin }
      );
      rootIO.observe(root);

      // Also observe individual cards so cards that enter the viewport later
      // (e.g. tall page, fast scroll) reveal in place.
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            const idx = cards.indexOf(el);
            const delay = idx >= 0 ? idx * stagger : 0;
            requestAnimationFrame(() => {
              el.style.transitionDelay = `${delay}ms`;
              el.classList.add("is-visible");
            });
            io?.unobserve(el);
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
      );
      cards.forEach((el) => io?.observe(el));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            io?.unobserve(entry.target);
          });
        },
        { threshold, rootMargin }
      );
      io.observe(root);
    }

    return () => {
      io?.disconnect();
      rootIO?.disconnect();
    };
  }, [stagger, cardSelector, threshold, rootMargin]);

  return ref;
}
