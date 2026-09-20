"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  lang: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, lang, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const homeHref = `/${lang}`;
  const isActive =
    href === homeHref
      ? pathname === homeHref
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "text-accent font-semibold"
          : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
