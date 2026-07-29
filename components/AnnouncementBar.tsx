import { Diamond } from 'lucide-react';

const MESSAGES = [
  'FREE SHIPPING ON ORDERS ABOVE ₹1999',
  '100% BIS HALLMARKED',
  '7 DAYS EASY RETURNS',
  'CERTIFIED RIQ 100%',
];

// Continuously scrolling ticker strip. The message list is rendered twice
// back-to-back and slid left by exactly 50% so the loop is seamless.
export default function AnnouncementBar() {
  return (
    <div className="overflow-hidden bg-[#0B1E42] py-2">
      <div className="flex w-max animate-scroll-x whitespace-nowrap will-change-transform [backface-visibility:hidden]">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-8 px-4 font-poppins">
            {MESSAGES.map((msg, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#F7F3E8] sm:text-[11px]"
              >
                <Diamond size={9} className="shrink-0 text-[#C9A24A]" fill="#C9A24A" strokeWidth={0} />
                {msg}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
