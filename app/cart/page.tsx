'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ChevronRight, Tag, Truck, ShieldCheck, Plus, Minus, Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, totalItems, totalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  const discount = couponApplied ? Math.round(totalPrice * 0.1) : 0;
  const shipping = totalPrice >= 1999 ? 0 : 99;
  const finalTotal = totalPrice - discount + shipping;

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'WELCOME10') {
      setCouponApplied(true);
    } else {
      alert('Invalid coupon. Try WELCOME10');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Cart</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-2">Shopping Cart</h1>
        <p className="text-sm text-[#6b5d4c]">
          {totalItems > 0
            ? `${totalItems} item${totalItems > 1 ? 's' : ''} in your cart.`
            : 'Your cart is empty.'}
        </p>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)]">
            <ShoppingBag className="text-[#b8893a] mx-auto mb-4" size={48} />
            <p className="serif text-2xl text-[#1a1410] mb-3">Your cart is empty</p>
            <p className="text-sm text-[#6b5d4c] mb-6 max-w-md mx-auto">
              Discover our exquisite collection and add your favourites.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
            >
              Continue Shopping <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 md:gap-5 bg-white border border-[rgba(184,137,58,0.18)] p-4 items-center rounded">
                  <div
                    className="w-24 h-24 md:w-28 md:h-28 bg-[#f8f2e6] bg-cover bg-center flex-shrink-0 rounded"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="t-product-title-sm">
                      {item.name}
                    </div>
                    <PriceDisplay currentPrice={item.price} size="md" />
                    <div className="flex items-center gap-4 flex-wrap mt-1">
                      <div className="qty-selector qty-selector-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="qty-btn"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="qty-btn"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="t-caption hidden md:block">
                        Line total: <PriceDisplay currentPrice={item.price * item.quantity} size="sm" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="w-11 h-11 grid place-items-center text-[#9a8c75] hover:text-[#7a2e2e] shrink-0"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div className="flex justify-between pt-3">
                <button
                  onClick={() => { if (confirm('Clear cart?')) clearCart(); }}
                  className="text-[11px] tracking-[1.5px] uppercase text-[#7a2e2e] font-semibold hover:underline"
                >
                  Clear Cart
                </button>
                <Link href="/collections" className="text-[11px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] p-5 sticky top-32">
                <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4 pb-3 border-b border-[rgba(184,137,58,0.18)]">
                  Order Summary
                </h2>

                <div className="mb-4">
                  <div className="text-[10px] tracking-[1.5px] uppercase text-[#6b5d4c] mb-2 flex items-center gap-1">
                    <Tag size={11} className="text-[#b8893a]" /> Coupon
                  </div>
                  {!couponApplied ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 bg-white border border-[rgba(184,137,58,0.32)] px-3 py-2 text-xs outline-none"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-[#1a1410] text-[#e8d49b] px-4 text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#b8893a]"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#3d6b5a]/10 border border-[#3d6b5a]/30 px-3 py-2 text-xs text-[#3d6b5a] flex justify-between items-center">
                      <span>✓ WELCOME10 applied</span>
                      <button onClick={() => setCouponApplied(false)} className="text-[10px] underline">Remove</button>
                    </div>
                  )}
                  <p className="text-[10px] text-[#9a8c75] mt-1 italic">Try: WELCOME10 (10% off)</p>
                </div>

                <div className="space-y-2 mb-4 pb-4 border-b border-[rgba(184,137,58,0.18)]">
                  <div className="flex justify-between text-sm text-[#6b5d4c]">
                    <span>Subtotal ({totalItems})</span>
                    <span className="text-[#1a1410] font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-[#3d6b5a]">
                      <span>Discount (10%)</span>
                      <span>- ₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-[#6b5d4c]">
                    <span className="flex items-center gap-1"><Truck size={11} /> Shipping</span>
                    <span className="text-[#1a1410] font-medium">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-[10px] text-[#b8893a] italic">
                      Add ₹{(1999 - totalPrice).toLocaleString('en-IN')} more for free shipping
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-5">
                  <span className="display text-xs tracking-[2px] uppercase text-[#1a1410]">Total</span>
                  <PriceDisplay
                    currentPrice={finalTotal}
                    size="lg"
                    priceStyle={{ fontSize: 'clamp(28px, 5.5vw, 36px)' }}
                  />
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-[#1a1410] text-[#e8d49b] py-3 text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] flex items-center justify-center gap-2 transition-all"
                >
                  Proceed to Checkout <ChevronRight size={14} />
                </Link>

                <div className="mt-4 pt-4 border-t border-[rgba(184,137,58,0.18)] flex items-center justify-center gap-2 text-[10px] text-[#6b5d4c]">
                  <ShieldCheck size={12} className="text-[#3d6b5a]" />
                  <span className="tracking-[0.5px]">100% Secure · SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}