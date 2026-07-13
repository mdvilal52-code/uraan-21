// Server-side banner persistence (Supabase). Returns null / false when the DB
// is not configured (or the table is missing) so callers fall back to the
// in-browser store. Mirrors lib/leadsDb.ts.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import type { Banner, BannerPosition, BannerInput } from './banners';

// Same bucket app/api/upload/route.ts uploads banner/product images into.
const STORAGE_BUCKET = 'product-images';

// Supabase public Storage URLs look like
// https://<project>.supabase.co/storage/v1/object/public/product-images/<path>
// — pull out the <path> so it can be passed to storage.remove(). Returns null
// for anything that isn't a URL into our own bucket (e.g. a manually-typed
// external image URL), so those are correctly left alone.
function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length);
  return path || null;
}

// Best-effort Storage cleanup: logs on failure but never throws, since the DB
// row change (insert/update/delete) succeeding is what matters most.
async function deleteStorageObject(sb: SupabaseClient, imageUrl: string | null | undefined): Promise<void> {
  const path = storagePathFromUrl(imageUrl);
  if (!path) return;
  const { error } = await sb.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.error('[bannersDb] storage cleanup:', error.message);
  }
}

type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  cta_text: string | null;
  cta_link: string | null;
  position: string;
  active: boolean;
};

function toBanner(r: Row): Banner {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle || '',
    image: r.image || '',
    ctaText: r.cta_text || '',
    ctaLink: r.cta_link || '',
    position: (['hero', 'middle', 'footer'].includes(r.position) ? r.position : 'hero') as BannerPosition,
    active: r.active,
  };
}

export async function dbGetBanners(): Promise<Banner[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('banners').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[bannersDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toBanner);
}

export async function dbInsertBanner(input: BannerInput): Promise<Banner | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = 'B' + Date.now().toString(36).toUpperCase();
  const { data, error } = await sb
    .from('banners')
    .insert({
      id,
      title: input.title,
      subtitle: input.subtitle || null,
      image: input.image || null,
      cta_text: input.ctaText || null,
      cta_link: input.ctaLink || null,
      position: input.position,
      active: input.active,
    })
    .select()
    .single();
  if (error) {
    console.error('[bannersDb] insert:', error.message);
    return null;
  }
  return toBanner(data as Row);
}

export async function dbUpdateBanner(id: string, patch: Partial<Banner>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle || null;
  if (patch.image !== undefined) row.image = patch.image || null;
  if (patch.ctaText !== undefined) row.cta_text = patch.ctaText || null;
  if (patch.ctaLink !== undefined) row.cta_link = patch.ctaLink || null;
  if (patch.position !== undefined) row.position = patch.position;
  if (patch.active !== undefined) row.active = patch.active;

  // When the image is being replaced, grab the current URL first so the
  // Storage object it points at (if any — /api/upload always writes a new
  // randomized path, so a replaced image is otherwise orphaned) can be
  // cleaned up once the update succeeds.
  let previousImage: string | null | undefined;
  if (patch.image !== undefined) {
    const { data } = await sb.from('banners').select('image').eq('id', id).maybeSingle();
    previousImage = (data as { image: string | null } | null)?.image;
  }

  const { error } = await sb.from('banners').update(row).eq('id', id);
  if (error) {
    console.error('[bannersDb] update:', error.message);
    return false;
  }

  if (patch.image !== undefined && previousImage && previousImage !== patch.image) {
    await deleteStorageObject(sb, previousImage);
  }

  return true;
}

export async function dbDeleteBanner(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  // .select() after .delete() returns the deleted row (Postgres RETURNING),
  // so the banner's image URL is available for Storage cleanup without a
  // separate round-trip.
  const { data, error } = await sb.from('banners').delete().eq('id', id).select('image');
  if (error) {
    console.error('[bannersDb] delete:', error.message);
    return false;
  }
  const deletedImage = (data as { image: string | null }[] | null)?.[0]?.image;
  // Best-effort: the DB row is already gone at this point either way, so a
  // Storage failure here is logged but doesn't flip the result to false.
  await deleteStorageObject(sb, deletedImage);
  return true;
}
