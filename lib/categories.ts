// Browser-persisted category store. Mirrors lib/leads.ts: categories live in
// localStorage so the admin panel's full add / edit / delete works without a
// backend, seeded from the bundled catalogue on first use.
import { categories as seedCategories, type Category } from '@/data/jewelleryData';
import { fallbackCategoryImage } from './categoryStyles';

export type { Category };

const KEY = 'ogp_categories';

function read(): Category[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Category[]) : null;
  } catch {
    return null;
  }
}

function write(list: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or unavailable — ignore in this demo */
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** All categories. Seeds the bundled catalogue on first use. */
export function getCategories(): Category[] {
  const stored = read();
  if (stored) return stored;
  write(seedCategories);
  return seedCategories;
}

export function addCategory(input: { name: string; description?: string; image?: string }): Category {
  const name = input.name.trim() || 'Untitled';
  const base = slugify(name) || 'category';
  const existing = getCategories();
  let slug = base;
  let n = 2;
  while (existing.some((c) => c.slug === slug)) slug = `${base}-${n++}`;

  const category: Category = {
    slug,
    name,
    description: input.description?.trim() || '',
    image: input.image?.trim() || fallbackCategoryImage(name),
    count: 0,
  };
  write([...existing, category]);
  return category;
}

export function updateCategory(slug: string, patch: Partial<Omit<Category, 'slug'>>): void {
  write(getCategories().map((c) => (c.slug === slug ? { ...c, ...patch } : c)));
}

export function deleteCategory(slug: string): void {
  write(getCategories().filter((c) => c.slug !== slug));
}
