'use client';

import { useState, useRef } from 'react';
import { X, Star, ImagePlus, Loader2, CheckCircle2 } from 'lucide-react';
import { submitReview } from '@/lib/reviewsActions';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Omit for a general review not tied to one product (e.g. from /reviews). */
  productId?: string;
  productName?: string;
}

async function compressPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function WriteReviewModal({ isOpen, onClose, productId = '', productName = '' }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setRating(0);
    setHoverRating(0);
    setName('');
    setCity('');
    setTitle('');
    setText('');
    setPhoto(null);
    setPhotoError('');
    setError('');
    setDone(false);
  };

  const handleClose = () => {
    onClose();
    // Delay so the closing transition doesn't visibly reset the form first.
    setTimeout(reset, 200);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (!/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.type)) {
      setPhotoError('Please choose a JPEG, PNG, WEBP or GIF image.');
      return;
    }
    try {
      const dataUrl = await compressPhoto(file);
      if (dataUrl.length > MAX_PHOTO_BYTES) {
        setPhotoError('That photo is too large even after compression. Try a smaller image.');
        return;
      }
      setPhoto(dataUrl);
    } catch {
      setPhotoError('Could not process that photo. Please try another one.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (text.trim().length < 10) {
      setError('Please write at least 10 characters about your experience.');
      return;
    }

    setSubmitting(true);
    const result = await submitReview({
      name: name.trim(),
      city: city.trim() || undefined,
      rating,
      title: title.trim() || undefined,
      text: text.trim(),
      product: productName || undefined,
      productId: productId || undefined,
      photo: photo || undefined,
      website: honeypotRef.current?.value || '',
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl max-h-[92vh] overflow-y-auto shadow-luxury">
        <div className="sticky top-0 bg-white px-5 sm:px-6 py-4 border-b border-[rgba(184,137,58,0.18)] flex items-center justify-between z-10">
          <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Write a Review</h3>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 grid place-items-center hover:text-[#b8893a]"
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <CheckCircle2 className="text-[#3d6b5a] mb-4" size={48} />
            <p className="serif text-2xl text-[#1a1410] mb-2">Thank you!</p>
            <p className="text-sm text-[#6b5d4c] mb-6 max-w-xs">
              Your review has been submitted and will appear once our team verifies it.
            </p>
            <button
              onClick={handleClose}
              className="h-11 px-8 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
            {productName && (
              <p className="text-xs text-[#9a8c75]">
                Reviewing <span className="font-semibold text-[#6b5d4c]">{productName}</span>
              </p>
            )}

            {/* Star rating */}
            <div>
              <label className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-2">
                Your Rating
              </label>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Star rating">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  const filled = value <= (hoverRating || rating);
                  return (
                    <button
                      type="button"
                      key={value}
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`${value} star${value > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="transition-transform duration-150 hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={filled ? 'text-[#b8893a] fill-[#b8893a]' : 'text-[#d4cfc5]'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rv-name" className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1.5">
                  Your Name
                </label>
                <input
                  id="rv-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full h-11 px-3 border border-[rgba(184,137,58,0.3)] text-sm focus:outline-none focus:border-[#b8893a]"
                />
              </div>
              <div>
                <label htmlFor="rv-city" className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1.5">
                  City <span className="normal-case text-[#c9beac]">(optional)</span>
                </label>
                <input
                  id="rv-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={120}
                  className="w-full h-11 px-3 border border-[rgba(184,137,58,0.3)] text-sm focus:outline-none focus:border-[#b8893a]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="rv-title" className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1.5">
                Review Title <span className="normal-case text-[#c9beac]">(optional)</span>
              </label>
              <input
                id="rv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Sum up your experience"
                className="w-full h-11 px-3 border border-[rgba(184,137,58,0.3)] text-sm focus:outline-none focus:border-[#b8893a]"
              />
            </div>

            <div>
              <label htmlFor="rv-text" className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1.5">
                Your Review
              </label>
              <textarea
                id="rv-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={5000}
                rows={4}
                required
                placeholder="Tell us about the quality, fit, and your overall experience…"
                className="w-full px-3 py-2.5 border border-[rgba(184,137,58,0.3)] text-sm focus:outline-none focus:border-[#b8893a] resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] mb-1.5">
                Add a Photo <span className="normal-case text-[#c9beac]">(optional)</span>
              </label>
              {photo ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Review upload preview" className="h-20 w-20 object-cover rounded border border-[rgba(184,137,58,0.3)]" />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    aria-label="Remove photo"
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a1410] text-white rounded-full grid place-items-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-20 w-20 border border-dashed border-[rgba(184,137,58,0.4)] rounded grid place-items-center text-[#b8893a] hover:bg-[#f8f2e6]"
                >
                  <ImagePlus size={20} />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhoto}
                className="hidden"
              />
              {photoError && <p className="text-xs text-[#7a2e2e] mt-1.5">{photoError}</p>}
            </div>

            {/* Honeypot — hidden from real visitors, catches simple bots */}
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute -left-[9999px] w-px h-px opacity-0"
              aria-hidden="true"
            />

            {error && <p className="text-xs text-[#7a2e2e]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
