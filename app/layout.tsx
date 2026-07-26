import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import {
  Cormorant_Garamond,
  Cinzel,
  Jost,
  Poppins,
  Noto_Sans_Devanagari,
  Rozha_One,
} from 'next/font/google';
import './globals.css';
import '../styles/luxury.css';
import '../styles/animations.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/wishlistContext';
import MobileBottomNav from '@/components/MobileBottomNav';
import StorageWarningBanner from '@/components/StorageWarningBanner';
import { SITE_URL } from '@/lib/site';
import { BUSINESS_NAME, BUSINESS_ADDRESS, BUSINESS_LAT, BUSINESS_LNG } from '@/lib/business';

// Self-hosted fonts via next/font — no render-blocking request to the Google
// Fonts CDN, no external dependency (works offline / on any host), and the CSS
// `size-adjust` fallback next/font injects prevents layout shift. Exposed as
// CSS variables so the existing `font-family: var(--font-*)` rules and the
// Tailwind `font-serif|display|sans` utilities resolve to them.
const fontSerif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});
const fontDisplay = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});
const fontSans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});
const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});
const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-devanagari',
});
const fontDevanagariDisplay = Rozha_One({
  subsets: ['devanagari'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-devanagari-display',
});

const siteUrl = SITE_URL;

// LocalBusiness structured data (JSON-LD) — powers the Google Maps /
// local-pack knowledge panel and rich search results. Rendered once, site
// -wide, so every crawled page carries the same store identity + address.
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: BUSINESS_NAME,
  image: `${siteUrl}/images/hero.jpg`,
  url: siteUrl,
  telephone: '+91-88519-11653',
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${BUSINESS_ADDRESS.line1}, ${BUSINESS_ADDRESS.line2}`,
    addressLocality: BUSINESS_ADDRESS.locality,
    addressRegion: BUSINESS_ADDRESS.region,
    postalCode: BUSINESS_ADDRESS.postalCode,
    addressCountry: BUSINESS_ADDRESS.countryCode,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS_LAT,
    longitude: BUSINESS_LNG,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '10:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday'],
      opens: '11:00',
      closes: '18:00',
    },
  ],
  sameAs: [process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/omgauriputra'],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Set NEXT_PUBLIC_GOOGLE_VERIFICATION (the content value Google Search
  // Console gives you) to verify ownership via the meta-tag method.
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }
    : undefined,
  title: {
    default: 'Om Gauri Putra Gems Jewellery & Rudraksh — Gold, Silver, Diamond & Rudraksh Online',
    template: '%s | Om Gauri Putra Gems Jewellery & Rudraksh',
  },
  description:
    'Buy certified gold, 92.5 silver, diamond and authentic Nepal Rudraksh jewellery online at Om Gauri Putra Gems Jewellery & Rudraksh. BIS hallmarked, bridal sets, necklaces, earrings & rings with free shipping above ₹1999. Located in Shyam Colony, Budh Vihar Phase-2, Delhi.',
  keywords: [
    'gold jewellery online',
    'silver jewellery',
    'diamond necklace',
    'bridal jewellery',
    'rudraksh online',
    'certified rudraksh nepal',
    'BIS hallmarked gold',
    '925 silver jewellery',
    'temple jewellery',
    'kundan necklace',
    'jhumka earrings',
    'gold rings india',
    'jewellery shop Shyam Colony Delhi',
    'jewellery shop Budh Vihar',
    'jewellery shop Budh Vihar Phase-2',
    'Om Gauri Putra Gems',
    'OMGP gems',
  ],
  authors: [{ name: 'Om Gauri Putra Gems Jewellery & Rudraksh' }],
  creator: 'Om Gauri Putra Gems Jewellery & Rudraksh',
  applicationName: 'Om Gauri Putra Gems Jewellery & Rudraksh',
  category: 'shopping',
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Om Gauri Putra Gems Jewellery & Rudraksh',
    title: 'Om Gauri Putra Gems Jewellery & Rudraksh — Gold, Silver, Diamond & Rudraksh',
    description:
      'Certified gold, silver, diamond and authentic Rudraksh jewellery. BIS hallmarked, bridal collections, free shipping above ₹1999.',
    images: [{ url: '/images/hero.jpg', width: 1200, height: 630, alt: 'Om Gauri Putra Gems Jewellery & Rudraksh' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Om Gauri Putra Gems Jewellery & Rudraksh — Fine Jewellery',
    description: 'Certified gold, silver, diamond & authentic Rudraksh jewellery online.',
    images: ['/images/hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1410',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSerif.variable} ${fontDisplay.variable} ${fontSans.variable} ${fontPoppins.variable} ${fontDevanagari.variable} ${fontDevanagariDisplay.variable}`}
    >
      <head />
      <body className="pb-14 md:pb-0">
        {/* Traffic analytics (Level 3) — dormant until NEXT_PUBLIC_GA_MEASUREMENT_ID
            is set (see the environment variables guide), matching the same
            graceful-degrade pattern as every other integration in this app. */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <CartProvider>
          <WishlistProvider>
            {children}
            <MobileBottomNav />
            <StorageWarningBanner />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}