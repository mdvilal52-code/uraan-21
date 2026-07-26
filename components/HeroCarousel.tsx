import Image from 'next/image';

export default function HeroCarousel() {
  return (
    <section aria-label="Hero banner" className="relative w-full">
      <Image
        src="/images/banner.jpg"
        alt="OM Gauri Putra – Gems Jewellery and Rudraksha"
        width={1536}
        height={456}
        priority
        className="w-full h-auto block"
        sizes="100vw"
      />
    </section>
  );
}
