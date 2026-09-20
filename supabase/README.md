# SE7EN Car Rental & Mobility — Database & Backend

Production Supabase backend for SE7EN Car Rental & Mobility (Oman). Everything the frontend
reads/writes goes through this schema. The existing Next.js UI is preserved —
the data layer now maps the `cars` table into the frontend `Vehicle` domain
model.

## Applying the migrations

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# Local / linked project
supabase db push          # apply supabase/migrations/* to the linked remote
supabase db reset         # local: recreate DB + apply migrations + seed.sql

# Seed a demo fleet + settings + locations (dev databases)
supabase db reset         # runs supabase/seed.sql automatically
```

Environment (`.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=       # https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # anon key (browser + SSR auth client)
SUPABASE_URL=                   # same URL, server-side reads
SUPABASE_SERVICE_ROLE_KEY=      # server-only secret, NEVER exposed to the browser
SUPABASE_PROJECT_ID=            # for types:gen
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

Create the first admin with:

```bash
node scripts/create-admin.mjs you@example.com super
```

Regenerate TypeScript types whenever the schema changes:

```bash
npm run types:gen
```

## Tables

### customers
| column | type | notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK auth.users | unique; NULL for anonymous self-registrations |
| full_name | text NN | |
| email | text | optional; NULL for phone-only bookings |
| phone | text NN | **normalized** (see Phone normalization) |
| nationality | text | |
| driving_license_number | text | |
| created_at / updated_at | timestamptz | |

### cars
The public listing status is `available`. `booked` cars are hidden from public
listings and never bookable — regardless of dates.

| column | type | notes |
|---|---|---|
| id | uuid PK | |
| brand / model | text NN | |
| year | integer NN | |
| category | text NN | indexed |
| description_ar / description_en | text | long copy |
| short_description_ar / short_description_en | text | card copy |
| daily_price | numeric(10,3) NN | OMR |
| weekly_price / monthly_price | numeric(10,3) | OMR |
| doors | integer NN | |
| transmission | transmission_type | automatic / manual |
| fuel_type / color | text | |
| status | car_status | available / booked |
| featured | boolean | partial index where featured |
| created_at / updated_at | timestamptz | |

Day-to-day availability is computed from `bookings` (below), not stored on the
car: an `available` car that has an overlapping pending/confirmed/active booking
cannot be booked for that specific range. Admins use `status = 'booked'` to take
a car off the public fleet entirely (e.g. departed for a longer lease).

### car_images
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| car_id | uuid FK cars ON DELETE CASCADE | |
| image_url | text NN | public bucket URL (or external URL) |
| alt_text_ar / alt_text_en | text | |
| sort_order | integer | index (car_id, sort_order) |
| created_at | timestamptz | |

### locations
`name_ar`/`name_en` NN; `latitude`/`longitude` numeric(9,6); `active` boolean
indexed. Pickup/drop-off points used by bookings.

### bookings
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| booking_reference | text UNIQUE | auto `RB-000001` |
| customer_id | uuid FK customers | |
| car_id | uuid FK cars | |
| pickup_location_id | uuid FK locations | |
| pickup_date / return_date | date NN | `CHECK (return_date >= pickup_date)` |
| pickup_time / return_time | time | |
| status | booking_status | pending → confirmed → active → completed / cancelled |
| total_price | numeric(10,3) | daily_price × inclusive days |
| notes | text | |
| created_at / updated_at | timestamptz | |

### site_settings
Singleton `id = 1` row holding company name (AR/EN), email, phone, addresses
and social URLs for the footer/contact sections.

### admins
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK auth.users UNIQUE | |
| role | admin_role | super_admin or admin |

## Availability logic

A car is available for `[pickup_date, return_date]` **iff**:

1. `cars.status = 'available'`, **and**
2. no `bookings` row with status `pending | confirmed | active` has an
   overlapping range:

```
existing.pickup_date <= requested.return_date
AND existing.return_date >= requested.pickup_date
```

