import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminApi';

const BUCKET = 'product-images';
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// POST (multipart form-data, field "file") → uploads an image to Supabase
// Storage and returns its public URL. Admin only.
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Connect Supabase (and create a public "product-images" bucket) to upload images.' },
      { status: 400 }
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get('file');
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload.' }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ ok: false, error: 'No file provided.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ ok: false, error: 'Image is too large (max 5 MB).' }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' },
      { status: 400 }
    );
  }

  const sb = getSupabase()!;
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[upload]', error.message);
    return NextResponse.json(
      { ok: false, error: `Upload failed: ${error.message}. Is the "${BUCKET}" bucket created and public?` },
      { status: 502 }
    );
  }

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
