// Browser-persisted banner store (localStorage), so the admin panel's banner
// add / edit / delete / show-hide survive a refresh without a backend — the
// same demo-friendly pattern used by lib/leads.ts.

export type BannerPosition = 'hero' | 'middle' | 'footer';

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  position: BannerPosition;
  active: boolean;
};

const KEY = 'ogp_banners';

export const seedBanners: Banner[] = [
  { id: 'B001', title: 'Festive Collection 2026', subtitle: 'Up to 40% off on selected items', image: '/images/banner.jpg', ctaText: 'Shop Now', ctaLink: '/collections', position: 'hero', active: true },
  { id: 'B002', title: 'Bridal Special', subtitle: 'Heirloom pieces for your sacred day', image: '/images/bridal-set.jpg', ctaText: 'Explore Bridal', ctaLink: '/collections?type=bridal', position: 'middle', active: true },
  { id: 'B003', title: 'Sacred Rudraksh', subtitle: 'Authentic certified beads', image: '/images/luxury-bg.jpg', ctaText: 'Discover', ctaLink: '/collections?type=rudraksh', position: 'middle', active: false },
];

function read(): Banner[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Banner[]) : null;
  } catch {
    return null;
  }
}

function write(list: Banner[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function nextId(list: Banner[]): string {
  const max = list.reduce((m, b) => {
    const n = parseInt(b.id.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return 'B' + String(max + 1).padStart(3, '0');
}

export function getBanners(): Banner[] {
  const stored = read();
  if (stored) return stored;
  write(seedBanners);
  return seedBanners;
}

export type BannerInput = Omit<Banner, 'id'>;

export function addBanner(input: BannerInput): Banner {
  const list = getBanners();
  const banner: Banner = { id: nextId(list), ...input };
  write([...list, banner]);
  return banner;
}

export function updateBanner(id: string, patch: Partial<Omit<Banner, 'id'>>): void {
  write(getBanners().map((b) => (b.id === id ? { ...b, ...patch } : b)));
}

export function toggleBanner(id: string): void {
  write(getBanners().map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
}

export function deleteBanner(id: string): void {
  write(getBanners().filter((b) => b.id !== id));
}
