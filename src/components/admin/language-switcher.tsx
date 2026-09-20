"use client";

import { useRouter } from "next/navigation";
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

import { dirs, type Locale } from "@/i18n/config";
import { setAdminLocaleCookie } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

interface AdminLanguageSwitcherProps {
  current: Locale;
  ariaLabel: string;
  className?: string;
}

/**
 * The admin panel's language switcher, mirroring the public site's switcher
 * style (dropdown with Globe + active check). Admin routes carry no `[lang]`
 * prefix, so switching just persists the independent `rb_admin_locale` cookie
 * and refreshes the current page — the new locale takes effect server-side.
 */
export function AdminLanguageSwitcher({
  current,
  ariaLabel,
  className,
}: AdminLanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (target: Locale) => {
    if (target === current) return;
    startTransition(async () => {
      await setAdminLocaleCookie(target);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 text-sm font-semibold", className)}
          aria-label={ariaLabel}
          disabled={isPending}
          data-testid="admin-language-switcher"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {current === "ar" ? "العربية" : "English"}
          </span>
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