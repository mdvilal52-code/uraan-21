'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { reviewAccent, initialsOf } from '@/lib/reviewStyle';
import { Heart, Star, CheckCircle2, Search, ThumbsUp, Flag, ImageIcon } from 'lucide-react';
import { useReviews, verifiedOnly } from '@/hooks/useReviews';
import { voteHelpful, reportReviewAction } from '@/lib/reviewsActions';
import WriteReviewModal from '@/components/WriteReviewModal';

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' | 'verified';

export default function ReviewsPage() {
  const { reviews } = useReviews();
  const all = verifiedOnly(reviews);

  const [query, setQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const avgRating = all.length > 0 ? all.reduce((sum, r) => sum + r.rating, 0) / all.length : 0;

  const shown = useMemo(() => {
    let list = all;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.product?.toLowerCase().includes(q)
      );
    }
    if (starFilter) list = list.filter((r) => Math.round(r.rating) === starFilter);
    if (photosOnly) list = list.filter((r) => Boolean(r.photo));
    if (verifiedOnlyFilter) list = list.filter((r) => r.verified);

    const sorted = [...list];
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'highest':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        sorted.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        break;
      case 'verified':
        sorted.sort((a, b) => Number(b.verified) - Number(a.verified));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return sorted;
  }, [all, query, starFilter, photosOnly, verifiedOnlyFilter, sort]);

  const handleHelpful = async (id: string) => {
    const voted = await voteHelpful(id);
    if (voted) setVotedIds((prev) => new Set(prev).add(id));
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Reviews</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <p className="section-tag-italic">Words of Love</p>
        <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-3">Customer Reviews</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={15}
                className={i < Math.round(avgRating) ? 'text-[#b8893a] fill-[#b8893a]' : 'text-[#d4cfc5]'}
              />
            ))}
          </div>
          <span className="text-sm text-[#6b5d4c]">
            {avgRating.toFixed(1)} average · {all.length} review{all.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Search + filters + sort */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviews…"
              className="w-full h-10 pl-9 pr-3 border border-[rgba(184,137,58,0.3)] text-sm focus:outline-none focus:border-[#b8893a]"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={`h-9 px-2.5 text-xs border flex items-center gap-1 ${
                  starFilter === s
                    ? 'border-[#b8893a] bg-[#f8f2e6] text-[#1a1410]'
                    : 'border-[rgba(184,137,58,0.3)] text-[#6b5d4c]'
                }`}
              >
                {s} <Star size={11} className="text-[#b8893a] fill-[#b8893a]" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setPhotosOnly((v) => !v)}
            className={`h-9 px-3 text-xs border flex items-center gap-1.5 ${
              photosOnly ? 'border-[#b8893a] bg-[#f8f2e6] text-[#1a1410]' : 'border-[rgba(184,137,58,0.3)] text-[#6b5d4c]'
            }`}
          >
            <ImageIcon size={13} /> Photos Only
          </button>

          <button
            onClick={() => setVerifiedOnlyFilter((v) => !v)}
            className={`h-9 px-3 text-xs border flex items-center gap-1.5 ${
              verifiedOnlyFilter ? 'border-[#b8893a] bg-[#f8f2e6] text-[#1a1410]' : 'border-[rgba(184,137,58,0.3)] text-[#6b5d4c]'
            }`}
          >
            <CheckCircle2 size={13} /> Verified Only
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 px-2.5 border border-[rgba(184,137,58,0.3)] text-xs text-[#1a1410] focus:outline-none focus:border-[#b8893a] md:ml-auto"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
            <option value="verified">Verified Purchases</option>
          </select>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6">
        {shown.length === 0 && (
          <p className="text-center text-sm text-[#6b5d4c] py-12">
            No reviews match these filters.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((r, idx) => {
            const accent = reviewAccent(idx);
            return (
            <div
              key={r.id}
              className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5 md:p-6 relative hover:shadow-luxury hover:border-[rgba(184,137,58,0.32)] transition-all duration-300"
              style={{ borderTop: `3px solid ${accent}` }}
            >
              <div
                className="absolute top-2 right-4 serif text-6xl opacity-20 leading-none pointer-events-none"
                style={{ color: accent }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < r.rating ? 'text-[#b8893a] fill-[#b8893a]' : 'text-[#9a8c75]'}
                  />
                ))}
              </div>

              {r.title && <p className="text-sm font-semibold text-[#1a1410] mb-1">{r.title}</p>}
              <p className="serif italic text-[#1a1410] text-base md:text-[17px] leading-relaxed mb-4">
                {r.text}
              </p>

              {r.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photo}
                  alt={`Photo from ${r.name}'s review`}
                  className="h-24 w-24 object-cover rounded mb-4 border border-[rgba(184,137,58,0.18)]"
                />
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(184,137,58,0.18)]">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 border-2 border-[#e8d49b]"
                  style={{ backgroundColor: accent }}
                >
                  {initialsOf(r.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: accent }}>{r.name}</div>
                  <div className="text-[10px] text-[#b08430] tracking-[1px] uppercase mt-0.5">
                    {r.city} · {new Date(r.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {r.verified && (
                  <div className="flex items-center gap-1 text-[10px] text-[#3d6b5a] font-medium flex-shrink-0">
                    <CheckCircle2 size={11} />
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {r.product && (
                <div className="mt-3 text-[10px] text-[#6b5d4c] tracking-[0.5px]">
                  Purchased: <span className="font-semibold" style={{ color: accent }}>{r.product}</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-3 text-[11px] text-[#9a8c75]">
                <button
                  onClick={() => handleHelpful(r.id)}
                  disabled={votedIds.has(r.id)}
                  className="flex items-center gap-1 hover:text-[#b8893a] disabled:text-[#3d6b5a]"
                >
                  <ThumbsUp size={12} /> Helpful{r.helpful ? ` (${r.helpful})` : ''}
                </button>
                <button onClick={() => reportReviewAction(r.id)} className="flex items-center gap-1 hover:text-[#7a2e2e]">
                  <Flag size={12} /> Report
                </button>
              </div>
            </div>
            );
          })}
        </div>

        <div className="luxury-divider mt-12">
          <Heart size={10} />
        </div>
        <p className="text-center text-sm text-[#6b5d4c] mt-4">
          Loved your purchase?{' '}
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="text-[#b8893a] font-medium hover:underline"
          >
            Share your experience with us
          </button>
        </p>
      </section>

      <WriteReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} />

      <Footer />
    </main>
  );
}
