-- =============================================================================
-- SE7EN Car Rental & Mobility — Supabase Storage configuration for vehicle images
-- =============================================================================
-- Dedicated 'car-images' bucket with its own object-level policies:
--   * Public read of every object in the bucket (raw file served publicly);
--     the table-level RLS on car_images already hides image records that do not
--     belong to an 'available' car, and the application only ever exposes URLs
--     for image rows it has read.
--   * Write/update/delete restricted to authenticated admins (defense in depth
--     on top of the service-role-only server code path).
--   * 5MB file-size cap and image-only MIME types enforced at the bucket and
--     then again in the server-side upload handler (scripts/handlers).
-- =============================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'car-images',
  'car-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[],
  true
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[];

-- Public read (the bucket is public, this makes the intent explicit).
DROP POLICY IF EXISTS "car_images_bucket_public_read" ON storage.objects;
CREATE POLICY car_images_bucket_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

-- Admin-only write access. `public.is_admin()` is a SECURITY DEFINER function,
-- so it evaluates the caller's JWT safely and avoids RLS recursion.
DROP POLICY IF EXISTS "car_images_bucket_admin_write" ON storage.objects;
CREATE POLICY car_images_bucket_admin_write
  ON storage.objects FOR ALL
  USING (bucket_id = 'car-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'car-images' AND public.is_admin());

COMMIT;