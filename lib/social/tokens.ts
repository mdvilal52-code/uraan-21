// Secure token storage for social platform OAuth tokens.
// Tokens are AES-256-GCM encrypted before being written to Supabase so they
// are opaque at rest. The encryption key is derived from SOCIAL_ENCRYPTION_KEY
// (env var); if absent we fall back to ADMIN_SESSION_SECRET.

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type Platform = 'youtube' | 'facebook' | 'instagram';

export interface PlatformToken {
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  pageId?: string;
  pageName?: string;
  username?: string;
  profileImage?: string;
  followers?: number;
  scopes?: string;
}

export interface ConnectedPlatform {
  platform: Platform;
  connected: boolean;
  pageName?: string;
  username?: string;
  profileImage?: string;
  followers?: number;
  expiresAt?: string;
  connectedAt?: string;
}

// ─── Encryption helpers (AES-256-GCM via Web Crypto) ───────────────────────

function encKey(): string {
  return (process.env.SOCIAL_ENCRYPTION_KEY || process.env.ADMIN_SESSION_SECRET || 'social-media-key-change-in-prod').slice(0, 32).padEnd(32, '0');
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret.slice(0, 32).padEnd(32, '0'));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await deriveKey(encKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const combined = new Uint8Array(iv.byteLength + enc.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(enc), iv.byteLength);
  return Buffer.from(combined).toString('base64');
}

export async function decryptToken(ciphertext: string): Promise<string> {
  const key = await deriveKey(encKey());
  const combined = Buffer.from(ciphertext, 'base64');
  const iv = combined.subarray(0, 12);
  const enc = combined.subarray(12);
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, enc);
  return new TextDecoder().decode(dec);
}

// ─── In-memory fallback (used when Supabase not configured) ────────────────

const memStore: Record<string, PlatformToken> = {};

// ─── Public API ────────────────────────────────────────────────────────────

export async function saveToken(t: PlatformToken): Promise<void> {
  if (!isSupabaseConfigured()) {
    memStore[t.platform] = t;
    return;
  }
  const db = getSupabase()!;
  const atEnc = await encryptToken(t.accessToken);
  const rtEnc = t.refreshToken ? await encryptToken(t.refreshToken) : null;
  await db.from('social_platform_tokens').upsert({
    platform: t.platform,
    access_token_enc: atEnc,
    refresh_token_enc: rtEnc,
    token_expires_at: t.expiresAt?.toISOString() ?? null,
    page_id: t.pageId ?? null,
    page_name: t.pageName ?? null,
    username: t.username ?? null,
    profile_image: t.profileImage ?? null,
    followers: t.followers ?? 0,
    scopes: t.scopes ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'platform' });
}

export async function getToken(platform: Platform): Promise<PlatformToken | null> {
  if (!isSupabaseConfigured()) {
    return memStore[platform] ?? null;
  }
  const db = getSupabase()!;
  const { data } = await db
    .from('social_platform_tokens')
    .select('*')
    .eq('platform', platform)
    .single();
  if (!data) return null;
  try {
    const accessToken = await decryptToken(data.access_token_enc);
    const refreshToken = data.refresh_token_enc ? await decryptToken(data.refresh_token_enc) : undefined;
    return {
      platform,
      accessToken,
      refreshToken,
      expiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
      pageId: data.page_id ?? undefined,
      pageName: data.page_name ?? undefined,
      username: data.username ?? undefined,
      profileImage: data.profile_image ?? undefined,
      followers: data.followers ?? 0,
      scopes: data.scopes ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function deleteToken(platform: Platform): Promise<void> {
  if (!isSupabaseConfigured()) {
    delete memStore[platform];
    return;
  }
  const db = getSupabase()!;
  await db.from('social_platform_tokens').delete().eq('platform', platform);
}

export async function isConnected(platform: Platform): Promise<boolean> {
  const t = await getToken(platform);
  return t !== null;
}

export async function getAllConnected(): Promise<ConnectedPlatform[]> {
  const platforms: Platform[] = ['youtube', 'facebook', 'instagram'];
  if (!isSupabaseConfigured()) {
    return platforms.map((p) => {
      const t = memStore[p];
      return {
        platform: p,
        connected: !!t,
        pageName: t?.pageName,
        username: t?.username,
        profileImage: t?.profileImage,
        followers: t?.followers,
        expiresAt: t?.expiresAt?.toISOString(),
      };
    });
  }
  const db = getSupabase()!;
  const { data } = await db
    .from('social_platform_tokens')
    .select('platform,page_name,username,profile_image,followers,token_expires_at,connected_at');
  const rows = data ?? [];
  return platforms.map((p) => {
    const row = rows.find((r: { platform: string }) => r.platform === p);
    return {
      platform: p,
      connected: !!row,
      pageName: row?.page_name ?? undefined,
      username: row?.username ?? undefined,
      profileImage: row?.profile_image ?? undefined,
      followers: row?.followers ?? 0,
      expiresAt: row?.token_expires_at ?? undefined,
      connectedAt: row?.connected_at ?? undefined,
    };
  });
}

export function isTokenExpired(t: PlatformToken): boolean {
  if (!t.expiresAt) return false;
  return t.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;
}
