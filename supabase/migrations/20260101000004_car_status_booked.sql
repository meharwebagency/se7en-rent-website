-- =============================================================================
-- SE7EN Car Rental & Mobility — reduce car statuses to available | booked
--
-- The admin UI exposes only two statuses. A car that is on a rental (or
-- otherwise temporarily unavailable) is marked 'booked'; it is hidden from
-- public listings by the RLS policy on cars.status = 'available'.
--
-- Resident rows are rebuilt because Postgres cannot drop enum values in place.
-- RLS policies referencing the column are dropped/recreated around the change.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "cars_public_read" ON public.cars;
DROP POLICY IF EXISTS "car_images_public_read" ON public.car_images;

ALTER TABLE public.cars ALTER COLUMN status DROP DEFAULT;
ALTER TYPE public.car_status RENAME TO car_status_old;
CREATE TYPE public.car_status AS ENUM ('available', 'booked');
ALTER TABLE public.cars
  ALTER COLUMN status TYPE public.car_status USING status::text::public.car_status;
ALTER TABLE public.cars ALTER COLUMN status SET DEFAULT 'available';
DROP TYPE public.car_status_old;

CREATE POLICY cars_public_read
  ON public.cars FOR SELECT
  USING (status = 'available');

CREATE POLICY car_images_public_read
  ON public.car_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id = car_id AND c.status = 'available'
  ));

COMMIT;