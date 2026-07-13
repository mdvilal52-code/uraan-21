// Server-side blog persistence (Supabase). Returns null / false when the DB is
// not configured so callers can fall back to the in-browser store.
import { getSupabase } from './supabase';
import type { BlogPost, BlogPostInput } from './blog';
import { slugify } from './categories';

type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean;
  author: string | null;
  created_at: string;
  updated_at: string;
};

function toPost(r: Row): BlogPost {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt || undefined,
    content: r.content,
    coverImage: r.cover_image || undefined,
    seoTitle: r.seo_title || undefined,
    seoDescription: r.seo_description || undefined,
    published: Boolean(r.published),
    author: r.author || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function dbGetPosts(): Promise<BlogPost[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[blogDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toPost);
}

export async function dbGetPublishedPosts(): Promise<BlogPost[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[blogDb] listPublished:', error.message);
    return null;
  }
  return (data as Row[]).map(toPost);
}

export async function dbGetPostBySlug(slug: string): Promise<BlogPost | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('blog_posts').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    console.error('[blogDb] bySlug:', error.message);
    return null;
  }
  if (!data) return null;
  return toPost(data as Row);
}

export async function dbGetPostById(id: string): Promise<BlogPost | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('blog_posts').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[blogDb] byId:', error.message);
    return null;
  }
  if (!data) return null;
  return toPost(data as Row);
}

async function uniqueSlug(sb: NonNullable<ReturnType<typeof getSupabase>>, base: string, skipId?: string): Promise<string> {
  let slug = base || 'post';
  let n = 2;
  // Small catalogue (a blog), so a loop of exact-match checks is fine.
  for (;;) {
    const { data } = await sb.from('blog_posts').select('id').eq('slug', slug).maybeSingle();
    if (!data || data.id === skipId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function dbInsertPost(input: BlogPostInput): Promise<BlogPost | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = 'BP' + Date.now().toString(36).toUpperCase();
  const slug = await uniqueSlug(sb, slugify(input.slug?.trim() || input.title));
  const { data, error } = await sb
    .from('blog_posts')
    .insert({
      id,
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim() || null,
      content: input.content,
      cover_image: input.coverImage?.trim() || null,
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
      published: Boolean(input.published),
      author: input.author?.trim() || null,
    })
    .select()
    .single();
  if (error) {
    console.error('[blogDb] insert:', error.message);
    return null;
  }
  return toPost(data as Row);
}

export async function dbUpdatePost(id: string, patch: Partial<BlogPost>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.slug !== undefined) row.slug = await uniqueSlug(sb, slugify(patch.slug), id);
  if (patch.excerpt !== undefined) row.excerpt = patch.excerpt || null;
  if (patch.content !== undefined) row.content = patch.content;
  if (patch.coverImage !== undefined) row.cover_image = patch.coverImage || null;
  if (patch.seoTitle !== undefined) row.seo_title = patch.seoTitle || null;
  if (patch.seoDescription !== undefined) row.seo_description = patch.seoDescription || null;
  if (patch.published !== undefined) row.published = patch.published;
  if (patch.author !== undefined) row.author = patch.author || null;
  row.updated_at = new Date().toISOString();

  const { error } = await sb.from('blog_posts').update(row).eq('id', id);
  if (error) {
    console.error('[blogDb] update:', error.message);
    return false;
  }
  return true;
}

export async function dbDeletePost(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('[blogDb] delete:', error.message);
    return false;
  }
  return true;
}
