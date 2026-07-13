'use client';

import { useState } from 'react';
import { ShoppingBag, Loader2, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';

type Status = 'idle' | 'loading' | 'success';

type Props = {
  product: { id: string; name: string; price: number; image: string; category?: string };
  className: string;
  label?: string;
  soldOutLabel?: string;
  inStock?: boolean;
  iconSize?: number;
  quantity?: number;
  stopPropagation?: boolean;
};

export default function AddToCartButton({
  product,
  className,
  label = 'Add to Cart',
  soldOutLabel = 'Sold Out',
  inStock = true,
  iconSize = 14,
  quantity = 1,
  stopPropagation = false,
}: Props) {
  const { addToCart, openCart } = useCart();
  const [status, setStatus] = useState<Status>('idle');

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (status !== 'idle' || !inStock) return;

    setStatus('loading');
    setTimeout(() => {
      for (let i = 0; i < Math.max(1, quantity); i++) {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        });
      }
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        openCart();
      }, 700);
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inStock}
      aria-label={inStock ? `Add ${product.name} to cart` : soldOutLabel}
      className={`${className} relative overflow-hidden transition-transform duration-150 active:scale-95`}
    >
      <span
        className={`flex items-center justify-center gap-1.5 transition-all duration-200 ${
          status !== 'idle' ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}
      >
        <ShoppingBag size={iconSize} /> {inStock ? label : soldOutLabel}
      </span>

      {status === 'loading' && (
        <span className="absolute inset-0 flex items-center justify-center gap-1.5">
          <Loader2 size={iconSize} className="animate-spin" /> Adding...
        </span>
      )}

      {status === 'success' && (
        <span className="absolute inset-0 flex items-center justify-center gap-1.5 animate-fade-up">
          <Check size={iconSize} /> Added!
        </span>
      )}
    </button>
  );
}
