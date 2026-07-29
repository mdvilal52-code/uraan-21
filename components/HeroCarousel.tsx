import Image from 'next/image';
import { blurDataURL } from '@/lib/imagePlaceholder';

// Single static hero banner, served responsively:
// - mobile: a taller, portrait-friendly composition (banner-mobile.jpg)
// - desktop (md+): the wide landscape banner (banner.jpg)
export default function HeroCarousel() {
  return (
    <section aria-label="Hero banner" className="relative w-full">
      {/* Mobile */}
      <Image
        src="/images/banner-mobile.jpg"
        alt="OM Gauri Putra – Gems Jewellery and Rudraksha"
        width={864}
        height={505}
        priority
        placeholder="blur"
        blurDataURL={blurDataURL(864, 505)}
        className="block w-full h-auto md:hidden"
        sizes="100vw"
      />
      {/* Desktop */}
      <Image
        src="/images/banner.jpg"
        alt="OM Gauri Putra – Gems Jewellery and Rudraksha"
        width={1536}
        height={456}
        priority
        placeholder="blur"
        blurDataURL={blurDataURL(1536, 456)}
        className="hidden w-full h-auto md:block"
        sizes="100vw"
      />
    </section>
  );
}
