-- =============================================================================
-- SE7EN Car Rental & Mobility — admin extras
--  1. notifications: dashboard event log (no public access)
--  2. site_settings.business_hours: admin-editable opening hours
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('new_booking', 'booking_cancelled', 'unavailable_attempt')),
  reference   text,
  message     text,
  meta        jsonb DEFAULT '{}'::jsonb,
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON public.notifications (created_at DESC);

-- Notification rows are written by server-side code with the service role.
-- There are intentionally NO public policies — browsers cannot read/write it.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS business_hours text;