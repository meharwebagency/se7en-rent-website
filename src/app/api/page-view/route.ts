import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

/**
 * Public, fire-and-forget endpoint for recording a page view.
 *
 * The browser sends `{ visitorId, path, lang? }`. `visitorId` is a random
 * 32-char opaque id the client generates and stores in a cookie (no PII,
 * no IP). We upsert the visitor row and insert a page view.
 *
 * Errors are swallowed and a 204 is always returned so a Supabase
 * cold-start / pause on the free plan can never block or break a visitor
 * page load.
 */
export async function POST(req: Request) {
  try {
    let visitorId = "";
    let path = "";
    let lang: string | undefined;

    try {
      const body = (await req.json()) as {
        visitorId?: string;
        path?: string;
        lang?: string;
      };
      visitorId = sanitizeId(body.visitorId);
      path = sanitizePath(body.path);
      lang = normalizeLang(body.lang);
    } catch {
      // Malformed body — treat as no-op.
      return new NextResponse(null, { status: 204 });
    }

    if (!visitorId || !path) {
      return new NextResponse(null, { status: 204 });
    }

    const supabase = await createServerClient();

    const now = new Date().toISOString();

    // Upsert the visitor (creates on first sight, bumps last_seen after).
    await supabase.from("page_visitors").upsert(
      { id: visitorId, last_seen: now },
      { onConflict: "id" },
    );

    // Record the page view.
    await supabase.from("page_views").insert({
      visitor_id: visitorId,
      path,
      lang: lang ?? null,
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("page-view tracking error:", err);
    // Never surface an error to the client.
    return new NextResponse(null, { status: 204 });
  }
}

/** Keep only the expected shape: 32 hex-ish chars of [A-Za-z0-9]. */
function sanitizeId(value: unknown): string {
  if (typeof value !== "string") return "";
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  // Reject obviously-too-short ids (guards against empty cookie accidents).
  return clean.length >= 16 ? clean : "";
}

/** Keep a sane URL path string, capped in length. */
function sanitizePath(value: unknown): string {
  if (typeof value !== "string") return "";
  const clean = value.replace(/\s+/g, "").slice(0, 200);
  if (!clean.startsWith("/")) return "";
  // Only allow relative, same-origin-ish paths (block external scheme tricks).
  if (/^\/\//.test(clean)) return "";
  return clean;
}

function normalizeLang(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toLowerCase();
  return v === "ar" || v === "en" ? v : undefined;
}

export const dynamic = "force-dynamic";
