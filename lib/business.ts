// Single source of truth for the store's business identity and physical
// address — used by the Footer, Contact page, About page, admin Settings,
// email templates and the site-wide LocalBusiness structured data. Override
// any field with the matching NEXT_PUBLIC_BUSINESS_* env var to relocate the
// store without touching component code.
export const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Om Gauri Putra';

export const BUSINESS_ADDRESS = {
  line1: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE1 || 'Ground Floor, Plot No. G-6, KH No. 69/17/1',
  line2: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE2 || 'Veer Singh Colony, Budh Vihar Phase 2',
  locality: process.env.NEXT_PUBLIC_BUSINESS_CITY || 'Rohini, New Delhi',
  region: process.env.NEXT_PUBLIC_BUSINESS_STATE || 'Delhi',
  postalCode: process.env.NEXT_PUBLIC_BUSINESS_PINCODE || '110086',
  country: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY || 'India',
  countryCode: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY_CODE || 'IN',
};

// Delhi has more than one locality named "Budh Vihar" (this one, in Rohini/
// North West Delhi, and an unrelated one near Munirka), which regularly
// confuses text-address geocoding and sends "Get Directions" to the wrong
// part of the city. Pinning the store's verified exact GPS coordinates
// sidesteps that ambiguity entirely — override with the matching env vars if
// the store ever relocates.
const BUSINESS_LAT = process.env.NEXT_PUBLIC_BUSINESS_LAT || '28.7192471';
const BUSINESS_LNG = process.env.NEXT_PUBLIC_BUSINESS_LNG || '77.0945902';
const BUSINESS_COORDS = { lat: BUSINESS_LAT, lng: BUSINESS_LNG };

/** Single-line address, e.g. for <address>, JSON-LD and map queries. */
export const BUSINESS_ADDRESS_INLINE = [
  BUSINESS_ADDRESS.line1,
  BUSINESS_ADDRESS.line2,
  `${BUSINESS_ADDRESS.locality}, ${BUSINESS_ADDRESS.region} – ${BUSINESS_ADDRESS.postalCode}`,
  BUSINESS_ADDRESS.country,
].join(', ');

/** Multi-line address for card-style layouts (Footer, Contact "Find Us"). */
export const BUSINESS_ADDRESS_LINES = [
  BUSINESS_ADDRESS.line1,
  BUSINESS_ADDRESS.line2,
  `${BUSINESS_ADDRESS.locality}, ${BUSINESS_ADDRESS.region} – ${BUSINESS_ADDRESS.postalCode}`,
];

const mapQuery = BUSINESS_COORDS
  ? `${BUSINESS_COORDS.lat},${BUSINESS_COORDS.lng}`
  : encodeURIComponent(
      `${BUSINESS_ADDRESS.line1}, ${BUSINESS_ADDRESS.line2}, ${BUSINESS_ADDRESS.locality}, ${BUSINESS_ADDRESS.region} ${BUSINESS_ADDRESS.postalCode}, India`
    );

/** Opens Google Maps centered on the store — safe to use as a plain link. */
export const MAPS_VIEW_URL = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

/** Universal "Get Directions" deep link (opens the Maps app on mobile). */
export const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

/** No API key required — Google's classic keyless embeddable map iframe. */
export const MAPS_EMBED_URL = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

export const BUSINESS_HOURS = {
  weekdays: 'Monday - Saturday: 10AM - 8PM',
  sunday: 'Sunday: 11AM - 6PM',
};
