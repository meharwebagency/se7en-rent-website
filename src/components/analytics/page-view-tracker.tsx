"use client";

import { useEffect, useRef } from "react";

const COOKIE_NAME = "rb_visitor_id";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Lightweight, privacy-friendly page-view tracker.
 *
 * - Generates a random 32-char opaque visitor id and stores it in a
 *   non-HttpOnly cookie so it persists across sessions (no PII, no IP).
 * - On every route change, fires a fire-and-forget POST to /api/page-view.
 * - Renders nothing. Adds no dependencies.
 *
 * The write is intentionally non-blocking: a Supabase cold-start on the
 * free plan can never delay or break the main page render.
 */
export function PageViewTracker() {
  // Track the last-reported path so we never report the same path twice in
  // a row (initial load counts once; SPA navigations each count once).
  const lastReported = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const visitorId = ensureCookie();

    const report = () => {
      const p = window.location.pathname;
      if (lastReported.current === p) return;
      lastReported.current = p;

      const lang = p.startsWith("/ar") ? "ar" : p.startsWith("/en") ? "en" : undefined;

      void fetch("/api/page-view", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, path: p, lang }),
      }).catch(() => {
        /* fire-and-forget: swallow network / supabase errors */
      });
    };

    // Report the initial page load exactly once.
    report();

    const onPop = () => report();
    window.addEventListener("popstate", onPop);

    // Hook Next.js Link navigations (which call history.pushState).
    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);
    history.pushState = function (...args) {
      originalPush(...args);
      report();
    };
    history.replaceState = function (...args) {
      originalReplace(...args);
      report();
    };

    return () => {
      window.removeEventListener("popstate", onPop);
      history.pushState = originalPush;
      history.replaceState = originalReplace;
    };
  }, []);

  return null;
}

function ensureCookie(): string {
  const existing = readCookie();
  if (existing && existing.length >= 16) return existing;
  const fresh = randomId();
  document.cookie = `${COOKIE_NAME}=${fresh}; path=/; max-age=${COOKIE_TTL_SECONDS}; SameSite=Lax`;
  return fresh;
}

function readCookie(): string {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? match.split("=")[1] : "";
}

/** Random opaque id — no PII. */
function randomId(): string {
  // crypto.getRandomValues is available in all modern browsers.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
