/** @type {import('next').NextConfig} */

// Content-Security-Policy is shipped in REPORT-ONLY mode first: it surfaces
// violations (in the browser console / report endpoint) without breaking the
// live store, so we can tighten it to enforcing once the report is clean.
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.razorpay.com https://api.razorpay.com",
  // Razorpay checkout iframes + Google Maps embed on the Contact page.
  "frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // upgrade-insecure-requests is NOT valid in Report-Only mode (browsers ignore
  // it and emit a console warning). It belongs only in the enforcing header.
].join('; ');

const securityHeaders = [
  // Force HTTPS for two years, including subdomains (HSTS preload-ready).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Clickjacking protection.
  { key: 'X-Frame-Options', value: 'DENY' },
  // MIME-sniffing protection.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak full URLs to other origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable powerful features the storefront doesn't use. Geolocation is
  // allowed for our own origin only (checkout's "Use My Location" address
  // detection) — still blocked for any third-party/embedded content.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
];

// Only allow the Image Optimizer to fetch from our own Supabase storage bucket
// — never an arbitrary attacker-supplied host. A wildcard `**` remotePattern
// turns the optimizer into an open image proxy (SSRF + a DoS amplifier that can
// exhaust CPU/disk optimizing hostile payloads). `**.supabase.co` covers every
// Supabase project; the exact project host is also derived from the env var so
// the allow-list is as tight as possible on a configured deployment.
const imageRemotePatterns = [{ protocol: 'https', hostname: '**.supabase.co' }];
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const host = new URL(supabaseUrl).hostname;
    if (!imageRemotePatterns.some((p) => p.hostname === host)) {
      imageRemotePatterns.push({ protocol: 'https', hostname: host });
    }
  }
} catch {
  // Malformed NEXT_PUBLIC_SUPABASE_URL — fall back to the wildcard subdomain rule.
}

const nextConfig = {
  // Self-contained build: bundles a minimal server + traced node_modules into
  // .next/standalone so the app runs anywhere (Ubuntu VPS, Docker, PM2, behind
  // Nginx/Apache) with plain `node server.js` — no platform adapter required.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  // 'standalone' bundles only the files needed to run in production.
  // The output lives in .next/standalone/ and is started with `node server.js`.
  // This is the recommended mode for Docker, VPS, PM2, and systemd deployments.
  output: 'standalone',

  images: {
    // Serve modern formats when the browser advertises support.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: imageRemotePatterns,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
