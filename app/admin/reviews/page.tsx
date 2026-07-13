'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Star, Trash2, CheckCircle2, XCircle, Database, HardDrive, Flag } from 'lucide-react';
import { type Review, getReviews, setReviewVerified, deleteReview } from '@/lib/reviewsStore';
import { initialsOf, reviewAccent } from '@/lib/reviewStyle';

export default function AdminReviewsPage() {
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [configured, setConfigured] = useState(false);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'reported'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setReviewList(data.reviews as Review[]);
        return;
      }
    } catch {
      /* ignore — use the local fallback */
    }
    setConfigured(false);
    setReviewList(getReviews());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusFiltered =
    filter === 'all' ? reviewList
    : filter === 'verified' ? reviewList.filter((r) => r.verified)
    : filter === 'reported' ? reviewList.filter((r) => r.reported)
    : reviewList.filter((r) => !r.verified);

  const filtered = statusFiltered.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q) ||
      (r.product || '').toLowerCase().includes(q)
    );
  });

  const avgRating = reviewList.length
    ? (reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length).toFixed(1)
    : '0.0';

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete review ${id}?`)) return;
    if (configured) {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      await load();
    } else {
      deleteReview(id);
      setReviewList(getReviews());
    }
  };

  const toggleVerified = async (id: string, current: boolean) => {
    if (configured) {
      await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !current }),
      });
      await load();
    } else {
      setReviewVerified(id, !current);
      setReviewList(getReviews());
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Reviews</h1>
        <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
          {filtered.length} reviews · Avg {avgRating}★
          <StorageBadge configured={configured} />
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`bg-white border p-4 text-center ${filter === 'all' ? 'border-[#b8893a]' : 'border-[rgba(184,137,58,0.18)]'}`}
        >
          <div className="stat-value text-[#1a1410]">{reviewList.length}</div>
          <div className="stat-label mt-1">All Reviews</div>
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`bg-white border p-4 text-center ${filter === 'verified' ? 'border-[#b8893a]' : 'border-[rgba(184,137,58,0.18)]'}`}
        >
          <div className="stat-value text-[#3d6b5a]">{reviewList.filter((r) => r.verified).length}</div>
          <div className="stat-label mt-1">Verified</div>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`bg-white border p-4 text-center ${filter === 'pending' ? 'border-[#b8893a]' : 'border-[rgba(184,137,58,0.18)]'}`}
        >
          <div className="stat-value text-[#7a2e2e]">{reviewList.filter((r) => !r.verified).length}</div>
          <div className="stat-label mt-1">Pending</div>
        </button>
        <button
          onClick={() => setFilter('reported')}
          className={`bg-white border p-4 text-center ${filter === 'reported' ? 'border-[#b8893a]' : 'border-[rgba(184,137,58,0.18)]'}`}
        >
          <div className="stat-value text-[#7a2e2e]">{reviewList.filter((r) => r.reported).length}</div>
          <div className="stat-label mt-1">Reported</div>
        </button>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-[#9a8c75]" />
        <input
          type="text"
          placeholder="Search by reviewer, review text, or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((r, idx) => (
          <div key={r.id} className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: reviewAccent(idx) }}
              >
                {initialsOf(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <div className="font-semibold text-[#1a1410]">{r.name}</div>
                  <div className="text-[10px] text-[#9a8c75] tracking-[1px] uppercase">{r.city}</div>
                  {r.verified && (
                    <span className="bg-[#3d6b5a]/10 text-[#3d6b5a] px-2 py-0.5 text-[9px] font-semibold flex items-center gap-1">
                      <CheckCircle2 size={9} /> Verified
                    </span>
                  )}
                  {r.reported && (
                    <span className="bg-[#7a2e2e]/10 text-[#7a2e2e] px-2 py-0.5 text-[9px] font-semibold flex items-center gap-1">
                      <Flag size={9} /> Reported
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? 'text-[#b8893a] fill-[#b8893a]' : 'text-[#d4cfc5]'}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#9a8c75]">{r.date}</span>
                  {Boolean(r.helpful) && (
                    <span className="text-[10px] text-[#9a8c75]">· {r.helpful} found helpful</span>
                  )}
                </div>
                {r.title && <p className="text-sm font-semibold text-[#1a1410] mb-1">{r.title}</p>}
                <p className="text-sm text-[#6b5d4c] leading-relaxed mb-2">{r.text}</p>
                {r.product && (
                  <div className="text-[10px] text-[#b8893a] tracking-[0.5px]">
                    Product: {r.product}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => toggleVerified(r.id, r.verified)}
                  aria-label="Toggle verified"
                  className={`p-2 ${r.verified ? 'text-[#7a2e2e]' : 'text-[#3d6b5a]'}`}
                  title={r.verified ? 'Unverify' : 'Verify'}
                >
                  {r.verified ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  aria-label="Delete"
                  className="p-2 text-[#6b5d4c] hover:text-[#7a2e2e]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[rgba(184,137,58,0.18)] text-center py-12 text-sm text-[#6b5d4c]">
          No reviews in this view.
        </div>
      )}
    </div>
  );
}

function StorageBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
        configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
      }`}
      title={configured ? 'Saved to your database' : 'Stored in this browser only — run supabase/schema.sql to sync'}
    >
      {configured ? <Database size={11} /> : <HardDrive size={11} />}
      {configured ? 'Database' : 'This browser'}
    </span>
  );
}
