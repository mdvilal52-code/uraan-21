'use client';

import Link from 'next/link';
import { whatsappLink } from '@/lib/whatsapp';
import { BUSINESS_NAME, BUSINESS_ADDRESS_LINES, MAPS_DIRECTIONS_URL, SOCIAL_URLS } from '@/lib/business';
import CopyAddressButton from '@/components/CopyAddressButton';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CreditCard,
  Smartphone,
  Wallet,
  ShieldCheck,
  Navigation,
} from 'lucide-react';

import { FaFacebook, FaInstagram, FaYoutube,  } from "react-icons/fa";
export default function Footer() {
  return (
    <footer className="bg-[#0B1E42] text-[#e8d49b] mt-10">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-[#C9A24A] rotate-45" />
            <span className="display text-sm font-semibold tracking-[1.5px] text-[#e8d49b] uppercase">
              {BUSINESS_NAME}
            </span>
          </div>
          <div className="text-[9px] tracking-[3px] text-[#C9A24A] mb-4 uppercase">
            Gems · Jewellery · Rudraksh
          </div>
          <p className="text-xs text-[#e8d49b]/70 leading-relaxed mb-4">
            Three generations of trust, crafting heirloom jewellery and
            authentic Rudraksh with timeless artistry.
          </p>
          <div className="flex gap-3">
            {[
              { icon: FaInstagram, href: SOCIAL_URLS.instagram, label: 'Instagram' },
              { icon: FaFacebook, href: SOCIAL_URLS.facebook, label: 'Facebook' },
              { icon: FaYoutube, href: SOCIAL_URLS.youtube, label: 'YouTube' },
              { icon: MessageCircle, href: whatsappLink(), label: 'WhatsApp' },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-[#C9A24A]/40 grid place-items-center hover:bg-[#C9A24A] hover:text-[#0B1E42] transition-colors"
              >
                <s.icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <div className="display text-xs tracking-[3px] uppercase text-[#C9A24A] mb-4">Shop</div>
          <ul className="space-y-2 text-xs text-[#e8d49b]/70">
            <li><Link href="/collections" className="hover:text-[#C9A24A]">All Products</Link></li>
            <li><Link href="/collections?type=gold" className="hover:text-[#C9A24A]">Gold</Link></li>
            <li><Link href="/collections?type=silver" className="hover:text-[#C9A24A]">Silver</Link></li>
            <li><Link href="/collections?type=diamond" className="hover:text-[#C9A24A]">Diamond</Link></li>
            <li><Link href="/collections?type=rudraksh" className="hover:text-[#C9A24A]">Rudraksh</Link></li>
            <li><Link href="/collections?type=bridal" className="hover:text-[#C9A24A]">Bridal</Link></li>
            <li><Link href="/collections?type=new" className="hover:text-[#C9A24A]">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <div className="display text-xs tracking-[3px] uppercase text-[#C9A24A] mb-4">Customer Care</div>
          <ul className="space-y-2 text-xs text-[#e8d49b]/70">
            <li><Link href="/about" className="hover:text-[#C9A24A]">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-[#C9A24A]">Contact</Link></li>
            <li><Link href="/profile" className="hover:text-[#C9A24A]">My Account</Link></li>
            <li><Link href="/wishlist" className="hover:text-[#C9A24A]">Wishlist</Link></li>
            <li><Link href="/terms#shipping" className="hover:text-[#C9A24A]">Shipping Policy</Link></li>
            <li><Link href="/terms#returns" className="hover:text-[#C9A24A]">Return &amp; Refund</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-[#C9A24A]">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-[#C9A24A]">Terms of Service</Link></li>
            <li><Link href="/data-deletion" className="hover:text-[#C9A24A]">Data Deletion</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="display text-xs tracking-[3px] uppercase text-[#C9A24A] mb-4">Get in Touch</div>
          <ul className="space-y-3 text-xs text-[#e8d49b]/70">
            <li className="flex items-start gap-2">
              <MapPin size={13} className="text-[#b8893a] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <address className="not-italic">
                {BUSINESS_ADDRESS_LINES.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < BUSINESS_ADDRESS_LINES.length - 1 && <br />}
                  </span>
                ))}
              </address>
            </li>
            <li className="flex flex-wrap items-center gap-3 pl-5">
              <a
                href={MAPS_DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] tracking-[1px] uppercase font-semibold text-[#C9A24A] hover:text-white"
              >
                <Navigation size={11} aria-hidden="true" /> Get Directions
              </a>
              <CopyAddressButton
                text={BUSINESS_ADDRESS_LINES.join(', ')}
                className="inline-flex items-center gap-1.5 text-[10px] tracking-[1px] uppercase font-semibold text-[#C9A24A] hover:text-white"
              />
            </li>
            <li className="flex items-center gap-2">
              <Phone size={13} className="text-[#b8893a] flex-shrink-0" aria-hidden="true" />
              <a href="tel:+918851911653" className="hover:text-[#b8893a]">+91 88519 11653</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={13} className="text-[#b8893a] flex-shrink-0" aria-hidden="true" />
              <a href="tel:+919811810235" className="hover:text-[#b8893a]">+91 98118 10235</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={13} className="text-[#b8893a] flex-shrink-0" aria-hidden="true" />
              <a href="mailto:info@omgpgems.com" className="hover:text-[#b8893a] break-all">
                info@omgpgems.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={13} className="text-[#b8893a] flex-shrink-0" aria-hidden="true" />
              <a href="mailto:jitendarsoni1975@gmail.com" className="hover:text-[#b8893a] break-all">
                jitendarsoni1975@gmail.com
              </a>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-[#C9A24A]/20">
            <div className="text-[10px] tracking-[1.5px] uppercase text-[#C9A24A] mb-1">Store Hours</div>
            <div className="text-[11px] text-[#e8d49b]/70">Mon - Sat: 10AM - 8PM</div>
            <div className="text-[11px] text-[#e8d49b]/70">Sunday: 11AM - 6PM</div>
          </div>
        </div>
      </div>

      {/* Payment & Trust */}
      <div className="border-t border-[#C9A24A]/20">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] tracking-[1.5px] uppercase text-[#e8d49b]/60">
            <ShieldCheck size={13} className="text-[#C9A24A]" />
            <span>Secure Checkout · 256-bit SSL Encrypted</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#e8d49b]/70">
            {[
              { icon: CreditCard, label: 'Cards' },
              { icon: Smartphone, label: 'UPI' },
              { icon: Wallet, label: 'Wallets' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                <p.icon size={13} className="text-[#C9A24A]" />
                <span>{p.label}</span>
              </div>
            ))}
            <div className="display text-[10px] tracking-[1.5px] text-[#e8d49b]/60">
              VISA · MASTERCARD · RUPAY · GPAY · PHONEPE · PAYTM
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="bg-black/20 border-t border-[#C9A24A]/20 py-4 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-[10px] tracking-[1px] text-[#e8d49b]/50">
        <span>
          © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved. · Crafted with care in India 🇮🇳
        </span>
        <span className="flex items-center gap-3">
          <Link href="/privacy-policy" className="hover:text-[#C9A24A]">Privacy Policy</Link>
          <span className="opacity-40">·</span>
          <Link href="/terms" className="hover:text-[#C9A24A]">Terms</Link>
          <span className="opacity-40">·</span>
          <Link href="/data-deletion" className="hover:text-[#C9A24A]">Data Deletion</Link>
        </span>
      </div>
    </footer>
  );
}