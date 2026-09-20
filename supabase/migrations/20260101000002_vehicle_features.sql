-- =============================================================================
-- SE7EN Car Rental & Mobility — vehicle features (for the detail page "Features" section)
-- =============================================================================
-- JSONB array of { ar, en } objects, e.g.
--   [{"ar":"مقاعد جلدية","en":"Leather seats"},{"ar":"كاميرا خلفية","en":"Reverse camera"}]
-- Empty array by default.
-- =============================================================================

BEGIN;

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;