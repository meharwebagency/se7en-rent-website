-- =============================================================================
-- SE7EN Car Rental & Mobility — core schema
-- =============================================================================
-- Tables: customers, cars, car_images, locations, bookings, site_settings, admins
--
-- Availability rule: a car is bookable for [pickup_date, return_date] only when
--   car.status = 'available' AND no other booking in ('pending','confirmed',
--   'active') overlaps that range. Race conditions are prevented at the
--   database level by an EXCLUDE constraint (btree_gist + daterange), which
--   rejects any concurrent overlapping insert.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS btree_gist; -- gist exclusion constraints

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.car_status AS ENUM ('available', 'booked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.transmission_type AS ENUM ('automatic', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name                   text NOT NULL,
  email                       text NOT NULL,
  phone                       text NOT NULL,
  nationality                 text,
  driving_license_number      text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_email_phone_idx UNIQUE (email, phone)
);

CREATE TABLE IF NOT EXISTS public.cars (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand                       text NOT NULL,
  model                       text NOT NULL,
  year                        integer NOT NULL,
  category                    text NOT NULL,
  description_ar              text,
  description_en              text,
  short_description_ar        text,
  short_description_en        text,
  daily_price                 numeric(10,3) NOT NULL CHECK (daily_price >= 0),
  weekly_price                numeric(10,3) CHECK (weekly_price >= 0),
  monthly_price               numeric(10,3) CHECK (monthly_price >= 0),
  seats                       integer NOT NULL DEFAULT 4 CHECK (seats > 0),
  doors                       integer NOT NULL DEFAULT 4 CHECK (doors > 0),
  transmission                public.transmission_type NOT NULL DEFAULT 'automatic',
  fuel_type                   text,
  color                       text,
  status                      public.car_status NOT NULL DEFAULT 'available',
  featured                    boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.car_images (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                      uuid NOT NULL REFERENCES public.cars (id) ON DELETE CASCADE,
  image_url                   text NOT NULL,
  alt_text_ar                 text,
  alt_text_en                 text,
  sort_order                  integer NOT NULL DEFAULT 0,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.locations (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar                     text NOT NULL,
  name_en                     text NOT NULL,
  address_ar                  text,
  address_en                  text,
  latitude                    numeric(9,6),
  longitude                   numeric(9,6),
  phone                       text,
  opening_hours               text,
  active                      boolean NOT NULL DEFAULT true
);

CREATE SEQUENCE IF NOT EXISTS public.booking_reference_seq;

CREATE TABLE IF NOT EXISTS public.bookings (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference           text NOT NULL UNIQUE DEFAULT
                                ('RB-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0')),
  customer_id                 uuid NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  car_id                      uuid NOT NULL REFERENCES public.cars (id) ON DELETE RESTRICT,
  pickup_location_id          uuid REFERENCES public.locations (id) ON DELETE RESTRICT,
  pickup_date                 date NOT NULL,
  return_date                 date NOT NULL,
  pickup_time                 time,
  return_time                 time,
  status                      public.booking_status NOT NULL DEFAULT 'pending',
  total_price                 numeric(10,3) CHECK (total_price >= 0),
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_dates_check CHECK (return_date >= pickup_date),
  -- Hard, race-safe guard: the same car can never have two overlapping
  -- date ranges among pending/confirmed/active bookings.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    car_id WITH =,
    daterange(pickup_date, return_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'active'))
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id                          integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name_ar             text,
  company_name_en             text,
  email                       text,
  phone                       text,
  address_ar                  text,
  address_en                  text,
  google_maps_url             text,
  instagram_url               text,
  tiktok_url                  text,
  snapchat_url                text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid UNIQUE NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role                        public.admin_role NOT NULL DEFAULT 'admin',
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- helper: is the given auth.uid an admin?
-- SECURITY DEFINER so RLS policies can call it without recursion.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Availability logic
-- -----------------------------------------------------------------------------
-- Returns true when the car may be booked for the inclusive date range.
CREATE OR REPLACE FUNCTION public.car_available_for_dates(
  p_car_id uuid,
  p_pickup_date date,
  p_return_date date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (p_pickup_date <= p_return_date)
    AND EXISTS (
      SELECT 1 FROM public.cars c
      WHERE c.id = p_car_id AND c.status = 'available'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.car_id = p_car_id
        AND b.status IN ('pending', 'confirmed', 'active')
        AND b.pickup_date <= p_return_date
        AND b.return_date >= p_pickup_date
    );
$$;

-- Public wrapper used by the booking search UI.
CREATE OR REPLACE FUNCTION public.check_car_availability(
  p_car_id uuid,
  p_pickup_date date,
  p_return_date date
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.car_available_for_dates(p_car_id, p_pickup_date, p_return_date);
$$;

-- Public search: only cars that are bookable for the requested range.
CREATE OR REPLACE FUNCTION public.get_available_cars(
  p_pickup_date date,
  p_return_date date
)
RETURNS SETOF public.cars
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.cars c
  WHERE public.car_available_for_dates(c.id, p_pickup_date, p_return_date);
$$;

-- -----------------------------------------------------------------------------
-- Booking insert guard: friendly error before the exclusion constraint fires.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_booking_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('pending', 'confirmed', 'active') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.cars c WHERE c.id = NEW.car_id AND c.status = 'available'
    ) THEN
      RAISE EXCEPTION 'car_not_bookable'
        USING HINT = 'Car is not available for booking (status: booked).';
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.car_id = NEW.car_id
        AND b.id IS DISTINCT FROM NEW.id
        AND b.status IN ('pending', 'confirmed', 'active')
        AND b.pickup_date <= NEW.return_date
        AND b.return_date >= NEW.pickup_date
    ) THEN
      RAISE EXCEPTION 'car_already_booked'
        USING HINT = 'The car is already booked for an overlapping date range.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cars_status            ON public.cars (status);
CREATE INDEX IF NOT EXISTS idx_cars_category          ON public.cars (category);
CREATE INDEX IF NOT EXISTS idx_cars_featured          ON public.cars (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_cars_brand             ON public.cars (brand);
-- Natural key used by seed.sql to keep car inserts idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_brand_model_year ON public.cars (brand, model, year);
CREATE INDEX IF NOT EXISTS idx_car_images_car         ON public.car_images (car_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_bookings_car_dates     ON public.bookings (car_id, pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates  ON public.bookings (status, pickup_date, return_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer      ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference     ON public.bookings (booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at    ON public.bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_active       ON public.locations (active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_admins_user            ON public.admins (user_id);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_cars_updated_at        ON public.cars;
DROP TRIGGER IF EXISTS trg_customers_updated_at   ON public.customers;
DROP TRIGGER IF EXISTS trg_bookings_updated_at    ON public.bookings;
DROP TRIGGER IF EXISTS trg_settings_updated_at    ON public.site_settings;
DROP TRIGGER IF EXISTS trg_bookings_availability  ON public.bookings;

CREATE TRIGGER trg_cars_updated_at
  BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_bookings_availability
  BEFORE INSERT OR UPDATE OF status, car_id, pickup_date, return_date
  ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_availability();

-- -----------------------------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins         ENABLE ROW LEVEL SECURITY;

-- --- cars -----------------------------------------------------------
-- Public: read only 'available' cars.
DROP POLICY IF EXISTS "cars_public_read" ON public.cars;
CREATE POLICY cars_public_read
  ON public.cars FOR SELECT
  USING (status = 'available');

-- Admins: full access. Fine-grained role rules (e.g. only super_admin may
-- delete a car with booking history) are enforced in application code.
DROP POLICY IF EXISTS "cars_admin_all" ON public.cars;
CREATE POLICY cars_admin_all
  ON public.cars FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- car_images -----------------------------------------------------
-- Public: read images that belong to 'available' cars.
DROP POLICY IF EXISTS "car_images_public_read" ON public.car_images;
CREATE POLICY car_images_public_read
  ON public.car_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id = car_id AND c.status = 'available'
  ));

DROP POLICY IF EXISTS "car_images_admin_all" ON public.car_images;
CREATE POLICY car_images_admin_all
  ON public.car_images FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- locations ------------------------------------------------------
-- Public: read only active pickup locations.
DROP POLICY IF EXISTS "locations_public_read" ON public.locations;
CREATE POLICY locations_public_read
  ON public.locations FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "locations_admin_all" ON public.locations;
CREATE POLICY locations_admin_all
  ON public.locations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- customers ------------------------------------------------------
-- Authenticated users manage their own customer row.
DROP POLICY IF EXISTS "customers_own" ON public.customers;
CREATE POLICY customers_own
  ON public.customers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anonymous users may self-register (name + email + phone) to submit a rental
-- request without signing in.
DROP POLICY IF EXISTS "customers_anon_insert" ON public.customers;
CREATE POLICY customers_anon_insert
  ON public.customers FOR INSERT
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "customers_admin_all" ON public.customers;
CREATE POLICY customers_admin_all
  ON public.customers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- bookings -------------------------------------------------------
-- Public may submit booking requests (status defaults to 'pending').
DROP POLICY IF EXISTS "bookings_public_insert" ON public.bookings;
CREATE POLICY bookings_public_insert
  ON public.bookings FOR INSERT
  WITH CHECK (status = 'pending');

-- A customer can view their own bookings.
DROP POLICY IF EXISTS "bookings_own_read" ON public.bookings;
CREATE POLICY bookings_own_read
  ON public.bookings FOR SELECT
  USING (customer_id IN (
    SELECT c.id FROM public.customers c WHERE c.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "bookings_admin_all" ON public.bookings;
CREATE POLICY bookings_admin_all
  ON public.bookings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- site_settings ---------------------------------------------------
-- Public read: the footer/contact sections render from this row.
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY site_settings_public_read
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON public.site_settings;
CREATE POLICY site_settings_admin_write
  ON public.site_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --- admins ----------------------------------------------------------
-- Only existing admins (or super_admins) may read/manage the admins table.
DROP POLICY IF EXISTS "admins_admin_all" ON public.admins;
CREATE POLICY admins_admin_all
  ON public.admins FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- Privileges / grants
-- -----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.cars, public.car_images, public.locations, public.site_settings TO anon, authenticated;
GRANT INSERT ON public.customers, public.bookings TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_car_availability(uuid, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_cars(date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.car_available_for_dates(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- Seed: singleton settings row + active pickup locations
-- -----------------------------------------------------------------------------
INSERT INTO public.site_settings (
  id, company_name_ar, company_name_en, email,
  google_maps_url, instagram_url, tiktok_url, snapchat_url
) VALUES (
  1, 'سيڤن لتأجير السيارات والتنقل', 'SE7EN Car Rental & Mobility', 'email@example.com',
  NULL,
  'https://www.instagram.com/se7en.rent',
  NULL,
  NULL
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.locations (name_ar, name_en, address_ar, address_en, phone, active)
VALUES
  ('مسقط', 'Muscat', 'وسط المدينة، مسقط', 'City centre, Muscat', '+968 9000 0000', true),
  ('مطار مسقط الدولي', 'Muscat International Airport', 'محافظة مسقط', 'Muscat Governorate', '+968 9000 0000', true)
ON CONFLICT DO NOTHING;

COMMIT;