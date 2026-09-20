"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface MobileNavProps {
  dict: Dictionary;
  lang: Locale;
  links: { href: string; label: string }[];
}

export function MobileNav({ dict, lang, links }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          aria-label={dict.nav.openMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={lang === "ar" ? "right" : "left"} className="w-80">
        <SheetHeader>
          <SheetTitle className="sr-only">{dict.nav.menu}</SheetTitle>
        </SheetHeader>
        <div className="mb-4">
          <Logo lang={lang} />
        </div>
        <Separator />
        <nav className="mt-4 flex flex-col gap-1" aria-label={dict.nav.menu}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {dict.nav.admin}
          </Link>
        </nav>
        <div className="mt-6 flex flex-col gap-3">
          <LanguageSwitcher current={lang} variant="default" showLabels={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
