'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, PlusCircle, MoreVertical, Star, Package } from 'lucide-react';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';

// Mock Data
const MOCK_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'active', name: 'Active' },
  { id: 'drafts', name: 'Drafts' },
  { id: 'low_stock', name: 'Low Stock' },
  { id: 'archived', name: 'Archived' }
];

const MOCK_PRODUCTS = [
  {
    id: 'TSH-BLK-M',
    name: 'Premium Cotton T-Shirt',
    price: 1499,
    stock: 24,
    rating: 4.8,
    status: 'Active',
    categoryId: 'active',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'AATA-5KG',
    name: 'Aashirvaad Atta (5kg)',
    price: 295,
    stock: 20,
    rating: 4.6,
    status: 'Active',
    categoryId: 'active',
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7ab5?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'OIL-1L',
    name: 'Fortune Sunlite Oil (1L)',
    price: 165,
    stock: 5,
    rating: 4.4,
    status: 'Low Stock',
    categoryId: 'low_stock',
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'BUT-100G',
    name: 'Amul Butter (100g)',
    price: 78,
    stock: 15,
    rating: 4.7,
    status: 'Active',
    categoryId: 'active',
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f6e55c?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

export default function MyProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Filter Logic
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory || p.status.toLowerCase().replace(' ', '_') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Top Header */}
      <SellerHeader 
        title="Products" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        rightAction={<PlusCircle className="w-6 h-6" onClick={() => router.push('/seller/products/add')} />}
      />

      {/* Category Tags & Filter */}
      <div className="bg-white border-b border-[#E5E2DC] flex items-center justify-between px-4">
        <div className="flex overflow-x-auto no-scrollbar py-3 gap-6 flex-1">
          {MOCK_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
                activeCategory === category.id 
                  ? 'bg-brand-navy text-white' 
                  : 'text-[#6B6B6B] bg-transparent'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <button className="p-2 ml-2 bg-[#F9F9F9] rounded-full text-[#171717] hover:bg-gray-200 transition-colors shrink-0">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 bg-white">
        {filteredProducts.map((product, idx) => (
          <div 
            key={product.id} 
            className={`p-4 flex gap-4 ${idx !== filteredProducts.length - 1 ? 'border-b border-[#F2EFE9]' : ''}`}
            onClick={() => router.push(`/seller/products/${product.id}`)}
          >
            {/* Image */}
            <div className="w-24 h-24 bg-[#F2EFE9] rounded-2xl overflow-hidden relative shrink-0">
              <Image 
                src={product.image} 
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Details */}
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[#171717] text-[15px] leading-tight pr-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <button className="shrink-0 p-1 -mr-1 -mt-1 text-[#6B6B6B] active:bg-gray-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-1 uppercase tracking-wider font-medium">SKU: {product.id}</p>
              </div>
              
              <div className="font-bold text-[#171717] text-lg mt-1">
                ₹{product.price}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="text-[#6B6B6B]">Stock: {product.stock}</span>
                  <div className="flex items-center gap-1 text-[#6B6B6B]">
                    <Star className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{product.rating}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold ${
                  product.status === 'Active' ? 'text-green-500' : 'text-orange-500'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No products found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your category or search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
