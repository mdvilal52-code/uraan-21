-- Om Gauri Putra — database schema
-- Run this once in Supabase → SQL Editor (New query → paste → Run).
-- After running, add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your
-- environment variables and the admin panel starts using the database.

-- ── Leads (CRM) ────────────────────────────────────────────────────────
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text,
  source      text not null default 'Website',
  status      text not null default 'New',
  created_at  timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ── Orders ─────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id          text primary key,                 -- e.g. OGP12345678
  customer    text not null,
  email       text,
  phone       text,
  amount      integer not null default 0,        -- in rupees
  items       jsonb not null default '[]'::jsonb,
  item_count  integer not null default 0,
  status      text not null default 'Processing',
  payment     text,
  payment_id  text,                              -- Razorpay payment id (if paid online)
  paid        boolean not null default false,
  address     text,
  created_at  timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
-- If you ran an earlier version of this file, add the new columns with:
--   alter table public.orders add column if not exists payment_id text;
--   alter table public.orders add column if not exists paid boolean not null default false;

-- ── Products (for the upcoming catalogue migration) ────────────────────
create table if not exists public.products (
  id                  text primary key,
  name                text not null,
  slug                text unique,
  category            text,
  price               integer not null default 0,
  old_price           integer,
  image               text,
  images              jsonb not null default '[]'::jsonb,
  description         text,
  material            text,
  weight              text,
  purity              text,
  tag                 text,
  in_stock            boolean not null default true,
  rating              numeric default 5,
  review_count        integer default 0,
  created_at          timestamptz not null default now(),
  -- Extended columns (also added via ALTER TABLE below for existing deployments)
  stock_quantity      integer not null default 0,
  low_stock_threshold integer not null default 5,
  alt_texts           jsonb not null default '[]'::jsonb,
  variants            jsonb not null default '[]'::jsonb,
  seo_title           text,
  seo_description     text,
  making_charge       numeric,
  use_dynamic_pricing boolean not null default false,
  sku                 text,
  barcode             text,
  status              text not null default 'published',
  featured            boolean not null default false,
  trending            boolean not null default false,
  deleted_at          timestamptz
);

-- Row Level Security: the app talks to the database only through the
-- server-side service-role key (which bypasses RLS), so we keep RLS enabled
-- and add no public policies. Nothing is readable/writable from the browser.
alter table public.leads    enable row level security;
alter table public.orders   enable row level security;
alter table public.products enable row level security;

