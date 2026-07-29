// No 'use client' — this page is 100% static markup; the only interactive
// bit (clipboard copy) already lives in its own client component
// (CopyAddressButton) below. Rendering it as a Server Component means it
// fully static-prerenders at build time (no client JS needed to paint the
// hero, story, values, or stats sections) instead of shipping the whole
// page's JS to hydrate content that never changes.
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Gem, Award, Heart, ShieldCheck, Users, Sparkles, ChevronRight, MapPin, Navigation } from 'lucide-react';
import { BUSINESS_NAME, BUSINESS_ADDRESS_LINES, MAPS_DIRECTIONS_URL } from '@/lib/business';
import CopyAddressButton from '@/components/CopyAddressButton';
import { blurDataURL } from '@/lib/imagePlaceholder';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0B1E42]">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-white/60">
        <Link href="/" className="text-[#C9A24A] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>About Us</span>
      </div>

      <section className="relative h-[300px] md:h-[420px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={blurDataURL()}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4">
          <p className="serif italic text-[#e8d49b] tracking-[3px] uppercase text-sm mb-3">
            — Our Story —
          </p>
          <h1 className="serif text-5xl md:text-7xl font-normal">
            A Legacy of <em className="gold-text">Trust</em>
          </h1>
        </div>
      </section>

      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/5] bg-[#f8f2e6] overflow-hidden">
            <Image
              src="/images/model.jpg"
              alt="Artisan crafting fine jewellery"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={blurDataURL()}
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-[#b8893a] serif italic text-sm tracking-[2px] mb-2">
              Since Generations
            </p>
            <h2 className="serif text-3xl md:text-4xl text-white mb-5 leading-tight">
              Crafting <em className="gold-text">Heirlooms</em> for Every Family
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Om Gauri Putra Gems Jewellery & Rudraksh was founded with a single vision — to bring authentic,
              certified, and exquisitely crafted jewellery to every Indian family.
              Three generations later, we remain committed to the same values: purity,
              craftsmanship, and trust.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Every piece in our collection is handcrafted by master artisans, with
              meticulous attention to detail. From 916 hallmarked gold to 92.5%
              certified silver, from rare gemstones to authentic Rudraksh sourced
              from Nepal — we ensure only the finest reaches our customers.
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              We believe jewellery is more than an ornament — it&apos;s a story, a memory,
              a blessing passed through generations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1E42] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="section-tag-italic">What We Stand For</p>
          <h2 className="section-heading" style={{ color: 'white' }}>Our Values</h2>
          <div className="luxury-divider"><Sparkles size={10} /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Authenticity',
                desc: 'Every piece is hallmarked, certified, and comes with a guarantee. Pure 916 gold, 92.5% silver, certified Rudraksh.',
              },
              {
                icon: Heart,
                title: 'Craftsmanship',
                desc: 'Handcrafted by master artisans whose families have practiced this art for centuries. Tradition meets precision.',
              },
              {
                icon: Users,
                title: 'Customer First',
                desc: 'From your first visit to lifetime servicing, your trust is sacred to us. We are here for every milestone.',
              },
            ].map((v, i) => (
              <div key={i} className="bg-white/10 border border-[rgba(201,162,74,0.3)] p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 mx-auto mb-4 grid place-items-center">
                  <v.icon className="text-[#C9A24A]" size={24} />
                </div>
                <h3 className="display text-sm tracking-[2px] uppercase text-white mb-3">
                  {v.title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '25+', label: 'Years of Trust', icon: Award },
            { num: '10K+', label: 'Happy Families', icon: Heart },
            { num: '500+', label: 'Unique Designs', icon: Gem },
            { num: '100%', label: 'Hallmarked', icon: ShieldCheck },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-start text-center bg-white border border-[rgba(184,137,58,0.18)] px-4 py-7"
            >
              <s.icon className="text-[#b8893a] mb-3" size={24} />
              {/* tabular + lining figures force every digit to one cap-height and
                  one width, so "25+", "10K+", "500+" and "100%" read at an
                  identical size and baseline (Cormorant defaults to old-style
                  figures, which made some numbers look taller/larger). */}
              <div className="serif tabular-nums lining-nums text-4xl md:text-5xl leading-none text-[#1a1410] font-semibold">
                {s.num}
              </div>
              <div className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mt-2.5 leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1a1410] py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="serif italic text-[#d4a857] text-sm tracking-[3px] uppercase mb-3">
            — Visit Our Store —
          </p>
          <h2 className="serif text-3xl md:text-4xl text-white mb-4">
            Experience the <em className="text-[#d4a857]">Difference</em>
          </h2>
          <p className="text-sm text-[#e8d49b]/70 mb-6 leading-relaxed">
            Step into our flagship store and witness the artistry up close.
          </p>

          <div className="flex items-start gap-2 justify-center mb-6 text-left">
            <MapPin className="text-[#d4a857] flex-shrink-0 mt-0.5" size={16} aria-hidden="true" />
            <address className="not-italic text-sm text-[#e8d49b]/80 leading-relaxed">
              {BUSINESS_NAME}<br />
              {BUSINESS_ADDRESS_LINES.join(', ')}
            </address>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#b8893a] text-[#d4a857] text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#b8893a] hover:text-[#1a1410] transition-all"
            >
              <Navigation size={12} aria-hidden="true" /> Get Directions
            </a>
            <CopyAddressButton
              text={BUSINESS_ADDRESS_LINES.join(', ')}
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#b8893a]/40 text-[#e8d49b]/80 text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#b8893a] hover:text-[#1a1410] transition-all"
            />
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#b8893a] text-[#d4a857] text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#b8893a] hover:text-[#1a1410] transition-all"
            >
              Contact Us <ChevronRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}