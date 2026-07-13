// Server-side saved-address persistence (Supabase). Returns null when the DB
// is not configured. Every query is scoped by email — see the schema.sql
// comment on user_addresses for why (no real per-customer auth session yet).
import { getSupabase } from './supabase';
import type { Address, AddressInput, AddressType } from './addresses';

type Row = {
  id: string;
  email: string;
  full_name: string;
  mobile: string;
  alternate_mobile: string | null;
  house_no: string;
  street: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  address_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const ADDRESS_TYPES: AddressType[] = ['Home', 'Work', 'Other'];

function toAddress(r: Row): Address {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    mobile: r.mobile,
    alternateMobile: r.alternate_mobile || undefined,
    houseNo: r.house_no,
    street: r.street,
    landmark: r.landmark || undefined,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    country: r.country,
    addressType: (ADDRESS_TYPES.includes(r.address_type as AddressType) ? r.address_type : 'Home') as AddressType,
    isDefault: r.is_default,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(input: AddressInput): Record<string, unknown> {
  return {
    full_name: input.fullName.trim(),
    mobile: input.mobile.trim(),
    alternate_mobile: input.alternateMobile?.trim() || null,
    house_no: input.houseNo.trim(),
    street: input.street.trim(),
    landmark: input.landmark?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
    country: input.country.trim(),
    address_type: input.addressType,
    is_default: input.isDefault,
  };
}

export async function dbGetAddresses(email: string): Promise<Address[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('user_addresses')
    .select('*')
    .eq('email', email)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[addressesDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toAddress);
}

// New default addresses unset any existing default for the same email first
// (best-effort — a duplicate default from a race is cosmetic, not a
// correctness issue, since checkout always uses whichever the customer
// explicitly selects).
async function clearExistingDefault(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('user_addresses').update({ is_default: false }).eq('email', email).eq('is_default', true);
}

export async function dbInsertAddress(email: string, input: AddressInput): Promise<Address | null> {
  const sb = getSupabase();
  if (!sb) return null;
  if (input.isDefault) await clearExistingDefault(email);
  const { data, error } = await sb
    .from('user_addresses')
    .insert({ email, ...toRow(input) })
    .select()
    .single();
  if (error) {
    console.error('[addressesDb] insert:', error.message);
    return null;
  }
  return toAddress(data as Row);
}

// Returns false (not found) when no row matches BOTH id and email — this is
// the ownership check: a caller can only ever touch rows for the email it claims.
export async function dbUpdateAddress(id: string, email: string, input: AddressInput): Promise<Address | null> {
  const sb = getSupabase();
  if (!sb) return null;
  if (input.isDefault) await clearExistingDefault(email);
  const { data, error } = await sb
    .from('user_addresses')
    .update({ ...toRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('email', email)
    .select()
    .maybeSingle();
  if (error) {
    console.error('[addressesDb] update:', error.message);
    return null;
  }
  return data ? toAddress(data as Row) : null;
}

export async function dbSetDefaultAddress(id: string, email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  await clearExistingDefault(email);
  const { data, error } = await sb
    .from('user_addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('email', email)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[addressesDb] setDefault:', error.message);
    return false;
  }
  return Boolean(data);
}

export async function dbDeleteAddress(id: string, email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error } = await sb
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('email', email)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[addressesDb] delete:', error.message);
    return false;
  }
  return Boolean(data);
}
