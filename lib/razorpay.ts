// Server-side Razorpay helpers. Creates payment orders and verifies the
// signature returned by Razorpay Checkout. Like the other integrations here it
// degrades gracefully: when keys are missing, isRazorpayConfigured() is false
// and checkout falls back to placing the order without an online payment.
//
// Env vars (Vercel → Settings → Environment Variables):
//   NEXT_PUBLIC_RAZORPAY_KEY_ID  — Razorpay Key Id (safe in the browser)
//   RAZORPAY_KEY_SECRET          — Razorpay Key Secret (server only!)
// Get them from https://dashboard.razorpay.com → Settings → API Keys.

import crypto from 'crypto';

export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(razorpayKeyId() && process.env.RAZORPAY_KEY_SECRET);
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string
): Promise<RazorpayOrder | null> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return null;

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      // payment_capture: 1 — auto-capture on success so a completed checkout
      // always reaches 'captured' status; /api/payment/verify requires that
      // status before it will ever record an order as paid.
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, payment_capture: 1 }),
    });
    if (!res.ok) {
      console.error('[razorpay] create order failed:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as RazorpayOrder;
  } catch (err) {
    console.error('[razorpay] create order error:', err);
    return null;
  }
}

export interface RazorpayRefundResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function createRazorpayRefund(
  paymentId: string,
  amountPaise: number
): Promise<RazorpayRefundResult> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return { ok: false, error: 'Razorpay not configured.' };

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountPaise }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('[razorpay] refund failed:', res.status, data);
      return { ok: false, error: data?.error?.description || `Razorpay error (${res.status})` };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[razorpay] refund error:', err);
    return { ok: false, error: 'Could not reach Razorpay API.' };
  }
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  status: string; // 'created' | 'authorized' | 'captured' | 'refunded' | 'failed'
  amount: number; // paise
  currency: string;
}

// Fetches the payment record straight from Razorpay so the server never has
// to trust what the browser claims was paid — used by /api/payment/verify to
// get the authoritative amount/status for a payment id.
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment | null> {
  const keyId = razorpayKeyId();
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return null;

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64'),
      },
    });
    if (!res.ok) {
      console.error('[razorpay] fetch payment failed:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as RazorpayPayment;
  } catch (err) {
    console.error('[razorpay] fetch payment error:', err);
    return null;
  }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  // Constant-time comparison.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
