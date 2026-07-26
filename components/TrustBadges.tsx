import { Truck, ShieldCheck, RotateCw, Lock } from 'lucide-react';

const BADGES = [
  { icon: Truck, title: 'Free Shipping', l1: 'Complimentary', l2: 'Above ₹1,999' },
  { icon: ShieldCheck, title: 'Certified', l1: 'BIS Hallmarked', l2: 'Purity' },
  { icon: RotateCw, title: 'Easy Returns', l1: '7-Day', l2: 'Hassle-Free' },
  { icon: Lock, title: 'Secure Payment', l1: '256-bit SSL', l2: 'Encrypted' },
];

export default function TrustBadges() {
  return (
    <section id="trust-badges" className="px-3 py-2 md:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-4 divide-x divide-[#e7dcc4] rounded-2xl border border-[#ece3d0] bg-[#FBF8F1]">
        {BADGES.map((badge) => (
          <div
            key={badge.title}
            className="flex flex-col items-center gap-1.5 px-1.5 py-4 text-center sm:py-6"
          >
            <badge.icon className="text-[#C9A24A]" size={22} strokeWidth={1.5} />
            <div className="font-poppins text-[8.5px] font-bold uppercase leading-tight tracking-[0.08em] text-[#0B1E42] sm:text-[11px]">
              {badge.title}
            </div>
            <div className="font-poppins text-[7.5px] leading-tight text-[#6b5d4c] sm:text-[10px]">
              {badge.l1}
              <br />
              {badge.l2}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
