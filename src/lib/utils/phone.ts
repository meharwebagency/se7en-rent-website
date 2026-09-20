/**
 * Phone number validation + normalization for SE7EN Car Rental & Mobility.
 *
 * Default rule (Oman): +968 followed by exactly 8 digits,
 * e.g. +96897102438. Omani mobile prefixes are 7, 8 or 9.
 *
 * When the customer explicitly declares a foreign number, any valid
 * international format is accepted: +<country code><national number>,
 * following the E.164 shape (+ up to 15 digits).
 */

export type PhoneValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

const OMAN_COUNTRY_CODE = "968";
const OMAN_LOCAL_LENGTH = 8;
const OMAN_MOBILE_PREFIXES = new Set(["7", "8", "9"]);

/** Removes every non-digit character, keeping a single leading '+'. */
function digitsOnly(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const raw = trimmed.replace(/[^\d]/g, "");
  return hasPlus ? `+${raw}` : raw;
}

/**
 * Validates and normalizes a phone number.
 *
 * - `+968` + 8 digits is returned verbatim as the canonical Omani form.
 * - A bare 8-digit Omani mobile is prefixed with +968.
 * - `00968XXXXXXXX`/`968XXXXXXXX` are converted to `+968XXXXXXXX`.
 * - Explicit foreign numbers (declared via `allowInternational`) are accepted
 *   when they match E.164 (max 15 digits, valid start).
 */
export function validatePhoneNumber(
  input: string,
  opts: { allowInternational?: boolean } = {},
): PhoneValidationResult {
  const { allowInternational = false } = opts;
  const digits = digitsOnly(input);

  if (digits.length === 0) {
    return { ok: false, error: "Phone number is required." };
  }

  // Bare 8-digit local number → assume Oman.
  if (/^[5-9]\d{7}$/.test(digits)) {
    if (!OMAN_MOBILE_PREFIXES.has(digits[0])) {
      return {
        ok: false,
        error: "Omani mobile numbers start with 7, 8 or 9.",
      };
    }
    return {
      ok: true,
      normalized: `+${OMAN_COUNTRY_CODE}${digits}`,
    };
  }

  // 00968XXXXXXXX
  if (/^00\d{6,14}$/.test(digits)) {
    const without00 = digits.slice(2); // currently: 968XXXXXXXX
    return validatePhoneNumber(`+${without00}`, opts);
  }

  // 968XXXXXXXX (country code without '+')
  if (digits.startsWith(OMAN_COUNTRY_CODE)) {
    const local = digits.slice(OMAN_COUNTRY_CODE.length);
    if (
      local.length === OMAN_LOCAL_LENGTH &&
      OMAN_MOBILE_PREFIXES.has(local[0])
    ) {
      return { ok: true, normalized: `+${OMAN_COUNTRY_CODE}${local}` };
    }
    return {
      ok: false,
      error: "Omani numbers must be +968 followed by 8 digits.",
    };
  }

  // International, explicitly allowed
  if (digits.startsWith("+")) {
    const body = digits.slice(1);
    if (/^[1-9]\d{6,14}$/.test(body)) {
      if (body.startsWith(OMAN_COUNTRY_CODE)) {
        const local = body.slice(OMAN_COUNTRY_CODE.length);
        if (
          local.length === OMAN_LOCAL_LENGTH &&
          OMAN_MOBILE_PREFIXES.has(local[0])
        ) {
          return { ok: true, normalized: `+${OMAN_COUNTRY_CODE}${local}` };
        }
      }
      return { ok: true, normalized: `+${body}` };
    }
    return {
      ok: false,
      error: "Invalid international phone number format.",
    };
  }

  return {
    ok: false,
    error:
      allowInternational
        ? "Phone must use an international format like +96897102438 or +1XXXXXXXXXX."
        : "Phone must be an Omani number: +968 followed by 8 digits.",
  };
}

/** Convenience wrapper for the common Omani case. */
export function validateOmanPhone(input: string): PhoneValidationResult {
  return validatePhoneNumber(input, { allowInternational: false });
}