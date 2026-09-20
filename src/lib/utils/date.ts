/**
 * Date helpers for date inputs (YYYY-MM-DD) and URL search params.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and returns a YYYY-MM-DD string, else null. Enforces that the
 * value is a real calendar date (e.g. rejects 2024-02-31).
 */
export function parseDateParam(value: string | null | undefined): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== value) return null;
  return value;
}

/** Today's date as a YYYY-MM-DD string (client-local, UTC-safe). */
export function todayString(): string {
  const now = new Date();
  return new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000
  ).toISOString()
    .slice(0, 10);
}

/** Number of calendar days between two YYYY-MM-DD dates (inclusive of both). */
export function inclusiveDays(pickupDate: string, returnDate: string): number {
  const start = new Date(`${pickupDate}T00:00:00Z`).getTime();
  const end = new Date(`${returnDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Adds `days` days to a YYYY-MM-DD string and returns the new string. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}