-- ── Categories ─────────────────────────────────────────────────────────
create table if not exists public.categories (
  slug        text primary key,
  name        text not null,
  description text,
  image       text,
  count       integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.categories (slug, name, description, image, count) values
  ('gold','Gold Jewellery','916 Hallmarked Gold','/images/gallery/necklace-1.jpg',124),
  ('silver','Silver Jewellery','92.5% Pure Silver','/images/gallery/necklace-2.jpg',98),
  ('diamond','Diamond','Certified Diamonds','/images/gallery/ring-5.jpg',56),
  ('gems','Precious Gems','Ruby, Emerald, Sapphire','/images/gallery/ring-2.jpg',42),
  ('rudraksh','Rudraksh','1 to 21 Mukhi Certified','/images/gallery/rudraksh-1.jpg',38),
  ('necklaces','Necklaces','Statement & Daily Wear','/images/gallery/necklace-4.jpg',87),
  ('earrings','Earrings','Jhumkas, Studs, Chandbalis','/images/gallery/earrings-4.jpg',112),
  ('rings','Rings','Engagement & Cocktail','/images/gallery/ring-1.jpg',64),
  ('bangles','Bangles','Traditional & Modern','/images/gallery/bracelet-3.jpg',78),
  ('bracelets','Bracelets','Chain & Charm','/images/gallery/bracelet-1.jpg',45),
  ('pendants','Pendants','Religious & Designer','/images/gallery/necklace-6.jpg',52),
  ('bridal','Bridal Sets','Complete Bridal','/images/gallery/necklace-8.jpg',28)
on conflict (slug) do nothing;

-- ── Coupons ────────────────────────────────────────────────────────────
create table if not exists public.coupons (
  id          text primary key,
  code        text not null,
  type        text not null default 'percent',     -- 'percent' | 'flat'
  value       integer not null default 0,
  min_order   integer not null default 0,
  usage_limit integer not null default 0,
  used        integer not null default 0,
  valid_until text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.coupons (id, code, type, value, min_order, usage_limit, used, valid_until, active) values
  ('CP001','WELCOME10','percent',10,999,1000,245,'31 Dec 2026',true),
  ('CP002','FESTIVE25','percent',25,4999,500,78,'15 Nov 2026',true),
  ('CP003','FLAT500','flat',500,2499,200,56,'30 Jun 2026',true),
  ('CP004','SUMMER15','percent',15,1999,800,800,'15 Apr 2026',false),
  ('CP005','NEWUSER','flat',200,999,5000,1245,'31 Dec 2026',true)
on conflict (id) do nothing;

-- ── Banners ────────────────────────────────────────────────────────────
create table if not exists public.banners (
  id         text primary key,
  title      text not null,
  subtitle   text,
  image      text,
  cta_text   text,
  cta_link   text,
  position   text not null default 'hero',          -- 'hero' | 'middle' | 'footer'
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.banners (id, title, subtitle, image, cta_text, cta_link, position, active) values
  ('B001','Festive Collection 2026','Up to 40% off on selected items','/images/banner.jpg','Shop Now','/collections','hero',true),
  ('B002','Bridal Special','Heirloom pieces for your sacred day','/images/bridal-set.jpg','Explore Bridal','/collections?type=bridal','middle',true),
  ('B003','Sacred Rudraksh','Authentic certified beads','/images/luxury-bg.jpg','Discover','/collections?type=rudraksh','middle',false)
on conflict (id) do nothing;

-- ── Reviews ────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id         text primary key,
  name       text not null,
  city       text,
  avatar     text,
  rating     integer not null default 5,
  "text"     text,
  product    text,
  product_id text,
  title      text,
  photo      text,
  helpful    integer not null default 0,
  reported   boolean not null default false,
  "date"     text,
  verified   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Adds the customer-review columns above to a `reviews` table that already
-- exists from an earlier deploy of this schema (the `create table if not
-- exists` above is a no-op in that case).
alter table public.reviews add column if not exists product_id text;
alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists photo text;
alter table public.reviews add column if not exists helpful integer not null default 0;
alter table public.reviews add column if not exists reported boolean not null default false;

-- $$...$$ dollar-quoting lets the review text contain apostrophes safely.
insert into public.reviews (id, name, city, avatar, rating, "text", product, "date", verified) values
  ('r1','Priya Sharma','Mumbai','/images/model.jpg',5,$$I wore this necklace at my daughter's wedding and received more compliments than the bride! The craftsmanship is extraordinary — it looks even more beautiful in person. Worth every rupee.$$,'Diamond Floral Necklace','2024-11-15',true),
  ('r2','Anjali Mehta','Delhi','/images/model.jpg',5,$$Three generations of my family shop only at Om Gauri Putra. The quality never wavers. This temple necklace is exactly what heirloom jewellery should feel like — heavy, impeccable, timeless.$$,'Gold Temple Necklace','2024-12-02',true),
  ('r3','Sunita Reddy','Hyderabad','/images/model.jpg',5,$$My bridal set was custom-designed here. The team was patient, professional and the final piece brought me to tears. Every bride deserves jewellery this special.$$,'Kundan Bridal Necklace','2024-10-20',true),
  ('r4','Kavitha Nair','Chennai','/images/model.jpg',5,$$I have bought jhumkas from many shops but these are in a different league. The weight is perfect, the sound when they move is music, and the 22K gold colour is stunning.$$,'Gold Jhumka Earrings','2024-09-18',true),
  ('r5','Meera Patel','Ahmedabad','/images/model.jpg',5,$$My husband proposed with this ring and I said yes before he finished the sentence. The diamond is breathtaking. Every time I look at it I fall in love again.$$,'Solitaire Diamond Ring','2024-11-30',true),
  ('r6','Rekha Iyer','Bangalore','/images/model.jpg',4,$$Beautiful silver work at a very fair price. The anti-tarnish coating is excellent — I have worn it daily for three months without any dulling. Great value for money.$$,'Silver Pendant Set','2024-08-14',true),
  ('r7','Fatima Shaikh','Pune','/images/model.jpg',5,$$I treated myself to this bracelet for my 40th birthday and it is the most beautiful thing I own. The diamonds are exceptional and the clasp is very secure. Pure luxury.$$,'Diamond Tennis Bracelet','2024-12-10',true),
  ('r8','Deepa Krishnan','Kochi','/images/model.jpg',5,$$The Rudraksh pendant came with a certificate of authenticity and a beautiful explanation of its significance. I can feel the positive energy. Highly recommend to anyone seeking both beauty and spirituality.$$,'1 Mukhi Rudraksh Pendant','2024-07-22',true),
  ('r9','Rashmi Gupta','Kolkata','/images/model.jpg',5,$$I was nervous ordering a piece this expensive online but the experience was flawless. Packaging was exquisite, the necklace arrived exactly as shown, and customer care was exceptional.$$,'Polki Diamond Necklace','2024-10-05',true)
on conflict (id) do nothing;

alter table public.categories enable row level security;
alter table public.coupons    enable row level security;
alter table public.banners    enable row level security;
alter table public.reviews    enable row level security;

-- ════════════════════════════════════════════════════════════════════════
--  SECURITY / ADMIN HARDENING (Phase 1)
--  All tables are written only via the server-side service-role key.
-- ════════════════════════════════════════════════════════════════════════

-- Team members + their RBAC role. Authentication itself moves to Supabase Auth
-- (Phase 2); auth_id links this row to auth.users. Roles: owner | super_admin
-- | admin | staff.
create table if not exists public.admin_users (
  id                  uuid primary key default gen_random_uuid(),
  auth_id             uuid unique,
  email               text unique not null,
  name                text,
  role                text not null default 'staff',
  status              text not null default 'active',  -- active | locked | disabled
  password_changed_at timestamptz,
  last_login_at       timestamptz,
  created_at          timestamptz not null default now()
);

-- Every login attempt — powers rate limiting, brute-force detection and the
-- login-attempt monitor.
create table if not exists public.login_attempts (
  id          bigint generated always as identity primary key,
  email       text,
  ip          text,
  user_agent  text,
  success     boolean not null default false,
  reason      text,
  created_at  timestamptz not null default now()
);
create index if not exists login_attempts_email_idx on public.login_attempts (email, created_at desc);
create index if not exists login_attempts_ip_idx    on public.login_attempts (ip, created_at desc);

-- Temporary + permanent account lockouts.
create table if not exists public.account_locks (
  email        text primary key,
  locked_until timestamptz,
  permanent    boolean not null default false,
  reason       text,
  updated_at   timestamptz not null default now()
);

-- Full audit trail of admin actions.
create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_email text,
  actor_role  text,
  action      text not null,
  target      text,
  ip          text,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- Security-specific events (failed logins, lockouts, new devices, suspicious).
create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  type        text not null,
  severity    text not null default 'info',     -- info | warning | critical
  email       text,
  ip          text,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists security_events_created_idx on public.security_events (created_at desc);

-- Recognised devices, for device verification + new-device approval.
create table if not exists public.trusted_devices (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  fingerprint  text not null,
  label        text,
  browser      text,
  os           text,
  ip           text,
  approved     boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  unique (email, fingerprint)
);

-- Password reuse prevention (stores only hashes; history check on change).
create table if not exists public.password_history (
  id            bigint generated always as identity primary key,
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
create index if not exists password_history_email_idx on public.password_history (email, created_at desc);

-- Active sessions, for the session-management dashboard + force-logout.
create table if not exists public.auth_sessions (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  device_fingerprint text,
  ip                 text,
  browser            text,
  os                 text,
  created_at         timestamptz not null default now(),
  last_active_at     timestamptz not null default now(),
  revoked_at         timestamptz
);
create index if not exists auth_sessions_email_idx on public.auth_sessions (email, last_active_at desc);

alter table public.admin_users      enable row level security;
alter table public.login_attempts   enable row level security;
alter table public.account_locks    enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.security_events  enable row level security;
alter table public.trusted_devices  enable row level security;
alter table public.password_history enable row level security;
alter table public.auth_sessions    enable row level security;

-- Seed the first Owner. Replace the email with yours, then in Phase 2 this row
-- links to the Supabase Auth user you sign in with.
insert into public.admin_users (email, name, role, status)
values ('admin@omgauriputra.com', 'Owner', 'owner', 'active')
on conflict (email) do nothing;

-- Allow a signed-in admin (Supabase Auth) to read ONLY their own admin_users
-- row, so the middleware/server can resolve their role. All writes still go
-- through the service-role key, which bypasses RLS.
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read" on public.admin_users
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Email OTP codes (new-device approval / email verification). Hashes only.
create table if not exists public.email_otps (
  id         bigint generated always as identity primary key,
  email      text not null,
  purpose    text not null,
  code_hash  text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists email_otps_email_idx on public.email_otps (email, created_at desc);
alter table public.email_otps enable row level security;

-- ════════════════════════════════════════════════════════════════════════
--  LEVEL 1-3 UPGRADE — inventory, variants, orders lifecycle, RMA,
--  transactions, CRM/marketing, blog. Safe to re-run (idempotent).
-- ════════════════════════════════════════════════════════════════════════

-- Products: real inventory, multi-image alt text, jewellery variants,
-- per-product SEO, and optional dynamic (weight × gold-rate) pricing.
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists low_stock_threshold integer not null default 5;
alter table public.products add column if not exists alt_texts jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;
alter table public.products add column if not exists making_charge numeric;
alter table public.products add column if not exists use_dynamic_pricing boolean not null default false;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists barcode text;
alter table public.products add column if not exists status text not null default 'published'; -- draft | published
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists trending boolean not null default false;
alter table public.products add column if not exists deleted_at timestamptz; -- soft delete; null = active
create index if not exists products_deleted_idx on public.products (deleted_at);

-- Generic key/value store for admin-editable global settings — starts with
-- the daily gold rate used by dynamic pricing (₹ per gram).
create table if not exists public.store_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (key, value) values
  ('gold_rate_per_gram', '7000')
on conflict (key) do nothing;
alter table public.store_settings enable row level security;

-- Orders: internal notes, status timeline, courier tracking, refund state.
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists status_history jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists refund_amount integer not null default 0;
alter table public.orders add column if not exists refund_status text not null default 'none';

-- Payment/refund/failure log — one row per gateway event.
create table if not exists public.transactions (
  id                bigint generated always as identity primary key,
  order_id          text references public.orders(id) on delete cascade,
  type              text not null,                      -- payment | refund | failure
  gateway           text,
  gateway_response  jsonb not null default '{}'::jsonb,
  amount            integer not null default 0,
  status            text not null default 'success',
  created_at        timestamptz not null default now()
);
create index if not exists transactions_order_idx on public.transactions (order_id, created_at desc);
alter table public.transactions enable row level security;

-- Return / Exchange (RMA) requests, tied to an order.
create table if not exists public.returns (
  id             text primary key,
  order_id       text references public.orders(id) on delete cascade,
  customer_name  text,
  customer_phone text,
  customer_email text,
  reason         text,
  type           text not null default 'return',        -- return | exchange
  status         text not null default 'requested',      -- requested | approved | rejected | refunded | replaced
  admin_notes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists returns_created_idx on public.returns (created_at desc);
alter table public.returns enable row level security;

-- Coupons: first-order-only + category-specific restrictions.
alter table public.coupons add column if not exists first_order_only boolean not null default false;
alter table public.coupons add column if not exists category text;

-- Checkout started but not completed — powers abandoned-cart recovery.
create table if not exists public.abandoned_carts (
  id          bigint generated always as identity primary key,
  name        text,
  phone       text,
  email       text,
  items       jsonb not null default '[]'::jsonb,
  total       integer not null default 0,
  reminded_at timestamptz,
  recovered   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists abandoned_carts_created_idx on public.abandoned_carts (created_at desc);
alter table public.abandoned_carts enable row level security;

-- Bulk WhatsApp / email marketing sends — one row per campaign.
create table if not exists public.campaign_logs (
  id               bigint generated always as identity primary key,
  channel          text not null,                        -- whatsapp | email
  subject          text,
  message          text not null,
  recipient_count  integer not null default 0,
  sent_count       integer not null default 0,
  failed_count     integer not null default 0,
  created_by       text,
  created_at       timestamptz not null default now()
);
create index if not exists campaign_logs_created_idx on public.campaign_logs (created_at desc);
alter table public.campaign_logs enable row level security;

-- Blog / CMS articles (SEO content lever).
create table if not exists public.blog_posts (
  id               text primary key,
  title            text not null,
  slug             text unique not null,
  excerpt          text,
  content          text not null,
  cover_image      text,
  seo_title        text,
  seo_description  text,
  published        boolean not null default false,
  author           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts (published, created_at desc);
alter table public.blog_posts enable row level security;

-- Internal notes on a customer, keyed by phone (customers themselves are
-- derived from orders, not a separate table — see lib/customersDb.ts).
create table if not exists public.customer_notes (
  id          bigint generated always as identity primary key,
  phone       text not null,
  note        text not null,
  created_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists customer_notes_phone_idx on public.customer_notes (phone, created_at desc);
alter table public.customer_notes enable row level security;

-- Inventory adjustment log (manual stock corrections, not tied to an order).
create table if not exists public.inventory_logs (
  id          bigint generated always as identity primary key,
  product_id  text references public.products(id) on delete cascade,
  delta       integer not null,             -- +ve = stock in, -ve = stock out
  reason      text,
  created_by  text,
  created_at  timestamptz not null default now()
);
create index if not exists inventory_logs_product_idx on public.inventory_logs (product_id, created_at desc);
alter table public.inventory_logs enable row level security;

-- Saved delivery addresses ("My Addresses"). Keyed by email, matching how
-- customers are identified everywhere else in this app (orders, leads,
-- abandoned_carts) — there is no real backend account/session system for
-- shoppers yet (lib/auth.ts is a client-side demo store), so this is not a
-- Supabase-Auth-authenticated user_id. The API routes are the authorization
-- boundary: every read/write is scoped to the email the caller claims, same
-- trust model as the rest of the storefront's customer-facing data.
create table if not exists public.user_addresses (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  full_name         text not null,
  mobile            text not null,
  alternate_mobile  text,
  house_no          text not null,
  street            text not null,
  landmark          text,
  city              text not null,
  state             text not null,
  pincode           text not null,
  country           text not null default 'India',
  address_type      text not null default 'Home',
  is_default        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists user_addresses_email_idx on public.user_addresses (email, created_at desc);
alter table public.user_addresses enable row level security;

-- Admin notification feed (the bell in the admin topbar). Shared across the
-- whole admin team — this app has no per-admin-account inbox concept, same
-- as audit_logs/security_events, so there is no user_id partition; actor_email
-- (when set) just records who/what the notification is about.
create table if not exists public.admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null,
  priority    text not null default 'normal',   -- low | normal | high | critical
  is_read     boolean not null default false,
  link        text,
  actor_email text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_unread_idx on public.admin_notifications (is_read) where is_read = false;
alter table public.admin_notifications enable row level security;

-- ════════════════════════════════════════════════════════════════════════
--  PAYMENT HARDENING — replay protection + atomic coupon usage.
--  Safe to re-run (idempotent).
-- ════════════════════════════════════════════════════════════════════════

-- A captured Razorpay payment id must map to exactly one order — this is the
-- database-level backstop for /api/payment/verify's idempotency check, so a
-- duplicate insert is rejected even if that application-level check is ever
-- bypassed or racing itself. Partial index: COD orders (payment_id null)
-- are unrestricted; only real payment ids must be unique.
create unique index if not exists orders_payment_id_unique_idx
  on public.orders (payment_id) where payment_id is not null;

-- Atomic "used = used + 1, but only while still under usage_limit" for
-- coupon redemption — a plain fetch-then-PATCH from application code loses
-- updates when two checkouts apply the same coupon at the same time.
-- usage_limit = 0 means unlimited. Returns the updated row when it
-- incremented, or no rows when the coupon was already at its limit.
create or replace function public.increment_coupon_usage(p_id text)
returns setof public.coupons
language sql
as $$
  update public.coupons
  set used = used + 1
  where id = p_id and (usage_limit = 0 or used < usage_limit)
  returning *;
$$;
