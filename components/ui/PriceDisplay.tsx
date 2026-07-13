import type { CSSProperties } from 'react';

type PriceDisplaySize = 'sm' | 'md' | 'lg' | 'xl';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  size?: PriceDisplaySize;
  showDiscountBadge?: boolean;
  align?: 'left' | 'center';
  className?: string;
  priceClassName?: string;
  priceStyle?: CSSProperties;
}

const SIZE_CLASSES: Record<PriceDisplaySize, { current: string; original: string; discount: string }> = {
  sm: { current: 't-price-sm', original: 't-price-old', discount: 't-discount' },
  md: { current: 't-price', original: 't-price-old', discount: 't-discount' },
  lg: { current: 't-price-lg', original: 't-price-old-lg', discount: 't-discount-lg' },
  xl: { current: 't-price-lg', original: 't-price-old-lg', discount: 't-discount-lg' },
};

// One price component for every customer-facing surface (cards, PDP, cart,
// cart drawer, checkout, wishlist) so the current/original/discount trio
// always renders identically — see the t-price* tokens in styles/luxury.css.
export default function PriceDisplay({
  currentPrice,
  originalPrice,
  currency = '₹',
  size = 'md',
  showDiscountBadge = true,
  align = 'left',
  className = '',
  priceClassName = '',
  priceStyle,
}: PriceDisplayProps) {
  const styles = SIZE_CLASSES[size];
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > currentPrice;
  const discount = hasDiscount ? Math.round(((originalPrice! - currentPrice) / originalPrice!) * 100) : 0;

  const currentPriceEl = (
    <span className={`${styles.current} ${priceClassName}`.trim()} style={priceStyle}>
      <span style={{ fontSize: '0.82em' }}>{currency}</span>
      {currentPrice.toLocaleString('en-IN')}
    </span>
  );

  if (!hasDiscount) {
    // No className means this is embedded inline (e.g. "Line total: ₹500") —
    // stay a bare inline span so it doesn't break onto its own line.
    return className ? <div className={className}>{currentPriceEl}</div> : currentPriceEl;
  }

  return (
    <div className={`t-price-row ${align === 'center' ? 'justify-center' : ''} ${className}`.trim()}>
      {currentPriceEl}
      <span className={styles.original} aria-label="Original price">
        <span className="sr-only">was</span>
        <span style={{ fontSize: '0.82em' }}>{currency}</span>
        {originalPrice!.toLocaleString('en-IN')}
      </span>
      {showDiscountBadge && discount > 0 && (
        <span className={styles.discount}>({discount}% OFF)</span>
      )}
    </div>
  );
}
