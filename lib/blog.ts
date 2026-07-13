// Browser-persisted blog-post store (localStorage) — mirrors lib/coupons.ts so
// the admin panel works without a backend. No compelling seed content exists
// for a jewellery blog demo, so it starts empty.
import { slugify } from '@/lib/categories';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  author?: string;
  createdAt: string;
  updatedAt: string;
};

export { slugify };

const KEY = 'ogp_blog_posts';

const seedPosts: BlogPost[] = [];

function read(): BlogPost[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BlogPost[]) : null;
  } catch {
    return null;
  }
}

function write(list: BlogPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getPosts(): BlogPost[] {
  const stored = read();
  if (stored) return stored;
  write(seedPosts);
  return seedPosts;
}

export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  published?: boolean;
  author?: string;
};

function uniqueSlug(base: string, existing: BlogPost[], skipId?: string): string {
  let slug = base || 'post';
  let n = 2;
  while (existing.some((p) => p.slug === slug && p.id !== skipId)) slug = `${base}-${n++}`;
  return slug;
}

export function addPost(input: BlogPostInput): BlogPost {
  const list = getPosts();
  const title = input.title.trim() || 'Untitled';
  const now = new Date().toISOString();
  const post: BlogPost = {
    id: 'BP' + Date.now().toString(36).toUpperCase(),
    title,
    slug: uniqueSlug(slugify(input.slug?.trim() || title), list),
    excerpt: input.excerpt?.trim() || undefined,
    content: input.content,
    coverImage: input.coverImage?.trim() || undefined,
    seoTitle: input.seoTitle?.trim() || undefined,
    seoDescription: input.seoDescription?.trim() || undefined,
    published: Boolean(input.published),
    author: input.author?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  write([post, ...list]);
  return post;
}

export function updatePost(id: string, patch: Partial<Omit<BlogPost, 'id'>>): void {
  const list = getPosts();
  write(
    list.map((p) =>
      p.id === id
        ? {
            ...p,
            ...patch,
            slug: patch.slug ? uniqueSlug(slugify(patch.slug), list, id) : p.slug,
            updatedAt: new Date().toISOString(),
          }
        : p
    )
  );
}

export function deletePost(id: string): void {
  write(getPosts().filter((p) => p.id !== id));
}
