'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import { Lock, Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { completePasswordReset, passwordIssue, passwordStrength } from '@/lib/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Clicking the emailed link lands here with a Supabase recovery session.
  // @supabase/ssr exchanges the link for a session automatically; we wait for
  // the PASSWORD_RECOVERY event (or an already-established session).
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

  const strength = password ? passwordStrength(password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const issue = passwordIssue(password);
    if (issue) {
      setError(issue);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await completePasswordReset(password);
    setLoading(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 2500);
    } else {
      setError(res.error);
    }
  };

  return (
    <main className="min-h-screen bg-[#C4E7F5]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Reset password</span>
      </div>

      <section className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-[#b8893a] serif italic text-sm tracking-[2px] mb-1">Almost there</p>
          <h1 className="serif text-4xl text-[#1a1410]">Choose a new password</h1>
        </div>

        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-6 md:p-8">
          {checking ? (
            <p className="text-sm text-[#6b5d4c] text-center">Verifying your reset link…</p>
          ) : done ? (
            <div className="flex items-start gap-2 bg-[#3d6b5a]/10 border border-[#3d6b5a]/30 text-[#3d6b5a] text-sm p-3 rounded">
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <span>Password updated. Redirecting you to sign in…</span>
            </div>
          ) : !ready ? (
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-start gap-2 bg-[#b91c1c]/10 border border-[#b91c1c]/30 text-[#b91c1c] text-sm p-3 rounded">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>This reset link is invalid or has expired. Please request a new one from the login page.</span>
              </div>
              <Link href="/login" className="text-[#b8893a] font-semibold text-sm hover:underline">← Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-[#6b5d4c]">Must be at least 8 characters, with letters and a number.</p>

              {error && (
                <div className="flex items-start gap-2 bg-[#b91c1c]/10 border border-[#b91c1c]/30 text-[#b91c1c] text-xs p-3 rounded">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="luxury-label">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="luxury-input !pl-11 !pr-11"
                    placeholder="Min 8 characters, letters + numbers"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label="Toggle password"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8c75] hover:text-[#1a1410]"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="h-1 flex-1 rounded-full" style={{ backgroundColor: n <= strength.score ? strength.color : '#e8dcc8' }} />
                      ))}
                    </div>
                    <div className="text-[10px] mt-1 font-semibold tracking-[1px] uppercase" style={{ color: strength.color }}>
                      {strength.label} password
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="luxury-label">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="luxury-input !pl-11"
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3.5 rounded-xl text-[12px] tracking-[3px] uppercase font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_6px_18px_rgba(214,40,120,0.35)] bg-gradient-to-r from-[#f7941e] via-[#ec1c7d] to-[#9b1fb5] hover:brightness-105"
              >
                {loading ? 'Saving…' : 'Set New Password'} <ChevronRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9a8c75]">
                <ShieldCheck size={12} className="text-[#3d6b5a]" />
                <span className="tracking-[1px] uppercase">Secure reset · link expires after one use</span>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
