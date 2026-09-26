"use client";

import { useEffect, useRef } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type Dict = Dictionary["terms"];

interface TermsContentProps {
  lang: Locale;
  dict: Dict;
}

export default function TermsContent({ lang, dict }: TermsContentProps) {
  const titleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const title = titleRef.current;
    if (title) {
      requestAnimationFrame(() => title.classList.add("is-animated"));
    }
  }, []);

  return (
    <div className="bg-white">
      {/* ============ PAGE TITLE ============ */}
      <section className="border-b border-border" aria-labelledby="terms-title">
          <div className="container-max px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
          <div
            ref={titleRef}
            className="hero-content max-w-3xl text-start"
          >
            <h1
              id="terms-title"
              className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl"
            >
              {dict.heroTitle}
            </h1>
          </div>
        </div>
      </section>

      {/* ============ TERMS DOCUMENT ============ */}
      <section id="terms" className="pb-14 pt-2 lg:pb-20">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {dict.intro}
            </p>

            <div className="mt-10 space-y-12">
              {dict.sections.map((section, i) => (
                <article key={section.title}>
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-display text-2xl font-bold leading-none text-accent tabular-nums sm:text-3xl"
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="mt-4 space-y-2.5 ps-8">
                    {section.items.map((item, j) => (
                      <li
                        key={j}
                        className="text-sm leading-relaxed text-muted-foreground sm:text-base"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  {i < dict.sections.length - 1 && (
                    <div
                      className="mt-12 h-px w-full bg-border"
                      aria-hidden="true"
                    />
                  )}
                </article>
              ))}
            </div>

            {/* ============ ABOUT AL ZAJEL (closing block) ============ */}
            <div className="mt-16 rounded-lg bg-muted p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {dict.aboutTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {dict.aboutText}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
