"use client";

import {
  MousePointerClick,
  CalendarCheck,
  KeyRound,
  MoveRight,
} from "lucide-react";

import { useReveal } from "@/lib/motion/use-reveal";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["home"];

interface HowItWorksSectionProps {
  dict: Dict;
  lang: Locale;
}

/**
 * "How It Works" sequential step reveal: heading fades up, then Step 1 →
 * Step 2 → Step 3 enter in order. Each icon scale-ins slightly after its
 * card, and the connecting arrow draws in after its step so the journey
 * reads as continuous (Choose → Book → Drive).
 */
export function HowItWorksSection({ dict }: HowItWorksSectionProps) {
  const sectionRef = useReveal<HTMLElement>({
    stagger: 140,
    cardSelector: ".mv-step",
  });

  const steps = [
    { icon: MousePointerClick, t: dict.how1Title, d: dict.how1Desc },
    { icon: CalendarCheck, t: dict.how2Title, d: dict.how2Desc },
    { icon: KeyRound, t: dict.how3Title, d: dict.how3Desc },
  ];

  return (
    <section
      ref={sectionRef}
      id="how"
      className="mv-section bg-secondary/60 pt-12 pb-2 lg:pt-16 lg:pb-4"
    >
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mv-heading font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.howTitle}
          </h2>
          <p className="mv-heading mt-3 text-muted-foreground">{dict.howSubtitle}</p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((f, i) => (
            <div key={f.t} className="mv-step relative text-center">
              {i < 2 ? (
                <MoveRight
                  className="mv-step-arrow absolute start-full top-6 hidden -translate-x-4 text-accent md:block rtl:-scale-x-100"
                  aria-hidden="true"
                />
              ) : null}
              <div className="mv-step-icon mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
                <f.icon className="h-8 w-8" />
              </div>
              <div className="mt-5">
                <span className="font-display text-sm font-bold tracking-widest text-accent">
                  0{i + 1}
                </span>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{f.t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {f.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
