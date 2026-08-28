'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, Edit2, Plus, Star } from 'lucide-react';
import Image from 'next/image';

const MOCK_CATEGORIES = [
  { id: '1', name: 'Fruits', icon: '🍎' },
  { id: '2', name: 'Vegetables', icon: '🥦' },
  { id: '3', name: 'Dairy', icon: '🥛' },
  { id: '4', name: 'Snacks', icon: '🍪' },
  { id: '5', name: 'Beverages', icon: '🥤' },
];

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Fresh Apples', price: 120, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&q=80' },
  { id: 'p2', name: 'Bananas', price: 60, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80' },
  { id: 'p3', name: 'Milk 1L', price: 65, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
  { id: 'p4', name: 'Potato chips', price: 20, image: 'https://images.unsplash.com/photo-1566478989037-e987e91ebdf0?w=400&q=80' },
];

export default function StorePreviewPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-24">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20 border-b border-gray-100 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">My Store</h1>
        <button 
          onClick={() => router.push('/seller/store/settings')} 
          className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* Banner Section */}
        <div className="relative w-full h-48 bg-indigo-500 group">
          {/* Mock Banner Image - we use a solid color or gradient for now, can be an image */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500" />
          
          {/* Edit Banner Button */}
          <button className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors border border-white/30 shadow-sm">
            <ImageIcon className="w-4 h-4" />
            Update Banner
          </button>
        </div>

        {/* Store Info Profile Section */}
        <div className="relative px-4 pb-6 bg-white border-b border-gray-100 shadow-sm">
          {/* Logo overlapping the banner */}
          <div className="relative w-24 h-24 -mt-12 mb-3 rounded-full bg-white p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-green-600 border-2 border-white flex items-center justify-center overflow-hidden">
              <span className="text-white font-bold text-sm text-center leading-tight">SHARMA<br/>KIRANA</span>
            </div>
            
            {/* Edit Logo Button */}
            <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md text-gray-700 hover:text-indigo-600 border border-gray-100">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sharma Kirana Store</h2>
            <p className="text-gray-500 text-sm mt-1">Har Ghar Ki Zaroorat • Grocery & Essentials</p>
            
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center text-sm font-medium text-gray-700">
                <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                4.8 (120+ ratings)
              </div>
              <div className="text-sm font-medium text-green-600">
                Open until 10:00 PM
              </div>
            </div>
          </div>
        </div>

        {/* Categories Loop */}
        <div className="mt-4 bg-white py-4 shadow-sm border-y border-gray-100">
          <div className="px-4 flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Categories</h3>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar px-4 pb-2 gap-4">
            
            {/* Add New Category Button */}
            <button 
              onClick={() => router.push('/seller/store/categories/add')}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm transition-transform active:scale-95">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-xs font-medium text-indigo-600 text-center">Add<br/>Category</span>
            </button>

            {/* Existing Categories */}
            {MOCK_CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2 min-w-[72px]">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shadow-sm">
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-gray-600 text-center truncate w-full">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Products Preview */}
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">All Products</h3>
            <button 
              onClick={() => router.push('/seller/products')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Add Product Card */}
            <button 
              onClick={() => router.push('/seller/products/add')}
              className="bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center justify-center p-4 aspect-[4/5] transition-transform active:scale-95 group"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-indigo-600 mb-3 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-semibold text-indigo-600 text-sm">Add Product</span>
            </button>

            {MOCK_PRODUCTS.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="relative aspect-square w-full bg-gray-100">
                  <Image 
                    src={product.image} 
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                  <p className="text-indigo-600 font-bold mt-auto">₹{product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
