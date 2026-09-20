"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminSignOut } from "@/app/actions/admin";

import type { Dictionary } from "@/i18n/dictionaries";

export function SignOutButton({
  dict,
  variant = "outline",
  size = "sm",
  className,
}: {
  dict: Dictionary["admin"];
  variant?: "outline" | "ghost";
  size?: "sm" | "default" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function handleSignOut() {
    setBusy(true);
    await adminSignOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => void handleSignOut()}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {size !== "icon" && dict.nav.signOut}
    </Button>
  );
}