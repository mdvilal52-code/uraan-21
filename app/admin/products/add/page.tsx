'use client';

import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { ChevronRight } from 'lucide-react';

export default function AddProductPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-[#9a8c75] mb-2">
          <Link href="/admin" className="text-[#b8893a] hover:underline">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/admin/products" className="text-[#b8893a] hover:underline">Products</Link>
          <ChevronRight size={12} />
          <span>Add New</span>
        </div>
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Add New Product</h1>
        <p className="text-sm text-[#6b5d4c]">Fill in details to add a new product to your catalog.</p>
      </div>

      <ProductForm mode="add" />
    </div>
  );
}