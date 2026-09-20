"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { dirs, isLocale, type Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  current: Locale;
  dirClassName?: string;
  showLabels?: boolean;
  variant?: "default" | "ghost";
}

/**
 * Instantly switches between العربية and English by navigating to the same
 * path under the other locale prefix, and persists the choice in an `rb_locale`
 * cookie so it survives across navigation and returning sessions.
 */
export function LanguageSwitcher({
  current,
  dirClassName,
  showLabels = true,
  variant = "ghost",
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (target: Locale) => {
    if (target === current) return;

    // Strip the current locale prefix and rebuild the path under the target,
    // preserving any query string and anchor (e.g. the booking handoff).
    const segments = pathname.split("/").filter(Boolean);
    if (isLocale(segments[0])) segments.shift();
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    let nextPath = `/${target}${segments.length ? "/" + segments.join("/") : ""}`;
    if (search) nextPath += search;
    if (hash) nextPath += hash;

    startTransition(async () => {
      await setLocaleCookie(target);
      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={variant === "default" ? "default" : "icon"}
          className={cn(
            "gap-2 text-sm font-semibold",
            variant === "default" && "h-11 px-4",
            dirClassName
          )}
          aria-label="Switch language"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          {showLabels && (
            <span>{current === "ar" ? "العربية" : "English"}</span>
          )}
          {isPending && (
            <span className="ms-1">
              <Skeleton className="h-3 w-6" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={current === "ar" ? "end" : "start"}>
        {(["ar", "en"] as Locale[]).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchTo(locale)}
            dir={dirs[locale]}
          >
            <span className="flex-1">{locale === "ar" ? "العربية" : "English"}</span>
            {locale === current && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
