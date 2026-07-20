// Shared per-category icon and colour theme used by the homepage
// category grid and the mobile navigation menu.

import {
  Crown, Sparkles, Diamond, Gem, Flower2, Link2,
  Sparkle, Circle, CircleDot, Watch, Hexagon, Heart,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, typeof Crown> = {
  gold: Crown,
  silver: Sparkles,
  diamond: Diamond,
  gems: Gem,
  rudraksh: Flower2,
  necklaces: Link2,
  earrings: Sparkle,
  rings: Circle,
  bangles: CircleDot,
  bracelets: Watch,
  pendants: Hexagon,
  bridal: Heart,
};

export const CATEGORY_THEME: Record<string, { bg: string; text: string }> = {
  gold: { bg: '#FBF1DD', text: '#A6790C' },
  silver: { bg: '#F0F1F3', text: '#6B7280' },
  diamond: { bg: '#E5F0FB', text: '#3D6FA8' },
  gems: { bg: '#F1E9FB', text: '#8856D6' },
  rudraksh: { bg: '#FBE6D8', text: '#BD6B36' },
  necklaces: { bg: '#E3F5EC', text: '#3E9C73' },
  earrings: { bg: '#FCE7F0', text: '#C24A82' },
  rings: { bg: '#FBF3D2', text: '#C99A1C' },
  bangles: { bg: '#E3EEFB', text: '#3D6FCB' },
  bracelets: { bg: '#FCE9DA', text: '#D4773A' },
  pendants: { bg: '#F0E7FB', text: '#9356D9' },
  bridal: { bg: '#E0F5EE', text: '#3CA088' },
};

// Centralized per-category image URLs. Each category has its own distinct,
// relevant jewelry image so the homepage grid and admin panel display unique
// visuals, preventing the duplication bug where all categories showed the same
// placeholder. Images sourced from Unsplash for high quality and licensing.
export const CATEGORY_IMAGES: Record<string, string> = {
  gold: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500&h=600&fit=crop',
  silver: 'https://images.unsplash.com/photo-1744822220368-c380740bfc7f?w=500&h=600&fit=crop',
  diamond: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop',
  gems: 'https://images.unsplash.com/photo-1727784892009-f3cf06199b65?w=500&h=600&fit=crop',
  rudraksh: 'https://images.unsplash.com/photo-1622993361118-b6365d859ab6?w=500&h=600&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1676329945867-01c9975aa9d1?w=500&h=600&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=500&h=600&fit=crop',
  rings: 'https://images.unsplash.com/photo-1629118639934-2b241503956c?w=500&h=600&fit=crop',
  bangles: 'https://images.unsplash.com/photo-1611107683227-e9060eccd846?w=500&h=600&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1676291055501-286c48bb186f?w=500&h=600&fit=crop',
  pendants: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=500&h=600&fit=crop',
  bridal: 'https://images.unsplash.com/photo-1600685890506-593fdf55949b?w=500&h=600&fit=crop',
};

// Fallback pool for a brand-new admin-created category that has no uploaded
// photo yet. Picked deterministically from the category's own name so two
// different categories don't default to the exact same picture (the bug
// this replaces: every category with no image fell back to the identical
// hardcoded '/images/necklace.jpg').
export const FALLBACK_IMAGE_POOL = [
  '/images/gallery/necklace-3.jpg',
  '/images/gallery/necklace-5.jpg',
  '/images/gallery/necklace-7.jpg',
  '/images/gallery/ring-3.jpg',
  '/images/gallery/ring-4.jpg',
  '/images/gallery/ring-6.jpg',
  '/images/gallery/ring-7.jpg',
  '/images/gallery/ring-8.jpg',
  '/images/gallery/earrings-1.jpg',
  '/images/gallery/earrings-2.jpg',
  '/images/gallery/earrings-3.jpg',
  '/images/gallery/earrings-5.jpg',
  '/images/gallery/bracelet-2.jpg',
  '/images/gallery/bracelet-4.jpg',
  '/images/gallery/lifestyle-1.jpg',
];

export function fallbackCategoryImage(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK_IMAGE_POOL[hash % FALLBACK_IMAGE_POOL.length];
}
