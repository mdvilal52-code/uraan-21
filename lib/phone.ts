// Shared phone-number normalization to E.164 (+<countrycode><localnumber>).
// Used by every form/API that captures a phone number (checkout, register,
// leads, abandoned carts) and by anything that builds a wa.me link, so a
// customer's number is stored and displayed the same way everywhere.

export type CountryOption = {
  code: string; // ISO 3166-1 alpha-2
  dial: string; // dial code, digits only (no +)
  name: string;
  localLen: number; // expected local (national) number length
};

export const COUNTRIES: CountryOption[] = [
  { code: 'IN', dial: '91', name: 'India (+91)', localLen: 10 },
  { code: 'US', dial: '1', name: 'USA / Canada (+1)', localLen: 10 },
  { code: 'GB', dial: '44', name: 'United Kingdom (+44)', localLen: 10 },
  { code: 'AE', dial: '971', name: 'UAE (+971)', localLen: 9 },
  { code: 'SG', dial: '65', name: 'Singapore (+65)', localLen: 8 },
  { code: 'AU', dial: '61', name: 'Australia (+61)', localLen: 9 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function countryByDial(dial: string): CountryOption {
  return COUNTRIES.find((c) => c.dial === dial.replace(/[^0-9]/g, '')) || DEFAULT_COUNTRY;
}

/**
 * Normalize a raw phone number to E.164 (e.g. "+919876543210"), given the
 * dial code to assume when the input carries no country code of its own.
 * Handles: stray spaces/dashes/parens, a leading trunk "0", and an
 * accidentally duplicated country code (e.g. "+91+9198765432"). Returns null
 * when the result doesn't look like a plausible number.
 */
export function normalizePhone(raw: string | null | undefined, dial: string = DEFAULT_COUNTRY.dial): string | null {
  if (!raw) return null;
  const d = dial.replace(/[^0-9]/g, '') || DEFAULT_COUNTRY.dial;
  const localLen = countryByDial(d).localLen;

  let digits = String(raw).replace(/[^0-9]/g, '');
  if (!digits) return null;

  digits = digits.replace(/^0+/, '');

  // Repeatedly strip a leading country-code prefix — handles both a normal
  // "91 9876543210" and an accidentally doubled "+91+919876543210" — but
  // only while what remains is still long enough to be a real local number,
  // so a local number that happens to start with the same digits (e.g. an
  // Indian mobile starting "91...") is never mistaken for a prefixed one.
  let guard = 0;
  while (digits.startsWith(d) && digits.length - d.length >= localLen && guard < 3) {
    digits = digits.slice(d.length).replace(/^0+/, '');
    guard++;
  }

  if (digits.length < Math.max(6, localLen - 2) || digits.length > localLen + 2) return null;
  return `+${d}${digits}`;
}

/** Basic E.164 shape check: a leading "+", then 7–15 digits. */
export function isValidE164(value: string | null | undefined): boolean {
  return !!value && /^\+[1-9]\d{6,14}$/.test(value);
}

/** True when `raw` normalizes to a plausible number for the given dial code. */
export function isValidPhoneInput(raw: string, dial: string = DEFAULT_COUNTRY.dial): boolean {
  return isValidE164(normalizePhone(raw, dial));
}
