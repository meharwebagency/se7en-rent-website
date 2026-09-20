-- =============================================================================
-- SE7EN Car Rental & Mobility — visitor statistics
--
-- Two tables power the "Visitor Statistics" admin dashboard widget:
--
--   page_views    — one row per page view (path, language, timestamp)
--   page_visitors — one row per unique visitor (cookie fingerprint, first/last seen)
--
-- Design goals:
--   * Writes are cheap: a single `upsert` + `insert` per page view, no triggers.
--   * Reads (admin dashboard) aggregate on-the-fly; traffic is low so no
--     materialised view is needed.
--   * RLS: tables are write-only via the service-role client. No public
--     policies — the browser never touches Supabase directly for tracking.
--   * Privacy: no IP, no geo-location, no PII. Only a random opaque cookie ID.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- page_visitors: unique-visitor registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_visitors (
  id           text PRIMARY KEY,              -- random 32-char opaque id set by the client cookie
  first_seen   timestamptz NOT NULL DEFAULT now(),
  last_seen    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_visitors_last_seen
  ON public.page_visitors (last_seen);

-- ---------------------------------------------------------------------------
-- page_views: one row per page view
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id          bigserial PRIMARY KEY,
  visitor_id  text NOT NULL REFERENCES public.page_visitors (id) ON DELETE CASCADE,
  path        text NOT NULL,
  lang        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id
  ON public.page_views (visitor_id);

-- ---------------------------------------------------------------------------
-- RLS: service-role only (no public / anon policies)
-- Browsers must NEVER write to these tables directly — the API route uses
-- the service-role key (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.page_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visitors ENABLE ROW LEVEL SECURITY;
