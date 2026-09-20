"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import type { Dictionary } from "@/i18n/dictionaries";

interface ResetPasswordFormProps {
  dict: Dictionary["admin"];
}

type Status = "checking" | "ready" | "invalid";

interface CallbackParams {
  code: string | null;
  flowId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  tokenHash: string | null;
}

/**
 * Parses both the URL fragment and the query string, expecting the token
 * holders delivered by GoTrue for a password recovery callback:
 * - PKCE:      `?code=…&flow_id=…`       (exchanged with the stored verifier)
 * - Implicit:  `#access_token=…&type=recovery` (this project's GoTrue variant)
 * - Token-hash: `?token_hash=…`          (legacy magic-link style)
 */
function readCallbackParams(): CallbackParams {
  const merged = new Map<string, string>();
  for (const [k, v] of new URLSearchParams(window.location.hash.slice(1))) merged.set(k, v);
  for (const [k, v] of new URLSearchParams(window.location.search)) {
    if (!merged.has(k)) merged.set(k, v);
  }
  const g = (key: string) => merged.get(key) ?? null;
  return {
    code: g("code"),
    flowId: g("flow_id"),
    accessToken: g("access_token"),
    refreshToken: g("refresh_token"),
    type: g("type"),
    error: g("error"),
    errorCode: g("error_code"),
    errorDescription: g("error_description"),
    tokenHash: g("token_hash"),
  };
}

/**
 * Handles the Supabase "recovery" flow for the admin area.
 *
 * `@supabase/ssr` creates the browser client with `flowType: "pkce"` and
 * auto-detects callbacks, but the reset links issued by this project's GoTrue
 * redirect to an *implicit* callback (`#access_token=…&type=recovery`), which
 * the PKCE-only client rejects with "Not a valid PKCE flow url". So this page
 * disables auto-detection and processes the callback itself — exchanging the
 * PKCE code when a code is present, or restoring the session from the implicit
 * tokens otherwise. On success `updateUser({ password })` applies the new
 * password, then the session is signed out and the admin is sent back to the
 * login page.
 */
export function ResetPasswordForm({ dict }: ResetPasswordFormProps) {
  const router = useRouter();
  const r = dict.reset;
  const [status, setStatus] = React.useState<Status>("checking");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [authErrorDetail, setAuthErrorDetail] = React.useState<string | null>(null);
  const [debugLog, setDebugLog] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const log: string[] = [];
      try {
        const raw = readCallbackParams();
        log.push(`url=${window.location.href}`);
        log.push(
          `code=${raw.code ? raw.code.slice(0, 12) + "…" : "none"} flow_id=${raw.flowId ? raw.flowId.slice(0, 12) + "…" : "none"}`
        );
        log.push(
          `access_token=${raw.accessToken ? `present(${raw.accessToken.length})` : "none"} refresh_token=${raw.refreshToken ? "present" : "none"} type=${raw.type ?? "none"}`
        );
        log.push(
          `error=${raw.error ?? "none"} error_code=${raw.errorCode ?? "none"} error_description=${raw.errorDescription ?? "none"} token_hash=${raw.tokenHash ? "present" : "none"}`
        );

        // The reset page parses and exchanges the callback itself, so the
        // client must not auto-detect it (race / PKCE-vs-implicit mismatch).
        const supabase = createBrowserSupabaseClient({
          auth: { detectSessionInUrl: false },
        });

        let authError: string | null = null;

        if (raw.error || raw.errorCode || raw.errorDescription) {
          const msg = raw.errorDescription || raw.error || raw.errorCode;
          authError = msg;
          log.push(`callback error param -> ${msg}`);
        } else if (raw.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(raw.code);
          authError = error ? error.message : null;
          log.push(`pkce code exchange -> ${authError ? `FAIL ${authError}` : "ok"}`);
        } else if (raw.accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: raw.accessToken,
            refresh_token: raw.refreshToken ?? "",
          });
          authError = error ? error.message : null;
          log.push(`implicit setSession -> ${authError ? `FAIL ${authError}` : "ok"}`);
        } else if (raw.tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: raw.tokenHash,
            options: { redirectTo: `${window.location.origin}/admin/reset-password` },
          });
          authError = error ? error.message : null;
          log.push(`token_hash verifyOtp -> ${authError ? `FAIL ${authError}` : "ok"}`);
        } else {
          log.push("no recovery token found in URL");
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        log.push(
          `getUser -> ${user ? `user(${user.email})` : "no-user"} ${userError ? `err=${userError.message}` : "no-error"}`
        );
        console.log("[reset-password]", ...log);

        window.history.replaceState(null, "", window.location.pathname);

        if (!cancelled) {
          setDebugLog(log);
          if (user && !userError && !authError) {
            setStatus("ready");
          } else {
            setAuthErrorDetail(authError);
            setStatus("invalid");
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log.push(`caught: ${msg}`);
        console.log("[reset-password]", ...log);
        if (!cancelled) {
          setDebugLog(log);
          setAuthErrorDetail(msg);
          setStatus("invalid");
        }
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setNotice(null);

    if (newPassword.length < 8) {
      setError(dict.messages.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(r.mismatch);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError(r.errorGeneric);
        return;
      }
      await supabase.auth.signOut().catch(() => {});
      router.push("/admin/login?reset=success");
      router.refresh();
    } catch {
      setError(r.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendNewLink(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    setError(null);
    setNotice(null);

    if (!email.trim()) {
      setError(r.errorGeneric);
      return;
    }

    setSending(true);
    let ok = false;
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      ok = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : r.errorGeneric);
    } finally {
      setSending(false);
    }
    if (ok) setNotice(r.sentNotice);
  }

  const renderDebug = (debugLog: string[] | null) =>
    debugLog ? (
      <div className="mt-5 space-y-1 rounded-lg border border-border bg-muted/40 p-3" data-testid="reset-debug-log">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Debug (temporary)</p>
        {debugLog.map((line, i) => (
          <p key={i} dir="ltr" className="break-all font-mono text-[10px] leading-relaxed text-muted-foreground/80">
            {line}
          </p>
        ))}
      </div>
    ) : null;

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">{r.checking}</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <h2 className="text-base font-semibold">{r.invalidTitle}</h2>
          <p className="text-sm text-muted-foreground">{r.invalidDesc}</p>
          {authErrorDetail ? (
            <p className="max-w-full break-words rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              {authErrorDetail}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSendNewLink} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {r.email}
            </Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              dir="ltr"
              required
              disabled={sending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" data-testid="reset-resend-error">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400" data-testid="reset-resend-notice">
              {notice}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={sending} data-testid="reset-resend-submit">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {sending ? r.sending : r.requestAgain}
          </Button>
        </form>

        <div className="text-center">
          <Button asChild variant="link" size="sm">
            <Link href="/admin/login" dir="auto">
              <ArrowLeft className="h-4 w-4" />
              {r.backToLogin}
            </Link>
          </Button>
        </div>

        {renderDebug(debugLog)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {r.newPassword}
        </Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {r.confirmPassword}
        </Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" data-testid="reset-update-error">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {submitting ? r.submitting : r.submit}
      </Button>

      {renderDebug(debugLog)}
    </form>
  );
}