import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetPosts, dbGetPublishedPosts, dbInsertPost } from '@/lib/blogDb';
import { isAdminRequest } from '@/lib/adminApi';
import type { BlogPostInput } from '@/lib/blog';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';

// GET → list posts. Public visitors only ever see published posts; an admin
// session sees everything (including drafts) so the admin list can manage them.
export async function GET() {
  const admin = await isAdminRequest();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, posts: [] });
  }
  const posts = admin ? await dbGetPosts() : await dbGetPublishedPosts();
  return NextResponse.json({ ok: true, configured: true, posts: posts || [] });
}

// POST → create a blog post (admin only).
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  if (!title || !content) {
    return NextResponse.json({ ok: false, error: 'Title and content are required.' }, { status: 400 });
  }

  const slug = String(body.slug || '').trim();
  const excerpt = String(body.excerpt || '').trim();
  const coverImage = String(body.coverImage || '').trim();
  const seoTitle = String(body.seoTitle || '').trim();
  const seoDescription = String(body.seoDescription || '').trim();
  const author = String(body.author || '').trim();

  const lengthError = checkLengths({
    Title: { value: title, max: MAX_LEN.short },
    Slug: { value: slug, max: MAX_LEN.short },
    Excerpt: { value: excerpt, max: MAX_LEN.text },
    Content: { value: content, max: MAX_LEN.text },
    'Cover image': { value: coverImage, max: MAX_LEN.url },
    'SEO title': { value: seoTitle, max: MAX_LEN.short },
    'SEO description': { value: seoDescription, max: MAX_LEN.text },
    Author: { value: author, max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const input: BlogPostInput = {
    title,
    slug: slug || undefined,
    excerpt: excerpt || undefined,
    content,
    coverImage: coverImage || undefined,
    seoTitle: seoTitle || undefined,
    seoDescription: seoDescription || undefined,
    published: Boolean(body.published),
    author: author || undefined,
  };
  const post = await dbInsertPost(input);
  if (!post) {
    return NextResponse.json({ ok: false, error: 'Could not save post.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, configured: true, post });
}
