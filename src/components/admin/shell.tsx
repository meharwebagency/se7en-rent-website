"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Car,
  CalendarDays,
  Users,
  MapPin,
  Settings,
  Home,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminLanguageSwitcher } from "@/components/admin/language-switcher";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface ShellProps {
  locale: Locale;
  dict: Dictionary["admin"];
  userEmail: string;
  isSuperAdmin: boolean;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  superOnly?: boolean;
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-white"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  locale,
  dict,
  userEmail,
  isSuperAdmin,
  children,
}: ShellProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/admin", label: dict.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: "/admin/cars", label: dict.nav.cars, icon: Car },
    { href: "/admin/bookings", label: dict.nav.bookings, icon: CalendarDays },
    { href: "/admin/customers", label: dict.nav.customers, icon: Users },
    { href: "/admin/locations", label: dict.nav.locations, icon: MapPin },
    { href: "/admin/settings", label: dict.nav.settings, icon: Settings, superOnly: true },
  ];

  const visible = isSuperAdmin
    ? navItems
    : navItems.filter((item) => !item.superOnly);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-white/10 bg-black lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Car className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-bold text-white">{dict.brand}</span>
        </div>
        <NavList items={visible} pathname={pathname} />
        <div className="mt-auto border-t border-white/10 p-3">
          <SignOutButton dict={dict} variant="ghost" className="w-full text-zinc-300 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-black/90 px-4 text-white backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={dict.nav.menu} className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={locale === "ar" ? "right" : "left"} className="w-72 border-white/10 bg-black text-white">
                <SheetHeader className="border-b border-white/10">
                  <SheetTitle className="text-white">{dict.brand}</SheetTitle>
                </SheetHeader>
                <NavList items={visible} pathname={pathname} onNavigate={() => {}} />
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-sm font-semibold text-white">{dict.title}</p>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            <AdminLanguageSwitcher
              current={locale}
              ariaLabel={dict.language.switch}
              className="text-white hover:bg-white/10 hover:text-white"
            />
            <span className="hidden max-w-40 truncate text-xs text-zinc-400 sm:block" dir="ltr">
              {userEmail}
            </span>
            <Button asChild variant="ghost" size="icon" title={dict.nav.viewSite} aria-label={dict.nav.viewSite} className="text-zinc-300 hover:bg-white/10 hover:text-white">
              <Link href="/">
                <Home className="h-4 w-4 text-red-500" />
              </Link>
            </Button>
            <div className="lg:hidden">
              <SignOutButton dict={dict} variant="ghost" size="icon" className="text-zinc-300 hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}