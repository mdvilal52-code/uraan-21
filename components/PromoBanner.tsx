import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section id="promo-banner" className="relative w-full overflow-hidden">
      <div className="relative aspect-[3/4] w-full sm:aspect-[16/9] md:aspect-[21/9]">
        {/* [IMAGE: promo-model.png] — warm bronze-toned photo of a woman wearing
            gold jewellery, looking to the side. Placeholder only — swap in the
            supplied file, do not substitute a different image. */}
        <Image
          src="/images/promo-model.png"
          alt="Woman wearing heirloom gold jewellery"
          fill
          sizes="100vw"
          className="object-cover object-[75%_center]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 sm:justify-center sm:px-10 md:px-16">
          <p className="font-poppins text-xs font-semibold uppercase leading-relaxed tracking-[0.3em] text-[#D9A441]">
            Timeless
            <br />
            Elegance
          </p>
          <h2 className="mt-4 font-serif text-[32px] leading-[1.1] text-white sm:text-5xl">
            Crafted to Make
            <br />
            You <em className="font-serif italic text-[#D9A441]">Unforgettable</em>
          </h2>
          <p className="mt-4 max-w-[260px] font-poppins text-[13px] leading-relaxed text-[#EDEDED] sm:max-w-sm sm:text-[15px]">
            Discover heirloom jewellery handcrafted by master artisans — for every
            milestone, every memory, every you.
          </p>
          <Link
            href="/collections"
            className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#D9A441] px-6 py-3 font-poppins text-xs font-bold uppercase tracking-[0.15em] text-[#0B1E42] transition-colors hover:bg-[#c99532]"
          >
            Explore Collections <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
