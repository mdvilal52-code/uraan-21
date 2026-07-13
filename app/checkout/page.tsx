'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { getCurrentUser } from '@/lib/auth';
import { saveOrder } from '@/lib/userOrders';
import LocationPicker from '@/components/LocationPicker';
import type { GeoAddress } from '@/lib/geo/nominatim';
import {
  CreditCard, Smartphone, Wallet, Building2, Banknote,
  Lock, CheckCircle2, ShieldCheck, Truck, ChevronRight, MapPin,
  Tag, X, Loader2,
} from 'lucide-react';
import { BUSINESS_ADDRESS_INLINE, MAPS_DIRECTIONS_URL } from '@/lib/business';
import { COUNTRIES, DEFAULT_COUNTRY, normalizePhone } from '@/lib/phone';
import type { Address } from '@/lib/addresses';
import { generateOrderId } from '@/lib/orders';

type PaymentMethod = 'card' | 'upi' | 'wallet' | 'netbanking' | 'cod';

type RazorpayInstance = { open: () => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [orderId, setOrderId] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  });
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.dial);
  const [phoneError, setPhoneError] = useState('');

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const handleLocationResolved = (addr: GeoAddress) => {
    const parts = [addr.line1, addr.area !== addr.line1 ? addr.area : ''].filter(Boolean);
    setForm((f) => ({
      ...f,
      address: parts.join(', ') || f.address,
      city: addr.city || f.city,
      state: addr.state || f.state,
      pincode: addr.pincode || f.pincode,
    }));
  };

  // Checkout requires an account so the order is tied to it; prefill from profile.
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login?next=/checkout');
      return;
    }
    setForm((f) => ({ ...f, name: user.name, email: user.email, phone: user.phone }));
    setAuthChecked(true);

    // Best-effort: load this customer's saved addresses so they can pick one
    // instead of retyping it. Never blocks checkout if it fails.
    fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.addresses)) {
          const list = data.addresses as Address[];
          setSavedAddresses(list);
          const preferred = list.find((a) => a.isDefault) || list[0];
          if (preferred) applySavedAddress(preferred);
        }
      })
      .catch(() => {
        /* no saved addresses available — manual entry still works */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const applySavedAddress = (a: Address) => {
    setSelectedAddressId(a.id);
    setForm((f) => ({
      ...f,
      name: a.fullName,
      phone: a.mobile,
      address: [a.houseNo, a.street, a.landmark].filter(Boolean).join(', '),
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    }));
    setPhoneError('');
  };

  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const shipping = totalPrice >= 1999 ? 0 : 99;
  const discount = appliedCoupon?.discount || 0;
  const finalTotal = Math.max(0, totalPrice + shipping - discount);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          orderTotal: totalPrice,
          categories,
          phone: form.phone,
          email: form.email,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setCouponError(data.error || 'Could not apply this coupon.');
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, discount: data.discount });
      setCouponCode('');
    } catch {
      setCouponError('Network error. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Synchronous re-entrancy guard for "Place Order" — a ref (not the
  // `processing` state) so a same-tick double-click can't slip both calls
  // through before React has re-rendered the disabled button.
  const placingOrder = useRef(false);
  const stopProcessing = () => {
    placingOrder.current = false;
    setProcessing(false);
  };

  // Best-effort abandoned-cart capture: fires once per session (guarded by a
  // ref) once the customer has entered a phone number and has cart items but
  // hasn't completed the order yet. Never blocks or alters checkout UX.
  const abandonedCaptured = useRef(false);
  const handlePhoneBlur = () => {
    if (abandonedCaptured.current) return;
    const normalized = normalizePhone(form.phone, dialCode);
    if (!normalized || items.length === 0) return;
    abandonedCaptured.current = true;
    fetch('/api/abandoned-carts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: normalized,
        email: form.email,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: totalPrice,
      }),
    }).catch(() => {
      /* best-effort only — never surface this to the customer */
    });
  };

  // Best-effort: mark any abandoned cart for this phone as recovered now that
  // a real order has completed. Never blocks or alters checkout UX.
  const recoverAbandonedCart = (phone: string) => {
    if (!phone.trim()) return;
    fetch('/api/abandoned-carts/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }).catch(() => {
      /* best-effort only */
    });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizePhone(form.phone, dialCode);
    if (!normalized) {
      setPhoneError('Please enter a valid phone number for the selected country.');
      return;
    }
    setPhoneError('');
    setForm((f) => ({ ...f, phone: normalized }));
    setStep('payment');
  };

  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const paymentLabel = () =>
    paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' :
    paymentMethod === 'card' ? 'Card' : paymentMethod === 'wallet' ? 'Wallet' : 'Net Banking';

  // Save to the customer's own (browser) order history and show success.
  const finishLocal = (id: string, label: string) => {
    saveOrder({
      id,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
      amount: finalTotal,
      payment: label,
      status: 'Processing',
      address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
    });
    recoverAbandonedCart(form.phone);
    setOrderId(id);
    setStep('success');
    clearCart();
  };

  // Server recomputes the authoritative price from the real product
  // catalogue — only ids/quantities are trusted from the browser here.
  const orderPayload = () => ({
    customer: form.name,
    email: form.email,
    phone: form.phone,
    items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    address: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}`,
    couponCode: appliedCoupon?.code,
  });

  // COD / demo (no online payment): record the order directly as unpaid.
  // Awaits the server's response instead of firing-and-forgetting, since the
  // server can now reject this (price/stock mismatch) — "Order Placed!"
  // must not show unless it's actually been recorded.
  const placeDirect = async () => {
    const id = generateOrderId();
    const label = paymentLabel();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...orderPayload(), payment: label, status: 'Processing', paid: false }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) {
        alert(data?.error || 'Could not place your order. Please try again.');
        stopProcessing();
        return;
      }
    } catch {
      alert('Network error. Please check your connection and try again.');
      stopProcessing();
      return;
    }
    finishLocal(id, label);
  };

  const handlePlaceOrder = async () => {
    if (placingOrder.current) return;
    placingOrder.current = true;
    setProcessing(true);
    try {
      // COD, or no gateway configured → place the order directly.
      if (paymentMethod === 'cod' || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        await placeDirect();
        return;
      }
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })), couponCode: appliedCoupon?.code, phone: form.phone, email: form.email }),
      });
      const data = await res.json();
      if (!data.ok) {
        // A real validation error (out of stock, coupon no longer valid,
        // etc.) — show it. Must NOT fall through to placeDirect(), which
        // would silently place an unpaid demo order instead of telling the
        // customer what's actually wrong.
        alert(data.error || 'Could not start payment. Please review your cart and try again.');
        stopProcessing();
        return;
      }
      // Server has no Razorpay keys → fall back to a direct (demo) order.
      if (!data.configured) {
        await placeDirect();
        return;
      }
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        alert('Payment system load nahi hua. Dobara koshish karein.');
        stopProcessing();
        return;
      }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Om Gauri Putra',
        description: 'Jewellery order',
        order_id: data.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#b8893a' },
        handler: async (response: Record<string, string>) => {
          try {
            const v = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, order: { ...orderPayload(), payment: paymentLabel() } }),
            });
            const vd = await v.json();
            if (vd.ok && vd.valid) {
              const id = (vd.orderId as string) || generateOrderId();
              finishLocal(id, `${paymentLabel()} · Paid`);
            } else {
              alert(vd.error || 'Payment verify nahi ho paaya. Agar paisa kata hai to support se contact karein.');
              stopProcessing();
            }
          } catch {
            stopProcessing();
          }
        },
        modal: { ondismiss: () => stopProcessing() },
      });
      rzp.open();
    } catch {
      alert('Payment shuru nahi ho paaya. Dobara koshish karein.');
      stopProcessing();
    }
  };

  if (!authChecked && step !== 'success') {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="py-32 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">
          Loading checkout…
        </div>
      </main>
    );
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="serif text-3xl text-[#1a1410] mb-3">Your cart is empty</h1>
          <p className="text-sm text-[#6b5d4c] mb-6">Add some products before checking out.</p>
          <Link href="/collections" className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold">
            Browse Products <ChevronRight size={14} />
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#3d6b5a]/10 grid place-items-center">
            <CheckCircle2 className="text-[#3d6b5a]" size={42} />
          </div>
          <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-3">
            Order <em className="gold-text">Placed</em>!
          </h1>
          <p className="text-sm text-[#6b5d4c] mb-2">Thank you for shopping with us.</p>
          <p className="text-sm text-[#6b5d4c] mb-8">
            Order ID: <span className="font-bold text-[#1a1410]">{orderId}</span>
          </p>

          <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-5 mb-8 text-left">
            <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-3">Order Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b5d4c]">Order ID</span>
                <span className="font-semibold text-[#1a1410]">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b5d4c]">Payment</span>
                <span className="font-semibold text-[#1a1410] capitalize">
                  {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi' ? 'UPI' : paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b5d4c]">Total</span>
                <span className="font-semibold text-[#1a1410]">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[rgba(184,137,58,0.18)]">
                <span className="text-[#6b5d4c]">Delivery</span>
                <span className="font-semibold text-[#1a1410]">3-7 business days</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#6b5d4c] mb-6">
            We&apos;ll keep you updated at <strong>{form.email}</strong> and <strong>{form.phone}</strong>.
          </p>

          <div className="flex items-start gap-2 justify-center mb-6 text-left max-w-sm mx-auto">
            <MapPin className="text-[#b8893a] flex-shrink-0 mt-0.5" size={14} aria-hidden="true" />
            <p className="text-xs text-[#6b5d4c] leading-relaxed">
              Prefer to shop in person? Visit our flagship store —{' '}
              <address className="not-italic inline">{BUSINESS_ADDRESS_INLINE}</address>.{' '}
              <a href={MAPS_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#b8893a] hover:underline">
                Get Directions
              </a>
            </p>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/profile" className="px-7 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]">
              View My Orders
            </Link>
            <Link href="/collections" className="px-7 py-3 border border-[#1a1410] text-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b]">
              Continue Shopping
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <Link href="/cart" className="text-[#b8893a] font-medium">Cart</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Checkout</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-3">Checkout</h1>
        <div className="flex items-center gap-3 text-[10px] tracking-[1.5px] uppercase">
          <span className={step === 'address' ? 'text-[#b8893a] font-bold' : 'text-[#3d6b5a]'}>
            1. Address {step !== 'address' && '✓'}
          </span>
          <span className="text-[#9a8c75]">→</span>
          <span className={step === 'payment' ? 'text-[#b8893a] font-bold' : 'text-[#9a8c75]'}>
            2. Payment
          </span>
          <span className="text-[#9a8c75]">→</span>
          <span className="text-[#9a8c75]">3. Confirmation</span>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
                <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
                  Shipping Address
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <p className="luxury-label mb-2">Saved Addresses</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applySavedAddress(a)}
                          className={`text-left p-3 border text-xs transition-colors ${
                            selectedAddressId === a.id
                              ? 'border-[#b8893a] ring-1 ring-[#b8893a] bg-[#fbf8f1]'
                              : 'border-[rgba(184,137,58,0.18)] hover:border-[#b8893a]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] tracking-[1px] uppercase font-semibold px-1.5 py-0.5 bg-[#f8f2e6] text-[#b8893a]">
                              {a.addressType}
                            </span>
                            {a.isDefault && <span className="text-[9px] text-[#3d6b5a] font-semibold">Default</span>}
                          </div>
                          <div className="font-semibold text-[#1a1410]">{a.fullName}</div>
                          <div className="text-[#6b5d4c] mt-0.5">
                            {a.houseNo}, {a.street}, {a.city}, {a.state} - {a.pincode}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <LocationPicker onLocationResolved={handleLocationResolved} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="luxury-label">Full Name *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="luxury-input" />
                  </div>
                  <div>
                    <label className="luxury-label">Email *</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="luxury-input" />
                  </div>
                  <div>
                    <label className="luxury-label">Phone *</label>
                    <div className="flex gap-2">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className="luxury-input !w-auto shrink-0"
                        aria-label="Country code"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.dial}>+{c.dial}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); setPhoneError(''); }}
                        onBlur={handlePhoneBlur}
                        placeholder="Mobile number"
                        className="luxury-input flex-1"
                      />
                    </div>
                    {phoneError && <p className="text-[11px] text-[#7a2e2e] mt-1">{phoneError}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="luxury-label">Address *</label>
                    <textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House no, street, landmark" className="luxury-input" />
                  </div>
                  <div>
                    <label className="luxury-label">City *</label>
                    <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="luxury-input" />
                  </div>
                  <div>
                    <label className="luxury-label">State *</label>
                    <input type="text" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="luxury-input" />
                  </div>
                  <div>
                    <label className="luxury-label">PIN Code *</label>
                    <input type="text" required pattern="[0-9]{6}" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="luxury-input" />
                  </div>
                </div>
                <button type="submit" className="mt-6 w-full md:w-auto px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] inline-flex items-center justify-center gap-2">
                  Continue to Payment <ChevronRight size={14} />
                </button>
              </form>
            )}

            {step === 'payment' && (
              <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
                  <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410]">
                    Payment Method
                  </h2>
                  <button onClick={() => setStep('address')} className="text-[10px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline">
                    ← Edit Address
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { id: 'card' as const, icon: CreditCard, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay, Amex' },
                    { id: 'upi' as const, icon: Smartphone, label: 'UPI', desc: 'GPay, PhonePe, Paytm, BHIM' },
                    { id: 'wallet' as const, icon: Wallet, label: 'Wallets', desc: 'Paytm, Amazon Pay, Mobikwik' },
                    { id: 'netbanking' as const, icon: Building2, label: 'Net Banking', desc: 'All major Indian banks' },
                    { id: 'cod' as const, icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when you receive' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${
                        paymentMethod === p.id
                          ? 'border-[#b8893a] bg-[#f8f2e6]'
                          : 'border-[rgba(184,137,58,0.18)] hover:border-[#b8893a]/50'
                      }`}
                    >
                      <input type="radio" name="payment" checked={paymentMethod === p.id} onChange={() => setPaymentMethod(p.id)} className="accent-[#b8893a]" />
                      <div className="w-10 h-10 rounded-full bg-white border border-[rgba(184,137,58,0.32)] grid place-items-center">
                        <p.icon className="text-[#b8893a]" size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1a1410]">{p.label}</div>
                        <div className="text-[11px] text-[#6b5d4c]">{p.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="bg-[#f8f2e6] p-4 mb-5 border border-[rgba(184,137,58,0.18)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <label className="luxury-label">Card Number</label>
                        <input type="text" maxLength={19} placeholder="1234 5678 9012 3456" value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })} className="luxury-input" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="luxury-label">Name on Card</label>
                        <input type="text" value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} className="luxury-input" />
                      </div>
                      <div>
                        <label className="luxury-label">Expiry</label>
                        <input type="text" maxLength={5} placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} className="luxury-input" />
                      </div>
                      <div>
                        <label className="luxury-label">CVV</label>
                        <input type="password" maxLength={4} placeholder="•••" value={cardForm.cvv} onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })} className="luxury-input" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#6b5d4c] mt-3">
                      <Lock size={11} className="text-[#3d6b5a]" />
                      <span>Your card details are encrypted</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="bg-[#f8f2e6] p-4 mb-5 border border-[rgba(184,137,58,0.18)]">
                    <label className="luxury-label">UPI ID</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="luxury-input" />
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((u) => (
                        <span key={u} className="px-3 py-1 bg-white border border-[rgba(184,137,58,0.32)] text-[10px] font-semibold">{u}</span>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="bg-[#f8f2e6] p-4 mb-5 border border-[rgba(184,137,58,0.18)]">
                    <div className="text-xs text-[#6b5d4c] mb-3">Select wallet:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Paytm', 'Amazon Pay', 'Mobikwik', 'FreeCharge', 'Ola Money', 'JioMoney'].map((w) => (
                        <button key={w} type="button" className="bg-white border border-[rgba(184,137,58,0.32)] py-2 text-xs font-semibold hover:border-[#b8893a]">{w}</button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="bg-[#f8f2e6] p-4 mb-5 border border-[rgba(184,137,58,0.18)]">
                    <label className="luxury-label">Select Bank</label>
                    <select className="luxury-input">
                      <option>Select your bank</option>
                      <option>State Bank of India</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Punjab National Bank</option>
                      <option>Kotak Mahindra Bank</option>
                      <option>Bank of Baroda</option>
                      <option>Yes Bank</option>
                      <option>IndusInd Bank</option>
                      <option>Other Banks</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="bg-[#f8f2e6] p-4 mb-5 border border-[rgba(184,137,58,0.18)] text-xs text-[#6b5d4c]">
                    <div className="flex items-start gap-2">
                      <Banknote className="text-[#b8893a] flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        Pay cash when your order arrives. Additional ₹50 COD charges apply.
                        Available only for orders below ₹50,000.
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={handlePlaceOrder} disabled={processing} className="w-full bg-[#1a1410] text-[#e8d49b] py-4 text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] flex items-center justify-center gap-2 disabled:opacity-60">
                  <Lock size={14} /> {processing ? 'Processing…' : `Place Order · ₹${finalTotal.toLocaleString('en-IN')}`}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#6b5d4c]">
                  <ShieldCheck size={12} className="text-[#3d6b5a]" />
                  <span>256-bit SSL · PCI DSS · Razorpay Secured</span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-5 sticky top-32">
              <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4 pb-3 border-b border-[rgba(184,137,58,0.18)]">
                Order Summary
              </h3>

              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-white bg-cover bg-center flex-shrink-0 rounded" style={{ backgroundImage: `url(${item.image})` }} />
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="t-product-title-sm">{item.name}</div>
                      <div className="t-caption">Qty: {item.quantity}</div>
                      <PriceDisplay currentPrice={item.price * item.quantity} size="sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="pt-3 border-t border-[rgba(184,137,58,0.18)]">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 bg-[#3d6b5a]/10 border border-[#3d6b5a]/30 rounded px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#3d6b5a]">
                      <Tag size={12} /> {appliedCoupon.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                      className="text-[#3d6b5a] hover:text-[#7a2e2e]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
                        <input
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                          placeholder="Have a coupon?"
                          maxLength={40}
                          className="w-full h-9 pl-8 pr-2 border border-[rgba(184,137,58,0.3)] bg-white text-xs uppercase tracking-wide focus:outline-none focus:border-[#b8893a]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="h-9 px-4 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                      >
                        {couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-[#7a2e2e] mt-1.5">{couponError}</p>}
                  </>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-[rgba(184,137,58,0.18)] text-sm">
                <div className="flex justify-between text-[#6b5d4c]">
                  <span>Subtotal ({totalItems})</span>
                  <span className="text-[#1a1410] font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#6b5d4c]">
                  <span className="flex items-center gap-1"><Truck size={11} /> Shipping</span>
                  <span className="text-[#1a1410] font-medium">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#3d6b5a]">
                    <span className="flex items-center gap-1"><Tag size={11} /> Discount ({appliedCoupon?.code})</span>
                    <span className="font-medium">−₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-[rgba(184,137,58,0.18)]">
                <span className="display text-xs tracking-[2px] uppercase text-[#1a1410]">Total</span>
                <PriceDisplay
                  currentPrice={finalTotal}
                  size="lg"
                  priceStyle={{ fontSize: 'clamp(28px, 5.5vw, 36px)' }}
                />
              </div>

              <div className="mt-5 pt-4 border-t border-[rgba(184,137,58,0.18)] space-y-2 text-[10px] text-[#6b5d4c]">
                <div className="flex items-center gap-2"><ShieldCheck size={11} className="text-[#3d6b5a]" /><span>100% Secure Checkout</span></div>
                <div className="flex items-center gap-2"><Truck size={11} className="text-[#b8893a]" /><span>Free shipping above ₹1999</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 size={11} className="text-[#3d6b5a]" /><span>Easy 7-day returns</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}