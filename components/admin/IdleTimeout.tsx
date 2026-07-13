'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Session timeout (#16): signs the admin out after a period of inactivity.
const IDLE_MINUTES = 30;

export default function IdleTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    const logout = async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch {
        /* redirect regardless */
      }
      router.push('/admin/login');
      router.refresh();
    };

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(logout, IDLE_MINUTES * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router, pathname]);

  return null;
}
