import { NextResponse } from 'next/server';
import { dbGetPostById, dbUpdatePost, dbDeletePost } from '@/lib/blogDb';
import { isAdminRequest } from '@/lib/adminApi';
import type { BlogPost } from '@/lib/blog';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';

// GET → one post by id, including drafts (admin only — used by the edit form).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const post = await dbGetPostById(params.id);
  if (!post) {
    return NextResponse.json({ ok: false, error: 'Post not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, post });
}

// PATCH → edit a post (admin only).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const patch: Partial<BlogPost> = {};
  if (body.title !== undefined) patch.title = String(body.title).trim();
  if (body.slug !== undefined) patch.slug = String(body.slug).trim();
  if (body.excerpt !== undefined) patch.excerpt = String(body.excerpt).trim() || undefined;
  if (body.content !== undefined) patch.content = String(body.content);
  if (body.coverImage !== undefined) patch.coverImage = String(body.coverImage).trim() || undefined;
  if (body.seoTitle !== undefined) patch.seoTitle = String(body.seoTitle).trim() || undefined;
  if (body.seoDescription !== undefined) patch.seoDescription = String(body.seoDescription).trim() || undefined;
  if (body.author !== undefined) patch.author = String(body.author).trim() || undefined;
  if (body.published !== undefined) patch.published = Boolean(body.published);

  const lengthError = checkLengths({
    Title: { value: patch.title ?? '', max: MAX_LEN.short },
    Slug: { value: patch.slug ?? '', max: MAX_LEN.short },
    Excerpt: { value: patch.excerpt ?? '', max: MAX_LEN.text },
    Content: { value: patch.content ?? '', max: MAX_LEN.text },
    'Cover image': { value: patch.coverImage ?? '', max: MAX_LEN.url },
    'SEO title': { value: patch.seoTitle ?? '', max: MAX_LEN.short },
    'SEO description': { value: patch.seoDescription ?? '', max: MAX_LEN.text },
    Author: { value: patch.author ?? '', max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const ok = await dbUpdatePost(params.id, patch);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update post.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a post (admin only).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbDeletePost(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete post.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
