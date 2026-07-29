// LQIP-style blur-up placeholder for next/image when the source is a dynamic
// string path (DB/Storage URL) rather than a statically-imported asset — the
// only case where Next.js can auto-derive a real blurDataURL from the file's
// own pixels. This is a lightweight shimmer gradient instead: it still
// paints something immediately (no blank flash while the real image loads),
// which is what "perceived paint is immediate" is actually asking for.
function shimmer(w: number, h: number): string {
  return `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0e6d2" offset="20%" />
      <stop stop-color="#e8d49b" offset="50%" />
      <stop stop-color="#f0e6d2" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0e6d2" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite" />
</svg>`;
}

function toBase64(str: string): string {
  return typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);
}

/** blurDataURL to pass alongside `placeholder="blur"` for any dynamic-source next/image. */
export function blurDataURL(w = 12, h = 12): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
}
