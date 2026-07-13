'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to trigger animation when element scrolls into view.
 * Returns a ref to attach to the element and a boolean isVisible flag.
 *
 * Usage:
 *   const { ref, isVisible } = useScrollAnimation();
 *   <div ref={ref} className={isVisible ? 'animate-fade-up' : 'opacity-0'}>...</div>
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0.15
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isVisible };
}

export default useScrollAnimation;