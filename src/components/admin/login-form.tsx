"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { adminSignIn } from "@/app/actions/admin";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { Dictionary } from "@/i18n/dictionaries";

interface LoginFormProps {
  dict: Dictionary["admin"];
}

export function LoginForm({ dict }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sendingReset, setSendingReset] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const result = await adminSignIn(email, password);
    setSubmitting(false);

    if (result.ok) {
      setError(null);
      setNotice(null);
      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
      return;
    }
    if (result.field === "email") {
      setNotice(result.error);
    } else {
      setError(result.error);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim() || sendingReset) return;
    setSendingReset(true);
    setError(null);
    setNotice(null);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      setNotice(dict.reset.sentNotice);
    } catch {
      setError(dict.login.error);
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="admin-email" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          {dict.login.email}
        </Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="meharwebagency@gmail.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {dict.login.password}
        </Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={sendingReset || !email.trim()}
            className="text-xs font-medium text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingReset ? dict.login.submitting : dict.login.forgotPassword}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {notice}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {submitting ? dict.login.submitting : dict.login.submit}
      </Button>
    </form>
  );
}