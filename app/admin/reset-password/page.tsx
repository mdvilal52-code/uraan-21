'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, Lock, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Clicking the emailed link lands here with a Supabase recovery session.
  // @supabase/ssr exchanges the URL code for a session automatically; we just
  // wait for the PASSWORD_RECOVERY event (or an already-established session).
  // Supabase Auth (Phase 2) may not be configured at all — createClient()
  // throws on an empty URL, so guard against that instead of crashing the page.
  useEffect(() => {
    if (!isSupabaseAuthConfigured()) {
      setChecking(false);
      return;
    }
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (password !== confirm) {
      setErrors(['Passwords do not match.']);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/password/reset-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDone(true);
        setTimeout(() => {
          router.push('/admin/login');
          router.refresh();
        }, 2500);
      } else {
        setErrors(data.errors || [data.error || 'Could not reset password.']);
      }
    } catch {
      setErrors(['Network error. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1a1410] bg-[radial-gradient(ellipse_at_top,_rgba(184,137,58,0.16),_transparent_55%)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <Gem className="text-[#b8893a]" size={26} />
            <span className="display text-xl md:text-2xl tracking-[4px] font-semibold text-white">OM GAURI</span>
          </div>
          <p className="text-[10px] tracking-[4px] text-[#b8893a] uppercase">Admin Panel</p>
        </div>

        <div className="bg-white border border-[#b8893a]/15 shadow-[0_22px_60px_-20px_rgba(0,0,0,0.55)] p-7 md:p-8">
          <h1 className="serif text-2xl text-[#1a1410] mb-1 flex items-center gap-2">
            <KeyRound size={20} className="text-[#b8893a]" /> Choose a new password
          </h1>

          {checking ? (
            <p className="text-sm text-[#6b5d4c] mt-4">Verifying your reset link…</p>
          ) : done ? (
            <div className="mt-4 flex items-start gap-2 bg-[#3d6b5a]/10 text-[#3d6b5a] text-sm p-3">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <span>Password updated. Redirecting to sign in…</span>
            </div>
          ) : !ready ? (
            <div className="mt-4 flex items-start gap-2 bg-[#7a2e2e]/10 text-[#7a2e2e] text-sm p-3">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>This reset link is invalid or has expired. Go back to the login page and request a new one.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5">
              <p className="text-sm text-[#6b5d4c] mb-6">Must be at least 12 characters, with upper/lowercase, a number and a symbol.</p>

              {errors.length > 0 && (
                <div className="mb-4 bg-[#7a2e2e]/10 text-[#7a2e2e] text-sm p-3 space-y-1">
                  {errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2"><AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {e}</div>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="new-password" className="luxury-label">New Password</label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8893a]" />
                  <input id="new-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="luxury-input h-12 !pl-11 !pr-11" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9a8c75] hover:text-[#b8893a] transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="confirm-password" className="luxury-label">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8893a]" />
                  <input id="confirm-password" type={showPassword ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="luxury-input h-12 !pl-11" autoComplete="new-password" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full h-12 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60 transition-colors">
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
