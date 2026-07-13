// Shared input-length caps so a single oversized field can't bloat the
// database or feed unbounded data into downstream processing (regex,
// hashing, third-party API calls). Mirrors the max-length guard already
// applied to the password policy (lib/security/password.ts).
export const MAX_LEN = {
  short: 120, // names, titles, codes, slugs, categories
  url: 2048, // image/cta links
  text: 5000, // messages, descriptions, addresses
} as const;

export function tooLong(value: string, max: number): boolean {
  return value.length > max;
}

// Rejects oversized JSON payloads by Content-Length before the body is read,
// so a public endpoint can't be made to buffer/parse an arbitrarily large
// request. 256 KB is generous for any form on this site.
export const MAX_BODY_BYTES = 256 * 1024;

export function isBodyTooLarge(request: Request, max: number = MAX_BODY_BYTES): boolean {
  const len = Number(request.headers.get('content-length') || 0);
  return len > max;
}

// Returns an error string if any of the given fields exceed their max
// length, otherwise null.
export function checkLengths(fields: Record<string, { value: string; max: number }>): string | null {
  for (const [label, { value, max }] of Object.entries(fields)) {
    if (tooLong(value, max)) return `${label} must be at most ${max} characters.`;
  }
  return null;
}
