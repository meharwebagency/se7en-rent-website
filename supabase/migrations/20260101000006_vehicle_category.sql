-- Split the free-text `category` into a rename `type` (free text) plus a new
-- fixed-tier `category` (economy / mid-range / luxury / sport).
--
--   * `category` -> renamed to `type`           (admin "Type" free-text field)
--   * new `category` column (tier)              still named `category` so the
--     existing frontend/admin code keeps working with the fixed set of tiers.
--   * Existing rows are backfilled to `mid-range` via the column default.

ALTER TABLE public.cars RENAME COLUMN category TO type;

ALTER TABLE public.cars
  ADD COLUMN category text NOT NULL DEFAULT 'mid-range'
  CHECK (category IN ('economy', 'mid-range', 'luxury', 'sport'));