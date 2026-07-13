import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetPostBySlug } from '@/lib/blogDb';
import { isAdminRequest } from '@/lib/adminApi';

// GET → a single post by slug (public — but drafts are 404 for non-admins).
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  }
  const slug = decodeURIComponent(params.slug || '');
  const post = await dbGetPostBySlug(slug);
  if (!post) {
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  }
  if (!post.published && !(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, post });
}
