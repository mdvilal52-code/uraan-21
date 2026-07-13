'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { getProductById } from '@/lib/products';
import { useProducts } from '@/hooks/useProducts';
import { ChevronRight } from 'lucide-react';

export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { products: list, loaded } = useProducts();
  const product = getProductById(id, list);

  if (!product) {
    if (!loaded) {
      return (
        <div className="py-20 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">
          Loading…
        </div>
      );
    }
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-[#9a8c75] mb-2">
          <Link href="/admin" className="text-[#b8893a] hover:underline">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/admin/products" className="text-[#b8893a] hover:underline">Products</Link>
          <ChevronRight size={12} />
          <span>Edit</span>
        </div>
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Edit Product</h1>
        <p className="text-sm text-[#6b5d4c]">Update product details for ID: <span className="font-semibold text-[#1a1410]">{product.id}</span></p>
      </div>

      <ProductForm mode="edit" initialProduct={product} />
    </div>
  );
}
