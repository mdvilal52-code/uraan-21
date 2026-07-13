'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Upload, Plus, Trash2, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Product, ProductVariant, categories } from '@/data/jewelleryData';
import { invalidateProductCache } from '@/hooks/useProducts';

type ProductFormProps = {
  initialProduct?: Product;
  mode?: 'add' | 'edit';
};

function newVariant(): ProductVariant {
  return {
    id: `v${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
    size: '',
    metal: '',
    purity: '',
    weight: '',
    stone: '',
    sku: '',
    priceDelta: 0,
    stock: 0,
  };
}

export default function ProductForm({ initialProduct, mode = 'add' }: ProductFormProps) {
  const router = useRouter();

  const initialImages =
    initialProduct?.images && initialProduct.images.length
      ? initialProduct.images
      : initialProduct?.image
        ? [initialProduct.image]
        : [];

  const [form, setForm] = useState({
    name: initialProduct?.name || '',
    slug: initialProduct?.slug || '',
    category: initialProduct?.category || 'necklaces',
    price: initialProduct?.price || 0,
    oldPrice: initialProduct?.oldPrice || 0,
    description: initialProduct?.description || '',
    tag: initialProduct?.tag || '',
    material: initialProduct?.material || '',
    weight: initialProduct?.weight || '',
    purity: initialProduct?.purity || '',
    inStock: initialProduct?.inStock ?? true,
    sku: initialProduct?.sku || '',
    barcode: initialProduct?.barcode || '',
    stockQuantity: initialProduct?.stockQuantity ?? 0,
    lowStockThreshold: initialProduct?.lowStockThreshold ?? 5,
    status: initialProduct?.status || 'published',
    featured: initialProduct?.featured ?? false,
    trending: initialProduct?.trending ?? false,
    seoTitle: initialProduct?.seoTitle || '',
    seoDescription: initialProduct?.seoDescription || '',
    useDynamicPricing: initialProduct?.useDynamicPricing ?? false,
    makingCharge: initialProduct?.makingCharge ?? 0,
  });

  const [images, setImages] = useState<string[]>(initialImages);
  const [altTexts, setAltTexts] = useState<string[]>(
    initialProduct?.altTexts && initialProduct.altTexts.length
      ? initialImages.map((_, i) => initialProduct.altTexts?.[i] || '')
      : initialImages.map(() => '')
  );
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);

  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        setImages((imgs) => [...imgs, data.url]);
        setAltTexts((alts) => [...alts, '']);
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

  const moveImage = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    setImages((imgs) => {
      const next = [...imgs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setAltTexts((alts) => {
      const next = [...alts];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImages((imgs) => imgs.filter((_, i) => i !== index));
    setAltTexts((alts) => alts.filter((_, i) => i !== index));
  };

  const updateAltText = (index: number, value: string) => {
    setAltTexts((alts) => alts.map((a, i) => (i === index ? value : a)));
  };

  const addVariant = () => setVariants((v) => [...v, newVariant()]);
  const removeVariant = (id: string) => setVariants((v) => v.filter((x) => x.id !== id));
  const updateVariant = (id: string, patch: Partial<ProductVariant>) =>
    setVariants((v) => v.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      const url = mode === 'add' ? '/api/products' : `/api/products/${initialProduct?.id}`;
      const payload = {
        ...form,
        image: images[0] || '',
        images,
        altTexts,
        variants,
      };
      const res = await fetch(url, {
        method: mode === 'add' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        invalidateProductCache();
        router.push('/admin/products');
        router.refresh();
      } else {
        alert(data.error || 'Could not save. Connect a database (Supabase) — see DEPLOYMENT.md.');
        setSubmitted(false);
      }
    } catch {
      alert('Network error. Please try again.');
      setSubmitted(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
      <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
        {mode === 'add' ? 'Add New Product' : 'Edit Product'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="luxury-label">Product Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="luxury-input"
            placeholder="e.g., Diamond Floral Necklace"
          />
        </div>

        <div>
          <label className="luxury-label">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="luxury-input"
            placeholder="e.g., diamond-floral-necklace"
          />
        </div>

        <div>
          <label className="luxury-label">Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="luxury-input"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="luxury-label">Price (₹) *</label>
          <input
            type="number"
            required
            min={0}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="luxury-input"
          />
        </div>

        <div>
          <label className="luxury-label">Old Price (₹)</label>
          <input
            type="number"
            min={0}
            value={form.oldPrice}
            onChange={(e) => setForm({ ...form, oldPrice: Number(e.target.value) })}
            className="luxury-input"
            placeholder="For discount display"
          />
        </div>

        <div>
          <label className="luxury-label">Material</label>
          <input
            type="text"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="luxury-input"
            placeholder="e.g., 22K Gold"
          />
        </div>

        <div>
          <label className="luxury-label">Weight</label>
          <input
            type="text"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="luxury-input"
            placeholder="e.g., 24g"
          />
        </div>

        <div>
          <label className="luxury-label">Purity</label>
          <input
            type="text"
            value={form.purity}
            onChange={(e) => setForm({ ...form, purity: e.target.value })}
            className="luxury-input"
            placeholder="e.g., 916"
          />
        </div>

        <div>
          <label className="luxury-label">Tag</label>
          <select
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="luxury-input"
          >
            <option value="">No tag</option>
            <option value="new">New</option>
            <option value="bestseller">Bestseller</option>
            <option value="sale">Sale</option>
            <option value="soldout">Sold Out</option>
          </select>
        </div>

        <div>
          <label className="luxury-label">SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="luxury-input"
            placeholder="e.g., OGP-NCK-001"
          />
        </div>

        <div>
          <label className="luxury-label">Barcode</label>
          <input
            type="text"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            className="luxury-input"
            placeholder="e.g., 8901234567890"
          />
        </div>

        <div>
          <label className="luxury-label">Stock Quantity</label>
          <input
            type="number"
            min={0}
            value={form.stockQuantity}
            onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
            className="luxury-input"
          />
        </div>

        <div>
          <label className="luxury-label">Low Stock Threshold</label>
          <input
            type="number"
            min={0}
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
            className="luxury-input"
            placeholder="e.g., 5"
          />
        </div>

        <div>
          <label className="luxury-label">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
            className="luxury-input"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="flex items-end gap-5 pb-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-[#b8893a]"
            />
            <span className="text-[#1a1410]">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.trending}
              onChange={(e) => setForm({ ...form, trending: e.target.checked })}
              className="accent-[#b8893a]"
            />
            <span className="text-[#1a1410]">Trending</span>
          </label>
        </div>

        {/* Multi-image manager */}
        <div className="md:col-span-2">
          <label className="luxury-label">Product Images</label>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border border-[rgba(184,137,58,0.18)] p-2"
              >
                <div
                  className="w-14 h-14 bg-[#f8f2e6] bg-cover bg-center flex-shrink-0 border border-[rgba(184,137,58,0.18)]"
                  style={{ backgroundImage: `url(${img})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#9a8c75] truncate mb-1">{img}</div>
                  <input
                    type="text"
                    value={altTexts[i] || ''}
                    onChange={(e) => updateAltText(i, e.target.value)}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="Alt text (for SEO & accessibility)"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="p-1 border border-[rgba(184,137,58,0.32)] hover:bg-[#fbf8f1] disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move down"
                    className="p-1 border border-[rgba(184,137,58,0.32)] hover:bg-[#fbf8f1] disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="p-1.5 text-[#7a2e2e] hover:bg-[#7a2e2e]/10 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {images.length === 0 && (
              <p className="text-xs text-[#9a8c75] italic">No images yet. Upload one below.</p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 border border-[rgba(184,137,58,0.32)] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
            >
              <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
            <span className="text-[10px] text-[#9a8c75]">The first image is used as the primary product photo.</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="luxury-label">Description *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="luxury-input"
            placeholder="Detailed product description..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
              className="accent-[#b8893a]"
            />
            <span className="text-[#1a1410]">In Stock</span>
          </label>
        </div>
      </div>

      {/* Variants editor */}
      <div className="mt-8 pt-5 border-t border-[rgba(184,137,58,0.18)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="display text-xs tracking-[3px] uppercase text-[#1a1410]">Variants</h3>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(184,137,58,0.32)] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1]"
          >
            <Plus size={12} /> Add Variant
          </button>
        </div>
        {variants.length === 0 && (
          <p className="text-xs text-[#9a8c75] italic mb-2">
            No variants — this product will be sold as a single option. Add variants for size, metal, purity, etc.
          </p>
        )}
        <div className="space-y-3">
          {variants.map((v) => (
            <div key={v.id} className="border border-[rgba(184,137,58,0.18)] p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="luxury-label !mb-1">Size</label>
                  <input
                    type="text"
                    value={v.size || ''}
                    onChange={(e) => updateVariant(v.id, { size: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="e.g., 14"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">Metal</label>
                  <input
                    type="text"
                    value={v.metal || ''}
                    onChange={(e) => updateVariant(v.id, { metal: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="e.g., Gold"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">Purity</label>
                  <input
                    type="text"
                    value={v.purity || ''}
                    onChange={(e) => updateVariant(v.id, { purity: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="e.g., 22K"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">Weight</label>
                  <input
                    type="text"
                    value={v.weight || ''}
                    onChange={(e) => updateVariant(v.id, { weight: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="e.g., 12g"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">Stone</label>
                  <input
                    type="text"
                    value={v.stone || ''}
                    onChange={(e) => updateVariant(v.id, { stone: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="e.g., Ruby"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">SKU</label>
                  <input
                    type="text"
                    value={v.sku || ''}
                    onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                    className="luxury-input !py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="luxury-label !mb-1">Price Delta (₹)</label>
                  <input
                    type="number"
                    value={v.priceDelta}
                    onChange={(e) => updateVariant(v.id, { priceDelta: Number(e.target.value) })}
                    className="luxury-input !py-1.5 text-xs"
                    placeholder="+/- from base price"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="luxury-label !mb-1">Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) })}
                      className="luxury-input !py-1.5 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    aria-label="Remove variant"
                    className="p-1.5 text-[#7a2e2e] hover:bg-[#7a2e2e]/10 mb-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="mt-8 pt-5 border-t border-[rgba(184,137,58,0.18)]">
        <h3 className="display text-xs tracking-[3px] uppercase text-[#1a1410] mb-3">SEO</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="luxury-label">SEO Title</label>
            <textarea
              rows={2}
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="luxury-input"
              placeholder="Falls back to the product name if left blank"
            />
            <p className={`text-[10px] mt-1 ${form.seoTitle.length > 60 ? 'text-[#7a2e2e]' : 'text-[#9a8c75]'}`}>
              {form.seoTitle.length} / ~60 characters (Google typically shows up to 60)
            </p>
          </div>
          <div>
            <label className="luxury-label">SEO Description</label>
            <textarea
              rows={3}
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className="luxury-input"
              placeholder="Falls back to the product description if left blank"
            />
            <p className={`text-[10px] mt-1 ${form.seoDescription.length > 160 ? 'text-[#7a2e2e]' : 'text-[#9a8c75]'}`}>
              {form.seoDescription.length} / ~160 characters (Google typically shows up to 160)
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic gold-rate pricing */}
      <div className="mt-8 pt-5 border-t border-[rgba(184,137,58,0.18)]">
        <h3 className="display text-xs tracking-[3px] uppercase text-[#1a1410] mb-3">Dynamic Pricing</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm mb-3">
          <input
            type="checkbox"
            checked={form.useDynamicPricing}
            onChange={(e) => setForm({ ...form, useDynamicPricing: e.target.checked })}
            className="accent-[#b8893a]"
          />
          <span className="text-[#1a1410]">Use dynamic gold-rate pricing</span>
        </label>
        {form.useDynamicPricing && (
          <div className="max-w-xs">
            <label className="luxury-label">Making Charge per Gram (₹)</label>
            <input
              type="number"
              min={0}
              value={form.makingCharge}
              onChange={(e) => setForm({ ...form, makingCharge: Number(e.target.value) })}
              className="luxury-input"
            />
            <p className="text-[10px] text-[#9a8c75] mt-2 flex items-start gap-1.5">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              Price = weight (parsed from the Weight field) × today&apos;s gold rate + making charge. Set today&apos;s
              rate in Settings → Gold Rate. The Price field above is kept as a fallback base price.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-[rgba(184,137,58,0.18)] flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-3 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] inline-flex items-center justify-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
        <button
          type="submit"
          disabled={submitted}
          className="px-6 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={14} /> {submitted ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
        </button>
      </div>
    </form>
  );
}
