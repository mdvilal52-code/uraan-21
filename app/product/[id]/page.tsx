'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import ProductGallery from '@/components/ProductGallery';
import ShareButton from '@/components/ShareButton';
import AddToCartButton from '@/components/AddToCartButton';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { getProductById, getRelatedProducts } from '@/lib/products';
import { useProducts } from '@/hooks/useProducts';
import { getGalleryImages } from '@/lib/gallery';
import { SITE_URL } from '@/lib/site';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/wishlistContext';
import { useReviews, verifiedOnly } from '@/hooks/useReviews';
import { voteHelpful, reportReviewAction } from '@/lib/reviewsActions';
import { reviewAccent, initialsOf } from '@/lib/reviewStyle';
import WriteReviewModal from '@/components/WriteReviewModal';
import {
  Heart, Truck, ShieldCheck, RotateCw,
  Star, Plus, Minus, ChevronRight, Award,
  ThumbsUp, Flag, CheckCircle2, Pencil, ArrowUpLeft,
} from 'lucide-react';

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { products: list, loaded } = useProducts();
  const product = getProductById(id, list);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping'>('desc');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<'newest' | 'helpful'>('newest');
  const [votedReview, setVotedReview] = useState<string | null>(null);

  const { addToCart, openCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { reviews: allReviews } = useReviews();

  if (!product) {
    // Still fetching the live catalogue — don't 404 a DB-only product yet.
    if (!loaded) {
      return (
        <main className="min-h-screen bg-white">
          <Navbar />
          <div className="py-32 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">
            Loading…
          </div>
        </main>
      );
    }
    notFound();
  }

  const inWishlist = isInWishlist(product.id);
  const related = getRelatedProducts(product.id, 4, list);

  const productReviews = verifiedOnly(allReviews).filter(
    (r) => r.productId === product.id || r.product === product.name
  );
  const hasLiveReviews = productReviews.length > 0;
  const avgRating = hasLiveReviews
    ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
    : product.rating;
  const reviewCount = hasLiveReviews ? productReviews.length : product.reviewCount;
  const sortedReviews = [...productReviews].sort((a, b) =>
    reviewSort === 'helpful'
      ? (b.helpful || 0) - (a.helpful || 0)
      : new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleHelpful = async (id: string) => {
    const voted = await voteHelpful(id);
    if (voted) setVotedReview(id);
  };

  const handleReport = async (id: string) => {
    await reportReviewAction(id);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
    }
    openCart();
  };

  const absoluteImage = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${SITE_URL}${product.image}`
    : undefined;

  // schema.org Product structured data — powers rich results (price,
  // availability, rating) in Google search for this product page.
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: absoluteImage ? [absoluteImage] : undefined,
    description: product.seoDescription || product.description,
    sku: product.sku || undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      price: product.price,
      priceCurrency: 'INR',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
  if (reviewCount > 0) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount,
    };
  }

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <Link href={`/collections?type=${product.category}`} className="text-[#b8893a] font-medium capitalize">
          {product.category}
        </Link>
        <span className="mx-2 opacity-50">›</span>
        <span className="truncate">{product.name}</span>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div>
            <ProductGallery
              images={product.images && product.images.length ? product.images : getGalleryImages(product)}
              name={product.name}
              tag={product.tag}
            />
          </div>

          {/* Info */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-3 flex-wrap">
              <h1 className="t-product-title-lg pr-1">
                {product.name}
              </h1>

              <div className="flex items-start gap-3 shrink-0 pt-1">
                <ShareButton
                  title={product.name}
                  text={`Check out ${product.name} on Uraan`}
                  iconSize={15}
                  className="!gap-1.5 h-10 px-4 rounded-full border border-[#B8860B] bg-transparent text-[#B8860B] hover:bg-[#B8860B]/10 hover:scale-100 active:scale-95"
                />

                <div className="relative">
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap inline-flex items-center gap-1 bg-white border border-[#B8860B] text-[#B8860B] text-[9px] font-semibold px-2.5 py-1 rounded-full shadow-sm z-10">
                    ⭐ VERIFIED BUYERS
                  </span>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="relative inline-flex items-center gap-2 h-10 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-bold text-[11px] uppercase tracking-wide shadow-[0_0_15px_rgba(184,134,11,0.5)] hover:shadow-[0_0_22px_rgba(184,134,11,0.7)] transition-shadow duration-300"
                  >
                    <Pencil size={14} className="text-white" />
                    Write a Review
                  </button>
                  <p className="absolute top-full right-0 mt-1.5 flex items-start gap-1 text-[11px] italic text-[#B8860B] whitespace-nowrap">
                    <ArrowUpLeft size={12} className="mt-0.5 shrink-0" />
                    Share your experience &amp; earn rewards!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap mt-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(avgRating)
                        ? 'text-[#b8893a] fill-[#b8893a]'
                        : 'text-[#d4cfc5]'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-[#6b5d4c]">
                {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
              </span>
            </div>

            <PriceDisplay
              currentPrice={product.price}
              originalPrice={product.oldPrice}
              size="lg"
              className="mb-5 pb-5 border-b border-[rgba(184,137,58,0.18)]"
            />

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#f8f2e6] p-3 border border-[rgba(184,137,58,0.18)]">
                <div className="text-[9px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Material</div>
                <div className="text-sm text-[#1a1410] font-semibold">{product.material}</div>
              </div>
              {product.weight && (
                <div className="bg-[#f8f2e6] p-3 border border-[rgba(184,137,58,0.18)]">
                  <div className="text-[9px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Weight</div>
                  <div className="text-sm text-[#1a1410] font-semibold">{product.weight}</div>
                </div>
              )}
              {product.purity && (
                <div className="bg-[#f8f2e6] p-3 border border-[rgba(184,137,58,0.18)]">
                  <div className="text-[9px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Purity</div>
                  <div className="text-sm text-[#1a1410] font-semibold">{product.purity} Hallmarked</div>
                </div>
              )}
              <div className="bg-[#f8f2e6] p-3 border border-[rgba(184,137,58,0.18)]">
                <div className="text-[9px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1">Stock</div>
                <div className={`text-sm font-semibold ${product.inStock ? 'text-[#3d6b5a]' : 'text-[#7a2e2e]'}`}>
                  {product.inStock ? 'In Stock' : 'Sold Out'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="qty-selector qty-selector-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                  className="qty-btn"
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                  className="qty-btn"
                >
                  <Plus size={14} />
                </button>
              </div>
              <AddToCartButton
                product={product}
                inStock={product.inStock}
                quantity={quantity}
                className="flex-1 h-12 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] flex items-center justify-center gap-2 disabled:opacity-40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Link
                href="/checkout"
                onClick={handleAddToCart}
                className="h-12 bg-[#b8893a] text-white text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#7a5a1f] flex items-center justify-center gap-2"
              >
                Buy Now <ChevronRight size={14} />
              </Link>
              <button
                onClick={() =>
                  toggleWishlist({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  })
                }
                aria-pressed={inWishlist}
                className="h-12 border border-[#1a1410] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] flex items-center justify-center gap-2 transition-transform duration-150 active:scale-95"
              >
                <Heart
                  size={14}
                  className={`transition-all duration-300 ${
                    inWishlist ? 'fill-[#7a2e2e] text-[#7a2e2e] scale-110' : 'scale-100'
                  }`}
                />
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { icon: Truck, text: 'Free Shipping' },
                { icon: ShieldCheck, text: 'Hallmarked' },
                { icon: RotateCw, text: '7-Day Returns' },
              ].map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center bg-[#f8f2e6] py-3 px-2 border border-[rgba(184,137,58,0.18)]"
                >
                  <t.icon className="text-[#b8893a] mb-1" size={16} />
                  <span className="text-[10px] tracking-[1px] uppercase text-[#6b5d4c]">{t.text}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-t border-[rgba(184,137,58,0.18)] pt-5">
              <div className="flex gap-4 mb-4 border-b border-[rgba(184,137,58,0.18)]">
                {[
                  { id: 'desc' as const, label: 'Description' },
                  { id: 'specs' as const, label: 'Specifications' },
                  { id: 'shipping' as const, label: 'Shipping & Returns' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-2 text-[11px] tracking-[1.5px] uppercase font-semibold ${
                      activeTab === t.id
                        ? 'text-[#b8893a] border-b-2 border-[#b8893a]'
                        : 'text-[#6b5d4c]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="text-sm text-[#6b5d4c] leading-relaxed">
                {activeTab === 'desc' && <p>{product.description}</p>}
                {activeTab === 'specs' && (
                  <ul className="space-y-1.5">
                    <li><strong className="text-[#1a1410]">Material:</strong> {product.material}</li>
                    {product.weight && <li><strong className="text-[#1a1410]">Weight:</strong> {product.weight}</li>}
                    {product.purity && <li><strong className="text-[#1a1410]">Purity:</strong> {product.purity}</li>}
                    <li><strong className="text-[#1a1410]">Category:</strong> <span className="capitalize">{product.category}</span></li>
                    <li><strong className="text-[#1a1410]">Certification:</strong> BIS Hallmarked</li>
                  </ul>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-2">
                    <p>✦ Free shipping on orders above ₹1999 across India.</p>
                    <p>✦ Standard delivery in 3-7 business days.</p>
                    <p>✦ Express delivery available at checkout.</p>
                    <p>✦ Easy 7-day return policy.</p>
                    <p>✦ All products undergo strict quality check.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-[rgba(184,137,58,0.18)]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="section-tag-italic">Words of Love</p>
            <h2 className="section-heading !mb-0">Customer Reviews</h2>
          </div>
          {sortedReviews.length > 1 && (
            <div className="flex items-center gap-2 text-[11px]">
              <label htmlFor="review-sort" className="text-[#9a8c75] tracking-[1px] uppercase">Sort</label>
              <select
                id="review-sort"
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as 'newest' | 'helpful')}
                className="border border-[rgba(184,137,58,0.3)] px-2 py-1.5 text-[#1a1410] focus:outline-none focus:border-[#b8893a]"
              >
                <option value="newest">Newest</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          )}
        </div>

        {sortedReviews.length === 0 ? (
          <p className="text-sm text-[#6b5d4c]">
            No reviews yet for this piece —{' '}
            <button onClick={() => setReviewModalOpen(true)} className="text-[#b8893a] font-medium hover:underline">
              be the first to write one
            </button>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedReviews.map((r, idx) => {
              const accent = reviewAccent(idx);
              return (
                <div
                  key={r.id}
                  className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < r.rating ? 'text-[#b8893a] fill-[#b8893a]' : 'text-[#d4cfc5]'}
                        />
                      ))}
                    </div>
                    {r.verified && (
                      <div className="flex items-center gap-1 text-[10px] text-[#3d6b5a] font-medium">
                        <CheckCircle2 size={11} />
                        <span>Verified Purchase</span>
                      </div>
                    )}
                  </div>
                  {r.title && <p className="text-sm font-semibold text-[#1a1410] mb-1">{r.title}</p>}
                  <p className="text-sm text-[#6b5d4c] leading-relaxed mb-3">{r.text}</p>
                  {r.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photo} alt={`Photo from ${r.name}'s review`} className="h-20 w-20 object-cover rounded mb-3 border border-[rgba(184,137,58,0.18)]" />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                        style={{ backgroundColor: accent }}
                      >
                        {initialsOf(r.name)}
                      </div>
                      <span className="font-semibold text-[#1a1410]">{r.name}</span>
                      {r.city && <span className="text-[#9a8c75]">· {r.city}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#9a8c75]">
                      <button
                        onClick={() => handleHelpful(r.id)}
                        disabled={votedReview === r.id}
                        className="flex items-center gap-1 hover:text-[#b8893a] disabled:text-[#3d6b5a]"
                      >
                        <ThumbsUp size={12} /> Helpful{r.helpful ? ` (${r.helpful})` : ''}
                      </button>
                      <button onClick={() => handleReport(r.id)} className="flex items-center gap-1 hover:text-[#7a2e2e]">
                        <Flag size={12} /> Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={product.id}
        productName={product.name}
      />

      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12 border-t border-[rgba(184,137,58,0.18)] mt-8">
          <p className="section-tag-italic">You Might Also Like</p>
          <h2 className="section-heading">Related Products</h2>
          <div className="luxury-divider"><Award size={10} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}