### Race-safe enforcement (three layers)

1. **Availability trigger** (`enforce_booking_availability`) — friendly
   `car_not_bookable` / `car_already_booked` errors before insert/update.
2. **Exclusion constraint** — `bookings_no_overlap` using `btree_gist` on
   `(car_id, daterange(pickup_date, return_date, '[]'))` filtered to
   `status IN ('pending','confirmed','active')`. Two concurrent overlapping
   inserts cannot both commit — the database rejects the second one. This is
   the true anti-race guarantee, independent of application state.
3. **Server validation** — `src/lib/bookings/service.ts` validates dates,
   car status and phone, and surfaces clean errors.

### SQL helpers

```sql
car_available_for_dates(car_id, pickup, ret)   -- boolean
check_car_availability(car_id, pickup, ret)    -- public RPC (anon allowed)
get_available_cars(pickup, ret)                -- SETOF cars (anon allowed)
```

## Roles & permissions (enforced in code, not labels)

| capability | admin | super_admin |
|---|---|---|
| create / edit / deactivate vehicles | ✔ | ✔ |
| delete a car **without** booking history | ✔ | ✔ |
| permanently delete a car **with** booking history | ✘ | ✔ |
| manage bookings (confirm / cancel / active / completed) | ✔ | ✔ |
| view customers | ✔ | ✔ |
| manage other admin accounts | ✘ | ✔ |
| edit site_settings / company info | ✘ | ✔ |

Every admin-facing server action starts with `requireAdmin()` (any admin) or
`requireAdmin("super_admin")`. Delete-with-history additionally calls
`requireCanDeleteCar(ctx, carId)`. See `src/app/actions/admin.ts`.

## Row-Level Security

| table | public (anon) | authenticated customer | admins |
|---|---|---|---|
| cars | SELECT where status=available | same | ALL |
| car_images | SELECT where owning car available | same | ALL |
| locations | SELECT where active | same | ALL |
| site_settings | SELECT (footer renders from it) | same | ALL (super_admin gated in code) |
| customers | INSERT (self-registration, `user_id IS NULL`) | ALL on self (`user_id = auth.uid()`) | ALL |
| bookings | INSERT (status must be `pending`) | SELECT own | ALL |
| admins | — | — | ALL (via `is_admin()`) |

`is_admin()` / `is_super_admin()` are `SECURITY DEFINER` functions so policies
can call them without RLS recursion. RLS grants the *coarse* boundary; the
fine-grained role rules above are enforced in application code.

## Storage

Bucket `car-images` (public read, image MIME types only, **5 MB** cap).

- Table-level RLS hides `car_images` rows that don't belong to an `available`
  car; the object policy grants explicit public read.
- Write/update/delete on the bucket requires an authenticated admin
  (`public.is_admin()`), and the server-side upload helper
  (`src/lib/storage/car-images.ts`) re-validates MIME + size before upload via
  the service role.
- The service-role key is used only in server-only modules
  (`src/lib/supabase/server.ts`) and never shipped to the browser.

## Public booking flow

1. `submitBooking()` server action (`src/app/actions/bookings.ts`) validates the
   payload (dates, car status, phone via `src/lib/utils/phone.ts`).
2. Creates/reuses a `customers` row (phone normalized to `+968` + 8 digits, or
   an explicit E.164 international number).
3. Inserts a `pending` booking; the trigger/exclusion constraint reject
   overlaps atomically → clean `"already booked for those dates"` error.
4. Admin confirms/marks-active/completes/cancels via `adminUpdateBookingStatus`.

## Phone normalization

`src/lib/utils/phone.ts`:

- `+96897102438` → kept as-is.
- `97102438` (bare Omani mobile, prefix 7/8/9) → `+96897102438`.
- `0096897102438` / `96897102438` → `+96897102438`.
- Non-Omani numbers require `allowInternational: true` and must be a valid
  E.164 international format (`+` + up to 15 digits).