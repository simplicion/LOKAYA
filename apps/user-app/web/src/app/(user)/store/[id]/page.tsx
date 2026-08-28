'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, MapPin, Star, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductOverlayCard } from '@/components/feed/ProductOverlayCard';

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

const PRODUCTS = [
  { id: '1', title: 'Classic White Tee', price: '₹899', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400', store: 'Urban Threads', category: 'T-Shirts' },
  { id: '2', title: 'Denim Jacket', price: '₹2499', image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=400', store: 'Urban Threads', category: 'Jackets' },
  { id: '3', title: 'Cargo Pants', price: '₹1799', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=400', store: 'Urban Threads', category: 'Pants' },
  { id: '4', title: 'Summer Shirt', price: '₹1299', image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=400', store: 'Urban Threads', category: 'Shirts' },
];

import { use } from 'react';



export default function StoreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  // TODO: Use resolvedParams.id to fetch store data if needed
  
  const [activeTab, setActiveTab] = useState<'products'|'reels'>('products');
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 w-full">
        <img src={STORE.banner} alt={STORE.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
        
        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe-offset-4 flex justify-between items-center z-10">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:bg-white/30 transition">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 active:bg-white/30 transition">
            <Share2 className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Store Info Card (Overlapping Banner) */}
      <div className="px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-sm -mt-12 mb-3">
            <img src={STORE.avatar} alt={STORE.name} className="w-full h-full object-cover rounded-xl border border-gray-100" />
          </div>
          
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-1.5">
            {STORE.name}
            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-50" />
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">{STORE.category}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-gray-900">{STORE.rating}</span>
              <span className="text-[10px] text-gray-400">({STORE.reviews})</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{STORE.distance}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-2 px-2">
            {STORE.address}
          </p>

          <div className="w-full h-px bg-gray-100 my-4" />

          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", STORE.isOpen ? "bg-green-500" : "bg-red-500")} />
              <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                {STORE.isOpen ? 'Open Now' : 'Closed'} <span className="text-gray-300">•</span> {STORE.openTime}
              </span>
            </div>
            <button className="text-[11px] font-bold text-[#FF5A36] flex items-center gap-0.5 bg-[#FF5A36]/10 px-2.5 py-1.5 rounded-lg">
              Get Directions <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-[13px] mt-4 transition-all duration-200 active:scale-[0.98]",
              isFollowing 
                ? "bg-gray-100 text-gray-700 border border-gray-200"
                : "bg-gray-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-800"
            )}
          >
            {isFollowing ? 'Following' : 'Follow Store'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 mt-6 gap-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('products')}
          className={cn(
            "pb-3 text-[14px] font-bold relative transition-colors",
            activeTab === 'products' ? "text-gray-900" : "text-gray-400"
          )}
        >
          Products
          {activeTab === 'products' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={cn(
            "pb-3 text-[14px] font-bold relative transition-colors",
            activeTab === 'reels' ? "text-gray-900" : "text-gray-400"
          )}
        >
          Reels
          {activeTab === 'reels' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-900 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-6">
        {activeTab === 'products' ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {PRODUCTS.map(product => (
              <ProductOverlayCard key={product.id} product={{ name: product.title, image: product.image, price: product.price }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">No Reels Yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">This store hasn't posted any video content yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}
