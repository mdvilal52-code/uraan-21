// Whether a src is safe to hand to next/image's optimizer. Mirrors the
// reasoning already applied to the admin banner-preview <img> exception
// (components/admin/BannerForm.tsx): next/image errors on any host outside
// images.remotePatterns (next.config.js — local assets + our own Supabase
// project only), which is exactly the point — an unrestricted optimizer is
// an SSRF/DoS-amplifying open image proxy. Category/banner `image` fields
// are admin-editable free text (an upload OR a pasted URL), so a handful of
// public components need to check this before choosing <Image> vs a plain
// <img> fallback for the rare non-Supabase external URL.
export function isOptimizableImageSrc(src: string | undefined | null): boolean {
  if (!src) return false;
  if (src.startsWith('/')) return true; // local /public asset
  try {
    return new URL(src).hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}
