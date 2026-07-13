'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import { User, Mail, Lock, Phone, Eye, EyeOff, ChevronRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { registerUser, getCurrentUser, passwordIssue, passwordStrength } from '@/lib/auth';
import { COUNTRIES, DEFAULT_COUNTRY, normalizePhone } from '@/lib/phone';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.dial);
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const nextUrl = () =>
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('next')) || '/profile';

  useEffect(() => {
    if (getCurrentUser()) router.replace(nextUrl());
  }, [router]);

  const strength = form.password ? passwordStrength(form.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const normalizedPhone = normalizePhone(form.phone, dialCode);
    if (!normalizedPhone) {
      setError('Please enter a valid phone number for the selected country.');
      return;
    }
    const issue = passwordIssue(form.password);
    if (issue) {
      setError(issue);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    const res = await registerUser({ ...form, phone: normalizedPhone });
    setLoading(false);
    if (res.ok) {
      // Capture the new account as a CRM lead (HubSpot + database). Non-blocking.
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: normalizedPhone,
          message: 'New account registration',
          source: 'Registration',
        }),
      }).catch(() => {});
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
        <span>Register</span>
      </div>

      <section className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-[#b8893a] serif italic text-sm tracking-[2px] mb-1">Join Our Family</p>
          <h1 className="serif text-4xl text-[#1a1410]">Create Account</h1>
          <p className="text-sm text-[#6b5d4c] mt-2">
            Get 10% off your first order + exclusive previews.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-6 md:p-8 space-y-4">
          <div>
            <label className="luxury-label">Full Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="luxury-input !pl-11" placeholder="Your name" />
            </div>
          </div>

          <div>
            <label className="luxury-label">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="luxury-input !pl-11" placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <label className="luxury-label">Phone</label>
            <div className="flex gap-2">
              <select
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="luxury-input !w-auto shrink-0"
                aria-label="Country code"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.dial}>+{c.dial}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="luxury-input !pl-11 w-full" placeholder="Mobile number" />
              </div>
            </div>
          </div>

          <div>
            <label className="luxury-label">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
              <input type={showPassword ? 'text' : 'password'} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="luxury-input !pl-11 !pr-11" placeholder="Min 8 characters, letters + numbers" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8c75]">
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className="h-1 flex-1 rounded-full"
                      style={{ backgroundColor: n <= strength.score ? strength.color : '#e8dcc8' }}
                    />
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
              <input type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="luxury-input !pl-11" placeholder="Re-enter password" />
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer text-xs">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="accent-[#b8893a] mt-1" />
            <span className="text-[#6b5d4c]">
              I agree to the <a href="#" className="text-[#b8893a] underline">Terms of Service</a> and <a href="#" className="text-[#b8893a] underline">Privacy Policy</a>
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-2 bg-[#b91c1c]/10 border border-[#b91c1c]/30 text-[#b91c1c] text-xs p-3 rounded">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full text-white py-3.5 rounded-xl text-[12px] tracking-[3px] uppercase font-bold flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_6px_18px_rgba(214,40,120,0.35)] bg-gradient-to-r from-[#f7941e] via-[#ec1c7d] to-[#9b1fb5] hover:brightness-105">
            {loading ? 'Creating Account…' : 'Create Account'} <ChevronRight size={16} />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9a8c75]">
            <ShieldCheck size={12} className="text-[#3d6b5a]" />
            <span className="tracking-[1px] uppercase">Your password is encrypted before saving</span>
          </div>

          <div className="bg-[#f8f2e6] p-3 text-xs text-[#6b5d4c] text-center">
            <CheckCircle2 size={14} className="text-[#3d6b5a] inline mr-1" />
            Get 10% off your first order!
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-[#6b5d4c]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#b8893a] font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </section>

      <Footer />
    </main>
  );
}