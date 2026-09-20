import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

interface LogoProps {
  lang: Locale;
  className?: string;
}

/**
 * Brand logo. Renders the official SE7EN Car Rental & Mobility logo from
 * /public/images as-is (no added background box) at ~40px height, preserving
 * the source aspect ratio.
 */
export function Logo({ lang, className }: LogoProps) {
  return (
    <Link
      href={`/${lang}`}
      aria-label={lang === "ar" ? "سيڤن لتأجير السيارات والتنقل" : "SE7EN Car Rental & Mobility"}
      className={cn("group flex items-center", className)}
    >
      <Image
        src="/images/logo.png"
        alt={lang === "ar" ? "شعار سيڤن لتأجير السيارات والتنقل" : "SE7EN Car Rental & Mobility logo"}
        width={1200}
        height={620}
        loading="eager"
        className="block h-10 w-auto shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
        draggable={false}
      />
    </Link>
  );
}