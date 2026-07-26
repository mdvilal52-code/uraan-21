import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function PromoBanner() {
  return (
    <section id="promo-banner" className="px-3 py-4 md:px-8">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-7xl overflow-hidden rounded-2xl sm:aspect-[16/9] md:aspect-[21/9]">
        {/* Warm bronze-toned photo of a woman wearing gold jewellery, looking
            to the side. */}
        <Image
          src="/images/model.jpg"
          alt="Woman wearing heirloom gold jewellery"
          fill
          sizes="100vw"
          className="object-cover object-[72%_18%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-center px-6 py-5 sm:px-10 md:px-16">
          <p className="font-poppins text-[11px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-[#D9A441] sm:text-xs">
            Timeless
            <br />
            Elegance
          </p>
          <h2 className="mt-2.5 font-serif text-2xl leading-[1.12] text-white sm:mt-4 sm:text-5xl">
            Crafted to Make
            <br />
            You <em className="font-serif italic text-[#D9A441]">Unforgettable</em>
          </h2>
          <p className="mt-2.5 max-w-[260px] font-poppins text-[12px] leading-snug text-[#EDEDED] sm:mt-4 sm:max-w-sm sm:text-[15px] sm:leading-relaxed">
            Discover heirloom jewellery handcrafted by master artisans — for every
            milestone, every memory, every you.
          </p>
          <Link
            href="/collections"
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#D9A441] px-5 py-2.5 font-poppins text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B1E42] transition-colors hover:bg-[#c99532] sm:mt-6 sm:px-6 sm:py-3 sm:text-xs"
          >
            Explore Collections <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
