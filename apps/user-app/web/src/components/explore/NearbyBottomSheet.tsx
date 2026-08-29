'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, MapPin, Heart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoreCard, Store } from '@/components/StoreCard';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'food', label: 'Food' },
];

const MOCK_STORES: Store[] = [
  {
    id: '1',
    name: 'Urban Threads',
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=200&auto=format&fit=crop',
    isOpen: true,
    rating: 4.8,
    reviews: 230,
    category: "Men's Fashion",
    distance: '0.6 km away',
    productCount: 12
  },
  {
    id: '2',
    name: 'Luxe Beauty',
    image: 'https://images.unsplash.com/photo-1571781537459-07446554b574?q=80&w=200&auto=format&fit=crop',
    isOpen: true,
    rating: 4.7,
    reviews: 186,
    category: "Beauty & Skincare",
    distance: '0.8 km away',
    productCount: 24
  }
];

export function NearbyBottomSheet() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchStart - touchEnd;
    
    // swipe up
    if (distance > 50 && !isListExpanded) {
      setIsListExpanded(true);
    }
    // swipe down
    else if (distance < -50 && isListExpanded) {
      setIsListExpanded(false);
    }
    setTouchStart(null);
  };

  return (
    <div 
      className={cn(
        "absolute w-full bottom-0 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-30 transition-all duration-300 ease-out flex flex-col",
        isListExpanded ? "top-[140px]" : "h-[25vh] sm:h-[30vh]"
      )}
    >
      {/* Drag Handle */}
      <div 
        className="w-full pt-4 pb-2 flex justify-center cursor-pointer active:opacity-70 touch-none"
        onClick={() => setIsListExpanded(!isListExpanded)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full pointer-events-none" />
      </div>

      <div className="px-5 flex items-center justify-between pb-4 pt-1">
        <h2 className="text-base font-black text-gray-900">Nearby Stores</h2>
        <button className="text-[#FF5A36] text-[11px] font-bold">See all</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-safe-offset-24 no-scrollbar">
        <div className="flex flex-col gap-4">
          
          {/* Search & Filters */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Search stores, categories..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-9 pr-10 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <SlidersHorizontal className="w-[18px] h-[18px] text-gray-500" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors",
                    activeCategory === cat.id 
                      ? "bg-[#FF5A36]/10 text-[#FF5A36] border-[#FF5A36]" 
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {MOCK_STORES.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
          
          <div className="h-20" /> {/* Bottom spacer for scrolling past nav */}
        </div>
      </div>
    </div>
  );
}
