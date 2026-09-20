-- =============================================================================
-- SE7EN Car Rental & Mobility — seed data (development only)
-- =============================================================================
-- Safe to re-run: every statement is idempotent.
--   * site_settings: single row, upsert on primary key.
--   * cars: natural key (brand, model, year) is unique — ON CONFLICT DO NOTHING
--     skips rows that already exist.
--   * car_images: guarded by NOT EXISTS per (car, url).
-- Pickup/site contact locations are seeded by migration 20260101000000.
-- =============================================================================
-- NOTE: an admin account cannot be created purely from SQL because it requires
-- an `auth.users` row. Use `scripts/create-admin.mjs` instead.
-- =============================================================================

BEGIN;

-- Single settings row (created by the schema migration; kept here for refreshes).
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

-- A small demo fleet so the homepage/featured grid renders immediately.
-- Gallery images use deterministic placeholder URLs (public/car-images bucket
-- is created by migration 20260101000001; swap URLs in the admin UI later).
INSERT INTO public.cars (
  brand, model, year, type, category, description_ar, description_en,
  short_description_ar, short_description_en,
  daily_price, weekly_price, monthly_price,
  doors, transmission, fuel_type, color, status, featured, features
) VALUES
  ('Toyota', 'Camry', 2024, 'sedan', 'mid-range',
   'سيارة سيدان مريحة وموفرة للوقود مناسبة للعائلة.', 'Comfortable, fuel-efficient family sedan.',
   'سيدان عائلية', 'Family sedan',
   18.000, 115.000, 430.000, 4, 'automatic', 'petrol', 'White', 'available', true,
   '[{"ar":"موفرة في استهلاك الوقود","en":"Fuel efficient"},{"ar":"مثبت سرعة تكيفي","en":"Adaptive cruise control"},{"ar":"شاشة تعمل باللمس وكاميرا خلفية","en":"Touchscreen & rear camera"},{"ar":"مقاعد جلدية","en":"Leather seats"}]'),
  ('Range Rover', 'Vogue', 2024, 'suv', 'luxury',
   'سيارة دفع رباعي فاخرة مثالية للمغامرات.', 'Luxury SUV, ideal for trips and off-road.',
   'SUV فاخرة', 'Luxury SUV',
   65.000, 420.000, 1500.000, 5, 'automatic', 'petrol', 'Black', 'available', true,
   '[{"ar":"دفع رباعي دائم","en":"Permanent 4WD"},{"ar":"مقصورة جلدية كاملة","en":"Full leather interior"},{"ar":"نظام صوت Meridian","en":"Meridian sound system"},{"ar":"سقف بانورامي","en":"Panoramic roof"}]'),
  ('Lexus', 'LX 570', 2024, 'suv', 'luxury',
   'SUV فخمة بأداء قوي ومقصورة راقية.', 'Flagship luxury SUV with a refined cabin.',
   'SUV فخمة', 'Premium SUV',
   55.000, 350.000, 1250.000, 5, 'automatic', 'petrol', 'Silver', 'available', true,
   '[{"ar":"7 مقاعد فاخرة","en":"7 luxury seats"},{"ar":"نظام تعليق هوائي","en":"Air suspension"},{"ar":"رادار ومساعدة الحارات","en":"Radar cruise & lane assist"},{"ar":"مقصورة خشب وجلد","en":"Wood & leather cabin"}]'),
  ('Toyota', 'Land Cruiser', 2024, 'suv', 'mid-range',
   'الأيقونة الصحراوية الأقوى في فئتها.', 'The desert icon, the most capable in its class.',
   'دفع رباعي قوي', 'Powerful 4x4',
   45.000, 280.000, 1000.000, 5, 'automatic', 'petrol', 'White', 'available', true,
   '[{"ar":"قدرة صحراوية فائقة","en":"Superior off-road capability"},{"ar":"تصميم خارجي رياضي","en":"Sporty exterior styling"},{"ar":"نظام وسائط متعدد","en":"Multi-media system"},{"ar":"تحكم مناخي ثلاثي المناطق","en":"Tri-zone climate control"}]'),
  ('Toyota', 'Corolla', 2024, 'hatchback', 'economy',
   'سيارة مدمجة هجينة اقتصادية مثالية للتنقل في المدينة.', 'Compact hybrid hatchback, ideal for city driving.',
   'هاتشباك هجينة', 'Hybrid hatchback',
   27.000, 170.000, 620.000, 5, 'automatic', 'hybrid', 'Grey', 'available', true,
   '[{"ar":"محرك هجين موفر للوقود","en":"Fuel-saving hybrid engine"},{"ar":"تحكم مناخي ثنائي المناطق","en":"Dual-zone climate control"},{"ar":"مقاعد أمامية مدفأة","en":"Heated front seats"}]'),
  ('Toyota', 'Hilux', 2024, 'pickup', 'mid-range',
   'بيك أب قوي ومتين صمم لتحمّل الظروف الأقسى.', 'Rugged, dependable pickup built for the toughest conditions.',
   'بيك أب متين', 'Tough pickup',
   30.000, 190.000, 690.000, 4, 'manual', 'diesel', 'Black', 'available', false,
   '[{"ar":"ناقل حركة يدوي","en":"Manual transmission"},{"ar":"محرك ديزل قوي","en":"Powerful diesel engine"},{"ar":"قدرة سحب عالية","en":"High towing capacity"}]'),
  ('Tesla', 'Model 3', 2024, 'sedan', 'sport',
   'سيارة كهربائية ذكية مع مدى طويل ومحرك فوري الاستجابة.', 'Smart electric sedan with long range and instant response.',
   'سيدان كهربائية', 'Electric sedan',
   38.000, 240.000, 870.000, 4, 'automatic', 'electric', 'Red', 'available', true,
   '[{"ar":"قيادة ذكية (أوتوبايلوت)","en":"Autopilot driving assist"},{"ar":"مدى طويل وشحن سريع","en":"Long range & supercharging"},{"ar":"شاشة مركزية كبيرة","en":"Large central display"},{"ar":"صيانة أقل","en":"Lower maintenance"}]')
ON CONFLICT DO NOTHING;

-- Gallery images (3 per car) so the detail page gallery is populated.
-- Deterministic seeds keep the URLs stable across re-runs.
INSERT INTO public.car_images (car_id, image_url, alt_text_ar, alt_text_en, sort_order)
SELECT
  c.id,
  'https://picsum.photos/seed/' || translate(c.brand || '-' || c.model, ' ', '-') || '-' || v AS url,
  c.model || ' — صورة ' || (v + 1),
  c.model || ' — photo ' || (v + 1),
  v
FROM public.cars c
CROSS JOIN LATERAL (VALUES (0), (1), (2)) AS n(v)
WHERE NOT EXISTS (
  SELECT 1 FROM public.car_images i
  WHERE i.car_id = c.id
    AND i.image_url = 'https://picsum.photos/seed/' || translate(c.brand || '-' || c.model, ' ', '-') || '-' || v
);

COMMIT;