'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { loginFromSupabaseUser } from '@/lib/auth';

// Landing spot right after a Google/Facebook sign-in: the server callback
// already exchanged the OAuth code for a Supabase session (cookies), so this
// page just reads the now-authenticated user and bridges it into the site's
// existing localStorage profile store (cart/checkout/profile all read from
// there), then continues on to wherever the user was headed.
export default function OAuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const next =
      (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('next')) || '/profile';

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError('Sign-in failed. Please try again.');
        setTimeout(() => router.replace('/login'), 1500);
        return;
      }

      await loginFromSupabaseUser({
        email: user.email,
        name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '',
        phone: (user.user_metadata?.phone as string) || '',
      });

      router.replace(next);
    })();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#C4E7F5]">
      <p className="text-sm text-[#6b5d4c]">{error || 'Signing you in…'}</p>
    </main>
  );
}
