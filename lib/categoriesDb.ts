// Server-side category persistence (Supabase). Returns null / false when the DB
// is not configured (or the table is missing) so callers fall back to the
// in-browser store. Mirrors lib/leadsDb.ts.
import { getSupabase } from './supabase';
import type { Category } from './categories';
import { fallbackCategoryImage } from './categoryStyles';

type Row = {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  count: number | null;
};

function toCategory(r: Row): Category {
  return {
    slug: r.slug,
    name: r.name,
    description: r.description || '',
    image: r.image || fallbackCategoryImage(r.name),
    count: r.count ?? 0,
  };
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function dbGetCategories(): Promise<Category[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('categories').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[categoriesDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toCategory);
}

export async function dbInsertCategory(input: { name: string; description?: string; image?: string }): Promise<Category | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const base = slugify(input.name) || 'category';
  const { data: existing } = await sb.from('categories').select('slug');
  const taken = new Set((existing as { slug: string }[] | null)?.map((r) => r.slug) || []);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;

  const { data, error } = await sb
    .from('categories')
    .insert({
      slug,
      name: input.name.trim() || 'Untitled',
      description: input.description?.trim() || null,
      image: input.image?.trim() || fallbackCategoryImage(input.name.trim() || base),
      count: 0,
    })
    .select()
    .single();
  if (error) {
    console.error('[categoriesDb] insert:', error.message);
    return null;
  }
  return toCategory(data as Row);
}

export async function dbUpdateCategory(slug: string, patch: Partial<Category>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description || null;
  if (patch.image !== undefined) row.image = patch.image || null;
  if (patch.count !== undefined) row.count = patch.count;
  const { error } = await sb.from('categories').update(row).eq('slug', slug);
  if (error) {
    console.error('[categoriesDb] update:', error.message);
    return false;
  }
  return true;
}

export async function dbDeleteCategory(slug: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('categories').delete().eq('slug', slug);
  if (error) {
    console.error('[categoriesDb] delete:', error.message);
    return false;
  }
  return true;
}
