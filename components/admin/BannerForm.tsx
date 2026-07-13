'use client';

import { useRef, useState } from 'react';
import { Save, X, Upload, ImageOff } from 'lucide-react';

type BannerData = {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  position: 'hero' | 'middle' | 'footer';
  active: boolean;
};

type BannerFormProps = {
  initialBanner?: BannerData;
  mode?: 'add' | 'edit';
  onSave?: (banner: BannerData) => void;
  onCancel?: () => void;
};

export default function BannerForm({
  initialBanner,
  mode = 'add',
  onSave,
  onCancel,
}: BannerFormProps) {
  const [form, setForm] = useState<BannerData>({
    title: initialBanner?.title || '',
    subtitle: initialBanner?.subtitle || '',
    image: initialBanner?.image || '',
    ctaText: initialBanner?.ctaText || 'Shop Now',
    ctaLink: initialBanner?.ctaLink || '/collections',
    position: initialBanner?.position || 'hero',
    active: initialBanner?.active ?? true,
  });

  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        setForm((f) => ({ ...f, image: data.url }));
        setImageError(false);
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
      <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
        {mode === 'add' ? 'Add Banner' : 'Edit Banner'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="luxury-label">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="luxury-input"
            placeholder="e.g., Festive Collection 2026"
          />
        </div>

        <div>
          <label className="luxury-label">Subtitle</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="luxury-input"
            placeholder="e.g., Up to 40% off on selected items"
          />
        </div>

        <div>
          <label className="luxury-label">Banner Image *</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              required
              value={form.image}
              onChange={(e) => {
                setForm({ ...form, image: e.target.value });
                setImageError(false);
              }}
              className="luxury-input flex-1"
              placeholder="/images/banner.jpg"
            />
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 border border-[rgba(184,137,58,0.32)] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
            >
              <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          <p className="text-[10px] text-[#9a8c75] mt-1.5">Upload an image, or paste an image URL above.</p>
          {form.image && (
            <div className="mt-3 aspect-video w-full max-w-md bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] overflow-hidden relative">
              {!imageError ? (
                <img
                  key={form.image}
                  src={form.image}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[#9a8c75]">
                  <ImageOff size={20} />
                  <span className="text-[10px] tracking-[1.5px] uppercase">Image failed to load</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="luxury-label">CTA Button Text</label>
            <input
              type="text"
              value={form.ctaText}
              onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              className="luxury-input"
              placeholder="Shop Now"
            />
          </div>
          <div>
            <label className="luxury-label">CTA Link</label>
            <input
              type="text"
              value={form.ctaLink}
              onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
              className="luxury-input"
              placeholder="/collections"
            />
          </div>
        </div>

        <div>
          <label className="luxury-label">Position</label>
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value as BannerData['position'] })}
            className="luxury-input"
          >
            <option value="hero">Hero (Top)</option>
            <option value="middle">Middle Section</option>
            <option value="footer">Footer Area</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-[#b8893a]"
          />
          <span className="text-[#1a1410]">Active (show on website)</span>
        </label>
      </div>

      <div className="mt-6 pt-5 border-t border-[rgba(184,137,58,0.18)] flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] inline-flex items-center justify-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] inline-flex items-center justify-center gap-2"
        >
          <Save size={14} /> Save Banner
        </button>
      </div>
    </form>
  );
}