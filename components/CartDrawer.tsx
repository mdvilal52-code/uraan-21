'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, ChevronRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PriceDisplay from '@/components/ui/PriceDisplay';

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <aside
        className={`cart-drawer fixed top-0 right-0 bottom-0 w-[90%] max-w-[400px] bg-[#0B1E42] z-[201] transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="display text-sm tracking-[3px] uppercase text-white">Your Cart</h3>
            <p className="text-[10px] text-white/50 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="w-8 h-8 grid place-items-center text-white/70 hover:text-[#C9A24A]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="text-[#C9A24A] mb-4" size={48} />
            <p className="serif text-2xl text-white mb-2">Your cart is empty</p>
            <p className="text-xs text-white/60 mb-6">
              Add some beautiful pieces to your cart.
            </p>
            <Link
              href="/collections"
              onClick={closeCart}
              className="inline-flex items-center gap-2 px-7 py-3 bg-[#C9A24A] text-[#0B1E42] text-[10px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-white"
            >
              Shop Now <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-white/10 border border-white/10 p-3 rounded-md"
                  >
                    <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded overflow-hidden bg-[#f8f2e6]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="absolute inset-0 m-auto text-[#b8893a]/40" size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="t-product-title-sm">
                        {item.name}
                      </div>
                      <PriceDisplay currentPrice={item.price} size="sm" />

                      <div className="flex items-center justify-between gap-3">
                        <div className="qty-selector">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="qty-btn"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="qty-btn"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="w-9 h-9 grid place-items-center text-white/50 hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-5 bg-[#0a1835]">
              <div className="flex justify-between items-baseline mb-4">
                <span className="display text-xs tracking-[2px] uppercase text-white">
                  Subtotal
                </span>
                <PriceDisplay
                  currentPrice={totalPrice}
                  size="lg"
                  priceStyle={{ fontSize: 'clamp(26px, 5vw, 32px)' }}
                />
              </div>
              <p className="text-[10px] text-white/50 mb-4 italic">
                Taxes & shipping calculated at checkout
              </p>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-[#C9A24A] text-[#0B1E42] py-3 text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-white text-center transition-all"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full border border-[#C9A24A] text-[#C9A24A] py-3 text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#C9A24A] hover:text-[#0B1E42] text-center transition-all"
                >
                  View Cart
                </Link>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/50">
                <ShieldCheck size={11} className="text-[#C9A24A]" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}