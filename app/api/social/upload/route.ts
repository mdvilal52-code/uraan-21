// Handles video uploads to Supabase Storage and creates a social_media record.
// Returns the media ID + public URL for use in the publish step.

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 500 MB limit' }, { status: 413 });
    }
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported format: ${file.type}` }, { status: 415 });
    }

    const ext = file.name.split('.').pop() ?? 'mp4';
    const storagePath = `social-videos/${crypto.randomUUID()}.${ext}`;

    if (!isSupabaseConfigured()) {
      // Dev fallback: return a mock response so UI works without Supabase
      const mockId = crypto.randomUUID();
      return NextResponse.json({
        mediaId: mockId,
        url: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
    }

    const db = getSupabase()!;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await db.storage
      .from('social-videos')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = db.storage.from('social-videos').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const { data: media, error: dbErr } = await db
      .from('social_media')
      .insert({
        file_name: file.name,
        storage_path: storagePath,
        public_url: publicUrl,
        mime_type: file.type,
        file_size: file.size,
      })
      .select('id')
      .single();

    if (dbErr) throw new Error(dbErr.message);

    return NextResponse.json({
      mediaId: media.id,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    console.error('[social/upload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
