-- ============================================================
-- Social Media Publishing System — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- 1. Platform OAuth tokens (encrypted at rest)
-- ──────────────────────────────────────────────────────────
create table if not exists social_platform_tokens (
  id               uuid primary key default gen_random_uuid(),
  platform         text not null check (platform in ('youtube','facebook','instagram')),
  access_token_enc text not null,         -- AES-encrypted in app layer
  refresh_token_enc text,                 -- nullable (Instagram has no refresh)
  token_expires_at  timestamptz,
  page_id          text,                  -- Facebook page id / YT channel id
  page_name        text,
  username         text,
  profile_image    text,
  followers        bigint default 0,
  scopes           text,
  connected_at     timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(platform)
);

-- ──────────────────────────────────────────────────────────
-- 2. Media Library (uploaded videos)
-- ──────────────────────────────────────────────────────────
create table if not exists social_media (
  id            uuid primary key default gen_random_uuid(),
  file_name     text not null,
  storage_path  text not null,
  public_url    text not null,
  mime_type     text not null default 'video/mp4',
  file_size     bigint,
  duration_sec  int,
  width         int,
  height        int,
  thumbnail_url text,
  created_at    timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- 3. Social posts (publish jobs)
-- ──────────────────────────────────────────────────────────
create table if not exists social_posts (
  id              uuid primary key default gen_random_uuid(),
  media_id        uuid references social_media(id) on delete set null,
  title           text,
  caption         text,
  hashtags        text[],
  thumbnail_url   text,

  -- per-platform status & IDs
  yt_status       text not null default 'pending' check (yt_status   in ('pending','uploading','published','failed','skipped','scheduled')),
  yt_video_id     text,
  yt_url          text,
  yt_error        text,
  yt_retries      int  not null default 0,

  fb_status       text not null default 'pending' check (fb_status   in ('pending','uploading','published','failed','skipped','scheduled')),
  fb_post_id      text,
  fb_url          text,
  fb_error        text,
  fb_retries      int  not null default 0,

  ig_status       text not null default 'pending' check (ig_status   in ('pending','uploading','published','failed','skipped','scheduled')),
  ig_media_id     text,
  ig_url          text,
  ig_error        text,
  ig_retries      int  not null default 0,

  -- YouTube-specific
  yt_category_id  text  default '22',
  yt_visibility   text  default 'public',
  yt_tags         text[],
  yt_is_shorts    boolean default false,
  yt_made_for_kids boolean default false,

  -- scheduling
  publish_mode    text  not null default 'now' check (publish_mode in ('now','scheduled','draft')),
  scheduled_at    timestamptz,
  timezone        text  default 'Asia/Kolkata',

  -- platforms selected
  platforms       text[] not null default '{}',

  created_at      timestamptz default now(),
  published_at    timestamptz
);

-- ──────────────────────────────────────────────────────────
-- 4. Publish logs (audit trail per attempt)
-- ──────────────────────────────────────────────────────────
create table if not exists social_publish_logs (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references social_posts(id) on delete cascade,
  platform   text not null,
  attempt    int  not null default 1,
  status     text not null,
  message    text,
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────
create index if not exists idx_social_posts_created  on social_posts(created_at desc);
create index if not exists idx_social_posts_yt_status on social_posts(yt_status);
create index if not exists idx_social_posts_fb_status on social_posts(fb_status);
create index if not exists idx_social_posts_ig_status on social_posts(ig_status);
create index if not exists idx_social_logs_post on social_publish_logs(post_id);

-- ──────────────────────────────────────────────────────────
-- RLS (disable for service-role, only public browsing blocked)
-- ──────────────────────────────────────────────────────────
alter table social_platform_tokens enable row level security;
alter table social_media           enable row level security;
alter table social_posts           enable row level security;
alter table social_publish_logs    enable row level security;

-- All tables are accessed only via the service role key (server-side).
-- No public/anon access is ever needed.
create policy "service role only" on social_platform_tokens for all using (false);
create policy "service role only" on social_media           for all using (false);
create policy "service role only" on social_posts           for all using (false);
create policy "service role only" on social_publish_logs    for all using (false);

-- ──────────────────────────────────────────────────────────
-- Storage bucket for video uploads
-- ──────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → Create bucket named "social-videos"
-- Settings: Private bucket, 500MB max file size
-- ============================================================
