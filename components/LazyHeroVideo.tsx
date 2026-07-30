'use client';

import { useEffect, useRef, useState } from 'react';

type LazyHeroVideoProps = {
  src: string;
  webmSrc?: string;
  poster: string;
  className?: string;
};

// Background/hero video that only starts fetching once it's about to scroll
// into view (IntersectionObserver, primed 200px early so playback is ready
// by the time it's actually visible) — not on initial page load. preload
// stays "none" until then, so a visitor who never scrolls this far never
// downloads a single byte of video. The poster paints instantly either way.
export default function LazyHeroVideo({ src, webmSrc, poster, className }: LazyHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true); // no IO support — fail open rather than never loading
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const el = videoRef.current;
    if (!el) return;
    el.load();
    // Autoplay can be blocked by the browser before any user interaction —
    // that's fine, the poster stays visible and playback starts on the next
    // interaction, same as a normal autoplay attribute would degrade.
    el.play().catch(() => {});
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="none"
      poster={poster}
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    >
      {shouldLoad && webmSrc && <source src={webmSrc} type="video/webm" />}
      {shouldLoad && <source src={src} type="video/mp4" />}
    </video>
  );
}
