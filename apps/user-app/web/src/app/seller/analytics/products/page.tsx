'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Image from 'next/image';

const mockTopProducts = [
  {
    id: 1,
    name: 'Fortune Sunlite Oil (1L)',
    orders: 120,
    revenue: 12000,
    image: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 2,
    name: 'Aashirvaad Atta (5kg)',
    orders: 98,
    revenue: 11500,
    image: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 3,
    name: 'Tata Salt (1kg)',
    orders: 76,
    revenue: 2280,
    image: 'https://images.unsplash.com/photo-1624467022247-49f3e49e0b1c?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 4,
    name: 'Maggi 2-Minute (70g)',
    orders: 65,
    revenue: 856,
    image: 'https://images.unsplash.com/photo-1606755456206-b25206cde27e?auto=format&fit=crop&q=80&w=100'
  },
  {
    id: 5,
    name: 'Amul Milk (1L)',
    orders: 54,
    revenue: 1020,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=100'
  },
];

const mockCategorySales = [
  { id: 1, name: 'Fruits & Vegetables', icon: '🍎', sales: 12450, orders: 86 },
  { id: 2, name: 'Dairy & Eggs', icon: '🥛', sales: 8750, orders: 54 },
  { id: 3, name: 'Snacks & Munchies', icon: '🍪', sales: 7980, orders: 48 },
  { id: 4, name: 'Beverages', icon: '🥤', sales: 5650, orders: 34 },
  { id: 5, name: 'Personal Care', icon: '🧴', sales: 4230, orders: 28 },
  { id: 6, name: 'Others', icon: '📦', sales: 6800, orders: 26 },
];

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');
  const [activeTab, setActiveTab] = useState('Products');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Product Analytics</h1>
          </div>
          
          <button className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <span className="text-sm font-medium text-gray-700">{dateRange}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('Products')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'Products' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            Products
            {activeTab === 'Products' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('Categories')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'Categories' ? 'text-indigo-600' : 'text-gray-500'
            }`}
          >
            Categories
            {activeTab === 'Categories' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'Products' ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
            </div>
            {mockTopProducts.map((product, index) => (
              <div 
                key={product.id}
                className={`p-4 flex items-center gap-4 ${
                  index !== mockTopProducts.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{product.orders} Orders</p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
            
            <div className="p-4 border-t border-gray-50">
              <button 
                onClick={() => router.push('/seller/products')}
                className="w-full py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
              >
                View All Products
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Category Sales</h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 mb-3 px-2">
                <div className="col-span-6">Category</div>
                <div className="col-span-3 text-right">Sales</div>
                <div className="col-span-3 text-right">Orders</div>
              </div>
              
              <div className="space-y-1">
                {mockCategorySales.map((category) => (
                  <div key={category.id} className="grid grid-cols-12 gap-2 py-3 px-2 items-center hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm shadow-sm border border-indigo-100/50">
                        {category.icon}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm truncate">{category.name}</span>
                    </div>
                    <div className="col-span-3 text-right font-bold text-gray-900 text-sm">
                      ₹{category.sales.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-right font-semibold text-gray-600 text-sm">
                      {category.orders}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
