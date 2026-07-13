import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAdminRequest } from '@/lib/adminApi';
import { getSupabase } from '@/lib/supabase';

// GET /api/admin/search?q=... → global admin search (components/admin/
// Topbar.tsx's "Search anything..." box). Runs small, capped lookups across
// the main admin tables in parallel and returns one flat, ranked-by-table
// list. Admin only — previews here can include order/customer PII.

export type SearchResult = {
  type: string;
  label: string;
  sublabel?: string;
  href: string;
};

const PER_TABLE_LIMIT = 5;
const TOTAL_LIMIT = 25;

// Strips characters that are structurally significant to PostgREST's
// or=(...) filter list (comma separates conditions, parentheses group them)
// and the ilike wildcard itself, so a raw search term can never break out of
// the filter string we build below or inject extra conditions.
function sanitizeTerm(term: string): string {
  return term.replace(/[,()%]/g, ' ').trim();
}

type ProductRow = { id: string; name: string; sku: string | null; category: string | null };

async function searchProducts(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('products')
      .select('id,name,sku,category')
      .is('deleted_at', null)
      .or(`name.ilike.${like},sku.ilike.${like},barcode.ilike.${like}`)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as ProductRow[]).map((p) => ({
      type: 'Product',
      label: p.name,
      sublabel: p.sku || p.category || undefined,
      href: `/admin/products/edit/${p.id}`,
    }));
  } catch {
    return [];
  }
}

type OrderRow = { id: string; customer: string | null };

async function searchOrders(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('orders')
      .select('id,customer')
      .or(`id.ilike.${like},customer.ilike.${like}`)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as OrderRow[]).map((o) => ({
      type: 'Order',
      label: o.id,
      sublabel: o.customer || undefined,
      href: `/admin/orders/${o.id}`,
    }));
  } catch {
    return [];
  }
}

type CategoryRow = { slug: string; name: string };

async function searchCategories(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('categories')
      .select('slug,name')
      .ilike('name', like)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as CategoryRow[]).map((c) => ({
      type: 'Category',
      label: c.name,
      sublabel: c.slug,
      href: '/admin/categories',
    }));
  } catch {
    return [];
  }
}

type ReviewRow = { id: string; name: string; text: string | null; product: string | null };

async function searchReviews(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('reviews')
      .select('id,name,text,product')
      .or(`name.ilike.${like},text.ilike.${like},product.ilike.${like}`)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as ReviewRow[]).map((r) => ({
      type: 'Review',
      label: r.name || 'Review',
      sublabel: r.product || (r.text ? r.text.slice(0, 60) : undefined),
      href: '/admin/reviews',
    }));
  } catch {
    return [];
  }
}

type CouponRow = { id: string; code: string };

async function searchCoupons(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('coupons')
      .select('id,code')
      .ilike('code', like)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as CouponRow[]).map((c) => ({
      type: 'Coupon',
      label: c.code,
      href: '/admin/coupons',
    }));
  } catch {
    return [];
  }
}

type BannerRow = { id: string; title: string };

async function searchBanners(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('banners')
      .select('id,title')
      .ilike('title', like)
      .limit(PER_TABLE_LIMIT);
    if (error || !data) return [];
    return (data as BannerRow[]).map((b) => ({
      type: 'Banner',
      label: b.title,
      href: '/admin/banners',
    }));
  } catch {
    return [];
  }
}

type CustomerOrderRow = { customer: string | null; phone: string | null; email: string | null };

// Customers have no dedicated table — derived from orders, same as
// lib/customersDb.ts. De-duped by phone (preferred) or email here too.
async function searchCustomers(sb: SupabaseClient, like: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await sb
      .from('orders')
      .select('customer,phone,email')
      .or(`customer.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
      .limit(PER_TABLE_LIMIT * 3);
    if (error || !data) return [];
    const seen = new Set<string>();
    const results: SearchResult[] = [];
    for (const o of data as CustomerOrderRow[]) {
      const key = (o.phone || o.email || o.customer || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push({
        type: 'Customer',
        label: o.customer || 'Unknown',
        sublabel: o.phone || o.email || undefined,
        href: '/admin/customers',
      });
      if (results.length >= PER_TABLE_LIMIT) break;
    }
    return results;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const url = new URL(request.url);
  const qRaw = (url.searchParams.get('q') || '').trim();
  if (qRaw.length < 1) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const sb = getSupabase();
  if (!sb) {
    // Not configured — degrade to an empty result set, not an error.
    return NextResponse.json({ ok: true, results: [] });
  }

  const term = sanitizeTerm(qRaw);
  if (!term) {
    return NextResponse.json({ ok: true, results: [] });
  }
  const like = `%${term}%`;

  const groups = await Promise.all([
    searchProducts(sb, like),
    searchOrders(sb, like),
    searchCategories(sb, like),
    searchReviews(sb, like),
    searchCoupons(sb, like),
    searchBanners(sb, like),
    searchCustomers(sb, like),
  ]);

  const results = groups.flat().slice(0, TOTAL_LIMIT);
  return NextResponse.json({ ok: true, results });
}
