'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, Eye, EyeOff, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginUser, getCurrentUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialNotice, setSocialNotice] = useState('');

  const nextUrl = () =>
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('next')) || '/profile';

  useEffect(() => {
    if (getCurrentUser()) router.replace(nextUrl());
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await loginUser(form.email, form.password);
    setLoading(false);
    if (res.ok) {
      router.push(nextUrl());
    } else {
      setError(res.error);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Login</span>
      </div>

      <section className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-[#b8893a] serif italic text-sm tracking-[2px] mb-1">Welcome Back</p>
          <h1 className="serif text-4xl text-[#1a1410]">Login</h1>
          <p className="text-sm text-[#6b5d4c] mt-2">
            Sign in to access your account, orders, and wishlist.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-6 md:p-8 space-y-5">
          <div>
            <label className="luxury-label">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="luxury-input !pl-11"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="luxury-label">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="luxury-input !pl-11 !pr-11"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8c75] hover:text-[#1a1410]"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-[#b8893a]" />
              <span className="text-[#6b5d4c]">Remember me</span>
            </label>
            <a href="#" className="text-[#b8893a] hover:underline">Forgot password?</a>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-[#b91c1c]/10 border border-[#b91c1c]/30 text-[#b91c1c] text-xs p-3 rounded">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3.5 rounded-xl text-[12px] tracking-[3px] uppercase font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_6px_18px_rgba(214,40,120,0.35)] bg-gradient-to-r from-[#f7941e] via-[#ec1c7d] to-[#9b1fb5] hover:brightness-105"
          >
            {loading ? 'Signing In…' : 'Sign In'} <ChevronRight size={16} />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9a8c75]">
            <ShieldCheck size={12} className="text-[#3d6b5a]" />
            <span className="tracking-[1px] uppercase">Secure login · Password encrypted, never stored as text</span>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(184,137,58,0.18)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[10px] tracking-[2px] uppercase text-[#9a8c75]">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSocialNotice('Google sign-in is being set up. Please continue with your email — it takes under a minute and you get 10% off your first order!')}
              className="w-full py-3 rounded-xl bg-white border border-[#dadce0] text-[#3c4043] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#f8f9fa] shadow-sm flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setSocialNotice('Facebook sign-in is being set up. Please continue with your email — it takes under a minute!')}
              className="w-full py-3 rounded-xl bg-[#1877F2] text-white text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#0d65d9] shadow-sm flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FFFFFF" aria-hidden="true">
                <path d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z" />
              </svg>
              Continue with Facebook
            </button>
            {socialNotice && (
              <div className="bg-[#f8f2e6] border border-[#b8893a]/30 text-[#6b5d4c] text-xs p-3 rounded text-center">
                {socialNotice}
              </div>
            )}
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-[#6b5d4c]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#b8893a] font-semibold hover:underline">
            Register Here
          </Link>
        </p>
      </section>

      <Footer />
    </main>
  );
}