import { Truck, ShieldCheck, RotateCw, Lock } from 'lucide-react';

// Dark trust strip shown directly under the hero carousel — mirrors the
// omgpgems.com badge row (deep-brown band, gold icons, cream text).
const BADGES = [
  { icon: Truck, title: 'Free Shipping', sub: 'Complimentary Above ₹1,999' },
  { icon: ShieldCheck, title: 'Certified', sub: 'BIS Hallmarked Purity' },
  { icon: RotateCw, title: 'Easy Returns', sub: '7-Day Hassle-Free' },
  { icon: Lock, title: 'Secure Pay', sub: '256-bit SSL Encrypted' },
];

export default function TrustBadges() {
  return (
    <section id="trust-badges" className="bg-[#3a2f24] border-y border-[rgba(184,137,58,0.18)]">
      <div className="max-w-7xl mx-auto grid grid-cols-4">
        {BADGES.map((badge) => (
          <div
            key={badge.title}
            className="flex flex-col items-center text-center py-5 md:py-6 px-1.5 md:px-4 border-r border-[rgba(184,137,58,0.18)] last:border-r-0"
          >
            <badge.icon className="text-[#b8893a] mb-2" size={22} strokeWidth={2} />
            <div className="text-[8px] md:text-[10px] font-semibold tracking-[1px] md:tracking-[1.5px] uppercase text-[#e8d49b]">
              {badge.title}
            </div>
            <div className="text-[8px] md:text-[10px] text-[#e8d49b]/60 mt-1 leading-tight">
              {badge.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
