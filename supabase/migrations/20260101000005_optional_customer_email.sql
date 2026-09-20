-- Email is optional for bookings: phone is the primary contact channel, and
-- confirmation emails are skipped when no email is provided. Phone-only
-- customers store NULL email; the (email, phone) unique constraint still
-- guards non-null pairs (Postgres treats NULLs as distinct).
ALTER TABLE public.customers ALTER COLUMN email DROP NOT NULL;