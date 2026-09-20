-- =============================================================================
-- SE7EN Car Rental & Mobility — remove the `seats` column from cars
--
-- Seats are no longer collected in the admin form, filtered on the public
-- fleet page, or displayed anywhere. Drop the column and its data.
--
-- The `doors` column is intentionally preserved (out of scope for this task).
-- =============================================================================

ALTER TABLE public.cars DROP COLUMN IF EXISTS seats;
