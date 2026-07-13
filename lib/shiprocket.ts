// Shiprocket courier integration (Level 2 — "Shipping & Fulfilment"). Like
// every other third-party integration in this app it degrades gracefully:
// when credentials are absent, isShiprocketConfigured() is false and callers
// should fall back to the manual tracking-number/courier fields on the order
// (see app/admin/orders/page.tsx) — the panel keeps working before this is
// wired up, exactly like Razorpay/WhatsApp/Resend.
//
// Env vars (Vercel → Settings → Environment Variables):
//   SHIPROCKET_EMAIL     — the Shiprocket account email
//   SHIPROCKET_PASSWORD  — the Shiprocket account password
// Get an account at https://www.shiprocket.in — API docs:
// https://apidocs.shiprocket.in

const BASE = 'https://apiv2.shiprocket.in/v1/external';

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Shiprocket tokens are valid ~10 days; cache in-memory for the life of the
// serverless function/process and re-authenticate once it's stale.
async function getToken(): Promise<string | null> {
  if (!isShiprocketConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    if (!res.ok) {
      console.error('[shiprocket] auth failed:', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { token: string };
    cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
    return data.token;
  } catch (err) {
    console.error('[shiprocket] auth error:', err);
    return null;
  }
}

async function call<T>(path: string, init: RequestInit): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error(`[shiprocket] ${path} failed:`, res.status, await res.text());
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[shiprocket] ${path} error:`, err);
    return null;
  }
}

export interface ShiprocketOrderInput {
  orderId: string;
  orderDate: string; // 'YYYY-MM-DD HH:mm'
  customerName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  items: { name: string; quantity: number; price: number }[];
  subTotal: number;
  paymentMethod: 'Prepaid' | 'COD';
}

// Creates a Shiprocket adhoc order. Returns the Shiprocket order/shipment ids
// on success, or null when unconfigured/failed (caller should fall back to
// the manual tracking-number field).
export async function createShiprocketOrder(
  input: ShiprocketOrderInput
): Promise<{ shiprocketOrderId: number; shipmentId: number } | null> {
  const [name, ...rest] = input.customerName.trim().split(' ');
  const data = await call<{ order_id: number; shipment_id: number }>('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify({
      order_id: input.orderId,
      order_date: input.orderDate,
      pickup_location: 'Primary',
      billing_customer_name: name || input.customerName,
      billing_last_name: rest.join(' ') || '.',
      billing_address: input.address,
      billing_city: input.city,
      billing_pincode: input.pincode,
      billing_state: input.state,
      billing_country: 'India',
      billing_email: input.email || 'no-reply@omgauriputra.com',
      billing_phone: input.phone.replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: input.items.map((i) => ({
        name: i.name,
        units: i.quantity,
        selling_price: i.price,
      })),
      payment_method: input.paymentMethod,
      sub_total: input.subTotal,
      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.5,
    }),
  });
  if (!data) return null;
  return { shiprocketOrderId: data.order_id, shipmentId: data.shipment_id };
}

// Auto-assigns the best-rated courier and returns the AWB (tracking) number.
export async function assignShiprocketAwb(shipmentId: number): Promise<{ awb: string; courierName: string } | null> {
  const data = await call<{ response: { data: { awb_code: string; courier_name: string } } }>(
    '/courier/assign/awb',
    { method: 'POST', body: JSON.stringify({ shipment_id: shipmentId }) }
  );
  if (!data?.response?.data) return null;
  return { awb: data.response.data.awb_code, courierName: data.response.data.courier_name };
}

// Schedules a courier pickup for the shipment.
export async function generateShiprocketPickup(shipmentId: number): Promise<boolean> {
  const data = await call('/courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
  return data !== null;
}

// Returns a URL to the printable shipping label PDF.
export async function generateShiprocketLabel(shipmentId: number): Promise<string | null> {
  const data = await call<{ label_url: string }>('/courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
  return data?.label_url || null;
}

// Live tracking status for a shipped AWB.
export async function trackShiprocketShipment(awb: string): Promise<{ status: string; activities: unknown[] } | null> {
  const data = await call<{ tracking_data: { shipment_status: string; shipment_track_activities: unknown[] } }>(
    `/courier/track/awb/${awb}`,
    { method: 'GET' }
  );
  if (!data?.tracking_data) return null;
  return { status: data.tracking_data.shipment_status, activities: data.tracking_data.shipment_track_activities || [] };
}
