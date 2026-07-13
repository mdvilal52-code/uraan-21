// Per-request security context: client IP, browser/OS, and a coarse device
// fingerprint. Reads only request headers, so it works in any route handler.
// On Vercel the real client IP is the first entry of x-forwarded-for.

export type DeviceInfo = { browser: string; os: string; deviceType: 'Mobile' | 'Desktop' };

export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '0.0.0.0';
}

export function parseUserAgent(ua: string): DeviceInfo {
  const s = ua || '';
  let browser = 'Unknown';
  if (/edg/i.test(s)) browser = 'Edge';
  else if (/opr|opera/i.test(s)) browser = 'Opera';
  else if (/chrome|crios/i.test(s)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(s)) browser = 'Firefox';
  else if (/safari/i.test(s)) browser = 'Safari';

  let os = 'Unknown';
  if (/windows/i.test(s)) os = 'Windows';
  else if (/android/i.test(s)) os = 'Android';
  else if (/iphone|ipad|ipod|ios/i.test(s)) os = 'iOS';
  else if (/mac os|macintosh/i.test(s)) os = 'macOS';
  else if (/linux/i.test(s)) os = 'Linux';

  const deviceType: DeviceInfo['deviceType'] = /mobile|iphone|android|ipad/i.test(s) ? 'Mobile' : 'Desktop';
  return { browser, os, deviceType };
}

/**
 * Stable, non-cryptographic device fingerprint from the browser/OS plus the
 * IP's /24 prefix (so a roaming IP within a network still matches). Used to
 * recognise returning devices for new-device approval; not a security boundary
 * on its own.
 */
export function deviceFingerprint(ua: string, ip: string): string {
  const { browser, os } = parseUserAgent(ua);
  const prefix = ip.split('.').slice(0, 3).join('.');
  const seed = `${browser}|${os}|${prefix}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export function requestSecurityContext(req: Request) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';
  const device = parseUserAgent(userAgent);
  return { ip, userAgent, device, fingerprint: deviceFingerprint(userAgent, ip) };
}
