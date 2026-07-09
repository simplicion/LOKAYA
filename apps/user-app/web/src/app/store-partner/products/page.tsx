'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, Plus, Package, TrendingUp, Archive, Settings, AlertCircle, ChevronDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

// Mock Data
const MOCK_CATEGORIES = [
  { id: 'all', name: 'All Products', count: 124 },
  { id: 'grocery', name: 'Grocery', count: 50 },
  { id: 'electronics', name: 'Electronics', count: 32 },
  { id: 'clothing', name: 'Clothing', count: 28 },
  { id: 'home', name: 'Home & Kitchen', count: 14 }
];

const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Fortune Sunlite Oil (1L)',
    categoryId: 'grocery',
    price: 165,
    totalStock: 50,
    availableStock: 5,
    sold: 40,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '2',
    name: 'Aashirvaad Atta (5kg)',
    categoryId: 'grocery',
    price: 295,
    totalStock: 100,
    availableStock: 20,
    sold: 80,
    status: 'Draft',
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7ab5?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '3',
    name: 'Logitech Wireless Mouse',
    categoryId: 'electronics',
    price: 999,
    totalStock: 200,
    availableStock: 150,
    sold: 50,
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: '4',
    name: 'Cotton T-Shirt (Blue)',
    categoryId: 'clothing',
    price: 499,
    totalStock: 80,
    availableStock: 30,
    sold: 50,
    status: 'Inactive',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

export default function MyProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, stock_low, highest_sales

  // Filter & Sort Logic
  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery);
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'stock_low') return a.availableStock - b.availableStock;
    if (sortBy === 'highest_sales') return b.sold - a.sold;
    return 0; // default for newest (mock)
  });

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-24">
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">
          SKU Management
        </h1>
      </div>

      {/* Top Level Analytics */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">124</p>
          </div>
          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">This Mth</span>
            </div>
            <p className="text-xl font-bold text-gray-900">+15</p>
          </div>
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <Archive className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Past Mth</span>
            </div>
            <p className="text-xl font-bold text-gray-900">+22</p>
          </div>
        </div>
      </div>

      {/* Category Tags */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="flex overflow-x-auto hide-scrollbar px-4 gap-2">
          {MOCK_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === category.id
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-white text-gray-500'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort Filters */}
      <div className="p-4 bg-white border-b border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Name or SKU ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gray-900 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 font-medium">Sort by:</span>
          <select 
            className="bg-transparent font-semibold text-gray-900 outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest Added</option>
            <option value="stock_low">Lowest Stock</option>
            <option value="highest_sales">Highest Sales</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 p-4 space-y-4">
        {filteredProducts.map(product => {
          const isLowStock = product.availableStock <= 10;
          
          return (
            <div 
              key={product.id} 
              className={`bg-white p-4 rounded-2xl flex flex-col shadow-sm border ${
                isLowStock ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <div 
                className="flex gap-4 cursor-pointer"
                onClick={() => router.push(`/store-partner/products/${product.id}`)}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative shrink-0">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                  {isLowStock && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] font-bold uppercase text-center py-0.5">
                      Low Stock
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-gray-500 font-medium">SKU: {product.id}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block uppercase tracking-wider ${
                        product.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        product.status === 'Inactive' ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="font-bold text-gray-900 text-lg mt-2">
                    ₹{product.price}
                  </div>
                </div>
              </div>

              {/* Quick Stock Updater & Status Bar */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total</span>
                    <span className="text-sm font-semibold text-gray-900">{product.totalStock}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Avail</span>
                    <span className={`text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                      {product.availableStock}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Sold</span>
                    <span className="text-sm font-semibold text-blue-600">{product.sold}</span>
                  </div>
                </div>
                
                {/* Quick Edit Stock */}
                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200">
                  <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-xl">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900">
                    {product.availableStock}
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-xl">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No products found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your category or search filters.</p>
          </div>
        )}
      </div>

      {/* Fixed Add Button */}
      <div className="fixed bottom-[72px] right-4 z-10 md:hidden pb-safe">
        <Button 
          className="w-14 h-14 bg-gray-900 hover:bg-black text-white rounded-full shadow-lg flex items-center justify-center"
          onClick={() => router.push('/store-partner/products/add')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
