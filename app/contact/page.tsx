'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import {
  Phone, Mail, MapPin, Clock,
   MessageCircle,
  Send, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";
import { addLead } from '@/lib/leads';
import { whatsappLink } from '@/lib/whatsapp';
import {
  BUSINESS_NAME,
  BUSINESS_ADDRESS_LINES,
  BUSINESS_ADDRESS_INLINE,
  MAPS_VIEW_URL,
  MAPS_DIRECTIONS_URL,
  MAPS_EMBED_URL,
} from '@/lib/business';
import CopyAddressButton from '@/components/CopyAddressButton';
export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: `${form.subject ? `[${form.subject}] ` : ''}${form.message}`,
          source: 'Contact Page',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        // Also record in the in-app CRM so it shows in the admin pipeline.
        try {
          addLead({
            name: form.name,
            email: form.email,
            phone: form.phone,
            message: `${form.subject ? `[${form.subject}] ` : ''}${form.message}`,
            source: 'Contact Page',
          });
        } catch { /* CRM is best-effort; never block the user */ }
        setSubmitted(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Contact Us</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <p className="text-[#b8893a] serif italic text-sm tracking-[2px] mb-1">Get in Touch</p>
        <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-2">Contact Us</h1>
        <p className="text-sm text-[#6b5d4c] max-w-2xl">
          We&apos;d love to hear from you. Whether you have a question or need styling advice — drop us a line.
        </p>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: Phone, title: 'Call Us', primary: '+91 88519 11653', secondary: '+91 98118 10235', href: 'tel:+918851911653' },
          { icon: Mail, title: 'Email Us', primary: 'info@omgpgems.com', secondary: 'jitendarsoni1975@gmail.com', href: 'mailto:info@omgpgems.com' },
          { icon: MapPin, title: 'Visit Us', primary: BUSINESS_ADDRESS_LINES[0], secondary: `${BUSINESS_ADDRESS_LINES[1]}, ${BUSINESS_ADDRESS_LINES[2]}`, href: '#find-us' },
        ].map((c, i) => (
          <a key={i} href={c.href} className="luxury-card p-5 text-center group">
            <div className="w-14 h-14 rounded-full bg-[#f8f2e6] mx-auto mb-3 grid place-items-center group-hover:bg-[#b8893a] transition-colors">
              <c.icon size={22} className="text-[#b8893a] group-hover:text-white" />
            </div>
            <h3 className="display text-xs tracking-[2px] uppercase text-[#1a1410] mb-2">
              {c.title}
            </h3>
            <div className="text-sm text-[#1a1410] font-semibold mb-1">{c.primary}</div>
            <div className="text-xs text-[#6b5d4c]">{c.secondary}</div>
          </a>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
          <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-2">
            Send Us a Message
          </h2>
          <p className="text-xs text-[#6b5d4c] mb-5 italic">
            We&apos;ll get back to you within 24 hours.
          </p>

          {submitted ? (
            <div className="bg-[#3d6b5a]/10 border border-[#3d6b5a]/30 p-6 text-center text-[#3d6b5a]">
              <CheckCircle2 className="mx-auto mb-3" size={36} />
              <div className="serif text-xl mb-1">Message sent!</div>
              <div className="text-sm">Thank you. We&apos;ll reply soon.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="luxury-label">Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="luxury-input" />
                </div>
                <div>
                  <label className="luxury-label">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="luxury-input" />
                </div>
              </div>
              <div>
                <label className="luxury-label">Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="luxury-input" />
              </div>
              <div>
                <label className="luxury-label">Subject</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="luxury-input">
                  <option value="">Select a subject</option>
                  <option value="product">Product Enquiry</option>
                  <option value="order">Order Support</option>
                  <option value="custom">Custom Design</option>
                  <option value="bulk">Bulk Order</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="luxury-label">Message *</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help..." className="luxury-input" />
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-[#b91c1c]/10 border border-[#b91c1c]/30 text-[#b91c1c] text-xs p-3 rounded">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1a1410] text-[#e8d49b] py-3 text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={14} /> {submitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Store Info */}
        <div className="space-y-5">
          <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
            <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">
              Our Flagship Store
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-[#b8893a] flex-shrink-0 mt-0.5" size={18} aria-hidden="true" />
                <div>
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Address</div>
                  <address className="not-italic text-sm text-[#1a1410] leading-relaxed">
                    {BUSINESS_ADDRESS_LINES.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < BUSINESS_ADDRESS_LINES.length - 1 && <br />}
                      </span>
                    ))}
                  </address>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <a
                      href={MAPS_VIEW_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-[#b8893a] hover:underline"
                    >
                      View on Map
                    </a>
                    <CopyAddressButton
                      text={BUSINESS_ADDRESS_INLINE}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b8893a] hover:underline"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-[#b8893a] flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Hours</div>
                  <div className="text-sm text-[#1a1410]">
                    Monday - Saturday: 10AM - 8PM<br />
                    Sunday: 11AM - 6PM
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-[#b8893a] flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Phone</div>
                  <a href="tel:+918851911653" className="text-sm text-[#1a1410] hover:text-[#b8893a]">
                    +91 88519 11653
                  </a>
                  <span className="text-sm text-[#1a1410]"> · </span>
                  <a href="tel:+919811810235" className="text-sm text-[#1a1410] hover:text-[#b8893a]">
                    +91 98118 10235
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-[rgba(184,137,58,0.18)]">
              <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-3">Follow Us</div>
              <div className="flex gap-3">
                {[
                  { icon: FaInstagram, href: 'https://instagram.com', label: 'Instagram' },
                  { icon: FaFacebook, href: 'https://facebook.com', label: 'Facebook' },
                  { icon: FaYoutube, href: 'https://youtube.com', label: 'YouTube' },
                  { icon: MessageCircle, href: whatsappLink(), label: 'WhatsApp' },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="w-10 h-10 rounded-full border border-[#b8893a]/40 grid place-items-center hover:bg-[#b8893a] hover:text-white transition-colors">
                    <s.icon size={16} className="text-[#b8893a]" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div id="find-us" className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-6">
            <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">
              Find Us
            </h2>
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="text-[#b8893a] flex-shrink-0 mt-1" size={20} aria-hidden="true" />
              <div>
                <div className="text-sm font-semibold text-[#1a1410] mb-1">{BUSINESS_NAME} Jewellery</div>
                <address className="not-italic text-sm text-[#6b5d4c] leading-relaxed">
                  {BUSINESS_ADDRESS_LINES.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < BUSINESS_ADDRESS_LINES.length - 1 && <br />}
                    </span>
                  ))}
                </address>
              </div>
            </div>

            {/* Interactive map — keyless embed, no API key required */}
            <div className="rounded-lg overflow-hidden border border-[rgba(184,137,58,0.18)] mb-4">
              <iframe
                title={`${BUSINESS_NAME} store location map`}
                src={MAPS_EMBED_URL}
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full aspect-[4/3] sm:aspect-video"
              />
            </div>

            <div className="border-t border-[rgba(184,137,58,0.18)] pt-4 mb-4">
              <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-2">How to Reach Us</div>
              <ul className="text-xs text-[#6b5d4c] space-y-1.5 leading-relaxed">
                <li><span className="text-[#b8893a] font-semibold">By Metro:</span> Rithala (Red Line) is the nearest Metro station — a short auto or e-rickshaw ride to Budh Vihar, Phase 2</li>
                <li><span className="text-[#b8893a] font-semibold">By Bus:</span> DTC &amp; cluster buses stop at Budh Vihar / Sector 24</li>
                <li><span className="text-[#b8893a] font-semibold">By Road:</span> On Kanjhawala Road, Budh Vihar Phase-2 — well connected to Rohini &amp; the Outer Ring Road</li>
                <li><span className="text-[#b8893a] font-semibold">Parking:</span> Street parking available near the store</li>
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#1a1410] text-[#e8d49b] text-[10px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] transition-all"
              >
                <MapPin size={12} aria-hidden="true" /> Get Directions
              </a>
              <CopyAddressButton
                text={BUSINESS_ADDRESS_INLINE}
                className="inline-flex items-center gap-2 px-5 py-2 border border-[#1a1410] text-[#1a1410] text-[10px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}