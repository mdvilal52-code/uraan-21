'use client';

export default function AnnouncementBar() {
  const items = [
    '♦ Free Shipping on Orders Above ₹1999',
    '♦ 100% BIS Hallmarked Jewellery',
    '♦ 7 Days Easy Returns',
    '♦ Certified RIQ 100%',
    '♦ 6661+ Happy Orders',
  ];
  const doubled = [...items, ...items];

  return (
    <div className="bg-[#0d1d3d] text-white overflow-hidden" style={{ paddingTop: '7px', paddingBottom: '7px' }}>
      {/* Mobile: compact static row */}
      <p className="md:hidden text-center text-[9px] tracking-[1.3px] uppercase font-medium px-3 truncate">
        Free Shipping ₹1999+&nbsp;&nbsp;•&nbsp;&nbsp;BIS Hallmarked&nbsp;&nbsp;•&nbsp;&nbsp;7 Days Returns&nbsp;&nbsp;•&nbsp;&nbsp;Certified 100%
      </p>
      {/* Desktop: seamless marquee */}
      <div className="hidden md:flex animate-scroll-x whitespace-nowrap">
        <div className="flex items-center gap-12 text-[10px] tracking-[1.5px] uppercase font-medium px-8">
          {doubled.map((msg, i) => (
            <span key={i}>{msg}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
