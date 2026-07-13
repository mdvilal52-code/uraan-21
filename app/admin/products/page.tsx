'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProductTable from '@/components/admin/ProductTable';
import { Plus, Search, Database, HardDrive, DownloadCloud, UploadCloud, X } from 'lucide-react';
import type { Product } from '@/data/jewelleryData';
import { invalidateProductCache } from '@/hooks/useProducts';

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'active' | 'deleted'>('active');

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ inserted: number; failed: number } | null>(null);
  const [bulkError, setBulkError] = useState('');
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setAllProducts((data.products || []) as Product[]);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const loadDeleted = useCallback(async () => {
    try {
      const res = await fetch('/api/products?deleted=1');
      const data = await res.json();
      setDeletedProducts((data.products || []) as Product[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (view === 'deleted') loadDeleted();
  }, [view, loadDeleted]);

  const filtered = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'instock' && p.inStock) ||
      (filter === 'outofstock' && !p.inStock) ||
      (filter === 'lowstock' &&
        (p.stockQuantity ?? 0) > 0 &&
        (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5));
    return matchSearch && matchFilter;
  });

  const filteredDeleted = deletedProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!configured) {
      alert('Connect a database (Supabase) to manage products. See DEPLOYMENT.md.');
      return;
    }
    if (!confirm(`Move product ${id} to trash?`)) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    invalidateProductCache();
    load();
    if (view === 'deleted') loadDeleted();
  };

  const handleRestore = async (id: string) => {
    await fetch(`/api/products/${id}/restore`, { method: 'POST' });
    invalidateProductCache();
    loadDeleted();
    load();
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/products/import', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        await load();
        alert(`Imported ${data.imported} products into the database.`);
      } else {
        alert(data.error || 'Import failed.');
      }
    } catch {
      alert('Import failed.');
    }
    setImporting(false);
  };

  const handleBulkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploading(true);
    setBulkError('');
    setBulkResult(null);
    try {
      const csv = await file.text();
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBulkResult({ inserted: data.inserted, failed: data.failed });
        await load();
      } else {
        setBulkError(data.error || 'Import failed.');
      }
    } catch {
      setBulkError('Network error. Please try again.');
    } finally {
      setBulkUploading(false);
      if (bulkFileRef.current) bulkFileRef.current.value = '';
    }
  };

  const products = view === 'active' ? filtered : filteredDeleted;
  const productTotal = view === 'active' ? allProducts.length : deletedProducts.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Products</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {products.length} of {productTotal} products
            <span
              className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
                configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
              }`}
              title={configured ? 'Live catalogue from your database' : 'Bundled catalogue — connect a database to manage products'}
            >
              {configured ? <Database size={11} /> : <HardDrive size={11} />}
              {configured ? 'Database' : 'Bundled'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setBulkOpen(true);
              setBulkResult(null);
              setBulkError('');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#1a1410] text-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b]"
          >
            <UploadCloud size={14} /> Bulk Upload CSV
          </button>
          <Link
            href="/admin/products/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
          >
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {bulkOpen && (
        <div className="bg-white border border-[rgba(184,137,58,0.3)] p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="display text-xs tracking-[3px] uppercase text-[#1a1410]">Bulk Upload CSV</h2>
            <button onClick={() => setBulkOpen(false)} aria-label="Close" className="text-[#6b5d4c] hover:text-[#7a2e2e]">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-[#6b5d4c] mb-3">
            Columns (case-insensitive): name, slug, category, price, oldPrice, description, material, weight, purity,
            stockQuantity, sku, tag, inStock. Up to 500 products per file.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <input ref={bulkFileRef} type="file" accept=".csv" hidden onChange={handleBulkFile} />
            <button
              type="button"
              onClick={() => bulkFileRef.current?.click()}
              disabled={bulkUploading}
              className="px-4 py-2 border border-[rgba(184,137,58,0.32)] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1] flex items-center gap-2 disabled:opacity-60"
            >
              <UploadCloud size={12} /> {bulkUploading ? 'Uploading…' : 'Choose CSV File'}
            </button>
          </div>
          {bulkResult && (
            <p className="text-sm text-[#3d6b5a] mt-3">
              Imported {bulkResult.inserted} product{bulkResult.inserted !== 1 ? 's' : ''}
              {bulkResult.failed > 0 ? ` (${bulkResult.failed} row${bulkResult.failed !== 1 ? 's' : ''} skipped)` : ''}.
            </p>
          )}
          {bulkError && <p className="text-sm text-[#7a2e2e] mt-3">{bulkError}</p>}
        </div>
      )}

      {/* When the DB is connected but empty, offer a one-click import. */}
      {configured && !loading && allProducts.length === 0 && (
        <div className="bg-[#f8f2e6] border border-[rgba(184,137,58,0.3)] p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="serif text-lg text-[#1a1410]">Your catalogue is empty</div>
            <p className="text-sm text-[#6b5d4c]">Import the bundled demo catalogue to get started, then edit freely.</p>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-5 py-2.5 bg-[#b8893a] text-white text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] inline-flex items-center gap-2 disabled:opacity-60"
          >
            <DownloadCloud size={14} /> {importing ? 'Importing…' : 'Import catalogue'}
          </button>
        </div>
      )}

      {!configured && !loading && (
        <div className="bg-[#b8893a]/8 border border-[rgba(184,137,58,0.3)] p-4 mb-5 text-sm text-[#6b5d4c]">
          You&apos;re viewing the bundled catalogue. Connect a database (Supabase) so that products you add or edit here show on the live website. See <span className="font-semibold text-[#1a1410]">DEPLOYMENT.md</span>.
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 border-b border-[rgba(184,137,58,0.18)]">
        {[
          { id: 'active' as const, label: 'Active' },
          { id: 'deleted' as const, label: 'Deleted' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] uppercase font-semibold ${
              view === t.id
                ? 'text-[#b8893a] border-b-2 border-[#b8893a]'
                : 'text-[#6b5d4c]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={14} className="text-[#9a8c75]" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
        </div>
        {view === 'active' && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-[rgba(184,137,58,0.32)] px-3 py-1.5 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Products</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
            <option value="lowstock">Low Stock</option>
          </select>
        )}
      </div>

      <ProductTable
        products={products}
        onDelete={view === 'active' ? handleDelete : undefined}
        onRestore={view === 'deleted' ? handleRestore : undefined}
      />
    </div>
  );
}
