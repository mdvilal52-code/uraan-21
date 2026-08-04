'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email,
          message: 'Newsletter signup from homepage',
          source: 'Newsletter Signup',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError(data.error || 'Could not subscribe. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-14 bg-[#f8f2e6]">
      <div className="max-w-2xl mx-auto text-center">
        <p className="section-tag-italic">Stay in the Glow</p>
        <h2 className="serif text-3xl md:text-4xl text-[#1a1410] mb-3">
          Join the <em className="gold-text">Family</em>
        </h2>
        <p className="text-xs md:text-sm text-[#6b5d4c] mb-6 max-w-md mx-auto">
          Subscribe for exclusive offers, festive previews, and 10% off your first order.
        </p>

        {submitted ? (
          <div className="bg-[#3d6b5a]/10 border border-[#3d6b5a]/30 p-5 text-[#3d6b5a] inline-flex items-center gap-2 max-w-md">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Thanks for subscribing! Check your email.</span>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex border border-[#1a1410] bg-white max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 text-sm outline-none bg-transparent text-[#1a1410]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 bg-[#1a1410] text-[#e8d49b] text-[10px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] transition-colors disabled:opacity-60"
              >
                {submitting ? '…' : 'Subscribe'}
              </button>
            </form>
            {error && <p className="text-[#b91c1c] text-xs mt-3">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}