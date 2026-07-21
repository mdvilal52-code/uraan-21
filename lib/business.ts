// Single source of truth for the store's business identity and physical
// address — used by the Footer, Contact page, About page, admin Settings,
// email templates and the site-wide LocalBusiness structured data. Override
// any field with the matching NEXT_PUBLIC_BUSINESS_* env var to relocate the
// store without touching component code.
export const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Om Gauri Pooja Gems Jewellery & Rudraksh';

export const BUSINESS_ADDRESS = {
  line1: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE1 || 'Shop No. Ground Floor of Prop No. 2, KH No. 56/12/1 and 56/19',
  line2: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS_LINE2 || 'Block C-1, Shyam Colony, Budh Vihar Phase-2, Near Citizen Public School',
  locality: process.env.NEXT_PUBLIC_BUSINESS_CITY || 'Delhi',
  region: process.env.NEXT_PUBLIC_BUSINESS_STATE || 'Delhi',
  postalCode: process.env.NEXT_PUBLIC_BUSINESS_PINCODE || '110086',
  country: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY || 'India',
  countryCode: process.env.NEXT_PUBLIC_BUSINESS_COUNTRY_CODE || 'IN',
};

// Pinning the store's verified exact GPS coordinates sidesteps text-address
// geocoding ambiguity — override with the matching env vars if the store
// ever relocates.
export const BUSINESS_LAT = process.env.NEXT_PUBLIC_BUSINESS_LAT || '28.71548864683306';
export const BUSINESS_LNG = process.env.NEXT_PUBLIC_BUSINESS_LNG || '77.08962878652694';
export const BUSINESS_COORDS = { lat: BUSINESS_LAT, lng: BUSINESS_LNG };

/** Single-line address, e.g. for <address>, JSON-LD and map queries. */
export const BUSINESS_ADDRESS_INLINE = [
  BUSINESS_ADDRESS.line1,
  BUSINESS_ADDRESS.line2,
  `${BUSINESS_ADDRESS.region} – ${BUSINESS_ADDRESS.postalCode}`,
  BUSINESS_ADDRESS.country,
].join(', ');

/** Multi-line address for card-style layouts (Footer, Contact "Find Us"). */
export const BUSINESS_ADDRESS_LINES = [
  BUSINESS_ADDRESS.line1,
  BUSINESS_ADDRESS.line2,
  `${BUSINESS_ADDRESS.region} – ${BUSINESS_ADDRESS.postalCode}`,
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
