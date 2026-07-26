import { Truck, ShieldCheck, RotateCw, Lock } from 'lucide-react';

const BADGES = [
  { icon: Truck, title: 'Free Shipping', sub: 'Complimentary Above ₹1,999' },
  { icon: ShieldCheck, title: 'Certified', sub: 'BIS Hallmarked Purity' },
  { icon: RotateCw, title: 'Easy Returns', sub: '7-Day Hassle-Free' },
  { icon: Lock, title: 'Secure Pay', sub: '256-bit SSL Encrypted' },
];

export default function TrustBadges() {
  return (
    <section id="trust-badges" className="bg-[#211712]">
      <div className="mx-auto grid max-w-7xl grid-cols-4">
        {BADGES.map((badge) => (
          <div
            key={badge.title}
            className="flex flex-col items-center gap-2 px-1.5 py-5 text-center sm:py-7"
          >
            <badge.icon className="text-[#C9A24A]" size={22} strokeWidth={1.5} />
            <div className="font-poppins text-[8.5px] font-bold uppercase leading-tight tracking-[0.1em] text-[#D9A441] sm:text-[11px]">
              {badge.title}
            </div>
            <div className="font-poppins text-[7.5px] leading-tight text-[#D9A441]/60 sm:text-[10px]">
              {badge.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
