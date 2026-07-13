'use client';

export default function AnnouncementBar() {
  const messages = [
    '✦ Free Shipping on Orders Above ₹1999',
    '✦ 100% BIS Hallmarked Jewellery',
    '✦ 7 Days Easy Returns',
    '✦ Certified Rudraksh from Nepal',
    '✦ Use Code WELCOME10 for 10% Off',
    '✦ Worldwide Shipping Available',
  ];

  // Duplicate for seamless scroll
  const allMessages = [...messages, ...messages];

  return (
    <div className="bg-[#1a1410] text-[#e8d49b] py-2 overflow-hidden">
      {/* Static on mobile (continuous marquee overwhelms weak mobile GPUs) */}
      <div className="md:hidden text-center text-[10px] tracking-[2px] uppercase font-medium px-4 truncate">
        {messages[0]}
      </div>
      <div className="hidden md:flex animate-scroll-x whitespace-nowrap">
        <div className="flex items-center gap-12 px-6 text-[10px] tracking-[2px] uppercase font-medium">
          {allMessages.map((msg, i) => (
            <span key={i}>{msg}</span>
          ))}
        </div>
      </div>
    </div>
  );
}