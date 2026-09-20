import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NavLink } from "@/components/layout/nav-link";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface NavbarProps {
  dict: Dictionary;
  lang: Locale;
}

export function Navbar({ dict, lang }: NavbarProps) {
  const links = [
    { href: `/${lang}`, label: dict.nav.home },
    { href: `/${lang}/cars`, label: dict.nav.cars },
    { href: `/${lang}/about`, label: dict.nav.about },
    { href: `/${lang}#how`, label: dict.nav.howItWorks },
    { href: `/${lang}#contact`, label: dict.nav.contact },
    { href: `/${lang}/terms-conditions`, label: dict.nav.terms },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black text-primary-foreground">
      {/* Main nav */}
      <div className="container-max flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-black p-1 shadow-none">
            <Logo lang={lang} />
          </div>
          <p className="hidden whitespace-nowrap font-display text-sm font-bold tracking-widest text-white min-[400px]:block lg:text-base">
            {dict.nav.brand}
          </p>
        </div>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} lang={lang}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            current={lang}
            dirClassName="text-white hover:bg-white/10 hover:text-white"
          />
          <div className="lg:hidden">
            <MobileNav dict={dict} lang={lang} links={links} />
          </div>
        </div>
      </div>
    </header>
  );
}
