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
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#ece3d0] bg-[#FBF8F1]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {BADGES.map((badge, i) => (
            <div
              key={badge.title}
              className={[
                'flex flex-col items-center gap-1.5 px-3 py-5 text-center sm:py-6',
                i % 2 !== 0 ? 'border-l border-[#e7dcc4]' : '',
                i >= 2 ? 'border-t border-[#e7dcc4]' : '',
                i > 0 ? 'md:border-l' : '',
                'md:border-t-0',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <badge.icon className="text-[#C9A24A]" size={22} strokeWidth={1.5} />
              <div className="font-poppins text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-[#0B1E42] sm:text-[11px]">
                {badge.title}
              </div>
              <div className="font-poppins text-[8px] leading-tight text-[#6b5d4c] sm:text-[10px]">
                {badge.l1}
                <br />
                {badge.l2}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
