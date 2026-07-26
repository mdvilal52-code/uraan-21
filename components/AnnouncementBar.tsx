import { Diamond } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-[#0B1E42] px-3 py-2">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-0.5 text-center font-poppins text-[#F7F3E8]">
        <p className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.1em] leading-snug">
          <Diamond size={9} className="shrink-0 text-[#C9A24A]" fill="#C9A24A" strokeWidth={0} />
          <span>
            FREE SHIPPING ON ORDERS ABOVE ₹1999&nbsp;&nbsp;•&nbsp;&nbsp;100% BIS HALLMARKED
          </span>
        </p>
        <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.1em] leading-snug">
          •&nbsp;&nbsp;7 DAYS EASY RETURNS&nbsp;&nbsp;•&nbsp;&nbsp;CERTIFIED RIQ 100%
        </p>
      </div>
    </div>
  );
}
