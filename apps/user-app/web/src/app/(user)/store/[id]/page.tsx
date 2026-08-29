'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { use } from 'react';

// Dummy data
const STORE = {
  id: '1',
  name: 'Urban Threads',
  category: "Men's Fashion",
  rating: 4.8,
  reviews: 230,
  distance: '0.6 km away',
  address: '142 Fashion Street, CP, New Delhi',
  openTime: '10:00 AM - 9:00 PM',
  isOpen: true,
  banner: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop',
  avatar: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=200&auto=format&fit=crop',
};

const MOCK_CATEGORIES = [
  { id: '1', name: 'T-Shirts', icon: '👕' },
  { id: '2', name: 'Jackets', icon: '🧥' },
  { id: '3', name: 'Pants', icon: '👖' },
  { id: '4', name: 'Shirts', icon: '👔' },
];

const PRODUCTS = [
  { id: '1', title: 'Classic White Tee', price: 899, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400', store: 'Urban Threads', category: 'T-Shirts' },
  { id: '2', title: 'Denim Jacket', price: 2499, image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=400', store: 'Urban Threads', category: 'Jackets' },
  { id: '3', title: 'Cargo Pants', price: 1799, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=400', store: 'Urban Threads', category: 'Pants' },
  { id: '4', title: 'Summer Shirt', price: 1299, image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=400', store: 'Urban Threads', category: 'Shirts' },
];

export default function StoreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const filteredProducts = selectedCategory 
    ? PRODUCTS.filter(p => p.category === selectedCategory)
    : PRODUCTS;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      <div className="flex-1 overflow-y-auto">
        
        {/* Banner Section */}
        <div className="relative w-full h-48 group">
          <img src={STORE.banner} alt={STORE.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          
          {/* Top Nav */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe-offset-4 flex justify-between items-center z-10">
            <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:bg-white/30 transition">
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setIsShareOpen(true)}
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:bg-white/30 transition"
            >
              <Share2 className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Store Info Profile Section */}
        <div className="relative px-4 pb-6 bg-white border-b border-gray-100 shadow-sm">
          {/* Logo overlapping the banner */}
          <div className="relative w-24 h-24 -mt-12 mb-3 rounded-full bg-white p-1 shadow-md flex-shrink-0">
            <img src={STORE.avatar} alt={STORE.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
          </div>

          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1.5 leading-tight">
                {STORE.name}
                <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50 flex-shrink-0" />
              </h2>
              <p className="text-gray-500 text-sm mt-1">{STORE.address} • {STORE.category}</p>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                  {STORE.rating} ({STORE.reviews}+ ratings)
                </div>
                <div className={cn("text-sm font-medium", STORE.isOpen ? "text-green-600" : "text-red-600")}>
                  {STORE.isOpen ? `Open until ${STORE.openTime.split(' - ')[1]}` : 'Closed'}
                </div>
              </div>
            </div>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap flex-shrink-0 mt-1">
              Visit Profile
            </button>
          </div>
        </div>

        {/* Categories Loop */}
        <div className="mt-4 bg-white py-4 shadow-sm border-y border-gray-100">
          <div className="px-4 flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900">Categories</h3>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-4">
            {/* All Category Button */}
            <button 
              onClick={() => setSelectedCategory(null)}
              className="relative flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shadow-sm transition-all", 
                selectedCategory === null 
                  ? "bg-indigo-50 border-indigo-200" 
                  : "bg-gray-50 border-gray-100")}>
                🛒
              </div>
              <span className={cn("text-xs font-medium text-center truncate w-full",
                selectedCategory === null ? "text-indigo-600 font-bold" : "text-gray-600"
              )}>All</span>
            </button>

            {/* Existing Categories */}
            {MOCK_CATEGORIES.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.name)}
                className="relative flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center text-3xl shadow-sm transition-all",
                  selectedCategory === cat.name
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-gray-50 border-gray-100"
                )}>
                  {cat.icon}
                </div>
                <span className={cn("text-xs font-medium text-center truncate w-full",
                   selectedCategory === cat.name ? "text-indigo-600 font-bold" : "text-gray-600"
                )}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Preview */}
        <div className="mt-4 px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{selectedCategory ? `${selectedCategory}` : 'All Products'}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={{
                    id: product.id,
                    title: product.title,
                    image: product.image,
                    price: product.price.toString(),
                    store: { name: product.store, isVerified: true },
                    rating: '4.5',
                    reviews: '(0)'
                  }}
                />
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-gray-500 text-sm">
                No products found in this category.
              </div>
            )}
          </div>
        </div>

      </div>

      <ShareBottomSheet 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={`Check out ${STORE.name} on Lokaya!`}
      />
    </div>
  );
}
